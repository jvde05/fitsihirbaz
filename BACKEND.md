# Fit Sihirbaz — Backend Dokümanı (BACKEND.md)

> `apps/api` için kaynak doküman. Kod yazarken önce `../CLAUDE.md`'yi, veri modeli için `../db/DATABASE.md`'yi oku.

## 1. Genel Yapı

- Framework: **NestJS** (TypeScript)
- Ana API katmanı: **tRPC** (web ve mobile ile uçtan uca tip güvenliği için)
- Ek katman: **REST** — sadece 3. parti webhook'lar için gerekli (ödeme sağlayıcı callback'leri gibi tRPC ile uyumsuz durumlar)
- ORM: Prisma (`packages/db`)
- Validation: zod şemaları `packages/shared` içinde tanımlanır, hem input hem output için kullanılır

## 2. Modül Listesi

```
apps/api/src/
├── auth/
├── users/
├── dietitians/
├── clients/
├── foods/
├── recipes/
├── diet-plans/
├── packages/
├── orders/
├── payments/
├── appointments/
├── messages/
├── progress/
├── reviews/
├── articles/
└── notifications/
```

Her modül NestJS standardında: `*.module.ts`, `*.service.ts`, `*.router.ts` (tRPC) veya `*.controller.ts` (REST gerekiyorsa), `*.spec.ts` (test).

## 3. Auth Modülü

- Kayıt: email+şifre, `role` seçimi (CLIENT veya DIETITIAN — ADMIN sadece manuel/db'den atanır)
- Giriş: email+şifre → JWT access token (15 dk) + refresh token (30 gün, httpOnly cookie veya secure storage mobilde)
- Refresh endpoint: access token yenileme
- Role guard: her endpoint hangi role'lerin erişebileceğini decorator ile belirtir (`@Roles('DIETITIAN')`)
- Şifre: bcrypt hash

**Endpoint'ler (tRPC procedure isimleri):**
- `auth.register`
- `auth.login`
- `auth.refresh`
- `auth.logout`
- `auth.me` (giriş yapmış kullanıcı bilgisi)

## 4. Users / Dietitians / Clients Modülleri

- `users.updateProfile`
- `dietitians.getProfile`, `dietitians.updateProfile`, `dietitians.uploadCertification`
- `dietitians.search` (pazaryeri keşfet — filtre: uzmanlık, fiyat aralığı, puan)
- `clients.getProfile`, `clients.updateProfile`
- `clients.linkToDietitian` (diyetisyen kendi danışanını manuel eklerken kullanılır — `ClientDietitianLink` kaydı oluşturur)
- `dietitians.getMyClients` (diyetisyenin danışan listesi)

## 5. Foods Modülü

- `foods.search` (isim/kategori bazlı — Meilisearch/Typesense üzerinden, fallback olarak Postgres full-text)
- `foods.getById` (tüm NutrientData dahil detay)
- `foods.create` (admin veya diyetisyen kendi özel besinini ekler, `isVerified=false` başlar)
- `admin.foods.verify` (admin onayı)
- Seed script: `packages/db/seed/foods.ts` — CSV/JSON'dan `FoodItem` + `NutrientData` + `FoodSource` tablolarına import

## 6. Recipes Modülü

- `recipes.create`, `recipes.update`, `recipes.getById`, `recipes.list`
- Recipe'in toplam besin değeri, içindeki `RecipeIngredient` + `NutrientData` üzerinden **hesaplanır** (ayrı tabloya cache'lenmez, ihtiyaç halinde ileride eklenir)

## 7. Diet Plans Modülü

