# Damgabir

Damgabir, işletmelerin NFC ve kasa QR’ı üzerinden damga vermesini, müşterilerin de biriken ödüllerini aynı cüzdanda kullanmasını sağlayan bir Next.js uygulamasıdır.

## Yerelde çalıştırma

Node.js 24 veya üzeri, npm ve bu GitHub reposuna erişim gerekir.

```bash
git clone https://github.com/erenbasaraNN/damgabir.git
cd damgabir
npm ci
npm run dev
```

[http://localhost:3000](http://localhost:3000) ana sayfayı açar. İşletme oluşturmak için `/yonetim` sayfasını geliştirme anahtarı `damgabir-demo` ile açın. Burada oluşturulan işletme için cüzdan `/isletme/<kisa-ad>`, işletme paneli `/isletme/<kisa-ad>/panel` adresindedir. İşletme paneline girişte işletme oluşturulurken verilen ayrı anahtarı kullanın.

```bash
npm test
npm run build
```

## Sunucuya kurulum

| Ortam | Çalıştırma | Veri |
| --- | --- | --- |
| Node.js çalıştıran VPS, fiziksel sunucu veya uygulama platformu | `npm ci`, `npm run build`, `npm run start` | Kalıcı yerel diskte SQLite veya uzak libSQL |
| Docker çalıştıran sunucu | `.env` dosyasını hazırlayın, `docker compose up -d --build` çalıştırın | Kalıcı Docker biriminde SQLite veya uzak libSQL |
| Geçici diskli veya birden fazla sunuculu kurulum | Node.js ya da Docker | Ortak uzak libSQL |

[Sunucu kurulumu, HTTPS, ortam değişkenleri ve yedek taşıma](docs/sunucu-kurulumu.md) · [NTAG213 ve NTAG 424 DNA kart kurulumu](docs/nfc-kurulum.md)

## Kod haritası

| Dizin | Sorumluluk |
| --- | --- |
| `app/isletme/[slug]` | İşletmeye özel müşteri cüzdanı ve işletme paneli |
| `app/api/loyalty` | Kampanya, kasa, damga ve ödül işlemleri |
| `app/api/customer` ve `app/api/platform` | Müşteri oturumları ve işletme yönetimi |
| `app/nfc` | Sayaçlı NTAG213 ve imzalı NTAG 424 DNA bağlantıları |
| `lib/database.ts` | SQLite ve libSQL, işletme verisi ayrımı ve işlem kuralları |
| `tests` | QR, NFC ve ödül akışının regresyon testleri |

Gerçek `.env` dosyaları, yerel veritabanları, yedekler ve mevcut dağıtım bağlantı ayarları Git dışında tutulur. Kurulum örneği için [`.env.example`](.env.example) dosyasını kullanın.
