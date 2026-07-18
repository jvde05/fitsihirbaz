# Fit Sihirbaz — Yol Haritası

> CLAUDE.md'deki Faz 0-4 tamamlandı (çalışan MVP + shadcn/ui arayüz yenilemesi, PR #23).
> Bu doküman bundan sonrasını tanımlar. Kuzey yıldızı: **"Türk diyetisyeninin her gün açtığı
> program olmak"** — iki gelir motoru: SaaS aboneliği (klinik araçlar) + pazaryeri komisyonu.
> Sıralama ilkesi: önce diyetisyeni araçlarla platforma yerleştir, pazaryeri onun üstüne gelir.

## Mevcut kritik eksikler

- Ödeme mock (`MockPaymentProvider`), gerçek iyzico/PayTR anahtarı yok
- Dosyalar local diske yazılıyor (`apps/api/uploads/`), S3/R2 yok
- E-posta altyapısı yok → **şifre sıfırlama ve e-posta doğrulama akışı hiç yok**
- Besin DB'de 117 kayıt (hedef 20.000+); TÜBER referans değerleri doğrulanmamış yer tutucu
- Production deployment, CI/CD, izleme (Sentry), rate limiting yok
- KVKK: açık rıza, aydınlatma metni, veri silme akışı yok (sağlık verisi işleniyor!)

## Faz A — Production'a Çıkış (0-30 gün)

Hedef: gerçek bir kullanıcı kayıt olabilir, verisi güvende, sistem ayakta kalır.

| # | İş | Not |
|---|---|---|
| A1 | **E-posta altyapısı (Resend) + şifre sıfırlama + e-posta doğrulama** | `RESEND_API_KEY` yokken konsola loglayan dev fallback ile uçtan uca kurulabilir |
| A2 | **Auth rate limiting** | login/register brute-force koruması |
| A3 | **KVKK temeli** | kayıtta açık rıza checkbox'ı, aydınlatma metni sayfası, hesap/veri silme akışı, VERBİS araştırması |
| A4 | **Dosya depolama → Cloudflare R2** | tek dosya: `uploads.controller.ts`; R2 kimlik bilgisi gerektirir |
| A5 | **Deployment** | Web → Vercel; API+Postgres+Redis → Railway/Fly/Hetzner VPS; domain+SSL |
| A6 | **CI/CD + izleme** | GitHub Actions (typecheck+test her PR'da), Sentry, /health, DB yedeği |
| A7 | **iyzico pazaryeri başvurusu** | kod değil, form — onay haftalar sürebilir, hemen başvur (insan işi) |

## Faz B — "BeBiS'ten İyi" Hamlesi (30-60 gün)

Hedef: bir diyetisyene demoda "bunu kullanırım" dedirtmek.

| # | İş | Not |
|---|---|---|
| B1 | **Besin DB: 117 → 3.000+** | USDA FoodData Central açık veri import script'i; `FoodSource` kaynakça mimarisi hazır. Paralelde TürKomp/TÜBER lisans araştırması (Türk yemekleri asıl fark) |
| B2 | **TÜBER 2022 gerçek referans değerleri** | admin arayüzü hazır; resmi tablolardan veri girişi/import |
| B3 | **Klinik hesaplayıcılar** | BMH/TDEE (Mifflin-St Jeor + Harris-Benedict), BKİ, ideal kilo; danışan profili → tek tıkla hedef kalori → plan oluşturmaya taşınır |
| B4 | **PDF çıktı** | diyet planını diyetisyen logolu PDF olarak indir/gönder — BeBiS kullanıcısının vazgeçilmezi |
| B5 | **Gerçek iyzico entegrasyonu** | `MockPaymentProvider` → `IyzicoPaymentProvider` (kural 5: önce plan modunda onay) |

## Faz C — Büyüme ve Gelir (60-90 gün)

| # | İş | Not |
|---|---|---|
| C1 | Pilot program | 5-10 gerçek diyetisyenle ücretsiz pilot, geri bildirim döngüsü |
| C2 | Mobil yayın | EAS Build → TestFlight + Play Console (push altyapısı hazır) |
| C3 | Gerçek zamanlı mesajlaşma | polling → WebSocket/SSE; randevu hatırlatma BullMQ job'ları aktifleşir |
| C4 | Takvim/uygunluk | diyetisyen slot tanımlar, danışan seçer; sonra Google Calendar senkronu |
| C5 | SEO | sitemap, meta/OG, şehir+uzmanlık bazlı arama sayfaları (SSR zaten var) |
| C6 | Fiyatlandırma denemesi | diyetisyen aboneliği + pazaryeri komisyonu (%10-15) pilotta test |

## Sürekli teknik sağlamlaştırma

- Playwright e2e: kayıt → satın alma → plan görüntüleme kritik akışları
- Arama ölçümü: `pg_trgm` 10-20k besine kadar yeterli; eşik aşılırsa Meilisearch
- Sağlık verisi erişim audit logu (CLAUDE.md kural 6'nın devamı)

## Riskler

| Risk | Önlem |
|---|---|
| TürKomp/TÜBER veri lisansı belirsiz | USDA ile başla (açık veri), resmi kanaldan yazılı izin iste |
| iyzico pazaryeri onayı gecikir | hemen başvur; gecikirse tek-hesap modeli + manuel hakediş ile başla |
| KVKK/sağlık verisi yükümlülüğü | Faz A'da temeli at; gerekirse tek seferlik KVKK danışmanlığı |
| Tek geliştirici bant genişliği | her fazda tek "wow" hedefi; sıralama buna göre |
