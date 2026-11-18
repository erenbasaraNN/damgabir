'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Stamp, Ticket } from 'lucide-react'
import { formatPhone } from '../../../lib/phone'
import PhoneInput from './phone-input'
import { PrivacyNotice } from './contact-consent'

type Card = {name:string;href:string;stamps:number;goal:number;rewards:number}
type Account = {phone:string;cards:Card[]}
type AccountResponse = {account:Account|null;error?:string}

async function customerRequest(body?: {action:string;phone?:string}): Promise<Account|null> {
  const result = await fetch('/api/customer', body ? {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
  } : {cache:'no-store'})
  const data = await result.json() as AccountResponse
  if (!result.ok) throw new Error(data.error ?? 'İşlem tamamlanamadı.')
  return data.account
}

export default function CustomerPortal() {
  const [account,setAccount] = useState<Account|null>(null)
  const [phone,setPhone] = useState('')
  const [loading,setLoading] = useState(true)
  const [pending,setPending] = useState(false)
  const [error,setError] = useState('')

  useEffect(() => {
    let active = true
    void customerRequest().then(value => { if (active) setAccount(value) })
      .catch(error => { if (active) setError(error.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => {active = false}
  }, [])

  async function submit(action: 'login' | 'logout') {
    setPending(true)
    setError('')
    try {
      setAccount(await customerRequest({action, ...(action === 'login' ? {phone} : {})}))
      setPhone('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'İşlem tamamlanamadı.')
    } finally {
      setPending(false)
    }
  }

  return <main className="portal-main">
    <header className="portal-intro">
      <h1>{account ? 'Sadakat kartlarım' : 'Müşteri girişi'}</h1>
      {account && <p>+90 {formatPhone(account.phone)}</p>}
    </header>
    {loading ? <p role="status">Hesabın kontrol ediliyor…</p> : account ? <>
      {account.cards.length ? <ul className="portal-list">
        {account.cards.map(card => <li key={card.href}><Link className="portal-card" href={card.href}>
          <span className="portal-role-icon"><Stamp size={22} aria-hidden="true"/></span>
          <div><h2>{card.name}</h2><p>{card.stamps} / {card.goal} damga</p></div>
          {card.rewards > 0 && <small><Ticket size={15} aria-hidden="true"/> {card.rewards} ödül</small>}
          <ArrowRight size={19} className="portal-card-arrow" aria-hidden="true"/>
        </Link></li>)}
      </ul> : <div className="portal-empty">
        <h2>Henüz sadakat kartın yok</h2><p>Bir işletmenin QR kodunu okuttuğunda kartını burada görebilirsin.</p>
      </div>}
      <button className="secondary" disabled={pending} onClick={() => void submit('logout')}>Oturumu kapat</button>
    </> : <form className="panel admin-form" onSubmit={event => {event.preventDefault();void submit('login')}}>
      <PhoneInput value={phone} onChange={setPhone}/>
      <PrivacyNotice/>
      <button className="primary" disabled={pending}>Kartlarımı aç <ArrowRight size={17}/></button>
    </form>}
    {error && <p className="error" role="alert">{error}</p>}
  </main>
}
