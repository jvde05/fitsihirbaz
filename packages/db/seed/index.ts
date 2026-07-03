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

    // ── Meyveler ──────────────────────────────────────────────
    { name: "Muz", nameEn: "Banana", category: "Meyveler", servingDescription: "1 orta boy", servingGramWeight: 118, calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6 },
    { name: "Portakal", nameEn: "Orange", category: "Meyveler", servingDescription: "1 orta boy", servingGramWeight: 131, calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4 },
    { name: "Çilek", nameEn: "Strawberry", category: "Meyveler", servingDescription: "1 su bardağı", servingGramWeight: 152, calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2 },
    { name: "Karpuz", nameEn: "Watermelon", category: "Meyveler", servingDescription: "1 dilim", servingGramWeight: 280, calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4 },
    { name: "Kavun", nameEn: "Melon", category: "Meyveler", servingDescription: "1 dilim", servingGramWeight: 160, calories: 34, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 0.9 },
    { name: "Üzüm", nameEn: "Grapes", category: "Meyveler", servingDescription: "1 su bardağı", servingGramWeight: 151, calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9 },
    { name: "Şeftali", nameEn: "Peach", category: "Meyveler", servingDescription: "1 orta boy", servingGramWeight: 150, calories: 39, protein: 0.9, carbs: 9.5, fat: 0.3, fiber: 1.5 },
    { name: "Kayısı", nameEn: "Apricot", category: "Meyveler", servingDescription: "3 adet", servingGramWeight: 105, calories: 48, protein: 1.4, carbs: 11.1, fat: 0.4, fiber: 2 },
    { name: "Erik", nameEn: "Plum", category: "Meyveler", servingDescription: "2 adet", servingGramWeight: 132, calories: 46, protein: 0.7, carbs: 11.4, fat: 0.3, fiber: 1.4 },
    { name: "Kiraz", nameEn: "Cherry", category: "Meyveler", servingDescription: "1 su bardağı", servingGramWeight: 154, calories: 63, protein: 1.1, carbs: 16, fat: 0.2, fiber: 2.1 },
    { name: "İncir", nameEn: "Fig", category: "Meyveler", servingDescription: "2 adet taze", servingGramWeight: 100, calories: 74, protein: 0.8, carbs: 19.2, fat: 0.3, fiber: 2.9 },
    { name: "Nar", nameEn: "Pomegranate", category: "Meyveler", servingDescription: "yarım adet", servingGramWeight: 87, calories: 83, protein: 1.7, carbs: 18.7, fat: 1.2, fiber: 4 },
    { name: "Mandalina", nameEn: "Tangerine", category: "Meyveler", servingDescription: "1 adet", servingGramWeight: 88, calories: 53, protein: 0.8, carbs: 13.3, fat: 0.3, fiber: 1.8 },
    { name: "Armut", nameEn: "Pear", category: "Meyveler", servingDescription: "1 orta boy", servingGramWeight: 178, calories: 57, protein: 0.4, carbs: 15.2, fat: 0.1, fiber: 3.1 },
    { name: "Ayva", nameEn: "Quince", category: "Meyveler", servingDescription: "1 orta boy", servingGramWeight: 92, calories: 57, protein: 0.4, carbs: 15.3, fat: 0.1, fiber: 1.9 },
    { name: "Kivi", nameEn: "Kiwi", category: "Meyveler", servingDescription: "1 adet", servingGramWeight: 69, calories: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3 },
    { name: "Ananas", nameEn: "Pineapple", category: "Meyveler", servingDescription: "1 dilim", servingGramWeight: 84, calories: 50, protein: 0.5, carbs: 13.1, fat: 0.1, fiber: 1.4 },
    { name: "Limon", nameEn: "Lemon", category: "Meyveler", servingDescription: "1 adet", servingGramWeight: 58, calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8 },
    { name: "Greyfurt", nameEn: "Grapefruit", category: "Meyveler", servingDescription: "yarım adet", servingGramWeight: 123, calories: 42, protein: 0.8, carbs: 10.7, fat: 0.1, fiber: 1.6 },
    { name: "Avokado", nameEn: "Avocado", category: "Meyveler", servingDescription: "yarım adet", servingGramWeight: 100, calories: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7 },

    // ── Sebzeler ──────────────────────────────────────────────
    { name: "Domates", nameEn: "Tomato", category: "Sebzeler", servingDescription: "1 orta boy", servingGramWeight: 123, calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
    { name: "Salatalık", nameEn: "Cucumber", category: "Sebzeler", servingDescription: "1 orta boy", servingGramWeight: 301, calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 },
    { name: "Yeşil Biber", nameEn: "Green Pepper", category: "Sebzeler", servingDescription: "1 orta boy", servingGramWeight: 74, calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, fiber: 1.7 },
    { name: "Patlıcan", nameEn: "Eggplant", category: "Sebzeler", servingDescription: "1 su bardağı doğranmış", servingGramWeight: 82, calories: 25, protein: 1, carbs: 5.9, fat: 0.2, fiber: 3 },
    { name: "Kabak", nameEn: "Zucchini", category: "Sebzeler", servingDescription: "1 su bardağı doğranmış", servingGramWeight: 124, calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1 },
    { name: "Ispanak", nameEn: "Spinach", category: "Sebzeler", servingDescription: "1 su bardağı çiğ", servingGramWeight: 30, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
    { name: "Brokoli", nameEn: "Broccoli", category: "Sebzeler", servingDescription: "1 su bardağı doğranmış", servingGramWeight: 91, calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6 },
    { name: "Karnabahar", nameEn: "Cauliflower", category: "Sebzeler", servingDescription: "1 su bardağı doğranmış", servingGramWeight: 107, calories: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2 },
    { name: "Havuç", nameEn: "Carrot", category: "Sebzeler", servingDescription: "1 orta boy", servingGramWeight: 61, calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8 },
    { name: "Patates (haşlanmış)", nameEn: "Potato (boiled)", category: "Sebzeler", servingDescription: "1 orta boy", servingGramWeight: 173, calories: 87, protein: 1.9, carbs: 20.1, fat: 0.1, fiber: 1.8 },
    { name: "Soğan", nameEn: "Onion", category: "Sebzeler", servingDescription: "1 orta boy", servingGramWeight: 110, calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
    { name: "Sarımsak", nameEn: "Garlic", category: "Sebzeler", servingDescription: "3 diş", servingGramWeight: 9, calories: 149, protein: 6.4, carbs: 33.1, fat: 0.5, fiber: 2.1 },
    { name: "Marul", nameEn: "Lettuce", category: "Sebzeler", servingDescription: "1 su bardağı", servingGramWeight: 36, calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3 },
    { name: "Beyaz Lahana", nameEn: "Cabbage", category: "Sebzeler", servingDescription: "1 su bardağı doğranmış", servingGramWeight: 89, calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1, fiber: 2.5 },
    { name: "Kırmızı Pancar (haşlanmış)", nameEn: "Beet (boiled)", category: "Sebzeler", servingDescription: "1 su bardağı", servingGramWeight: 170, calories: 44, protein: 1.7, carbs: 10, fat: 0.2, fiber: 2 },
    { name: "Bezelye", nameEn: "Green Peas", category: "Sebzeler", servingDescription: "1 su bardağı", servingGramWeight: 160, calories: 81, protein: 5.4, carbs: 14.5, fat: 0.4, fiber: 5.7 },
    { name: "Bamya", nameEn: "Okra", category: "Sebzeler", servingDescription: "1 su bardağı", servingGramWeight: 100, calories: 33, protein: 1.9, carbs: 7.5, fat: 0.2, fiber: 3.2 },
    { name: "Pırasa", nameEn: "Leek", category: "Sebzeler", servingDescription: "1 su bardağı doğranmış", servingGramWeight: 89, calories: 61, protein: 1.5, carbs: 14.2, fat: 0.3, fiber: 1.8 },
    { name: "Turp", nameEn: "Radish", category: "Sebzeler", servingDescription: "1 su bardağı dilimlenmiş", servingGramWeight: 116, calories: 16, protein: 0.7, carbs: 3.4, fat: 0.1, fiber: 1.6 },
    { name: "Mantar", nameEn: "Mushroom", category: "Sebzeler", servingDescription: "1 su bardağı dilimlenmiş", servingGramWeight: 70, calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1 },

    // ── Tahıllar ──────────────────────────────────────────────
    { name: "Pirinç (pişmiş)", nameEn: "White Rice (cooked)", category: "Tahıllar", servingDescription: "1 su bardağı", servingGramWeight: 158, calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4 },
    { name: "Bulgur (pişmiş)", nameEn: "Bulgur (cooked)", category: "Tahıllar", servingDescription: "1 su bardağı", servingGramWeight: 182, calories: 83, protein: 3.1, carbs: 18.6, fat: 0.2, fiber: 4.5 },
    { name: "Kinoa (pişmiş)", nameEn: "Quinoa (cooked)", category: "Tahıllar", servingDescription: "1 su bardağı", servingGramWeight: 185, calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8 },
    { name: "Tam Buğday Ekmeği", nameEn: "Whole Wheat Bread", category: "Tahıllar", servingDescription: "1 dilim", servingGramWeight: 32, calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7 },
    { name: "Beyaz Ekmek", nameEn: "White Bread", category: "Tahıllar", servingDescription: "1 dilim", servingGramWeight: 30, calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7 },
    { name: "Makarna (pişmiş)", nameEn: "Pasta (cooked)", category: "Tahıllar", servingDescription: "1 su bardağı", servingGramWeight: 140, calories: 158, protein: 5.8, carbs: 30.9, fat: 0.9, fiber: 1.8 },
    { name: "Mısır (haşlanmış)", nameEn: "Corn (boiled)", category: "Tahıllar", servingDescription: "1 adet koçan", servingGramWeight: 90, calories: 96, protein: 3.4, carbs: 21, fat: 1.5, fiber: 2.4 },
    { name: "Arpa (pişmiş)", nameEn: "Barley (cooked)", category: "Tahıllar", servingDescription: "1 su bardağı", servingGramWeight: 157, calories: 123, protein: 2.3, carbs: 28.2, fat: 0.4, fiber: 3.8 },

    // ── Et ve Tavuk Ürünleri ─────────────────────────────────
    { name: "Dana Kıyma (pişmiş)", nameEn: "Ground Beef (cooked)", category: "Et ve Tavuk Ürünleri", servingDescription: "1 porsiyon (100g)", servingGramWeight: 100, calories: 254, protein: 25.6, carbs: 0, fat: 16.8, fiber: 0 },
    { name: "Kuzu Eti (pişmiş)", nameEn: "Lamb (cooked)", category: "Et ve Tavuk Ürünleri", servingDescription: "1 porsiyon (100g)", servingGramWeight: 100, calories: 294, protein: 24.5, carbs: 0, fat: 20.9, fiber: 0 },
    { name: "Hindi Göğsü (pişmiş)", nameEn: "Turkey Breast (cooked)", category: "Et ve Tavuk Ürünleri", servingDescription: "1 porsiyon (100g)", servingGramWeight: 100, calories: 135, protein: 30, carbs: 0, fat: 0.7, fiber: 0 },
    { name: "Tavuk But (derisiz, pişmiş)", nameEn: "Chicken Thigh (skinless, cooked)", category: "Et ve Tavuk Ürünleri", servingDescription: "1 porsiyon (100g)", servingGramWeight: 100, calories: 209, protein: 26, carbs: 0, fat: 10.9, fiber: 0 },
    { name: "Sucuk", nameEn: "Sucuk (Turkish Sausage)", category: "Et ve Tavuk Ürünleri", servingDescription: "3-4 dilim", servingGramWeight: 50, calories: 460, protein: 22, carbs: 3, fat: 40, fiber: 0 },
    { name: "Pastırma", nameEn: "Pastirma", category: "Et ve Tavuk Ürünleri", servingDescription: "5-6 ince dilim", servingGramWeight: 30, calories: 250, protein: 30, carbs: 2, fat: 13, fiber: 0 },

    // ── Balık ve Deniz Ürünleri ──────────────────────────────
    { name: "Somon (pişmiş)", nameEn: "Salmon (cooked)", category: "Balık ve Deniz Ürünleri", servingDescription: "1 porsiyon (100g)", servingGramWeight: 100, calories: 208, protein: 20.4, carbs: 0, fat: 13.4, fiber: 0 },
    { name: "Ton Balığı (suda, süzülmüş)", nameEn: "Canned Tuna (in water, drained)", category: "Balık ve Deniz Ürünleri", servingDescription: "1 kutu", servingGramWeight: 85, calories: 116, protein: 25.5, carbs: 0, fat: 0.8, fiber: 0 },
    { name: "Levrek (pişmiş)", nameEn: "Sea Bass (cooked)", category: "Balık ve Deniz Ürünleri", servingDescription: "1 porsiyon (100g)", servingGramWeight: 100, calories: 124, protein: 23.4, carbs: 0, fat: 2.6, fiber: 0 },
    { name: "Uskumru (pişmiş)", nameEn: "Mackerel (cooked)", category: "Balık ve Deniz Ürünleri", servingDescription: "1 porsiyon (100g)", servingGramWeight: 100, calories: 262, protein: 23.9, carbs: 0, fat: 17.8, fiber: 0 },
    { name: "Karides (haşlanmış)", nameEn: "Shrimp (boiled)", category: "Balık ve Deniz Ürünleri", servingDescription: "1 porsiyon (100g)", servingGramWeight: 100, calories: 99, protein: 20.9, carbs: 0.2, fat: 1.1, fiber: 0 },

    // ── Süt Ürünleri ──────────────────────────────────────────
    { name: "Süt (tam yağlı)", nameEn: "Whole Milk", category: "Süt Ürünleri", servingDescription: "1 su bardağı", servingGramWeight: 244, calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 },
    { name: "Beyaz Peynir", nameEn: "White Cheese (Feta-style)", category: "Süt Ürünleri", servingDescription: "1 dilim (30g)", servingGramWeight: 30, calories: 264, protein: 14.2, carbs: 4.1, fat: 21.3, fiber: 0 },
    { name: "Kaşar Peyniri", nameEn: "Kashar Cheese", category: "Süt Ürünleri", servingDescription: "1 dilim (30g)", servingGramWeight: 30, calories: 371, protein: 25, carbs: 1.3, fat: 29, fiber: 0 },
    { name: "Lor Peyniri", nameEn: "Curd Cheese", category: "Süt Ürünleri", servingDescription: "3 yemek kaşığı", servingGramWeight: 100, calories: 98, protein: 11.1, carbs: 3.4, fat: 4.3, fiber: 0 },
    { name: "Ayran", nameEn: "Ayran", category: "Süt Ürünleri", servingDescription: "1 bardak", servingGramWeight: 200, calories: 34, protein: 1.7, carbs: 2.5, fat: 1.8, fiber: 0 },
    { name: "Kefir", nameEn: "Kefir", category: "Süt Ürünleri", servingDescription: "1 su bardağı", servingGramWeight: 245, calories: 41, protein: 3.4, carbs: 4.8, fat: 1, fiber: 0 },
    { name: "Krema", nameEn: "Heavy Cream", category: "Süt Ürünleri", servingDescription: "1 yemek kaşığı", servingGramWeight: 15, calories: 340, protein: 2.1, carbs: 2.8, fat: 36, fiber: 0 },

    // ── Baklagiller ───────────────────────────────────────────
    { name: "Nohut (pişmiş)", nameEn: "Chickpeas (cooked)", category: "Baklagiller", servingDescription: "1 su bardağı", servingGramWeight: 164, calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6 },
    { name: "Barbunya (pişmiş)", nameEn: "Cranberry Beans (cooked)", category: "Baklagiller", servingDescription: "1 su bardağı", servingGramWeight: 177, calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5, fiber: 6.5 },
    { name: "Kuru Fasulye (pişmiş)", nameEn: "White Beans (cooked)", category: "Baklagiller", servingDescription: "1 su bardağı", servingGramWeight: 179, calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5, fiber: 6.4 },
    { name: "Yeşil Mercimek (pişmiş)", nameEn: "Green Lentils (cooked)", category: "Baklagiller", servingDescription: "1 su bardağı", servingGramWeight: 198, calories: 116, protein: 9, carbs: 20.1, fat: 0.4, fiber: 7.9 },
    { name: "Kuru Bezelye (pişmiş)", nameEn: "Dried Peas (cooked)", category: "Baklagiller", servingDescription: "1 su bardağı", servingGramWeight: 196, calories: 118, protein: 8.3, carbs: 21.1, fat: 0.4, fiber: 8.3 },

    // ── Kuruyemişler ──────────────────────────────────────────
    { name: "Ceviz", nameEn: "Walnuts", category: "Kuruyemişler", servingDescription: "1 avuç (7 yarım)", servingGramWeight: 28, calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7 },
    { name: "Fındık", nameEn: "Hazelnuts", category: "Kuruyemişler", servingDescription: "1 avuç (20 adet)", servingGramWeight: 28, calories: 628, protein: 15, carbs: 16.7, fat: 60.8, fiber: 9.7 },
    { name: "Antep Fıstığı", nameEn: "Pistachios", category: "Kuruyemişler", servingDescription: "1 avuç (49 adet)", servingGramWeight: 28, calories: 560, protein: 20.2, carbs: 27.2, fat: 45.3, fiber: 10.6 },
    { name: "Kaju", nameEn: "Cashews", category: "Kuruyemişler", servingDescription: "1 avuç (18 adet)", servingGramWeight: 28, calories: 553, protein: 18.2, carbs: 30.2, fat: 43.9, fiber: 3.3 },
    { name: "Ay Çekirdeği", nameEn: "Sunflower Seeds", category: "Kuruyemişler", servingDescription: "1 avuç", servingGramWeight: 28, calories: 584, protein: 20.8, carbs: 20, fat: 51.5, fiber: 8.6 },
    { name: "Chia Tohumu", nameEn: "Chia Seeds", category: "Kuruyemişler", servingDescription: "1 yemek kaşığı", servingGramWeight: 12, calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4 },
    { name: "Keten Tohumu", nameEn: "Flaxseed", category: "Kuruyemişler", servingDescription: "1 yemek kaşığı", servingGramWeight: 10, calories: 534, protein: 18.3, carbs: 28.9, fat: 42.2, fiber: 27.3 },
    { name: "Susam", nameEn: "Sesame Seeds", category: "Kuruyemişler", servingDescription: "1 yemek kaşığı", servingGramWeight: 9, calories: 573, protein: 17.7, carbs: 23.4, fat: 49.7, fiber: 11.8 },

    // ── Yağlar ────────────────────────────────────────────────
    { name: "Tereyağı", nameEn: "Butter", category: "Yağlar", servingDescription: "1 tatlı kaşığı", servingGramWeight: 5, calories: 717, protein: 0.9, carbs: 0.1, fat: 81.1, fiber: 0 },
    { name: "Ayçiçek Yağı", nameEn: "Sunflower Oil", category: "Yağlar", servingDescription: "1 yemek kaşığı", servingGramWeight: 14, calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
    { name: "Hindistan Cevizi Yağı", nameEn: "Coconut Oil", category: "Yağlar", servingDescription: "1 yemek kaşığı", servingGramWeight: 14, calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0 },
    { name: "Margarin", nameEn: "Margarine", category: "Yağlar", servingDescription: "1 tatlı kaşığı", servingGramWeight: 5, calories: 717, protein: 0.2, carbs: 0.7, fat: 80.5, fiber: 0 },

    // ── Türk Mutfağı Yemekleri ────────────────────────────────
    { name: "Mercimek Çorbası", nameEn: "Lentil Soup", category: "Türk Mutfağı Yemekleri", servingDescription: "1 kase", servingGramWeight: 250, calories: 60, protein: 3.5, carbs: 9, fat: 1.2, fiber: 1.8 },
    { name: "İmam Bayıldı", nameEn: "Imam Bayildi", category: "Türk Mutfağı Yemekleri", servingDescription: "1 porsiyon", servingGramWeight: 200, calories: 120, protein: 1.8, carbs: 10, fat: 8.5, fiber: 3.5 },
    { name: "Karnıyarık", nameEn: "Karniyarik", category: "Türk Mutfağı Yemekleri", servingDescription: "1 porsiyon", servingGramWeight: 250, calories: 150, protein: 8, carbs: 8, fat: 10, fiber: 2.5 },
    { name: "Mantı (yoğurtlu)", nameEn: "Manti (with yogurt)", category: "Türk Mutfağı Yemekleri", servingDescription: "1 porsiyon", servingGramWeight: 250, calories: 210, protein: 8, carbs: 25, fat: 8, fiber: 1.5 },
    { name: "Lahmacun", nameEn: "Lahmacun", category: "Türk Mutfağı Yemekleri", servingDescription: "1 adet", servingGramWeight: 130, calories: 235, protein: 10, carbs: 32, fat: 7.5, fiber: 2 },
    { name: "Pide (kaşarlı)", nameEn: "Pide (with Kashar cheese)", category: "Türk Mutfağı Yemekleri", servingDescription: "1 dilim", servingGramWeight: 150, calories: 280, protein: 11, carbs: 35, fat: 10, fiber: 1.8 },
    { name: "Döner (tavuk)", nameEn: "Chicken Doner", category: "Türk Mutfağı Yemekleri", servingDescription: "1 porsiyon", servingGramWeight: 200, calories: 215, protein: 20, carbs: 8, fat: 12, fiber: 0.5 },
    { name: "İskender", nameEn: "Iskender Kebab", category: "Türk Mutfağı Yemekleri", servingDescription: "1 porsiyon", servingGramWeight: 350, calories: 230, protein: 15, carbs: 12, fat: 14, fiber: 1 },
    { name: "Çiğ Köfte (vegan)", nameEn: "Cig Kofte (vegan)", category: "Türk Mutfağı Yemekleri", servingDescription: "5-6 adet", servingGramWeight: 150, calories: 180, protein: 5, carbs: 32, fat: 3.5, fiber: 4 },
    { name: "Menemen", nameEn: "Menemen", category: "Türk Mutfağı Yemekleri", servingDescription: "1 porsiyon", servingGramWeight: 200, calories: 130, protein: 7, carbs: 6, fat: 9, fiber: 1.5 },
    { name: "Sütlaç", nameEn: "Sutlac (Rice Pudding)", category: "Türk Mutfağı Yemekleri", servingDescription: "1 kase", servingGramWeight: 150, calories: 130, protein: 3.5, carbs: 20, fat: 3.8, fiber: 0 },
    { name: "Baklava", nameEn: "Baklava", category: "Türk Mutfağı Yemekleri", servingDescription: "1 dilim", servingGramWeight: 70, calories: 430, protein: 6, carbs: 48, fat: 24, fiber: 1.5 },
    { name: "Künefe", nameEn: "Kunefe", category: "Türk Mutfağı Yemekleri", servingDescription: "1 porsiyon", servingGramWeight: 150, calories: 320, protein: 6, carbs: 40, fat: 15, fiber: 0.8 },
    { name: "Simit", nameEn: "Simit", category: "Türk Mutfağı Yemekleri", servingDescription: "1 adet", servingGramWeight: 100, calories: 275, protein: 9, carbs: 52, fat: 4, fiber: 2.2 },

    // ── İçecekler ─────────────────────────────────────────────
    { name: "Elma Suyu", nameEn: "Apple Juice", category: "İçecekler", servingDescription: "1 su bardağı", servingGramWeight: 248, calories: 46, protein: 0.1, carbs: 11.3, fat: 0.1, fiber: 0.2 },
    { name: "Portakal Suyu", nameEn: "Orange Juice", category: "İçecekler", servingDescription: "1 su bardağı", servingGramWeight: 248, calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2 },
    { name: "Kahve (sade)", nameEn: "Black Coffee", category: "İçecekler", servingDescription: "1 fincan", servingGramWeight: 240, calories: 2, protein: 0.1, carbs: 0, fat: 0, fiber: 0 },
    { name: "Çay (şekersiz)", nameEn: "Tea (unsweetened)", category: "İçecekler", servingDescription: "1 bardak", servingGramWeight: 200, calories: 1, protein: 0, carbs: 0.2, fat: 0, fiber: 0 },
    { name: "Kola", nameEn: "Cola", category: "İçecekler", servingDescription: "1 kutu (330ml)", servingGramWeight: 330, calories: 41, protein: 0, carbs: 10.6, fat: 0, fiber: 0 },

    // ── Tatlılar ve Atıştırmalıklar ───────────────────────────
    { name: "Bal", nameEn: "Honey", category: "Tatlılar ve Atıştırmalıklar", servingDescription: "1 yemek kaşığı", servingGramWeight: 21, calories: 304, protein: 0.3, carbs: 82.4, fat: 0, fiber: 0.2 },
    { name: "Reçel", nameEn: "Jam", category: "Tatlılar ve Atıştırmalıklar", servingDescription: "1 yemek kaşığı", servingGramWeight: 20, calories: 278, protein: 0.4, carbs: 69, fat: 0.1, fiber: 0.9 },
    { name: "Bitter Çikolata (%70)", nameEn: "Dark Chocolate (70%)", category: "Tatlılar ve Atıştırmalıklar", servingDescription: "2 kare", servingGramWeight: 20, calories: 598, protein: 7.8, carbs: 45.9, fat: 42.6, fiber: 10.9 },
    { name: "Sütlü Çikolata", nameEn: "Milk Chocolate", category: "Tatlılar ve Atıştırmalıklar", servingDescription: "2 kare", servingGramWeight: 20, calories: 535, protein: 7.7, carbs: 59.4, fat: 29.7, fiber: 3.4 },
    { name: "Kuru Üzüm", nameEn: "Raisins", category: "Tatlılar ve Atıştırmalıklar", servingDescription: "1 avuç", servingGramWeight: 40, calories: 299, protein: 3.1, carbs: 79.2, fat: 0.5, fiber: 3.7 },
    { name: "Kuru Kayısı", nameEn: "Dried Apricots", category: "Tatlılar ve Atıştırmalıklar", servingDescription: "5-6 adet", servingGramWeight: 40, calories: 241, protein: 3.4, carbs: 62.6, fat: 0.5, fiber: 7.3 },
    { name: "Hurma", nameEn: "Dates", category: "Tatlılar ve Atıştırmalıklar", servingDescription: "3 adet", servingGramWeight: 75, calories: 277, protein: 1.8, carbs: 75, fat: 0.2, fiber: 6.7 },
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

  // ─────────────────────────────────────────────────────────────
  // Referans besin alım değerleri (TÜBER/DRI benzeri) — YER TUTUCU VERİ
  // Bu değerler genel kabul görmüş uluslararası ortalamalardır, resmi TÜBER (Türkiye
  // Beslenme Rehberi) kaynağıyla teyit edilmemiştir (isVerifiedSource=false). Sadece
  // yetişkin enerji/makro değerleriyle sınırlı tutuldu; admin panelinden gerçek
  // kaynaklarla güncellenene kadar kesin klinik referans olarak kullanılmamalıdır.
  // ─────────────────────────────────────────────────────────────

  const UNVERIFIED_SOURCE_LABEL =
    "Genel uluslararası ortalama değer — TÜBER ile doğrulanmadı, resmi kaynakla teyit edilmeli";

  async function seedReferenceIntake(data: {
    nutrient: string;
    unit: string;
    ageMinYears: number;
    ageMaxYears: number | null;
    sex: "MALE" | "FEMALE" | "ALL";
    value: number;
  }) {
    const existing = await prisma.referenceIntake.findFirst({
      where: {
        nutrient: data.nutrient,
        ageMinYears: data.ageMinYears,
        sex: data.sex,
        lifeStage: "NONE",
      },
    });
    if (existing) return existing;
    return prisma.referenceIntake.create({
      data: {
        ...data,
        lifeStage: "NONE",
        sourceLabel: UNVERIFIED_SOURCE_LABEL,
        isVerifiedSource: false,
      },
    });
  }

  await seedReferenceIntake({ nutrient: "ENERGY", unit: "kcal", ageMinYears: 19, ageMaxYears: 50, sex: "MALE", value: 2500 });
  await seedReferenceIntake({ nutrient: "ENERGY", unit: "kcal", ageMinYears: 19, ageMaxYears: 50, sex: "FEMALE", value: 2000 });
  await seedReferenceIntake({ nutrient: "PROTEIN", unit: "g", ageMinYears: 19, ageMaxYears: null, sex: "ALL", value: 56 });
  await seedReferenceIntake({ nutrient: "CARBS", unit: "g", ageMinYears: 19, ageMaxYears: null, sex: "ALL", value: 130 });
  await seedReferenceIntake({ nutrient: "FAT", unit: "g", ageMinYears: 19, ageMaxYears: null, sex: "ALL", value: 70 });
  await seedReferenceIntake({ nutrient: "FIBER", unit: "g", ageMinYears: 19, ageMaxYears: null, sex: "MALE", value: 38 });
  await seedReferenceIntake({ nutrient: "FIBER", unit: "g", ageMinYears: 19, ageMaxYears: null, sex: "FEMALE", value: 25 });

  console.log(
    `Seed tamamlandı: 1 FoodSource, ${sampleFoods.length} FoodItem, 1 admin, 3 diyetisyen, 3 danışan, 3 paket, 2 ödenmiş sipariş, 2 yorum, 1 randevu, 7 referans alım değeri (yer tutucu).`,
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
