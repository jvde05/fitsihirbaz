# Fit Sihirbaz — Proje Ana Dokümanı

> Bu dosya projenin çatı dokümanıdır. Diğer klasörlerdeki detay dosyaları (db/DATABASE.md, backend/BACKEND.md, web/WEB.md, mobil/MOBIL.md) bu dosyayı tamamlar. Bir görevle başlamadan önce bu dosyayı ve ilgili detay dosyasını oku.

## 1. Proje Nedir

**Fit Sihirbaz**, Türkiye'de diyetisyenlerin kullandığı BeBiS (Beslenme Bilgi Sistemi) masaüstü yazılımının modern, web+mobil bir alternatifidir. BeBiS'ten farkı:

- BeBiS: tek kullanıcılı masaüstü program, sadece besin analizi/diyet planı yapar, internet/mobil/pazaryeri yok.
- Fit Sihirbaz: çok kullanıcılı SaaS platform. Kapsamlı besin veritabanı + literatür referansları, diyetisyen-danışan ilişki yönetimi, **pazaryeri** (danışanlar diyetisyenlerden online paket satın alabilir), web + iOS + Android, hepsi ortak backend ve veritabanı üzerinden çalışır.

## 2. Kullanıcı Rolleri

| Rol | Açıklama |
|---|---|
| `CLIENT` | Danışan. Diyetisyen bulur, paket satın alır, diyet planını görür, ölçüm/ilerleme girer. |
| `DIETITIAN` | Diyetisyen. Kendi danışanlarını kaydeder/yönetir, diyet planı oluşturur, paket tanımlar, danışan olmayanlara da pazaryerinden ulaşır. |
| `ADMIN` | Platform yöneticisi. Besin veritabanını yönetir, diyetisyen onayı/doğrulaması yapar, içerik/literatür yönetir. |

## 3. Mimari Genel Bakış

Monorepo, **tek backend, tek veritabanı** — web, mobil ve backend aynı Prisma şemasından ve aynı ortak tip/validasyon katmanından beslenir.

```
fit-sihirbaz/
├── apps/
│   ├── web/       → Next.js 14 (App Router) — danışan + diyetisyen + admin web arayüzü
│   ├── mobile/    → Expo / React Native — iOS + Android tek kod tabanı
│   └── api/       → NestJS backend (tRPC ana katman + gerekirse REST)
├── packages/
│   ├── db/        → Prisma schema, migration'lar, seed script'leri
│   ├── shared/    → zod validation şemaları, ortak TS tipleri, tRPC/API client
│   └── ui/        → (ileriki fazda) paylaşılan tasarım bileşenleri
│
├── db/DATABASE.md         → tüm veritabanı şeması, tablo/alan/ilişki detayları
├── backend/BACKEND.md     → API modülleri, endpoint listesi, entegrasyon detayları
├── web/WEB.md             → sayfa/route listesi, dashboard akışları
└── mobil/MOBIL.md         → ekran listesi, navigasyon, push notification
```

**Neden bu yapı:** Prisma şeması `packages/db` içinde tek yerde tanımlanır. Buradan üretilen TypeScript tipleri `packages/shared` üzerinden hem `apps/api` (backend validation), hem `apps/web`, hem `apps/mobile` (form validation, API client tipleri) tarafından kullanılır. Aynı veri modeli, aynı doğrulama kuralı — üç platformda da tekrar yazılmaz.

## 4. Teknoloji Stack

