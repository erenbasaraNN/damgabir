# Damgabir’de NTAG213 damga ve ödül kartlarını kurma

Kurulum için iki yazılabilir **NTAG213 kart**, NFC’li bir **Android telefon** ve **NFC TagWriter by NXP** uygulaması yeterli. Kartların kaydını işletme paneli yapar. Müşteriler kartı açarken yazma uygulamasına ihtiyaç duymaz. [Google Play’de NFC TagWriter by NXP](https://play.google.com/store/apps/details?id=com.nxp.nfc.tagwriter)

## 1. Damgabir’den iki bağlantıyı alın

1. Kartları birbirine karıştırmamak için birine **DAMGA**, diğerine **ÖDÜL** yazın.
2. Android telefonda Damgabir işletme panelini açın ve işletme anahtarıyla giriş yapın.
3. **Kasa işlemleri → NTAG213 NFC kartları → Kart bağlantılarını göster** yolunu izleyin. Panel her kart için ayrı bir bağlantı tanımlar. Daha sonra aynı düğmeye basınca aynı bağlantıları görürsünüz.
4. **Damga bağlantısını kopyala** düğmesine dokunun. Kopyalanan adres `/nfc/…` ile biten kartın temel adresidir. Okuma sayacını yazma uygulaması karta ekleyecek.

## 2. Damga kartını telefondan yazın

1. Android’de **Ayarlar** içinde **NFC** aratıp açın. Google Play’den **NFC TagWriter by NXP** uygulamasını yükleyin ve açın.
2. Uygulamada **Write tags → New dataset → Link** seçin.
3. Adres alanına Damgabir’den kopyaladığınız **damga bağlantısını** yapıştırın. `https://` ayrı bir kutuda seçiliyorsa adresin `https://` sonrasını yapıştırın. Başlık alanını boş bırakın.
4. **Configure Mirroring Options** seçeneğine dokunun. Kart türü olarak **NTAG213** seçin. **Enable Counter Mirroring** seçeneğini açın, **Enable UID Mirroring** kapalı kalsın ve **OK** deyin. Uygulamanın sürümüne göre aynı sayaç seçeneği **Add Interaction Counter (mirror)** diye görünebilir. Sayaç URL’nin sonuna `?ctr=…` olarak eklenebilir. TagWriter sonda **URL not valid** gösterirse URL’yi paneldeki haliyle bırakın, **Set Offset** ile son `/` işaretinden hemen sonraki ilk karakteri seçin. Bu ayarda kart, kart kimliğinin ilk altı karakterini sayaçla değiştirir. [NXP TagWriter kılavuzu, §4.2](https://inspire.nxp.com/tagwriter/tag-writer-user-manual.pdf)
5. **Save & Write** seçin. Bir sonraki ekranda **Write** düğmesine dokunun. Koruma veya kalıcı kilit seçeneklerini boş bırakın; böylece kurulum hatası olursa kartı yeniden yazabilirsiniz.
6. **DAMGA** kartını telefonun arkasına yaklaştırın ve başarılı yazma bildirimi gelene kadar sabit tutun.

## 3. Ödül kartını yazın

1. Damgabir’de aynı ekrana dönüp **Ödül bağlantısını kopyala** düğmesine dokunun.
2. TagWriter’da **yeni** bir bağlantı kaydı açın. 2. bölümdeki işlemleri ödül bağlantısıyla tekrarlayın ve bu kez telefona **ÖDÜL** kartını yaklaştırın.

## 4. Kasada test edin

1. Yazma uygulamasından çıkın. **DAMGA** kartını normal şekilde okutun, açılan bağlantıya dokunun ve **Damganı bas** düğmesine basın. Bir damga eklenir. Test cüzdanında hazır ödüller varsa yerlerinde kalır.
2. Telefonun açtığı ilk NFC adresini tekrar açın. Damgabir **“Bu NFC okuması kullanıldı”** gösterir. Telefonu karttan uzaklaştırıp kartı yeniden okutun. Sayaç değiştiği için bu yeni bir okumadır. Sayacı `?ctr=` sonrasında veya son `/` işaretinden sonraki ilk altı karakterde görebilirsiniz.
3. Açık ödülü olan bir test cüzdanıyla **ÖDÜL** kartını okutun ve bağlantıyı açın. **“NFC ile ödülünü kullandın.”** mesajını görün. En eski açık bilet kullanılır. Damga sayısı ve diğer biletler korunur. Oturum kapalıysa işlem, müşterinin cüzdanını açmasından sonra devam eder.
4. Açık bilet kalmadığında yeni bir okumayla ÖDÜL kartını tekrar deneyin. **“Kullanabileceğin ödül bileti yok.”** mesajı görünür.

Sayaç gelmiyorsa veya `000000` görünüyorsa kartı TagWriter ile yeniden yazıp **Enable Counter Mirroring** seçeneğini kontrol edin. Birden fazla kartı aynı anda telefona yaklaştırmayın.

**Sınır:** Her kartın aynı sayaç değeri bütün müşteriler arasında bir kez işlenir. NTAG213 sayaç değerini imzalamaz. Sayıyı elle değiştirme veya fiziksel kartı tekrar okutma yeni bir işlem gibi görünebilir. Kartları kasada tutun ve müşteriye ilgili işlem için uzatın. [NXP NTAG213 veri sayfası, §8.7](https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf)

---

## Mevcut NTAG 424 DNA kartlarının kurulumu

| Kasadaki kart | Müşterinin gördüğü ekran | Cüzdandaki işlem |
| --- | --- | --- |
| **DAMGA** | **Damganı bas** | Müşteri onaylayınca 1 damga eklenir. Hedef dolunca yeni bir ödül bileti kazanır ve önceki biletlerini saklar. |
| **ÖDÜL** | **NFC ile ödülünü kullandın.** | Müşterinin oturumu açıksa cüzdan açılır açılmaz işletmedeki en eski açık bilet kullanılır. Damga sayısı korunur. |
| **ÖDÜL**, açık bilet yoksa | **Kullanabileceğin ödül bileti yok.** | Damga, bilet ve kasa hareketi oluşmaz. |

Müşteri oturum açmamışsa önce kayıtlı telefon numarasıyla cüzdanını açar. Ödül kartı işlemi bu adımdan sonra otomatik tamamlanır. Kasa QR’ı da damga kartı gibi çalışır. Ödül kartını müşteriye ödül kullanmak istediğinde uzatın.

### 1. İşletmenin kısa adını ve kartların UID’lerini alın

1. İşletmenin cüzdan bağlantısına bakın. Örneğin `https://damgabir.erenbasaran.com.tr/isletme/incirkafe` bağlantısında kısa ad `incirkafe`, NFC ayarındaki `tenant` ise `business-incirkafe` olur. Panel bağlantısında `/isletme/incirkafe/panel` yolundaki `incirkafe` aynı değerdir. Karta yazacağınız `/nfc` adresi için cüzdanın telefonda açılan alan adını kullanın.
2. İki **NTAG 424 DNA** kullanın. Kartın yalnızca bir URL saklayabilmesi yeterli değildir. Damgabir, her okumada UID, sayaç ve AES tabanlı doğrulama kodu üreten **Secure Dynamic Messaging (SDM)** bekler. NTAG213/215/216 bu kurulumla çalışmaz. [NXP NTAG 424 DNA veri sayfası](https://www.nxp.com/docs/en/data-sheet/NT4H2421Gx.pdf)
3. Windows’ta bir seçenek, uyumlu bir USB NFC okuyucuyla **GoToTags Desktop App → NFC Tag Tools** kullanmaktır. Okuyucunuzun tam modelini destek listesinde kontrol edin. Telefonla programlama yapıyorsanız yazıcınızın NTAG 424 DNA uygulama anahtarlarını ve SDM ayarlarını değiştirebilmesi gerekir. Kartı hazırlayan tedarikçi de 2. adımdaki ayarlarla kartları teslim edebilir. [Windows kurulumu](https://gototags.com/desktop-app/download/windows), [desteklenen okuyucular](https://gototags.com/desktop-app/features/nfc/supported), [SDM desteği](https://gototags.com/desktop-app/features/nfc/chip)
4. Kartları okuyucuya tek tek koyun. Her birinin 7 baytlık UID’sini, boşluk ve `:` kullanmadan **14 hex karakter** olarak not edin. Örneğin `04:11:22:33:44:55:66` → `04112233445566`. Kartlara fiziksel olarak **DAMGA** ve **ÖDÜL** yazın. Okuttuğunuz UID’nin hangi karta ait olduğunu kayıt sırasında tekrar kontrol edin.

### 2. Her karta dinamik HTTPS adresini yazın

Mevcut çalışan Damgabir damga kartını Damga kartı olarak kullanacaksanız kartı tekrar yazmanız gerekmez. Yeni kart için aşağıdaki ayarları uygulayın.

1. Her yeni kart için ayrı, rastgele **16 baytlık AES anahtarı** oluşturun. Node.js bulunan bilgisayarda aşağıdaki komutu iki yeni kart için ayrı ayrı çalıştırabilirsiniz. Çıktı 32 hex karakterdir. Her anahtarı ait olduğu UID ile birlikte parola yöneticinizde saklayın.

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(16).toString('hex'))"
   ```

2. Kartın yönetim anahtarıyla yazıcıda kimlik doğrulayın. Oluşturduğunuz anahtarı kartta bir uygulama anahtarı yuvasına yazın. Örneğin boş bir kartta `02` yuvası kullanılabilir. SDM ayarında **SDMFileRead** için seçtiğiniz yuvanın numarasını kullanın. Vercel’e gireceğiniz değer yuva numarası değil, bu yuvaya yazılan 32 karakterlik anahtardır. Kartın yönetim anahtarı ayrı kalır ve kartta yazma ile ayar değiştirme erişimini korur. [NXP AN12196](https://www.nxp.com/docs/en/application-note/AN12196.pdf)
3. NDEF dosyasına (`02`, NFC dosya kimliği `E104`) tek bir **URI** kaydı yazın. İki kart da kendi işletmesinin aynı `/nfc` adresini ve aynı yer tutucuları kullanır. Kartın görevi Vercel’deki UID kaydından gelir.

   ```text
   https://damgabir.erenbasaran.com.tr/nfc?uid=00000000000000&ctr=000000&mac=0000000000000000
   ```

4. NDEF dosyasında aşağıdaki SDM ayarlarını yapıp kaydedin. Telefonun NDEF kaydını açabilmesi için normal okuma erişimi serbest olmalı (`Read = E`). Yazma ve dosya ayarlarını değiştirme erişimi yetkili anahtarlara bağlı olmalı.

   | Kart yazıcı ayarı | Değer |
   | --- | --- |
   | SDM / ASCII | Açık / açık |
   | UID ve okuma sayacı yansıtması | İkisi de açık |
   | `SDMMetaRead` | `E` ile açık UID ve sayaç |
   | `SDMFileRead` | 2. adımda anahtar yazdığınız yuva, örneğin `02` |
   | `UIDOffset` | `uid=` sonrasındaki ilk sıfırın konumu |
   | `SDMReadCtrOffset` | `ctr=` sonrasındaki ilk sıfırın konumu |
   | `SDMMACInputOffset` ve `SDMMACOffset` | İkisi de `mac=` sonrasındaki ilk sıfırın konumu |
   | Dosya verisi şifrelemesi | Kapalı |

   Ofsetler NDEF dosyasının başından itibaren sayılır. Yukarıdaki adres **tek kısa URI kaydı** olarak ve `https://` için URI ön ek baytı `04` kullanılarak kodlanmışsa ofsetler sırasıyla ondalık `43`, `62` ve `73` olur. Ham ayar alanı 3 bayt little-endian istiyorsa bunlar `2B0000`, `3E0000`, `490000` şeklinde yazılır. Yazıcınızın NDEF bayt görünümünde değerleri kontrol edin. Başka bir alan adı, URI ön eki veya kayıt biçimi kullanırsanız ofsetleri yeniden hesaplayın. İki MAC ofsetinin eşit olması Damgabir’in doğruladığı sıfır uzunluklu MAC girdisini sağlar. [NXP AN12196, §3.4.4.2.1](https://www.nxp.com/docs/en/application-note/AN12196.pdf)

5. Telefonu karttan uzaklaştırıp yeniden yaklaştırarak her kartı iki kez okutun. Açılan adresin `uid` değeri kartla eşleşmeli, iki ayrı okumada `ctr` değişmeli ve `mac` dolu olmalı. Bu aşamada kartı sunucuya kaydetmediyseniz doğrulama ekranında hata görmeniz beklenir. Sayaç ilk denemede değişmiyorsa eski tarayıcı sekmesini yenilemek yerine kartı yeniden fiziksel olarak okutun.

### 3. İki kartı Vercel’de işletmeye bağlayın

1. Vercel’de **damgabir → Settings → Environment Variables** ekranını açın. Kart kaydı burada sunucu ayarı olarak yapılır. İşletme panelinde **Kasa işlemleri** ekranı QR’ı, **Genel bakış** ekranı ise son işlemleri gösterir.
2. **`DAMGABIR_NFC_CARDS`** adlı değişkeni bulun veya ekleyin. Çalışan kartlar varsa mevcut kayıtların saklandığı JSON’a iki kaydı ekleyin. Değişken Secret olduğu için ekranda eski değeri okuyamıyorsanız kayıtların parola yöneticisindeki kopyasını kullanın. **Value** alanına tek bir JSON nesnesi yapıştırın.

   ```json
   {
     "04112233445566": {
       "tenant": "business-incirkafe",
       "key": "DAMGA_KARTININ_32_HEX_ANAHTARI",
       "purpose": "stamp"
     },
     "04778899AABBCC": {
       "tenant": "business-incirkafe",
       "key": "ODUL_KARTININ_32_HEX_ANAHTARI",
       "purpose": "redeem"
     }
   }
   ```

   Örnek UID’leri, işletme kısa adını ve anahtar yer tutucularını kendi değerlerinizle değiştirin. İki UID ayrı olmalı. `purpose: "stamp"` damga, `purpose: "redeem"` ödül anlamına gelir. `purpose` alanı bulunmayan eski kayıtlar **damga** olarak çalışır. Yeni kayıtlarda her kartın görevini açıkça belirtin.
3. Ortam olarak **Production**, tür olarak **Secret** seçip kaydedin. AES anahtarını NFC URL’sine, `NEXT_PUBLIC_` değişkenine veya Git’e koymayın. Yeni NFC sürümünü Production’a yayınlayın. Sürüm zaten yayındaysa değişkeni kaydettikten sonra **Deployments** ekranında ilgili Production deployment’ın menüsünden **Redeploy** seçin. Ortam değişkenleri yeni deployment ile devreye girer. [Vercel Environment Variables](https://vercel.com/docs/environment-variables), [Secret değişken türü](https://vercel.com/changelog/environment-variables-now-use-config-and-secret-types)

### 4. Kasada ilk testi yapın

1. Açık ödül bileti olan bir test cüzdanıyla **DAMGA** kartını okutun. **Damganı bas** düğmesine dokunun. Damga ilerlemeli ve açık biletler kalmalı. Kampanya hedefini yeniden doldurursanız ikinci bir bilet eklenmeli.
2. Aynı cüzdanla **ÖDÜL** kartını okutun ve çıkan bağlantıyı açın. **NFC ile ödülünü kullandın.** yazısını ve bir biletin **KULLANILDI** durumuna geçtiğini kontrol edin. Diğer açık biletler ve damga sayısı korunmalı. İşletme panelinde **Genel bakış → Son işlemler** altında hareket **Ödül NFC** olarak görünür.
3. Kullanılmış NFC bağlantısını aynı veya başka bir tarayıcıda yeniden açın. Yeni bir işlem gerçekleşmemeli. Bir sonraki ödül için kartı yeniden fiziksel olarak okutun.
4. Açık bileti olmayan bir test cüzdanında ödül kartını deneyin. **Kullanabileceğin ödül bileti yok.** mesajını görmelisiniz. Son olarak telefonda oturum kapalıyken aynı akışı deneyin. Numara girip cüzdanı açtığınızda işlem devam etmeli.

#### Hata görürseniz

| Belirti | Bakılacak yer |
| --- | --- |
| Telefon hiç bağlantı göstermiyor | NFC açık mı, kart NTAG 424 DNA mı, NDEF kaydı URI türünde mi ve normal okuma erişimi serbest mi? |
| URL’de yer tutucular okunuyor veya sayaç değişmiyor | SDM etkin mi, UID ve sayaç yansıtması seçili mi, ofsetler NDEF dosyasının başından mı hesaplandı? |
| **NFC kartı doğrulanamadı** | Production ortamında UID, `tenant`, `key` ve deployment’ı doğrulayın. `SDMFileRead` yuvasında sunucudakiyle aynı anahtar bulunmalı. MAC ofsetleri eşit olmalı. |
| Yanlış işlem açılıyor | Vercel’de kartın UID’sine ait `purpose` değerini ve fiziksel etiketi kontrol edin. Düzeltmeden sonra yeni bir deployment alıp kartı yeniden okutun. |
| Kart kayboldu | Yeni okumaları durdurmak için kartın UID kaydını `DAMGABIR_NFC_CARDS` listesinden çıkarıp Production’ı yeniden yayınlayın. Yeni kartı kendi UID’si ve anahtarıyla ekleyin. |
