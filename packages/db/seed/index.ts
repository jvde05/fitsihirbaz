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

  console.log("Seed tamamlandı: 1 FoodSource, 8 FoodItem, 1 admin kullanıcı.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
