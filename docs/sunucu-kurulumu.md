# Damgabir sunucu kurulumu

Damgabir’in çalıştığı makine veya platform, Node.js 24 ve üzerini ya da Docker konteynerlerini desteklemelidir. Müşteri cüzdanı, işletme paneli ve NFC işlemleri sunucu rotalarını kullanır. Kurulum bir alan adının kökünden servis edilir. Örnek alan adı olarak `sadakat.example.com` kullanılmıştır. [Next.js dağıtım rehberi](https://nextjs.org/docs/app/getting-started/deploying)

## Ortamı hazırlayın

`.env.example` dosyasını `.env` adıyla kopyalayın. Linux ve macOS’ta `cp .env.example .env`, PowerShell’de `Copy-Item .env.example .env` kullanabilirsiniz. Yönetilen bir platformda aynı değişkenleri platformun ortam ayarlarından girebilirsiniz.

| Değişken | Kullanım |
| --- | --- |
| `DAMGABIR_PUBLIC_ORIGIN` | Müşterilerin açtığı adres. Örnek `https://sadakat.example.com`. İşletme yolu bu değere eklenir. Canlıda HTTPS kullanın. |
| `DAMGABIR_OWNER_KEY` | `/yonetim` ekranından işletme oluşturmak ve listelemek için sahip anahtarı. Yeni kurulum için güçlü bir değer üretin. |
| `DAMGABIR_DATA_DIR` | Yerel SQLite dosyalarının dizini. Doğrudan Node kurulumu için mutlak ve kalıcı bir sunucu yolu seçin. Compose bunu `/var/lib/damgabir` olarak ayarlar. |
| `LIBSQL_DATABASE_URL` ve `LIBSQL_AUTH_TOKEN` | Uzak libSQL kullanıyorsanız ikisini de girin. Yönetilen veya kendi barındırdığınız, kimlik doğrulamalı bir libSQL uç noktası kullanabilirsiniz. |
| `TURSO_DATABASE_URL` ve `TURSO_AUTH_TOKEN` | Mevcut Turso kurulumlarının kullanabildiği eşdeğer değişkenler. Bir bağlantı için aynı değişken çiftini kullanın. |
| `DAMGABIR_NFC_CARDS` | İsteğe bağlı NTAG 424 DNA kart kayıtları. NTAG213 kartlar işletme panelinden tanımlanır. |

Yeni bir sahip anahtarı üretmek için aşağıdaki komutu çalıştırın ve çıktıyı sunucu ortamına kaydedin.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Node.js ile yayınlayın

VPS veya fiziksel sunucuda uygulamayı yetkisiz bir işletim sistemi hesabıyla çalıştırın. SQLite kullanacaksanız o hesabın `DAMGABIR_DATA_DIR` dizinine yazma yetkisi olmalı.

```bash
npm ci
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Node sürecini sunucunuzun servis yöneticisine tanımlayın. Yönetilen bir Node platformunda kurulum komutu `npm ci`, derleme komutu `npm run build`, başlangıç komutu `npm run start` olabilir. Platformun atadığı port `PORT` ortam değişkeniyle okunur. [Next.js komut satırı kılavuzu](https://nextjs.org/docs/app/api-reference/cli/next)

## Docker Compose ile yayınlayın

`.env` dosyasını hazırladıktan sonra repo dizininden çalıştırın.

```bash
docker compose up -d --build
docker compose logs --tail=50 damgabir
```

Compose uygulamayı sunucunun `127.0.0.1:3000` adresinde yayınlar. `damgabir-data` adlı Docker birimi SQLite kullanıldığında verileri konteyner yeniden oluşturulsa da saklar. Kod güncellemelerinde aynı Compose proje adını kullanın. Veri birimini korumak için güncellemede `docker compose up -d --build` çalıştırın. [Docker birimleri](https://docs.docker.com/engine/storage/volumes/)

## Alan adı ve HTTPS

Herkese açık alan adını ters vekil sunucuda sonlandırın. Vekil, gelen `Host` başlığını uygulamaya iletmelidir. Nginx kullanıyorsanız, sertifikası ayarlanmış ilgili `server` bloğunda şu yapı kullanılabilir.

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

`DAMGABIR_PUBLIC_ORIGIN` tarayıcıda açılan HTTPS adresiyle eşleşmelidir. QR ve NTAG213 bağlantılarında uzun adresler kapasite sınırına takılabilir. Kasa paneli bu durumda daha kısa bir alan adı ister. NFC kartları bir alan adına yazıldıktan sonra adres taşınacaksa kartları yeni adresle yazın veya eski alan adının NFC isteklerini yolu ve sorguyu koruyarak yeni adrese yönlendirmesini sağlayın. [Next.js ters vekil rehberi](https://nextjs.org/docs/app/guides/self-hosting)

## Veriyi yedekleme ve taşıma

- **Yerel SQLite** için tek uygulama örneği ve kalıcı bir yerel disk kullanın. İşletme kayıtları, cüzdanlar ve işletme bazlı veriler aynı dizindeki farklı dosyalardadır. Yedeği almak için yazan uygulama süreçlerini durdurun ve `DAMGABIR_DATA_DIR` dizininin **tamamını** kopyalayın. Kalmışsa `-wal` ve `-shm` dosyaları da kopyanın parçası olsun. [SQLite WAL rehberi](https://sqlite.org/wal.html)
- **SQLite geri yükleme** için yedeği ayrı bir boş dizine ya da yeni bir Docker birimine kopyalayın. Doğrudan Node kurulumunda `DAMGABIR_DATA_DIR` değerini bu dizine yöneltin. Docker’da dosyaları uygulama başlamadan önce `/var/lib/damgabir` konumuna bağlı birime yükleyin. Konteyner içindeki `node` kullanıcısına dosyalara ve dizine yazma izni verin. Önce geri yüklenen kopyada işletme listesi, müşteri cüzdanı ve açık ödülleri kontrol edin. Ardından trafiği yeni sunucuya yönlendirin.
- **Mevcut uzak libSQL/Turso verisini taşımadan sunucu değiştirme** için yeni sunucuya aynı veritabanı uç noktasını ve erişim anahtarını güvenli ortam ayarlarından verin. Sunucu diski geçiciyse veya uygulamayı birden fazla makinede çalıştıracaksanız ortak uzak veritabanı kullanın. Uzak verinin yedeğini sağlayıcıdan alın ve geri yüklemeyi önce ayrı bir veritabanında deneyin. Yerel SQLite dosyalarından uzak şemaya geçiş ayrı bir veri taşıma işlemidir.
- `.env` ayarlarının ve gerekiyorsa NTAG 424 DNA anahtarlarının kopyasını erişimi sınırlı bir yerde saklayın. GitHub bağlantısı yalnızca kaynak kodu paylaşır. Üretim verilerini veya anahtarları ayrıca yetkilendirilmiş bir kanal üzerinden devredin.

## İlk çalıştırma kontrolü

1. Dışarıdan ana sayfayı açın ve HTTPS adresini doğrulayın.
2. `/yonetim` ekranında yeni kurulumda bir test işletmesi oluşturun. Bir veri kopyası yüklediyseniz mevcut işletme listesini kontrol edin.
3. İşletmenin paneli ve müşteri cüzdanını açın. Bir QR damgası ve bir NFC işlemi deneyin. NFC kartının adresi doğru işletme cüzdanına dönmelidir.
4. Test kurulumunda uygulamayı yeniden başlatıp aynı işletmenin ve cüzdan verisinin korunduğunu doğrulayın.
