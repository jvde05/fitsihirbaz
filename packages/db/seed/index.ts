import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const usdaSource = await prisma.foodSource.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "USDA FoodData Central",
      citation:
        "U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, fdc.nal.usda.gov.",
      url: "https://fdc.nal.usda.gov",
    },
  });

  const sampleFoods = [
    {
      name: "Tavuk Göğsü (haşlanmış)",
      nameEn: "Chicken Breast (boiled)",
      category: "Et ve Tavuk Ürünleri",
      servingDescription: "1 orta parça",
      servingGramWeight: 120,
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
    },
    {
      name: "Yulaf Ezmesi",
      nameEn: "Oats",
      category: "Tahıllar",
      servingDescription: "1 su bardağı",
      servingGramWeight: 80,
      calories: 389,
      protein: 16.9,
      carbs: 66.3,
      fat: 6.9,
      fiber: 10.6,
    },
    {
      name: "Yumurta",
      nameEn: "Egg",
      category: "Yumurta",
      servingDescription: "1 adet büyük boy",
      servingGramWeight: 50,
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
    },
    {
      name: "Elma",
      nameEn: "Apple",
      category: "Meyveler",
      servingDescription: "1 orta boy",
      servingGramWeight: 182,
      calories: 52,
      protein: 0.3,
      carbs: 13.8,
      fat: 0.2,
      fiber: 2.4,
    },
    {
      name: "Badem",
      nameEn: "Almonds",
      category: "Kuruyemişler",
      servingDescription: "1 avuç (20 adet)",
      servingGramWeight: 28,
      calories: 579,
      protein: 21.2,
      carbs: 21.6,
      fat: 49.9,
      fiber: 12.5,
    },
    {
      name: "Yoğurt (yağsız)",
      nameEn: "Yogurt (fat-free)",
      category: "Süt Ürünleri",
      servingDescription: "1 su bardağı",
      servingGramWeight: 245,
      calories: 56,
      protein: 5.7,
      carbs: 7.7,
      fat: 0.2,
      fiber: 0,
    },
    {
      name: "Kırmızı Mercimek (pişmiş)",
      nameEn: "Red Lentils (cooked)",
      category: "Baklagiller",
      servingDescription: "1 su bardağı",
      servingGramWeight: 200,
      calories: 116,
      protein: 9,
      carbs: 20.1,
      fat: 0.4,
      fiber: 7.9,
    },
    {
      name: "Zeytinyağı",
      nameEn: "Olive Oil",
      category: "Yağlar",
      servingDescription: "1 yemek kaşığı",
      servingGramWeight: 14,
      calories: 884,
      protein: 0,
      carbs: 0,
      fat: 100,
      fiber: 0,
    },
  ];

  for (const food of sampleFoods) {
    const { calories, protein, carbs, fat, fiber, ...foodFields } = food;
    const existing = await prisma.foodItem.findFirst({
      where: { name: foodFields.name },
    });
    const foodItem =
      existing ??
      (await prisma.foodItem.create({
        data: {
          ...foodFields,
          sourceId: usdaSource.id,
          isVerified: true,
        },
      }));

    await prisma.nutrientData.upsert({
      where: { foodItemId: foodItem.id },
      update: { calories, protein, carbs, fat, fiber },
      create: {
        foodItemId: foodItem.id,
        calories,
        protein,
        carbs,
        fat,
        fiber,
      },
    });
  }

  const adminPasswordHash = await bcrypt.hash("ChangeMe123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@fitsihirbaz.com" },
    update: {},
    create: {
      email: "admin@fitsihirbaz.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      firstName: "Admin",
      lastName: "Kullanıcı",
      isEmailVerified: true,
    },
  });

  // ─────────────────────────────────────────────────────────────
  // Demo veri: diyetisyen/danışan hesapları + pazaryeri akışı
  // ─────────────────────────────────────────────────────────────

  const demoPasswordHash = await bcrypt.hash("Demo1234", 10);

  async function upsertUser(data: {
    email: string;
    role: "DIETITIAN" | "CLIENT";
    firstName: string;
    lastName: string;
  }) {
    return prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: { ...data, passwordHash: demoPasswordHash, isEmailVerified: true },
    });
  }

  const ayseUser = await upsertUser({
    email: "ayse.yilmaz@fitsihirbaz.com",
    role: "DIETITIAN",
    firstName: "Ayşe",
    lastName: "Yılmaz",
  });
  const ayse = await prisma.dietitianProfile.upsert({
    where: { userId: ayseUser.id },
    update: {},
    create: {
      userId: ayseUser.id,
      title: "Kilo Yönetimi ve Sürdürülebilir Beslenme Uzmanı",
      bio: "8 yıldır sürdürülebilir kilo yönetimi ve beslenme davranışı değişikliği üzerine çalışıyorum.",
      specialties: ["Kilo Yönetimi", "Sürdürülebilir Beslenme"],
      yearsOfExperience: 8,
      verificationStatus: "VERIFIED",
    },
  });

  const mehmetUser = await upsertUser({
    email: "mehmet.demir@fitsihirbaz.com",
    role: "DIETITIAN",
    firstName: "Mehmet",
    lastName: "Demir",
  });
  const mehmet = await prisma.dietitianProfile.upsert({
    where: { userId: mehmetUser.id },
    update: {},
    create: {
      userId: mehmetUser.id,
      title: "Sporcu Beslenmesi Uzmanı",
      bio: "Amatör ve profesyonel sporcularla performans odaklı beslenme planları üzerine çalışıyorum.",
      specialties: ["Sporcu Beslenmesi", "Performans"],
      yearsOfExperience: 5,
      verificationStatus: "VERIFIED",
    },
  });

  const zeynepUser = await upsertUser({
    email: "zeynep.kaya@fitsihirbaz.com",
    role: "DIETITIAN",
    firstName: "Zeynep",
    lastName: "Kaya",
  });
  await prisma.dietitianProfile.upsert({
    where: { userId: zeynepUser.id },
    update: {},
    create: {
      userId: zeynepUser.id,
      title: "Çocuk ve Ergen Beslenmesi Uzmanı",
      bio: "Çocuk ve ergenlerde sağlıklı beslenme alışkanlıkları kazandırma konusunda çalışıyorum.",
      specialties: ["Çocuk Beslenmesi", "Ergen Beslenmesi"],
      yearsOfExperience: 3,
      verificationStatus: "PENDING", // admin onay akışını göstermek için kasıtlı olarak onaysız bırakıldı
    },
  });

  const elifUser = await upsertUser({
    email: "elif.sahin@example.com",
    role: "CLIENT",
    firstName: "Elif",
    lastName: "Şahin",
  });
  const elif = await prisma.clientProfile.upsert({
    where: { userId: elifUser.id },
    update: {},
    create: { userId: elifUser.id, goal: "WEIGHT_LOSS" },
  });

  const canUser = await upsertUser({
    email: "can.ozturk@example.com",
    role: "CLIENT",
    firstName: "Can",
    lastName: "Öztürk",
  });
  const can = await prisma.clientProfile.upsert({
    where: { userId: canUser.id },
    update: {},
    create: { userId: canUser.id, goal: "MUSCLE_GAIN" },
  });

  await upsertUser({
    email: "deniz.aydin@example.com",
    role: "CLIENT",
    firstName: "Deniz",
    lastName: "Aydın",
  });

  async function upsertPackage(dietitianId: string, data: {
    title: string;
    description: string;
    durationDays: number;
    sessionCount: number;
    price: number;
  }) {
    const existing = await prisma.package.findFirst({ where: { dietitianId, title: data.title } });
    return existing ?? prisma.package.create({ data: { ...data, dietitianId } });
  }

  const ayse3AyPaket = await upsertPackage(ayse.id, {
    title: "3 Aylık Kilo Yönetimi Paketi",
    description: "Kişiselleştirilmiş diyet planı, haftalık takip görüşmeleri ve sürekli mesaj desteği.",
    durationDays: 90,
    sessionCount: 12,
    price: 3000,
  });
  await upsertPackage(ayse.id, {
    title: "Tek Seferlik Danışmanlık",
    description: "Beslenme alışkanlıklarınızı gözden geçirip yol haritası çıkardığımız tek seanslık görüşme.",
    durationDays: 7,
    sessionCount: 1,
    price: 500,
  });
  const mehmetPaket = await upsertPackage(mehmet.id, {
    title: "Sporcu Performans Paketi",
    description: "Antrenman programınıza uygun makro planlama ve performans takibi.",
    durationDays: 60,
    sessionCount: 8,
    price: 2500,
  });

  async function seedPaidOrder(clientId: string, dietitianId: string, pkg: { id: string; price: unknown }) {
    const existing = await prisma.order.findFirst({ where: { clientId, packageId: pkg.id } });
    if (existing) return existing;

    const dietitianProfile = await prisma.dietitianProfile.findUnique({ where: { id: dietitianId } });
    const price = Number(pkg.price);
    const commissionRate = Number(dietitianProfile?.commissionRate ?? 0.15);
    const commissionAmount = Math.round(price * commissionRate * 100) / 100;
    const dietitianPayoutAmount = Math.round((price - commissionAmount) * 100) / 100;

    const order = await prisma.order.create({
      data: {
        clientId,
        dietitianId,
        packageId: pkg.id,
        amount: price,
        commissionAmount,
        dietitianPayoutAmount,
        status: "PAID",
      },
    });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "MOCK",
        providerTransactionId: `mock_seed_${order.id}`,
        status: "SUCCESS",
        paidAt: new Date(),
      },
    });
    const existingLink = await prisma.clientDietitianLink.findFirst({ where: { clientId, dietitianId } });
    if (!existingLink) {
      await prisma.clientDietitianLink.create({
        data: { clientId, dietitianId, status: "ACTIVE", startedAt: new Date(), source: "MARKETPLACE" },
      });
    }
    return order;
  }

  await seedPaidOrder(elif.id, ayse.id, ayse3AyPaket);
  await seedPaidOrder(can.id, mehmet.id, mehmetPaket);

  async function seedReview(clientId: string, dietitianId: string, rating: number, comment: string) {
    await prisma.review.upsert({
      where: { clientId_dietitianId: { clientId, dietitianId } },
      update: {},
      create: { clientId, dietitianId, rating, comment },
    });
    const aggregate = await prisma.review.aggregate({ where: { dietitianId }, _avg: { rating: true } });
    await prisma.dietitianProfile.update({
      where: { id: dietitianId },
      data: { averageRating: aggregate._avg.rating ?? null },
    });
  }

  await seedReview(elif.id, ayse.id, 5, "Harika bir deneyimdi, hedeflerime ulaşmamda çok yardımcı oldu!");
  await seedReview(can.id, mehmet.id, 4, "Performansım gözle görülür şekilde arttı, teşekkürler.");

  const existingAppointment = await prisma.appointment.findFirst({ where: { clientId: elif.id, dietitianId: ayse.id } });
  if (!existingAppointment) {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 3);
    await prisma.appointment.create({
      data: { clientId: elif.id, dietitianId: ayse.id, scheduledAt, status: "SCHEDULED" },
    });
  }

  console.log(
    "Seed tamamlandı: 1 FoodSource, 8 FoodItem, 1 admin, 3 diyetisyen, 3 danışan, 3 paket, 2 ödenmiş sipariş, 2 yorum, 1 randevu.",
  );
  console.log("Demo şifre (tüm diyetisyen/danışan hesapları için): Demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
