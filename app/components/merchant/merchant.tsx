'use client'
import Brand from '../brand'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, ArrowLeft, ArrowRight, ClipboardCopy, Eye, Grid2X2, LockKeyhole, MessageCircle, Plus, ScanLine, Settings, Stamp, Ticket, Users } from 'lucide-react'
import { loyalty, LoyaltyError, type Campaign } from '../../client'
import { recipientCsv, whatsappLink as whatsapp } from '../../../lib/messaging'
import Wallet from '../wallet/wallet'
import BusinessSettings from './business-settings'
import type { BusinessAppearance } from '../../../lib/business-appearance'

type Customer = {phone:string;stamps:number;last_visit:string|null}
type Revision = Campaign & {id:number;name:string;changed:string;kind:string}
type Activity = {id:number;day:string;kind:string;branch:string;seal:string;phone:string|null}
type ActivityFeed = {activity:Activity[];totals:{stamps:number;tickets:number}}
type Overview = {campaign:Campaign;day:string;issued?:number;history:Revision[];customers:Customer[];activity:Activity[];totals:ActivityFeed['totals'] & {customers:number}}
type CounterQr = {url:string;qr:string}
type Issued = {url:string;qr:string;expires:number;code:string}
const sections = [{id:'home',label:'Genel bakış',icon:Grid2X2},{id:'codes',label:'Kasa işlemleri',icon:ScanLine},{id:'campaign',label:'Kampanyalar',icon:Stamp},{id:'customers',label:'Müşteriler',icon:Users},{id:'messages',label:'WhatsApp',icon:MessageCircle},{id:'preview',label:'Cüzdan önizlemesi',icon:Eye},{id:'settings',label:'İşletme ayarları',icon:Settings}] as const
type View = typeof sections[number]['id']
const descriptions:Record<View,string> = {home:'Sadakat programının güncel durumu ve son kasa hareketleri.',codes:'Damga vermek için damga NFC kartını veya kasa QR’ını kullanın. Ödül kullanımı için müşteriye ödül NFC kartını okutun.',campaign:'Aktif kuralları güncelleyin veya yeni bir kampanya yayınlayın.',customers:'Damga ilerlemesine ve son ziyaret tarihine göre müşterileri inceleyin.',messages:'Alıcıları seçin, mesajı hazırlayın ve gönderim listesini dışa aktarın.',preview:'Damga birikimini ve ödül kullanımını müşteri cüzdanında deneyin.',settings:'Müşterilerin cüzdanında görünen adı, logoyu ve temayı düzenleyin.'}

