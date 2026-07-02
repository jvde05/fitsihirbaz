# Fit Sihirbaz

BeBiS'in modern, çok kullanıcılı SaaS alternatifi — diyetisyen-danışan yönetimi,
besin veritabanı, diyet planı, pazaryeri (paket satışı + mock ödeme akışı), randevu,
mesajlaşma ve yorumlar. Monorepo: `apps/web` (Next.js), `apps/api` (NestJS + tRPC),
`apps/mobile` (Expo), `packages/db` (Prisma), `packages/shared` (zod şemaları).

Proje detayları için bkz. `CLAUDE.md` (ana doküman), `DATABASE.md`, `BACKEND.md`,
`WEB.md`, `MOBIL.md`.

## Gereksinimler

- Node.js >= 20
- pnpm (`corepack enable` yeterli, `packageManager` alanı sürümü sabitliyor)
- PostgreSQL 16 ve Redis (yerel kurulum ya da aşağıdaki `docker-compose.yml`)

## Kurulum

```bash
pnpm install

# Postgres + Redis'i Docker ile başlatmak isterseniz:
docker compose up -d

# .env dosyasını oluşturun (varsayılanlar docker-compose ile birebir uyumlu)
cp .env.example .env

# Prisma client üret + migration'ları uygula
pnpm db:generate
pnpm db:migrate

# Örnek veri: 8 besin + 1 admin kullanıcı (admin@fitsihirbaz.com / ChangeMe123!)
pnpm db:seed
```

Yerel Postgres/Redis kullanıyorsanız (Docker yerine), `.env` içindeki
`DATABASE_URL`/`REDIS_URL` bağlantı bilgilerini kendi kurulumunuza göre güncelleyin.

## Çalıştırma

Üç ayrı terminalde:

```bash
pnpm dev:api      # http://localhost:4000/trpc
pnpm dev:web      # http://localhost:3000
pnpm dev:mobile   # Expo — QR kod ile cihazda aç, veya "w" tuşuna basıp web önizlemesi
```

`apps/api` ayakta değilse hem web hem mobil boş/hata döner — önce API'yi başlatın.

## Giriş yapmak için

Seed sadece bir admin hesabı oluşturuyor. Diyetisyen ve danışan hesapları web
üzerinden `/kayit` sayfasından (veya mobilde kayıt ekranından) serbestçe
oluşturulabilir — e-posta doğrulama zorunlu değil, kayıt olur olmaz giriş yapılmış
sayılır. Örnek akış:

1. `/kayit` → "Diyetisyen" seçip kayıt ol → `/diyetisyen/paketler`'den bir paket oluştur
2. Farklı bir tarayıcı sekmesinde (ya da gizli pencerede) `/kayit` → "Danışan" seçip
   kayıt ol → `/diyetisyenler`'den az önceki diyetisyeni bul → paketi satın al
3. Ödeme adımı gerçek bir sağlayıcı değil, mock bir simülasyon sayfasıdır
   ("Ödemeyi Onayla" / "Ödemeyi Reddet") — gerçek iyzico/PayTR entegrasyonu
   henüz yok, bkz. `apps/api/src/payments/payments.provider.ts`

## Test / typecheck

```bash
pnpm typecheck   # tüm workspace'ler
pnpm test        # apps/api unit testleri (134 test)
```

## Notlar

- Ödeme, mesajlaşma gibi bazı akışlar polling tabanlıdır (WebSocket yok, MVP kapsamı).
- `packages/db/prisma/schema.prisma` değiştiyse `pnpm db:migrate` migration'ı
  otomatik oluşturur/uygular; production'da bunun yerine `migrate:deploy` kullanılır.