| Katman | Teknoloji | Neden |
|---|---|---|
| Web | Next.js 14 (App Router), TypeScript, Tailwind CSS | SSR/SEO (diyetisyen profilleri, literatür sayfaları arama motorunda görünsün), hızlı geliştirme |
| Mobil | Expo / React Native | Tek kod tabanından iOS + Android, web ile aynı iş mantığını paylaşabilme |
| Backend | NestJS, TypeScript | Modüler yapı, büyük projede sürdürülebilir |
| API katmanı | tRPC (ana), REST (opsiyonel, 3. parti/ödeme webhook'ları için) | Uçtan uca tip güvenliği, web+mobil+backend arası tekrar yazım yok |
| Veritabanı | PostgreSQL | İlişkisel veri + JSON alan desteği (vitamin/mineral gibi değişken besin öğeleri için) |
| ORM | Prisma | Tip güvenli şema, migration yönetimi |
| Auth | JWT (access + refresh token) | Basit, ölçeklenebilir, mobil uyumlu |
| Ödeme | iyzico Pazaryeri veya PayTR (marketplace/split payment) | Türkiye'de diyetisyene otomatik ödeme aktarımı + platform komisyonu desteği hazır geliyor |
| Dosya depolama | S3 uyumlu (AWS S3 / Cloudflare R2) | İlerleme fotoğrafları, diyetisyen sertifikaları |
| Arama | Postgres `pg_trgm` (trigram + `word_similarity`) | 20.000+ besin içinde hızlı, typo-tolerant arama; Meilisearch/Typesense'e geçiş ileride trafik/ölçek gerektirirse değerlendirilir |
| Job queue | BullMQ + Redis | Randevu hatırlatma, bildirim gönderimi |
| Bildirim | Expo Push Notifications (mobil) + DB tabanlı bildirim listesi (e-posta entegrasyonu henüz yok) | |

> **Not (ödeme):** Gerçek iyzico/PayTR anahtarları henüz yok. Şu an `MockPaymentProvider` kullanılıyor — gerçek bir checkout/webhook/state machine akışı çalışıyor ama sağlayıcı tarafı simüle ediliyor. `PaymentProvider` interface'i sayesinde gerçek sağlayıcıya geçiş tek bir implementasyon değişikliği (bkz. `apps/api/src/payments/payments.provider.ts`).
>
> **Not (dosya depolama):** S3/R2 kimlik bilgileri henüz yok. Yüklemeler (avatar, ilerleme fotoğrafı, sertifika, akış paylaşımı) şu an `apps/api/uploads/` altında local diske yazılıyor, `/uploads/...` relatif yol olarak dönüyor. `apps/api/src/uploads/uploads.controller.ts`'in disk yazma kısmı ileride S3 SDK çağrısıyla değiştirilecek, geri kalan (auth kontrolü, dönen URL şekli) aynı kalacak.

## 5. Faz Planı

| Faz | Kapsam | Durum |
|---|---|---|
| **Faz 0** | Monorepo iskeleti, Prisma şeması, auth (kayıt/giriş/roller) | ✅ Tamamlandı |
| **Faz 1 (MVP)** | Besin veritabanı + arama, diyetisyen dashboard, danışan ekleme/yönetme, manuel diyet planı oluşturma, web app | ✅ Tamamlandı |
| **Faz 2** | Pazaryeri: paket tanımlama, ödeme entegrasyonu (mock provider), mobil app (danışan tarafı) | ✅ Tamamlandı |
| **Faz 3** | Randevu takvimi, mesajlaşma, ilerleme grafikleri, literatür/içerik kütüphanesi | ✅ Tamamlandı |
| **Faz 4** | Mobilde diyetisyen dashboard, push notification, admin paneli | ✅ Tamamlandı |

Orijinal faz planının kapsamı dışında, geliştirme sürecinde ek olarak eklenen özellikler: besin kaynakça/referans alım değerleri (TÜBER/DRI — **doğrulanmamış yer tutucu veri**, gerçek resmi kaynak gelene kadar "Doğrulanmamış" etiketiyle gösteriliyor), tarifler (recipes) modülü, LinkedIn-benzeri akış (posts/feed — beğeni/yorum), profil fotoğrafı + diyetisyen sertifika/lisans belgesi yükleme, admin kullanıcı yönetimi, mobil onboarding ekranı.

Sıradaki olası iş: gerçek bir ödeme sağlayıcısına (iyzico/PayTR) geçiş — **bu, kural 5 gereği önce plan modunda onay gerektirir**, mock provider'ın yerine geçecek şekilde tek bir `PaymentProvider` implementasyonu yazılacak.

## 6. Kod Standartları ve Kurallar (Claude Code için)

1. Her yeni Prisma modeli eklendiğinde: migration oluştur + kısa bir seed örneği yaz + `packages/shared` içindeki ilgili zod şemasını güncelle.
2. Her yeni API endpoint için: input/output zod validation zorunlu + en az 1 unit test yaz.
3. Commit'ler küçük ve atomik olsun — her tamamlanan görev sonunda commit at, açıklayıcı mesaj yaz.
4. Kod (değişken/fonksiyon/dosya isimleri) İngilizce, yorum satırları Türkçe olabilir.
5. Ödeme, auth, veri silme gibi riskli/geri dönüşü olmayan özelliklerde önce **plan modunda** bir plan yaz, onay al, sonra kodla.
6. Sağlık verisi (ölçüm, kilo, sağlık geçmişi) işlendiği için: bu alanlara erişim loglanabilir şekilde tasarla, ileride KVKK'ya uyum için hazır olsun (şimdilik bloklayıcı değil, sadece mimaride göz önünde bulundur).
7. Tek seferde "her şeyi yap" diye görev verilmeyecek — her görev tek bir modül/özellik kapsamında, küçük adımlarla ilerlenecek.

## 7. Diğer Dokümanlar — Okuma Sırası

Bir göreve başlamadan önce şu sırayla oku:

1. Bu dosya (genel çatı, hangi fazdayız, hangi kural geçerli)
2. Üzerinde çalışılacak alanın detay dosyası:
   - Veritabanı/şema işi → `db/DATABASE.md`
   - Backend/API işi → `backend/BACKEND.md`
   - Web arayüz işi → `web/WEB.md`
   - Mobil arayüz işi → `mobil/MOBIL.md`

## 8. Claude Code'a Genel Not

- Bu dokümanlardaki entity/endpoint/sayfa listeleri **başlangıç noktasıdır**, birebir üzerinden atlama yapılmadan kod yazılabilir ama kapsam dışına çıkmadan önce kullanıcıya sor.
- Belirsiz bir nokta varsa (örn. bir alanın tipi netleşmemişse) tahmin etmek yerine sor.
- Her modülü bitirdiğinde çalıştığını göster (test sonucu, örnek istek/cevap vs.).
