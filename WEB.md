# Fit Sihirbaz — Web Dokümanı (WEB.md)

> `apps/web` için kaynak doküman. Kod yazarken önce `../CLAUDE.md`'yi oku. API sözleşmesi için `../backend/BACKEND.md`'ye bak.

## 1. Genel Yapı

- Framework: **Next.js 14, App Router**, TypeScript
- Stil: Tailwind CSS
- Veri katmanı: tRPC client (`packages/shared`'daki router tiplerini kullanır) + React Query
- Form validation: zod şemaları `packages/shared`'dan import edilir (backend ile aynı kaynak)
- Auth: JWT — access token memory/short-lived cookie, refresh token httpOnly cookie

## 2. Route/Sayfa Listesi

### Herkese Açık (auth gerektirmez)
| Route | Açıklama |
|---|---|
| `/` | Landing sayfası |
| `/diyetisyenler` | Diyetisyen keşfet/listele (pazaryeri vitrini) |
| `/diyetisyenler/[slug]` | Diyetisyen profil sayfası (bio, paketler, yorumlar, "paket satın al" CTA) |
| `/makaleler` | Makale kütüphanesi listesi (herkese açık, yayınlanmış makaleler) |
| `/makaleler/[slug]` | Makale detay |
| `/giris` | Giriş |
| `/kayit` | Kayıt (danışan veya diyetisyen seçimi) |

### Danışan Alanı (`/danisan/...`, auth: CLIENT)
| Route | Açıklama |
|---|---|
| `/danisan/panel` | Ana özet: aktif diyet planı, yaklaşan randevu, son ilerleme |
| `/danisan/plan` | Aktif diyet planı detayı (gün/öğün/besin, toplam kalori/makro) |
| `/danisan/ilerleme` | Ölçüm girişi + grafik (kilo, ölçüler zaman serisi) |
| `/danisan/mesajlar` | Diyetisyenle mesajlaşma |
| `/danisan/randevular` | Randevu listesi/oluşturma |
| `/danisan/satin-al/[packageId]` | Paket satın alma / checkout akışı |
| `/danisan/profil` | Profil düzenleme |

### Diyetisyen Alanı (`/diyetisyen/...`, auth: DIETITIAN)
| Route | Açıklama |
|---|---|
| `/diyetisyen/panel` | Özet: danışan sayısı, bekleyen randevular, son siparişler |
| `/diyetisyen/danisanlar` | Danışan listesi + "danışan ekle" (manuel) |
| `/diyetisyen/danisanlar/[id]` | Danışan detay: ölçümler, aktif plan, geçmiş |
| `/diyetisyen/danisanlar/[id]/plan-olustur` | Diyet planı oluşturma ekranı (besin arama + sürükle/ekle, kalori/makro canlı hesaplama) |
| `/diyetisyen/paketler` | Paket tanımlama/düzenleme |
| `/diyetisyen/siparisler` | Gelen siparişler, kazanç özeti |
| `/diyetisyen/randevular` | Randevu takvimi |
| `/diyetisyen/mesajlar` | Danışanlarla mesajlaşma (conversation listesi + thread) |
| `/diyetisyen/profil` | Profil, uzmanlık, sertifika yükleme |

### Admin Alanı (`/admin/...`, auth: ADMIN)
| Route | Açıklama |
|---|---|
| `/admin/besinler` | Besin veritabanı yönetimi (onay, düzenleme, ekleme) |
| `/admin/diyetisyenler` | Diyetisyen doğrulama/onaylama |
| `/admin/icerik` | Makale/literatür yönetimi |
| `/admin/kullanicilar` | Kullanıcı yönetimi |

## 3. Kritik Akışlar

### Diyet Planı Oluşturma (diyetisyen)
1. Danışan seçilir → yeni plan başlatılır (başlangıç/bitiş tarihi, hedef kalori/makro)
2. Gün eklenir → öğün eklenir (kahvaltı/öğle/akşam/ara öğün)
3. Öğüne besin/tarif eklenir — besin arama input'u tRPC `foods.search` çağırır, seçilince miktar/birim girilir
4. Sağda canlı olarak günlük/plan toplam kalori-makro gösterilir (backend'deki `calculateDietPlanTotals` çağrılır veya sonuç cache'lenip client'ta da hesaplanabilir)
5. "Farklı kaloriye ayarla" butonu → `dietPlans.duplicateForNewCalorieTarget` çağrılır

### Paket Satın Alma (danışan)
1. Diyetisyen profilinde paket seçilir → `/danisan/satin-al/[packageId]`
2. `orders.create` çağrılır → `payments.initiate` ile ödeme sağlayıcı formu/token alınır
3. Ödeme sonrası webhook backend'de işlenir, kullanıcı `/danisan/panel`'e yönlendirilir, `ClientDietitianLink` otomatik oluştuğu için artık o diyetisyenin danışanı olur

## 4. Bileşen/State Yaklaşımı

- Server Components varsayılan; interaktif kısımlar (form, canlı hesaplama) Client Component
- Global state için Zustand (yalnızca auth/session ve UI state gibi hafif şeyler için) — veri fetch'i React Query/tRPC üzerinden, ayrı bir global store'a kopyalanmaz
- Form: `react-hook-form` + zod resolver (`packages/shared` şemaları)

## 5. Tasarım Notları

- Tasarım sistemi kararları için proje ilerledikçe `packages/ui` oluşturulacak; şimdilik Tailwind ile sayfa bazlı ilerlenebilir.
- Diyetisyen profil sayfaları ve literatür sayfaları SEO açısından önemli — bunlar mutlaka server-side render edilmeli, meta tag/OG image eklenmeli.

## 6. Geliştirme Sırası Önerisi

1. Auth sayfaları (giriş/kayıt) + layout/navigasyon
2. Diyetisyen dashboard: danışan listesi + ekleme
3. Diyet planı oluşturma ekranı
4. Danışan panel: plan görüntüleme
5. Pazaryeri: diyetisyen keşfet + profil + paket satın alma
6. Randevu, mesajlaşma
7. İlerleme grafikleri, literatür, admin paneli
