# Fit Sihirbaz — Veritabanı Dokümanı (DATABASE.md)

> Bu doküman `packages/db` içindeki Prisma şemasının kaynağıdır. Kod yazarken önce `../CLAUDE.md`'yi oku.

## Genel Kurallar

- PostgreSQL + Prisma ORM kullanılır.
- Tüm tablolarda birincil anahtar `id` (uuid, `@default(uuid())`) olur.
- Aşağıda tekrar yazılmadı ama **her tabloda** `createdAt` ve `updatedAt` (datetime) alanları standart olarak bulunur.
- Enum'lar Prisma `enum` olarak tanımlanır.
- Para birimi alanları `Decimal` tipinde tutulur (float kullanılmaz).

---

## 1. User

Tüm kullanıcı tipleri (danışan, diyetisyen, admin) için tek tablo, `role` alanı ile ayrılır.

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| email | string, unique | |
| passwordHash | string | |
| role | enum(`CLIENT`, `DIETITIAN`, `ADMIN`) | |
| firstName | string | |
| lastName | string | |
| phone | string? | |
| avatarUrl | string? | |
| isEmailVerified | boolean, default false | |
| isActive | boolean, default true | admin tarafından askıya alma için |

**İlişkiler:** `DietitianProfile` (1-1, sadece role=DIETITIAN), `ClientProfile` (1-1, sadece role=CLIENT), `ProgressLog[]`, `Message[]`, `Notification[]`, `Review[]`

---

## 2. DietitianProfile

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| userId | uuid, FK → User, unique | |
| title | string? | örn. "Uzm. Dyt." |
| bio | text? | |
| specialties | string[] | örn. ["Spor Beslenmesi", "Diyabet"] |
| yearsOfExperience | int? | |
| licenseNumber | string? | diploma/lisans no |
| certificationUrls | string[] | S3'e yüklenen sertifika dosyaları |
| verificationStatus | enum(`PENDING`, `VERIFIED`, `REJECTED`), default `PENDING` | admin onayı |
| commissionRate | decimal, default 0.15 | platform komisyon oranı |
| averageRating | decimal? | Review'lardan hesaplanır (cache) |
| payoutAccountInfo | json? | iyzico/PayTR sub-merchant bilgisi |

**İlişkiler:** `Package[]`, `DietPlan[]` (created by), `Appointment[]`, `ClientDietitianLink[]`, `Review[]`

---

## 3. ClientProfile

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| userId | uuid, FK → User, unique | |
| birthDate | date? | |
| gender | enum(`MALE`, `FEMALE`, `OTHER`)? | |
| heightCm | decimal? | |
| goal | enum(`WEIGHT_LOSS`, `WEIGHT_GAIN`, `MAINTENANCE`, `MUSCLE_GAIN`, `MEDICAL`)? | |
| activityLevel | enum(`SEDENTARY`, `LIGHT`, `MODERATE`, `ACTIVE`, `VERY_ACTIVE`)? | |
| medicalNotes | text? | alerji, kronik hastalık vb. — hassas veri, erişim kısıtlı olmalı |

**İlişkiler:** `ProgressLog[]`, `DietPlan[]`, `Order[]`, `ClientDietitianLink[]`, `Review[]`

---

## 4. ClientDietitianLink

Bir danışan zaman içinde birden fazla diyetisyenle çalışabilir; bu tablo geçmişi ve "aktif diyetisyen"i tutar.

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| clientId | uuid, FK → ClientProfile | |
| dietitianId | uuid, FK → DietitianProfile | |
| status | enum(`ACTIVE`, `ENDED`) | |
| startedAt | datetime | |
| endedAt | datetime? | |
| source | enum(`MARKETPLACE`, `MANUAL_ADD`) | diyetisyen kendi danışanını mı ekledi, pazaryerinden mi geldi |

---

## 5. FoodSource (Literatür/Kaynak)

