# Fit Sihirbaz 🥑

**Türkiye'nin diyetisyenleri için BeBiS'in yerini alacak, çok kullanıcılı bir SaaS
platform inşa ediyoruz** — ve bu akşam çalışır halde göreceksin.

BeBiS 20 yıllık, tek kullanıcılı, internetsiz bir masaüstü programı. Fit Sihirbaz ise
web + iOS + Android'de aynı anda çalışan, diyetisyenlerin danışanlarını yönettiği,
danışanların da pazaryerinden diyetisyen bulup paket satın alabildiği tam bir platform.
Ve bu repo o platformun **çalışan, uçtan uca test edilmiş** bir hâli — mock değil,
demo değil, gerçek bir backend + gerçek bir veritabanı + gerçek bir ödeme state
machine'i üzerinde çalışan bir ürün.

## Şu an ne var?

- 🍎 **20.000+ besinlik veritabanı altyapısı** — arama, admin onayı, tarif oluşturma
  ve otomatik besin değeri hesaplama
- 👩‍⚕️ **Diyetisyen ↔ danışan yönetimi** — manuel ekleme, diyet planı oluşturma,
  kalori/makro hesaplama, ilerleme takibi
- 🛒 **Gerçek bir pazaryeri** — paket satın alma, sipariş/ödeme state machine'i,
  komisyon hesaplama, otomatik diyetisyen-danışan eşleştirme, yorum/puanlama
- 📅 **Randevu + mesajlaşma + bildirimler** — polling tabanlı, ama gerçek
- 📱 **Web + mobil aynı backend'i paylaşıyor** — Next.js web arayüzü ve Expo mobil
  uygulaması, tek tRPC API, tek Prisma şeması, tek doğrulama katmanı
- 🔐 **Admin paneli** — diyetisyen onayı, besin onayı, kullanıcı yönetimi

Ödeme tarafı gerçek iyzico/PayTR anahtarları gelmediği için şu an **mock bir
sağlayıcı** ile çalışıyor — ama mimari gerçek sağlayıcıyı takmaya hazır (bkz.
`apps/api/src/payments/payments.provider.ts`). Sipariş, komisyon, webhook, state
machine — hepsi gerçek, sadece son adımda kartın çekildiği yer simüle ediliyor.

Detaylı mimari ve modül dokümanları: `CLAUDE.md` (ana doküman), `DATABASE.md`,
`BACKEND.md`, `WEB.md`, `MOBIL.md`.

## Gereksinimler

- Node.js >= 20
- pnpm (`corepack enable` yeterli, `packageManager` alanı sürümü sabitliyor)
- PostgreSQL 16 ve Redis (yerel kurulum ya da aşağıdaki `docker-compose.yml`)

## Kurulum — 5 dakikada ayakta

```bash
pnpm install

# Postgres + Redis'i Docker ile başlatmak isterseniz:
docker compose up -d

# .env dosyasını oluşturun (varsayılanlar docker-compose ile birebir uyumlu)
cp .env.example .env

# Prisma client üret + migration'ları uygula
pnpm db:generate
pnpm db:migrate

# Demo veri: diyetisyenler, danışanlar, paketler, ödenmiş bir sipariş, yorumlar...
# boş bir ekranla değil, dolu bir platformla karşılaşacaksın
pnpm db:seed
```

Yerel Postgres/Redis kullanıyorsanız (Docker yerine), `.env` içindeki
`DATABASE_URL`/`REDIS_URL` bağlantı bilgilerini kendi kurulumunuza göre güncelleyin.

## Çalıştır ve gör

Üç ayrı terminalde:

```bash
pnpm dev:api      # http://localhost:4000/trpc
pnpm dev:web      # http://localhost:3000
pnpm dev:mobile   # Expo — QR kod ile cihazda aç, veya "w" tuşuna basıp web önizlemesi
```

`apps/api` ayakta değilse hem web hem mobil boş/hata döner — önce API'yi başlatın.

## Demo hesaplarla gir

Seed script'i az önce çalışırken arkanda gerçek bir pazaryeri kurdu. Şifre hepsinde
aynı: **`Demo1234`**

| Rol | E-posta | Ne göreceksin |
|---|---|---|
| Diyetisyen | `ayse.yilmaz@fitsihirbaz.com` | Onaylı profil, 2 paket, ödenmiş bir sipariş, 5 yıldızlı bir yorum |
| Diyetisyen | `mehmet.demir@fitsihirbaz.com` | Onaylı profil, sporcu paketi, ödenmiş sipariş, 4 yıldızlı yorum |
| Diyetisyen | `zeynep.kaya@fitsihirbaz.com` | **Onay bekliyor** — admin panelindeki onay akışını görmek için |
| Danışan | `elif.sahin@example.com` | Ayşe'den satın almış, yorum bırakmış, yaklaşan bir randevusu var |
| Danışan | `can.ozturk@example.com` | Mehmet'ten satın almış |
| Danışan | `deniz.aydin@example.com` | Hiçbir şeye bağlı değil — sıfırdan keşif/satın alma akışını denemek için |
| Admin | `admin@fitsihirbaz.com` | Şifre: `ChangeMe123!` — `/admin/kullanicilar`, diyetisyen onayı |

**En hızlı "vay be" anı:** `deniz.aydin@example.com` ile giriş yap → `/diyetisyenler`
→ Ayşe'yi bul → bir paket satın al → mock ödeme sayfasında "Ödemeyi Onayla"'ya bas →
saniyeler içinde sipariş PAID oluyor, Ayşe'nin danışan listesine otomatik ekleniyor,
her iki tarafa bildirim gidiyor. Sonra Ayşe'nin profiline dönüp yorum bırak.

Yeni diyetisyen/danışan hesapları da `/kayit` sayfasından serbestçe açılabilir —
e-posta doğrulama yok, kayıt olur olmaz giriş yapılmış sayılırsın.

## Test / typecheck

```bash
pnpm typecheck   # tüm workspace'ler
pnpm test        # apps/api unit testleri (134 test, hepsi yeşil)
```

## Notlar

- Ödeme, mesajlaşma gibi bazı akışlar polling tabanlıdır (WebSocket yok, MVP kapsamı).
- `packages/db/prisma/schema.prisma` değiştiyse `pnpm db:migrate` migration'ı
  otomatik oluşturur/uygular; production'da bunun yerine `migrate:deploy` kullanılır.
