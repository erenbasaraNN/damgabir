import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, Gift, MessageCircle, ScanLine, SlidersHorizontal, Stamp, SwatchBook, UsersRound } from 'lucide-react'
import { walletStyles, walletThemes } from '../../../lib/business-appearance'
import Brand from '../brand'
import CardPreview from './card-preview'

const steps = [
  {title:'Kasada okutur', icon:ScanLine, description:'Müşteri kasa QR’ını kamerayla okutur veya telefonunu damga NFC kartına yaklaştırır.'},
  {title:'Damgasını basar', icon:Stamp, description:'İlk gelişinde telefon numarasıyla cüzdanını açar. Damgasını onaylayınca ödüle kaç damga kaldığını görür.'},
  {title:'Ödülünü kullanır', icon:Gift, description:'Kart dolunca ödül cüzdanına eklenir. Müşteri ödüllerini biriktirebilir veya ödül NFC kartını okutarak birini kullanabilir.'},
] as const

const questions = [
  {question:'Müşterim uygulama indirmek zorunda mı?', answer:'Müşteri QR’ı okutup cüzdanını telefonunun tarayıcısında açar. Katıldığı işletmelerin kartlarını aynı Damgabir hesabından görebilir.'},
  {question:'NFC kartı olmadan başlayabilir miyim?', answer:'İşletme panelindeki otomatik kasa QR’ıyla damga verebilirsiniz. Ödül kullanımı için işletmenize bir ödül NFC kartı tanımlayın.'},
  {question:'Müşterim ödülünü nasıl kullanır?', answer:'Müşteri kasada ödül NFC kartını okutur. Cüzdanı açıldığında elindeki en eski kullanılabilir ödül bileti işlenir ve müşteri ekranda sonucu görür.'},
  {question:'Bir damga bağlantısı tekrar kullanılabilir mi?', answer:'Başarılı işlemden sonra bağlantı kapanır. Otomatik kasa QR’ı bir sonraki işlem için panelde yenilenir.'},
  {question:'WhatsApp mesajı nasıl gönderilir?', answer:'İşletme panelinde müşteriyi seçip mesajı hazırlarsınız. Damgabir ilgili WhatsApp sohbetini hazır metinle açar, gönderime siz karar verirsiniz.'},
] as const