export default function Merchant({walletUrl,business,initialAppearance}: {walletUrl:string;business?:string;initialAppearance?:BusinessAppearance}) {
  const [appearance,setAppearance] = useState(initialAppearance)
  const businessName = appearance?.name ?? 'Kavak Kahve'
  const [key,setKey] = useState('')
  const [remember,setRemember] = useState(true)
  const [checkingSession,setCheckingSession] = useState(true)
  const [view,setView] = useState<View>('home')
  const [data,setData] = useState<Overview>()
  const [rules,setRules] = useState<Campaign>()
  const [mode,setMode] = useState('update')
  const [name,setName] = useState('')
  const [error,setError] = useState('')
  const [notice,setNotice] = useState('')
  const [pending,setPending] = useState(false)
  const [segment,setSegment] = useState('all')
  const [issued,setIssued] = useState<Issued>()
  const [counterQr,setCounterQr] = useState<CounterQr>()
  const [ntagLinks,setNtagLinks] = useState<{stamp:string;redeem:string}>()
  const [counterQrError,setCounterQrError] = useState('')
  const [closed,setClosed] = useState(false)
  const [clock,setClock] = useState(0)
  const [message,setMessage] = useState('')
  const [recipientIndex,setRecipientIndex] = useState(0)
  const [batch,setBatch] = useState<{phones:string[];text:string;downloadUrl:string}>()
  const qrUrl = useRef<HTMLInputElement>(null)
  const counterUrl = useRef<HTMLInputElement>(null)
  const downloadUrl = batch?.downloadUrl
  useEffect(() => {
    if (downloadUrl) return () => URL.revokeObjectURL(downloadUrl)
  }, [downloadUrl])

  const showOverview = useCallback((result: Overview) => {
    setData(result)
    setRules(result.campaign)
    setName(result.history[0]?.name ?? 'Kahve Kulübü')
    setMode('update')
  }, [])

  const clearPanel = useCallback(() => {
    setData(undefined)
    setRules(undefined)
    setKey('')
    setIssued(undefined)
    setCounterQr(undefined)
    setNtagLinks(undefined)
    setCounterQrError('')
    setBatch(undefined)
    setMessage('')
    setSegment('all')
    setView('home')
    setNotice('')
  }, [])

  const sessionExpired = useCallback(() => {
    clearPanel()
    setError('Oturum süresi doldu. Yeniden giriş yapın.')
  }, [clearPanel])

  useEffect(() => {
    let active = true
    void loyalty<Overview>({action:'overview'},business)
      .then(result => { if (active) showOverview(result) })
      .catch(error => {
        if (active && !(error instanceof LoyaltyError && error.status === 401)) {
          setError('Oturum kontrol edilemedi. Tekrar giriş yapın.')
        }
      })
      .finally(() => { if (active) setCheckingSession(false) })
    return () => { active = false }
  }, [business,showOverview])

  useEffect(() => {
    if (!issued) return
    let active = true
    const timer = setInterval(() => setClock(Date.now()),500)
    const status = setInterval(() => {
      void loyalty<{active:boolean}>({action:'codeStatus',code:issued.code},business).then(result => {
        if (active && !result.active) setClosed(true)
      }).catch(error => {
        if (active && error instanceof LoyaltyError && error.status === 401) sessionExpired()
      })
    },1800)
    return () => {active = false;clearInterval(timer);clearInterval(status)}
  },[issued,business,sessionExpired])

  const counterVisible = Boolean(data) && view === 'codes'
  useEffect(() => {
    if (!counterVisible) return
    let active = true
    let timer: ReturnType<typeof setTimeout>
    async function refresh() {
      try {
        const result = await loyalty<CounterQr>({action:'counterQr'},business)
        if (!active) return
        setCounterQr(previous => previous?.url === result.url ? previous : result)
        setCounterQrError('')
      } catch (error) {
        if (!active) return
        if (error instanceof LoyaltyError && error.status === 401) {
          sessionExpired()
          return
        }
        setCounterQrError((error as Error).message)
      }
      timer = setTimeout(refresh,2000)
    }
    void refresh()
    return () => {active = false;clearTimeout(timer)}
  },[business,counterVisible,sessionExpired])

  const activityVisible = Boolean(data) && view === 'home'
  useEffect(() => {
    if (!activityVisible) return
    let active = true
    let timer: ReturnType<typeof setTimeout>
    async function refresh() {
      try {
        const result = await loyalty<ActivityFeed>({action:'activity'},business)
        if (!active) return
        setData(previous => previous && {...previous,activity:result.activity,totals:{...previous.totals,...result.totals}})
      } catch (error) {
        if (!active) return
        if (error instanceof LoyaltyError && error.status === 401) {
          sessionExpired()
          return
        }
      }
      timer = setTimeout(refresh,4000)
    }
    void refresh()
    return () => {active = false;clearTimeout(timer)}
  },[activityVisible,business,sessionExpired])

  async function run(action:string, payload:Record<string,unknown> = {}) {
    setError('');setNotice('');setPending(true)
    try {
      if (action === 'issue') {
        setIssued(undefined)
        const result = await loyalty<Issued>({action,...payload},business)
        setClock(Date.now());setClosed(false);setIssued(result)
      } else if (action === 'ntagCards') {
        setNtagLinks(await loyalty<{stamp:string;redeem:string}>({action},business))
      } else {
        const result = await loyalty<Overview>({action,...payload},business)
        showOverview(result)
        if (action === 'login') setKey('')
        if (action === 'campaign') setNotice(result.issued ? `Kampanya yayınlandı. ${result.issued} ödül bileti tanımlandı.` : 'Kampanya yayınlandı.')
      }
    } catch (error) {
      if (error instanceof LoyaltyError && error.status === 401) sessionExpired()
      else setError((error as Error).message)
    }
    finally {setPending(false)}
  }

  async function logout() {
    setPending(true);setError('')
    try {
      await loyalty({action:'logout'},business)
      clearPanel()
    } catch {
      setError('Oturum kapatılamadı. Tekrar deneyin.')
    } finally {
      setPending(false)
    }
  }

  function switchTo(next:View) {setView(next);setError('');setNotice('')}
  const cutoff = data ? new Date(Date.parse(data.day) - 30*86400000).toISOString().slice(0,10) : ''
  const customers = data?.customers.filter(customer => segment === 'all' || (segment === 'near' ? customer.stamps === data.campaign.goal - 1 : customer.last_visit && customer.last_visit <= cutoff)) ?? []
  const seconds = issued ? Math.max(0,Math.ceil((issued.expires-clock)/1000)) : 0
  const filter = <select aria-label="Müşteri segmenti" value={segment} onChange={event => {setSegment(event.target.value);setBatch(undefined)}}><option value="all">Tüm müşteriler</option><option value="near">Ödüle 1 damga kalanlar</option><option value="inactive">30 gündür gelmeyenler</option></select>

  function prepareMessages() {
    const phones = customers.map(customer => customer.phone)
    const text = message.trim()
    const file = new Blob([recipientCsv(phones, text)], {type:'text/csv;charset=utf-8'})
    setBatch({phones,text,downloadUrl:URL.createObjectURL(file)})
    setRecipientIndex(0)
  }

  async function copyLink(url: string, input: HTMLInputElement | null) {
    try {
      await navigator.clipboard.writeText(url)
      setNotice('Bağlantı kopyalandı.')
    } catch {
      input?.focus()
      input?.select()
      setNotice('Bağlantı seçildi. Klavyenizden kopyalayabilirsiniz.')
    }
  }

  if (checkingSession) return <main className="entry-shell"><p role="status">Oturum kontrol ediliyor…</p></main>

  if (!data) return <main className="entry-shell"><form className="panel admin-login" onSubmit={event => {event.preventDefault();void run('login',{key,remember})}}>
    <div className="brand"><Brand/></div>
    <h1>İşletme girişi</h1><p>Sadakat programını yönetmek için işletme anahtarını gir.</p>
    <label htmlFor="owner-key">İşletme anahtarı</label><input id="owner-key" type="password" autoComplete="current-password" value={key} onChange={event => setKey(event.target.value)} required/>
    <label className="remember-session"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)}/> Beni hatırla <small>30 gün</small></label>
    <button className="primary" disabled={pending}>Paneli aç <ArrowRight size={17}/></button>
    {error && <p className="error" role="alert">{error}</p>}
  </form></main>

  if (view === 'preview') return <div className="preview-shell"><div className="preview-bar"><button className="secondary" onClick={() => switchTo('home')}><ArrowLeft size={17}/> İşletme paneli</button><p>Yönetici önizlemesi</p></div><Wallet name={businessName} theme={appearance?.theme} style={appearance?.style} logoUrl={appearance?.logoUrl} business={business} preview onSessionExpired={sessionExpired}/></div>

  return <div className="admin">
    <aside className="sidebar">
      <div className="brand"><Brand/></div>
      <div className="workspace">
        {appearance?.logoUrl ? <img className="business-logo workspace-logo" src={appearance.logoUrl} alt=""/> : <span aria-hidden="true"><Stamp size={16}/></span>}
        <div><strong>{businessName}</strong><small>İşletme çalışma alanı</small></div>
      </div>
      <nav aria-label="İşletme paneli">{sections.filter(({id}) => id !== 'settings' || (business && appearance)).map(({id,label,icon:Icon}) => <button type="button" key={id} aria-current={view === id ? 'page' : undefined} onClick={() => switchTo(id)}><Icon size={18}/>{label}</button>)}</nav>
      <a className="subtle-link admin-wallet" href={walletUrl} target="_blank" rel="noreferrer">Müşteri cüzdanını aç <ArrowRight size={15}/></a>
      <button className="sidebar-exit" disabled={pending} onClick={() => void logout()}>Oturumu kapat</button>
    </aside>
    <main className="admin-main" id="top">
      <header className="admin-header" data-enter><div><span className="eyebrow">{businessName.toLocaleUpperCase("tr-TR")} / İŞLETME</span><h1>{sections.find(item => item.id === view)?.label}</h1><p>{descriptions[view]}</p></div>{view === 'home' && <button className="primary" onClick={() => switchTo('codes')}><ScanLine size={17}/> Kasa işlemi</button>}</header>
      {view === 'settings' && business && appearance && <BusinessSettings business={business} appearance={appearance} campaign={data.campaign} onSave={setAppearance} onSessionExpired={sessionExpired}/>}
      {view === 'home' && <>
        <div className="metrics">{([{label:'Toplam müşteri',icon:Users,value:data.totals.customers},{label:'Verilen damga',icon:Stamp,value:data.totals.stamps},{label:'Açık ödül bileti',icon:Ticket,value:data.totals.tickets}]).map(({label,icon:Icon,value}) => <article className="panel metric" key={label}><span><Icon size={19}/>{label}</span><strong>{value}</strong></article>)}</div>
        <section className="panel activity"><div className="form-heading"><h2>Son işlemler</h2><button className="secondary" disabled={pending} onClick={() => run('overview')}>Yenile</button></div>{data.activity.length ? <div className="table-wrap"><table><thead><tr><th>İşlem</th><th>Tarih</th><th>Şube</th><th>Mühür / Kart</th></tr></thead><tbody>{data.activity.map(item => <tr key={item.id}><td>{item.kind === 'stamp' ? 'Damga verildi' : item.phone ? `+90 ${item.phone} ödül kullandı` : 'Ödül kullanıldı'}</td><td>{item.day}</td><td>{item.branch}</td><td>{item.seal}</td></tr>)}</tbody></table></div> : <p>İlk kasa işlemi burada görünecek.</p>}</section>
      </>}
      {view === 'campaign' && rules && <div className="admin-grid">
        <form className="panel admin-form" onSubmit={event => {event.preventDefault();void run('campaign',{goal:rules.goal,reward:rules.reward,name,mode})}}>
          <div className="form-heading"><h2>{mode === 'new' ? 'Yeni kampanya' : 'Aktif kampanya'}</h2>{mode === 'update' && <span className="status">Yayında</span>}</div>
          {mode === 'new' ? <label>Kampanya adı<input value={name} maxLength={60} required onChange={event => setName(event.target.value)}/></label> : <strong>{data.history[0]?.name ?? 'Kahve Kulübü'}</strong>}
          <label>Ödül adı<input value={rules.reward} maxLength={80} required onChange={event => setRules({...rules,reward:event.target.value})}/></label>
          <label>Damga hedefi<input type="number" min={2} max={20} value={rules.goal} required onChange={event => setRules({...rules,goal:Number(event.target.value)})}/></label>
          <p>Yeni hedefe ulaşan kartlara ödül bileti verilir. Artan damgalar sonraki ödüle aktarılır ve kazanılmış biletler korunur.</p>
          <button className="primary" disabled={pending}>{mode === 'new' ? 'Yeni kampanyayı yayınla' : 'Değişiklikleri yayınla'}</button>
        </form>
        <section className="panel activity"><div className="form-heading"><h2>Kampanya geçmişi</h2><button className="secondary" disabled={pending} onClick={() => {setMode(mode === 'new' ? 'update' : 'new');setName('');setRules(data.campaign)}}>{mode === 'new' ? 'Vazgeç' : <><Plus size={16}/> Yeni kampanya</>}</button></div>
          {data.history.length ? <ul className="revisions">{data.history.map((r,index) => <li key={r.id}><strong>{r.name}</strong><span>{r.goal} damga · {r.reward}</span><small>{index === 0 ? 'Aktif' : 'Arşiv'} · {r.changed.slice(0,10)}</small></li>)}</ul> : <p>Yayınlanan değişiklikler burada listelenir.</p>}
        </section>
      </div>}
      {view === 'customers' && <section className="panel activity"><div className="form-heading"><h2>Müşteri listesi</h2>{filter}</div>
        {customers.length ? <div className="table-wrap"><table><thead><tr><th>Telefon</th><th>Damga</th><th>Son geliş</th><th>İletişim</th></tr></thead><tbody>{customers.map(customer => <tr key={customer.phone}><td>+90 {customer.phone}</td><td>{customer.stamps}/{data.campaign.goal}</td><td>{customer.last_visit ?? '—'}</td><td><a className="whatsapp" target="_blank" rel="noreferrer" href={whatsapp(customer.phone,'Merhaba! ' + businessName + ' sizi bekliyor.')}><MessageCircle size={16}/> Mesaj gönder</a></td></tr>)}</tbody></table></div> : <p>Bu segmentte müşteri yok.</p>}
      </section>}
      {view === 'messages' && <div className="admin-grid"><form className="panel admin-form" onSubmit={event => {event.preventDefault();prepareMessages()}}>
        <h2>Toplu mesaj hazırla</h2><label>Alıcılar{filter}</label><p>{customers.length} alıcı</p><label>Mesaj<textarea required maxLength={1000} value={message} onChange={event => setMessage(event.target.value)} rows={5} placeholder={'Merhaba! ' + businessName + ' sizi bekliyor.'}/></label>
        <button className="primary" disabled={!customers.length || !message.trim()}><MessageCircle size={17}/> Mesaj gönder</button>
      </form><section className="panel activity"><h2>Gönderim listesi</h2><p>WhatsApp bağlantısı her alıcının sohbetini hazır mesajla açar. Otomatik toplu gönderim için WhatsApp Business API bağlantısı gerekir.</p>
        {batch && <div className="batch"><p>{batch.phones.length} alıcı hazır.</p><blockquote>{batch.text}</blockquote><label>Alıcı seç <select value={recipientIndex} onChange={e => setRecipientIndex(Number(e.target.value))}>{batch.phones.map((phone,index) => <option key={phone} value={index}>+90 {phone}</option>)}</select></label><a className="primary" href={whatsapp(batch.phones[recipientIndex],batch.text)} target="_blank" rel="noreferrer">WhatsApp’ta aç <ArrowRight size={16}/></a><a className="secondary" href={batch.downloadUrl} download="damgabir-whatsapp.csv"><ArrowDownToLine size={16}/> Alıcı listesini indir</a></div>}
      </section></div>}
      {view === 'codes' && <>
        <section className="panel admin-form">
          <h2>NTAG213 NFC kartları</h2>
          <p>Her bağlantıyı ayrı bir karta yazın. NFC TagWriter by NXP uygulamasında okuma sayacı yansıtmasını açın.</p>
          {ntagLinks ? <div className="form-row">
            {([{name:'Damga',url:ntagLinks.stamp},{name:'Ödül',url:ntagLinks.redeem}]).map(({name,url}) => <div key={name}>
              <label>{name} kartı bağlantısı<input readOnly value={url} onFocus={event => event.target.select()}/></label>
              <button type="button" className="secondary" onClick={event => void copyLink(url,event.currentTarget.parentElement?.querySelector('input') ?? null)}><ClipboardCopy size={16}/> {name} bağlantısını kopyala</button>
            </div>)}
          </div> : <button type="button" className="primary" disabled={pending} onClick={() => void run('ntagCards')}><ScanLine size={16}/> Kart bağlantılarını göster</button>}
        </section>
        <section className="panel qr-panel">
          <h2>Otomatik damga QR’ı</h2>
          {counterQrError ? <p className="error" role="alert">{counterQrError}</p> : counterQr ? <>
            <svg viewBox="0 0 45 45" className="qr-code" role="img" aria-label="Otomatik damga QR kodu" shapeRendering="crispEdges"><rect width="45" height="45" fill="white"/><path d={counterQr.qr} fill="#101814"/></svg>
            <input ref={counterUrl} aria-label="Otomatik damga bağlantısı" readOnly value={counterQr.url} onFocus={event => event.target.select()}/>
            <button type="button" className="secondary" onClick={() => void copyLink(counterQr.url,counterUrl.current)}><ClipboardCopy size={16}/> Bağlantıyı kopyala</button>
          </> : <p role="status">QR hazırlanıyor…</p>}
          <p>QR her başarılı damga işleminden sonra yenilenir.</p>
        </section>
        <details className="panel manual-codes"><summary>Elle kasa QR’ı oluştur</summary>
        <div className="admin-grid"><form className="panel admin-form" onSubmit={event => {event.preventDefault();const fields = new FormData(event.currentTarget);void run('issue',{branch:fields.get('branch'),seal:fields.get('seal')})}}>
        <h2>Kasa işlemi başlat</h2><p>Oluşan QR kodu müşteriye gösterin.</p>
        <div className="form-row"><label>Şube<input name="branch" defaultValue="Merkez" maxLength={50}/></label><label>Mühür / Kart<input name="seal" placeholder="Kasa 1" maxLength={50}/></label></div>
        <button className="primary" disabled={pending}><ScanLine size={17}/> QR kod oluştur</button>
      </form><section className="panel qr-panel"><h2>Müşteriye göster</h2>{issued && seconds > 0 && !closed ? <>
        <svg viewBox="0 0 45 45" className="qr-code" role="img" aria-label="İşlem bağlantısının QR kodu" shapeRendering="crispEdges"><rect width="45" height="45" fill="white"/><path d={issued.qr} fill="#101814"/></svg>
        <span className="status">Süre sonuna {seconds} sn</span>
        <button type="button" className="secondary" onClick={() => void copyLink(issued.url,qrUrl.current)}><ClipboardCopy size={16}/> Bağlantıyı kopyala</button>
        <input ref={qrUrl} aria-label="İşlem bağlantısı" readOnly value={issued.url} onFocus={event => event.target.select()}/>
      </> : <div className="qr-placeholder"><ScanLine size={45}/><p>{issued ? (closed && seconds > 0 ? 'QR kullanıldı. Yeni işlem için yeni QR kod oluşturun.' : 'Bağlantının süresi doldu. Yeni QR kod oluşturun.') : 'QR kod oluşturduğunuzda burada görünür.'}</p></div>}<p>QR iki dakika içinde veya ilk başarılı işlemde kapanır.</p></section></div>
        </details>
      </>}
      {error && <p className="error" role="alert">{error}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
    </main>
  </div>
}