- `dietPlans.create` (diyetisyen, danışan için plan oluşturur)
- `dietPlans.addDay`, `dietPlans.addMeal`, `dietPlans.addMealItem`
- `dietPlans.getById` (gün/öğün/besin hiyerarşisiyle birlikte, + toplam kalori/makro hesaplaması)
- `dietPlans.duplicateForNewCalorieTarget` — BeBiS'teki "planı tek tuşla farklı kaloriye ayarlama" özelliğinin karşılığı: mevcut planın tüm porsiyonlarını oranlı şekilde yeni hedef kaloriye göre yeniden hesaplar
- Kalori/makro toplama mantığı: her `DietPlanMealItem` → `FoodItem`/`Recipe` → `NutrientData` üzerinden hesaplanıp plan seviyesinde toplanır (backend'de bir `calculateDietPlanTotals(dietPlanId)` yardımcı fonksiyonu olarak yazılmalı, tekrar kullanılabilir olsun)

## 8. Packages / Orders / Payments Modülü

- `packages.create`, `packages.update`, `packages.list` (diyetisyenin kendi paketleri)
- `packages.browse` (danışan tarafı — tüm aktif paketleri filtreli listeler)
- `orders.create` → önce `PENDING` order oluşturur, ödeme sağlayıcıya yönlendirir
- `payments.initiate` → iyzico/PayTR checkout formu/token'ı oluşturur
- `payments.webhook` (REST endpoint, tRPC değil — sağlayıcı callback'i) → ödeme sonucu geldiğinde `Order.status` ve `Payment.status` güncellenir, başarılıysa `ClientDietitianLink` otomatik oluşturulur

**Ödeme entegrasyonu notu:** iyzico Pazaryeri (Marketplace) ürünü kullanılacaksa, her diyetisyen bir "sub-merchant" olarak sisteme kaydedilmeli (IBAN, kimlik/vergi bilgisi onayı iyzico tarafında yapılır). Komisyon oranı `DietitianProfile.commissionRate` alanından okunup split payment isteğinde iyzico'ya parametre olarak gönderilir. Bu entegrasyon başlı başına ayrı bir görev olarak ele alınmalı, tek promptla halledilmeye çalışılmamalı.

## 9. Appointments Modülü

- `appointments.create`, `appointments.updateStatus`, `appointments.listForClient`, `appointments.listForDietitian`
- Randevu hatırlatma: BullMQ job, randevudan 1 saat önce tetiklenir → `notifications` modülüne push/email gönderme görevi bırakır

## 10. Messages Modülü

- `messages.getOrCreateConversation(clientId, dietitianId)`
- `messages.send`, `messages.listByConversation`
- İleri faz: WebSocket (Socket.io veya tRPC subscriptions) ile gerçek zamanlı mesajlaşma — MVP'de polling yeterli

## 11. Progress / Reviews Modülü

- `progress.addLog`, `progress.listForClient` (grafik için tarih sıralı veri)
- `reviews.create` (sadece tamamlanmış bir Order'ı olan danışan yorum yapabilir), `reviews.listForDietitian`

## 12. Articles (Literatür/İçerik) Modülü

- `articles.list`, `articles.getBySlug`, `articles.create` (admin/diyetisyen), `articles.publish`
- SEO için web tarafında bu içerikler server-side render edilmeli (Next.js)

## 13. Notifications Modülü

- `notifications.listForUser`, `notifications.markAsRead`
- Gönderim: Expo Push (mobil) + e-posta (Resend/SendGrid) — job queue üzerinden asenkron

## 14. Ortam Değişkenleri (env)

```
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
IYZICO_API_KEY=
IYZICO_SECRET=
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=
EXPO_PUSH_TOKEN=
RESEND_API_KEY=
```

## 15. Test Yaklaşımı

- Her modül için en az: service unit testleri (Jest) + kritik akışlar için e2e test (örn. `order → payment webhook → link oluşturma` zinciri)
- Ödeme webhook'ları mock'lanarak test edilmeli, gerçek sağlayıcıya test isteği atılmamalı

## 16. Geliştirme Sırası Önerisi

1. Auth
2. Foods (arama + seed)
3. Dietitians/Clients profil + `ClientDietitianLink` (manuel ekleme)
4. Diet Plans (oluşturma + hesaplama)
5. Packages/Orders (ödeme entegrasyonu ayrı, dikkatli bir görev olarak)
6. Appointments, Messages
7. Progress, Reviews, Articles, Notifications
