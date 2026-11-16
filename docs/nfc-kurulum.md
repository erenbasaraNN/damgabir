# Damgabir NFC kart kurulumu

Kasa için NTAG 424 DNA kartını AES tabanlı Secure Dynamic Messaging (SDM) ile hazırlayın. Müşteri telefonunu karta yaklaştırınca kart, UID’yi, okuma sayacını ve doğrulama kodunu içeren bir HTTPS adresi verir.

## Kartı hazırlama

Kartın NDEF URI kaydına uygulamanın herkese açık HTTPS adresini ve şu yer tutucuları yazın:

```text
https://damgabir.erenbasaran.com.tr/nfc?uid=00000000000000&ctr=000000&mac=0000000000000000
```

- NDEF dosyasında SDM’yi ve ASCII kodlamayı açın. Açık UID ve sayaç yansıtması için `SDMMetaRead=E` kullanın. UID ve sayaç konumlarını ilgili alanların ilk sıfırına ayarlayın.
- `SDMFileRead` için karta özel, rastgele bir AES-128 uygulama anahtarı seçin. `SDMMACOffset` ve `SDMMACInputOffset` değerlerini `mac` alanındaki ilk sıfıra ayarlayın. Dosya verisi şifrelemesini kapalı tutun ve NDEF kaydının kimlik doğrulaması olmadan okunabilmesini sağlayın.
- Ofsetleri kodlanmış NDEF dosyasındaki baytlar üzerinden hesaplayın. URI kısaltması ve kayıt başlığı, URL metnindeki konumdan farklı bir ofset oluşturabilir. Kart yazma ve yönetim erişimini yetkili anahtarlarla koruyun. [NXP uygulama notu](https://www.nxp.com/docs/en/application-note/AN12196.pdf)

## Kartı işletmeye bağlama

Sunucuda `DAMGABIR_NFC_CARDS` ortam değişkenine JSON olarak kartın 14 haneli hex UID’sini, işletmenin `business-` önekli kısa adını ve karttaki `SDMFileRead` anahtarını girin. Örneğin `incirkafe` için `tenant` değeri `business-incirkafe` olur. `key`, 32 hex karakterden oluşur. Kart başka bir işletmeye atanırken karttaki anahtarı da değiştirin.

```text
{"<kart-uid>":{"tenant":"business-incirkafe","key":"<karta-özel-aes-anahtarı>"}}
```

Kurulumdan sonra kartı iki kez okutun. Telefonun her okutmadaki bağlantısı yeni bir sayaç içermeli. İlk bağlantıyla damga aldıktan sonra aynı adresi başka bir tarayıcıda açın ve damganın zaten alındığını doğrulayın. Paneldeki otomatik QR için de aynı bağlantının ikinci kez damga vermediğini ve panelin yeni bir QR gösterdiğini kontrol edin.