Her besinin/verinin dayandığı bilimsel kaynağı tutar — akademik güvenilirlik için kritik (BeBiS'in de referans gösterdiği gibi).

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| name | string | örn. "USDA FoodData Central", "TÜBİTAK Besin Bileşim Veritabanı" |
| citation | text | akademik atıf formatında kaynak metni |
| url | string? | |

---

## 6. FoodItem

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| name | string | Türkçe ad |
| nameEn | string? | İngilizce ad |
| category | string | örn. "Süt Ürünleri", "Sebzeler" |
| servingDescription | string? | örn. "1 orta boy" |
| servingGramWeight | decimal? | 1 porsiyonun gram karşılığı |
| sourceId | uuid, FK → FoodSource | |
| isVerified | boolean, default false | admin onaylı mı |
| createdByUserId | uuid?, FK → User | kullanıcı kendi tarifini/besinini eklerse |

**İlişkiler:** `NutrientData` (1-1), `RecipeIngredient[]`, `DietPlanMealItem[]`

---

## 7. NutrientData

100 gram üzerinden besin öğesi değerleri. BeBiS'teki 130+ öğe kapsamının karşılığı — başlangıçta ana makro/mikro besin öğeleri, vitamin/mineral/amino asit/yağ asidi gibi detaylar JSON alanlarda genişletilebilir tutulur (her biri için ayrı kolon açmak şemayı şişirir).

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| foodItemId | uuid, FK → FoodItem, unique | |
| calories | decimal | kcal / 100g |
| protein | decimal | g / 100g |
| carbs | decimal | g / 100g |
| fat | decimal | g / 100g |
| fiber | decimal? | g / 100g |
| sugar | decimal? | g / 100g |
| glycemicIndex | int? | |
| oracValue | decimal? | antioksidan kapasite |
| vitamins | json? | `{ "vitaminA": 12.3, "vitaminC": 5.1, ... }` (mcg/mg birim notu ayrı tutulur) |
| minerals | json? | `{ "calcium": 120, "iron": 1.2, ... }` |
| aminoAcids | json? | `{ "leucine": 0.5, ... }` |
| fattyAcids | json? | `{ "saturated": 1.1, "omega3": 0.2, ... }` |

---

## 8. Recipe

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| name | string | |
| description | text? | |
| servings | int | |
| instructions | text? | |
| createdByUserId | uuid, FK → User | diyetisyen veya admin |
| isPublic | boolean, default false | pazaryeri/literatür kütüphanesinde görünsün mü |

**İlişkiler:** `RecipeIngredient[]`

## 9. RecipeIngredient

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| recipeId | uuid, FK → Recipe | |
| foodItemId | uuid, FK → FoodItem | |
| quantity | decimal | |
| unit | enum(`GRAM`, `ML`, `PORTION`, `PIECE`) | |

---

## 10. DietPlan

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| clientId | uuid, FK → ClientProfile | |
| dietitianId | uuid?, FK → DietitianProfile | null ise danışan kendi oluşturmuş (ileriki faz) |
| title | string | |
| startDate | date | |
| endDate | date? | |
| targetCalories | int? | |
| targetProteinG | decimal? | |
| targetCarbsG | decimal? | |
| targetFatG | decimal? | |
| status | enum(`DRAFT`, `ACTIVE`, `COMPLETED`, `ARCHIVED`) | |

**İlişkiler:** `DietPlanDay[]`

## 11. DietPlanDay

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| dietPlanId | uuid, FK → DietPlan | |
| dayNumber | int | plan başlangıcına göre gün (1, 2, 3...) |

## 12. DietPlanMeal

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| dietPlanDayId | uuid, FK → DietPlanDay | |
| mealType | enum(`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`) | |
| plannedTime | time? | |

## 13. DietPlanMealItem

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| dietPlanMealId | uuid, FK → DietPlanMeal | |
| foodItemId | uuid?, FK → FoodItem | |
| recipeId | uuid?, FK → Recipe | foodItemId veya recipeId'den biri dolu olur |
| quantity | decimal | |
| unit | enum(`GRAM`, `ML`, `PORTION`, `PIECE`) | |

---

## 14. Package (Diyetisyen paketi)

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| dietitianId | uuid, FK → DietitianProfile | |
| title | string | örn. "3 Aylık Online Takip" |
| description | text? | |
| durationDays | int | |
| sessionCount | int? | dahil olan görüşme sayısı |
| price | decimal | |
| currency | string, default "TRY" | |
| isActive | boolean, default true | |

## 15. Order

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| clientId | uuid, FK → ClientProfile | |
| packageId | uuid, FK → Package | |
| dietitianId | uuid, FK → DietitianProfile | (denormalize, sorgu kolaylığı için) |
| amount | decimal | toplam ödenen |
| commissionAmount | decimal | platform payı |
| dietitianPayoutAmount | decimal | diyetisyene aktarılan |
| status | enum(`PENDING`, `PAID`, `CANCELLED`, `REFUNDED`) | |

## 16. Payment

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| orderId | uuid, FK → Order | |
| provider | enum(`IYZICO`, `PAYTR`) | |
| providerTransactionId | string | |
| status | enum(`INITIATED`, `SUCCESS`, `FAILED`, `REFUNDED`) | |
| rawResponse | json? | webhook/callback ham veri, debug için |
| paidAt | datetime? | |

---

## 17. Appointment

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| clientId | uuid, FK → ClientProfile | |
| dietitianId | uuid, FK → DietitianProfile | |
| scheduledAt | datetime | |
| durationMinutes | int, default 30 | |
| status | enum(`SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`) | |
| meetingLink | string? | video görüşme linki |

## 18. Conversation & Message

| Conversation | Alan | Tip |
|---|---|---|
| | id | uuid |
| | clientId | uuid, FK → ClientProfile |
| | dietitianId | uuid, FK → DietitianProfile |

| Message | Alan | Tip |
|---|---|---|
| | id | uuid |
| | conversationId | uuid, FK → Conversation |
| | senderId | uuid, FK → User |
| | content | text |
| | readAt | datetime? |

## 19. ProgressLog

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| clientId | uuid, FK → ClientProfile | |
| logDate | date | |
| weightKg | decimal? | |
| bodyFatPercent | decimal? | |
| waistCm | decimal? | |
| hipCm | decimal? | |
| photoUrls | string[] | |
| notes | text? | |

## 20. Review

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| clientId | uuid, FK → ClientProfile | |
| dietitianId | uuid, FK → DietitianProfile | |
| rating | int | 1-5 |
| comment | text? | |

## 21. Article (Literatür/İçerik Kütüphanesi)

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| title | string | |
| slug | string, unique | |
| body | text | markdown içerik |
| authorId | uuid, FK → User | |
| tags | string[] | |
| sourceCitations | string[]? | referans gösterilen kaynaklar |
| publishedAt | datetime? | |

## 22. Notification

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | PK |
| userId | uuid, FK → User | |
| type | string | örn. "APPOINTMENT_REMINDER", "NEW_MESSAGE", "ORDER_PAID" |
| payload | json | |
| isRead | boolean, default false | |

---

## İlişki Özeti (metin diyagram)

```
User 1─1 DietitianProfile / ClientProfile
DietitianProfile 1─N Package, DietPlan, Appointment, Review
ClientProfile 1─N ProgressLog, DietPlan, Order, Review
ClientProfile N─N DietitianProfile  (ClientDietitianLink üzerinden)
Package 1─N Order 1─1 Payment
FoodItem 1─1 NutrientData
FoodItem N─N Recipe (RecipeIngredient üzerinden)
DietPlan 1─N DietPlanDay 1─N DietPlanMeal 1─N DietPlanMealItem
Conversation 1─N Message
```

## İndeksleme Notları

- `FoodItem.name`, `FoodItem.category` → arama için index (ve/veya Meilisearch senkronizasyonu)
- `Order.status`, `Appointment.scheduledAt`, `Message.conversationId` → sık sorgulanan alanlar, index eklenmeli

## Seed Verisi Notu

- Başlangıç için örnek 100-200 besinlik bir set + karşılık gelen `NutrientData` seed edilecek (kaynak: USDA FoodData Central açık verisi + TÜBİTAK BKB gibi Türkiye'ye özgü kaynaklar, her ikisi de `FoodSource` tablosunda referanslanır).
- Gerçek 20.000+ besin verisi ayrı bir "veri girişi" projesi olarak ilerideki fazda planlanmalı; MVP'de kapsam ve kalite öncelik.

## KVKK / Hassas Veri Notu

`ClientProfile.medicalNotes`, `ProgressLog.photoUrls`, sağlık verisi sayılır (KVKK'da "özel nitelikli kişisel veri"). Şema tasarımında bloklayıcı değil ama ileride:
- Bu alanlara erişim loglanabilir olmalı
- Silme talebi (right to erasure) için cascade delete/anonimleştirme planı düşünülmeli
