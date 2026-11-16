'use client'
import Brand from '../brand'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ScanLine, Stamp, Ticket, WalletCards } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { businessWalletPath } from '../../../lib/tenant'
import { WalletCard, WalletIdentity } from './wallet-card'
import { defaultWalletTheme, type WalletTheme } from '../../../lib/business-appearance'
import PhoneInput from '../portal/phone-input'
import { loyalty, LoyaltyError, type Campaign } from '../../client'

type State = {campaign:Campaign;customer:{id:string;stamps:number}|null;tickets:{id:string;reward:string;redeemed:string|null}[];action?:string}
const initial: State = {campaign:{goal:8,daily:1,reward:'Bir kahve bizden',locked:0},customer:null,tickets:[]}

export default function Wallet({name,code,preview,business,program,theme = defaultWalletTheme,logoUrl,onSessionExpired}: {
  name:string;code?:string;preview?:boolean;business?:string;program?:'kavak';theme?:WalletTheme;logoUrl?:string|null;onSessionExpired?:()=>void
}) {
  const [state,setState] = useState<State>(initial)
  const [phone,setPhone] = useState('')
  const [error,setError] = useState('')
  const [notice,setNotice] = useState('')
  const [pending,setPending] = useState(false)
  const [ready,setReady] = useState(false)
  const [tab,setTab] = useState('card')
  const [used,setUsed] = useState(false)
  const [impact,setImpact] = useState<number|null>(null)
  const [introDone,setIntroDone] = useState(false)
  useEffect(() => { const timer = setTimeout(() => setIntroDone(true),1100); return () => clearTimeout(timer) },[])
  const [earnedTicket,setEarnedTicket] = useState<State['tickets'][number] | null>(null)
  const rewardDialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = rewardDialog.current
    if (earnedTicket && dialog && !dialog.open) dialog.showModal()
  }, [earnedTicket])
  const started = useRef(false)
  const running = useRef(false)


  async function run(action:string, payload:Record<string,unknown> = {}) {
    if (running.current) return
    running.current = true
    setPending(true);setError('');setNotice('')
    try {
      const result = await loyalty<State>(preview ? {action:'preview',operation:action,...payload} : {action,...payload},business,program)

      if (result.action === 'stamp') {
        const newTicket = result.customer?.stamps === 0
          ? result.tickets.find(ticket => !ticket.redeemed && !state.tickets.some(existing => existing.id === ticket.id))
          : undefined
        const earned = result.customer?.stamps === 0
        if (result.campaign.goal !== state.campaign.goal) {
          setState(previous => ({...previous,campaign:result.campaign}))
        }
        setTab('card')
        setImpact(earned ? result.campaign.goal - 1 : (result.customer?.stamps ?? 1) - 1)
        await new Promise<void>(resolve => {setTimeout(resolve,1900)})

        setImpact(null)
        setNotice(earned ? 'Ödül biletin hazır!' : 'Damgan kartına işlendi.')
        if (newTicket) setEarnedTicket(newTicket)
      } else if (result.action === 'redeem') {
        setNotice('Ödülün kullanıldı.')
        setTab('tickets')
      }
      if (result.action && code) {
        setUsed(true)
        window.history.replaceState(null,'',window.location.pathname)
      }
      setState(result)
    } catch (e) {
      if (preview && e instanceof LoyaltyError && e.status === 401) onSessionExpired?.()
      else setError((e as Error).message)
    }
    finally {running.current = false;setPending(false)}
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (!preview && 'serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js').catch(() => {})
    void loyalty<State>(preview ? {action:'preview'} : undefined,business,program).then(result => {
      setState(result)

    }).catch(e => {
      if (preview && e instanceof LoyaltyError && e.status === 401) onSessionExpired?.()
      else setError((e as Error).message)
    }).finally(() => setReady(true))
    // Loading a wallet never consumes its QR code. Claims require an explicit tap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const stamps = state.customer?.stamps ?? 0
  const canStamp = Boolean(preview || (code && !used))
  const available = state.tickets.filter(ticket => !ticket.redeemed).length
  const nextReward = state.tickets.findLast(ticket => !ticket.redeemed)

  return <div data-stamp-motion="enabled" data-wallet-theme={theme} className={'wallet-shell'+(!state.customer ? ' onboarding' : '')}>
    <AnimatePresence>
      {(!introDone || !ready) && <motion.div className="arrival" key="arrival" exit={{opacity:0,filter:'blur(8px)'}} transition={{duration:.45}} role="status" aria-label="Cüzdan açılıyor">
        <div className="arrival-emblem">{logoUrl ? <img className="business-logo" src={logoUrl} alt=""/> : <><Stamp size={42} strokeWidth={1.3}/><span/></>}</div>
        <h2>damgabir<span>.</span></h2><p>Güzel alışkanlıkların bir karşılığı var.</p><div className="arrival-line"/>
      </motion.div>}
    </AnimatePresence>
    {earnedTicket && <dialog
      ref={rewardDialog}
      className="reward-celebration"
      aria-labelledby="earned-heading"
      onClose={() => setEarnedTicket(null)}
    >
      <div className="reward-celebration-card">
        <div className="reward-celebration-icon" aria-hidden="true"><Ticket size={38} strokeWidth={1.5}/></div>
        <p className="reward-celebration-label">Altın bilet</p>
        <h2 id="earned-heading">Tebrikler!</h2>
        <strong>{earnedTicket.reward}</strong>
        <p>Ödülünü bir sonraki kasa okutmanda kullanabilirsin.</p>
      </div>
      <button className="primary" autoFocus onClick={() => {
        setTab('tickets')
        rewardDialog.current?.close()
      }}>Ödül biletlerimi gör <ArrowRight size={17}/></button>
      <button className="secondary" onClick={() => rewardDialog.current?.close()}>Karta dön</button>
    </dialog>}
    <header className="wallet-header"><a className="brand" href={business ? businessWalletPath(business) : "/"}><Brand/></a><span className="wallet-header-label">Sadakat cüzdanı</span></header>
    <main id="top" className="wallet-main">
      <WalletIdentity name={name} campaign={state.campaign.name ?? (business ? 'Sadakat programı' : 'Kahve Kulübü')} logoUrl={logoUrl} business={Boolean(business)}/>
      <nav hidden={!state.customer} className="wallet-tabs" aria-label="Cüzdan">
        <button type="button" disabled={pending} aria-pressed={tab === 'card'} onClick={() => setTab('card')}><WalletCards size={17}/> Sadakat kartı</button>
        <button type="button" disabled={pending} aria-pressed={tab === 'tickets'} onClick={() => setTab('tickets')}><Ticket size={17}/> Ödül biletleri {available > 0 && <span className="badge">{available}</span>}</button>
      </nav>
      {tab === 'card' ? <>
        <WalletCard goal={state.campaign.goal} reward={state.campaign.reward} stamps={stamps} canStamp={canStamp && !nextReward} impact={impact} hidden={!state.customer} business={Boolean(business)}/>
        {state.customer ? <div className="wallet-action">
          {!canStamp && <p><ScanLine size={17}/> {nextReward ? 'Ödülünü kullanmak için kasadaki NFC kartını veya QR’ı okut.' : 'Kasadaki NFC kartını veya QR kodu okutarak damga ekle.'}</p>}
          {canStamp && <>
            {nextReward && <p>{nextReward.reward}</p>}
            <button className="primary stamp-trigger" disabled={pending || !ready} onClick={() => preview ? run('stamp') : run('claim',{code})}>
              {nextReward ? <Ticket size={21}/> : <Stamp size={21}/>}
              {pending ? 'İşleniyor…' : nextReward ? 'Ödülümü kullan' : 'Damganı bas'}
            </button>
          </>}
          {preview && <button className="secondary" disabled={pending} onClick={() => run('reset')}>Önizleme kartını sıfırla</button>}
        </div> : <form className="join welcome-form" onSubmit={event => {event.preventDefault();void run('join',{phone})}}>
          <h2>{code ? 'Damganı cüzdanına ekle' : 'Sadakat kartını aç'}</h2>
          <PhoneInput value={phone} onChange={setPhone}/>
          <button className="primary" disabled={pending || !ready}>{pending ? 'İşleniyor…' : 'Kartımı aç'}<ArrowRight size={17}/></button>
        </form>}
      </> : <div className="tickets">
        {state.tickets.length ? state.tickets.map(ticket => <article className="reward" key={ticket.id}><div className="ticket-icon"><Ticket size={31}/></div><div><span className="eyebrow">{ticket.redeemed ? 'KULLANILDI' : 'ÖDÜL BİLETİ'}</span><h2>{ticket.reward}</h2>{!ticket.redeemed && <p>Bir sonraki kasa okutmanda kullanılabilir.</p>}</div></article>) : <article className="empty"><Ticket size={27}/><h2>Henüz ödül biletin yok</h2><p>Kartı doldurduğunda biletin burada görünecek.</p></article>}
      </div>}
      {notice && <p className="notice" role="status">{notice}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </main>
  </div>
}

