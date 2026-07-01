# Fit Sihirbaz — Mobil Dokümanı (MOBIL.md)

> `apps/mobile` için kaynak doküman. Kod yazarken önce `../CLAUDE.md`'yi oku. API sözleşmesi için `../backend/BACKEND.md`'ye bak.

## 1. Genel Yapı

- Framework: **Expo (React Native)**, TypeScript — tek kod tabanından iOS + Android
- Navigasyon: `expo-router` (dosya bazlı, web'deki route mantığına benzer — tutarlılık için tercih edilir)
- Veri katmanı: aynı tRPC client + `packages/shared` tipleri (web ile ortak)
- Auth: access token secure storage (`expo-secure-store`), refresh token da aynı şekilde güvenli saklanır
- Push notification: `expo-notifications`

## 2. Kapsam Sırası

Mobil, web'e göre bir faz geriden gelir ve **önce danışan tarafı** tamamlanır (Faz 2), diyetisyen dashboard'u mobile'a Faz 4'te taşınır. Sebep: diyetisyenin plan oluşturma/danışan yönetimi ekranları karmaşık, önce web'de stabilize edilmesi daha verimli; danışan tarafı (plan görüntüleme, ölçüm girme, mesajlaşma, satın alma) mobilde daha erken değer üretir.

## 3. Ekran Listesi — Faz 2 (Danışan tarafı)

| Ekran | Açıklama |
|---|---|
| Onboarding | Kısa tanıtım + giriş/kayıt yönlendirme |
| Giriş / Kayıt | Auth |
| Ana Sayfa | Aktif plan özeti, bugünün öğünleri, yaklaşan randevu |
| Diyet Planı | Gün/öğün/besin detay görünümü, kalori/makro toplamı |
| Diyetisyen Keşfet | Liste + filtre (uzmanlık, fiyat, puan) |
| Diyetisyen Profil | Bio, paketler, yorumlar, "satın al" |
| Paket Satın Alma | Ödeme akışı (WebView ile iyzico/PayTR checkout sayfası açılabilir) |
| İlerleme | Ölçüm girme formu + grafik (kilo/ölçü zaman serisi) |
| Mesajlar | Conversation listesi + thread |
| Randevular | Liste + yeni randevu talebi |
| Profil | Kullanıcı bilgisi düzenleme |
| Bildirimler | Bildirim listesi |

## 4. Ekran Listesi — Faz 4 (Diyetisyen tarafı, mobile)

| Ekran | Açıklama |
|---|---|
| Diyetisyen Ana Sayfa | Özet: danışan sayısı, bugünkü randevular |
| Danışan Listesi | Arama/filtre |
| Danışan Detay | Ölçümler, aktif plan (salt okunur veya basit düzenleme — tam plan oluşturma web'de kalabilir) |
| Randevu Takvimi | |
| Mesajlar | |
| Kazanç/Siparişler | |

## 5. Push Notification Senaryoları

- Randevu hatırlatma (1 saat önce)
- Yeni mesaj geldi
- Sipariş/ödeme onaylandı
- Diyetisyen yeni plan/güncelleme yaptı

Backend tarafında `notifications` modülü Expo Push API'sine token bazlı gönderim yapar; mobil tarafta uygulama açılışında push token backend'e kaydedilir (`users.registerPushToken` gibi bir endpoint gerekecek — backend dokümanına eklenmesi unutulmamalı).

## 6. Offline / Senkronizasyon Notu

- MVP'de offline destek yok, sadece network hatası durumunda kullanıcıya nazik hata mesajı gösterilir (retry butonu ile).
- İleri fazda: ölçüm girişi gibi basit formlar offline'da local'e yazılıp bağlantı gelince senkronize edilebilir (React Query'nin mutation queue özellikleri değerlendirilebilir).

## 7. Paylaşılan Kod

- Tipler, zod şemaları, tRPC client tanımı `packages/shared`'dan gelir — mobile'da tekrar yazılmaz.
- İş mantığı (örn. kalori/makro hesaplama gösterimi) mümkünse `packages/shared` içinde saf fonksiyon olarak tutulup hem web hem mobile import eder.

## 8. Geliştirme Sırası Önerisi

1. Expo proje iskeleti + auth ekranları + secure token storage
2. Ana sayfa + diyet planı görüntüleme (read-only tRPC çağrıları)
3. Diyetisyen keşfet + profil + paket satın alma (WebView checkout)
4. İlerleme girişi + grafik
5. Mesajlar + randevular
6. Push notification entegrasyonu
7. (Faz 4) Diyetisyen tarafı ekranları