export default function HomeProduct() {
  return <div className="portal portal-landing product-home">
    <a className="skip-link" href="#main">İçeriğe geç</a>
    <header className="portal-header product-header wrap">
      <Link className="brand" href="/" aria-label="Damgabir ana sayfa"><Brand/></Link>
      <nav aria-label="Ürün sayfası">
        <a href="#nasil-calisir">Nasıl çalışır?</a>
        <a href="#isletmeler-icin">İşletmeler için</a>
        <a href="#whatsapp">WhatsApp</a>
      </nav>
      <Link className="product-link product-header-login" href="/musteri">Müşteri girişi <ArrowUpRight size={15} aria-hidden="true"/></Link>
    </header>

    <main className="portal-home" id="main" tabIndex={-1}>
      <section className="home-hero product-hero wrap" aria-labelledby="home-title" data-enter>
        <div className="home-copy">
          <p className="home-category">İşletmeler için dijital sadakat</p>
          <h1 id="home-title">Bir sonraki geliş için bir neden verin.</h1>
          <p className="home-description">Her ziyarette bir damga, hedef dolduğunda bir ödül. Müşteriniz ilerlemesini telefonunda görsün, siz WhatsApp’tan bir sonraki ziyareti hatırlatın.</p>
          <div className="product-actions">
            <Link className="brand-button" href="/isletmeler">İşletme paneline gir <ArrowRight size={19} aria-hidden="true"/></Link>
            <a className="product-link" href="#nasil-calisir">Nasıl çalışır? <ArrowDown size={16} aria-hidden="true"/></a>
          </div>
        </div>
        <CardPreview/>
      </section>

      <section className="product-section wrap" id="nasil-calisir" aria-labelledby="flow-title">
        <div className="product-flow">
          <div className="product-section-heading">
            <p className="product-kicker">Müşteri deneyimi</p>
            <h2 id="flow-title">Kasadan cüzdana üç adım.</h2>
          </div>
          <ol className="product-steps">
            {steps.map(({title,icon:Icon,description},index) => <li key={title}>
              <div className="product-step-top"><Icon size={27} strokeWidth={1.5} aria-hidden="true"/><span aria-hidden="true">0{index+1}</span></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>)}
          </ol>
          <Link className="product-link" href="/musteri">Müşteri cüzdanını aç <ArrowRight size={17} aria-hidden="true"/></Link>
        </div>
      </section>

      <section className="product-section wrap" id="isletmeler-icin" aria-labelledby="merchant-title">
        <div className="product-merchant">
          <div className="product-section-heading">
            <p className="product-kicker">İşletme paneli</p>
            <h2 id="merchant-title">Müşterinize geri gelmeye değer bir ödül verin.</h2>
            <ul className="product-features">
              <li><SlidersHorizontal size={20} aria-hidden="true"/><div><h3>Ulaşılabilir bir hedef belirleyin</h3><p>Damga hedefini ve ödülü seçin. Müşteriniz bir sonraki ziyaretinin onu ödüle ne kadar yaklaştıracağını görür.</p></div></li>
              <li><SwatchBook size={20} aria-hidden="true"/><div><h3>Markanızı müşterinin telefonuna taşıyın</h3><p>Adınızı ve logonuzu ekleyin. {walletThemes.length} renk paletiyle {walletStyles.length} görünümü birleştirerek işletmenize ait bir kart hazırlayın.</p></div></li>
              <li><UsersRound size={20} aria-hidden="true"/><div><h3>Kampanyanın nasıl kullanıldığını görün</h3><p>Verilen damgaları, açık ödülleri ve kullanılan ödülleri panelde takip edin.</p></div></li>
            </ul>
          </div>
          <div className="product-console" data-visual role="group" aria-label="Örnek işletme paneli">
            <div className="product-console-header"><span className="brand"><Brand/></span><span>Örnek işletme paneli</span></div>
            <div className="product-console-body">
              <div className="product-console-title"><h3>Kampanya ayarları</h3><SlidersHorizontal size={19} aria-hidden="true"/></div>
              <dl>
                <div><dt>Damga hedefi</dt><dd>8 damga</dd></div>
                <div><dt>Kasa QR’ı</dt><dd>Tek kullanımlık</dd></div>
                <div><dt>Ödül</dt><dd>Ücretsiz kahve</dd></div>
              </dl>
              <div className="product-console-reward"><Gift size={20} aria-hidden="true"/><div><strong>Ödül kartta belirir</strong><span>Hedef tamamlandığında cüzdana eklenir.</span></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="product-section wrap" id="whatsapp" aria-labelledby="whatsapp-title">
        <div className="product-merchant">
          <div className="product-section-heading">
            <p className="product-kicker">WhatsApp ile müşteri iletişimi</p>
            <h2 id="whatsapp-title">Geri gelmeleri için onları davet edin.</h2>
            <ul className="product-features">
              <li><Stamp size={20} aria-hidden="true"/><div><h3>Ödüle yaklaşanları teşvik edin</h3><p>Ödülüne bir damga kalan müşterileri seçip bir sonraki ziyaretlerinde hedefi tamamlayabileceklerini hatırlatın.</p></div></li>
              <li><MessageCircle size={20} aria-hidden="true"/><div><h3>Bir süredir gelmeyenlere ulaşın</h3><p>30 gündür gelmeyen müşterilere yeni kampanyanızı duyurun veya onları yeniden davet edin.</p></div></li>
            </ul>
          </div>
          <div className="product-console product-messages" data-visual role="group" aria-label="Örnek WhatsApp mesajı">
            <div className="product-console-header"><span><MessageCircle size={19} aria-hidden="true"/> WhatsApp</span><span>Örnek mesaj</span></div>
            <div className="product-console-body">
              <p className="product-message-segment">Ödüle 1 damga kalanlar</p>
              <p className="product-message-bubble">Merhaba! Kahve ödülüne bir damga kaldı. Bir sonraki gelişinde kartını tamamlayabilirsin. Seni bekliyoruz!</p>
              <p className="product-message-note">Müşteri grubunu seçin ve mesajınızı hazırlayın. Damgabir hazır metni ilgili WhatsApp sohbetinde açar, mesajı siz gönderirsiniz.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="product-section wrap" id="sorular" aria-labelledby="faq-title">
        <div className="product-faq">
          <div className="product-section-heading">
            <h2 id="faq-title">Sadakat programınızı kasada başlatın.</h2>
            <Link className="brand-button" href="/isletmeler">İşletme paneline gir <ArrowRight size={19} aria-hidden="true"/></Link>
          </div>
          <div className="product-questions">
            {questions.map(({question,answer}) => <details key={question} name="damgabir-questions"><summary>{question}</summary><p>{answer}</p></details>)}
          </div>
        </div>
      </section>
    </main>

    <footer className="portal-footer product-footer wrap">
      <Link className="brand" href="/" aria-label="Damgabir ana sayfa"><Brand/></Link>
      <nav aria-label="Diğer bağlantılar">
        <Link href="/musteri">Müşteri girişi</Link>
        <Link href="/isletmeler">İşletme girişi</Link>
        <Link href="/yonetim">Yönetici girişi</Link>
        <Link href="/marka">Marka kimliği</Link>
      </nav>
    </footer>
  </div>
}
