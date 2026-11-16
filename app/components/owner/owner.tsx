'use client'
import Brand from '../brand'

import { useState, type FormEvent } from 'react'
import { ArrowRight, Plus, Stamp } from 'lucide-react'
import type { Business } from '../../../lib/business'
import { businessSlugPattern, businessWalletPath, maxBusinessSlugLength } from '../../../lib/tenant'

type NewBusiness = Business & { key: string }

export default function Owner() {
  const [key, setKey] = useState('')
  const [businesses, setBusinesses] = useState<Business[]>()
  const [created, setCreated] = useState<NewBusiness>()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>, action: 'list' | 'create') {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, key, name: fields.get('name'), slug: fields.get('slug') }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      if (action === 'list') {
        setBusinesses(data.businesses)
      } else {
        const { key: businessKey, ...business } = data.business as NewBusiness
        setCreated({ ...business, key: businessKey })
        setBusinesses(items => [business, ...(items ?? [])])
        form.reset()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'İşlem tamamlanamadı.')
    } finally {
      setPending(false)
    }
  }

  if (!businesses) return <main className="entry-shell">
    <form className="panel admin-login" onSubmit={event => void submit(event, 'list')}>
      <div className="brand"><Brand/></div>
      <h1>Uygulama yönetimi</h1>
      <label htmlFor="platform-key">Uygulama sahibi anahtarı</label>
      <input id="platform-key" type="password" autoComplete="current-password" required value={key} onChange={event => setKey(event.target.value)} />
      <button className="primary" disabled={pending}>Giriş yap <ArrowRight size={17}/></button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  </main>

  return <main className="owner-console">
    <header className="admin-header">
      <h1>İşletmeler</h1>
      <button type="button" className="secondary" disabled={pending} onClick={() => {
        setKey(''); setBusinesses(undefined); setCreated(undefined); setError('')
      }}>Oturumu kapat</button>
    </header>
    <form className="panel admin-form" onSubmit={event => void submit(event, 'create')}>
      <h2>Yeni işletme</h2>
      <label>İşletme adı<input name="name" minLength={2} maxLength={80} required /></label>
      <label>Adres kısa adı<input name="slug" pattern={businessSlugPattern.source} maxLength={maxBusinessSlugLength} required placeholder="ornek-kafe" aria-describedby="slug-hint" /></label>
      <p id="slug-hint">En fazla 22 karakter. Küçük harf, rakam ve kısa çizgi kullan.</p>
      <button className="primary" disabled={pending}><Plus size={17}/> İşletme oluştur</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
    {created && <section className="panel admin-form" aria-live="polite">
      <h2>{created.name} oluşturuldu</h2>
      <label>İşletme giriş anahtarı
        <input readOnly value={created.key} onFocus={event => event.target.select()} />
      </label>
      <p>Anahtarı şimdi kopyala. Bu oturumda yalnızca son oluşturulan anahtar gösterilir.</p>
      <a className="subtle-link" href={businessWalletPath(created.slug) + '/panel'}>İşletme panelini aç <ArrowRight size={15}/></a>
    </section>}
    <section className="panel">
      <h2>Oluşturulan işletmeler</h2>
      {businesses.length === 0 ? <p>Henüz işletme oluşturulmadı.</p> : <div className="table-wrap"><table>
        <thead><tr><th>İşletme</th><th>Cüzdan</th><th>Yönetim</th></tr></thead>
        <tbody>{businesses.map(business => <tr key={business.slug}>
          <th scope="row">{business.name}</th>
          <td><a className="subtle-link" href={businessWalletPath(business.slug)}>Cüzdanı aç</a></td>
          <td><a className="subtle-link" href={businessWalletPath(business.slug) + '/panel'}>Paneli aç</a></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </main>
}
