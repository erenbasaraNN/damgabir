import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { tenantFromHost, tenantNames } from '../lib/tenant'
import { panelPath, siteTenant } from '../lib/settings'
import Wallet from './components/wallet/wallet'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ShieldCheck, Store } from 'lucide-react'
import PortalHeader from './components/portal/portal-header'
import CardPreview from './components/portal/card-preview'

const roles = [
  { href:'/isletmeler', label:'İşletme girişi', description:'Kasa işlemlerini ve sadakat programını yönet.', icon:Store },
  { href:'/yonetim', label:'Yönetici girişi', description:'Damgabir işletmelerini oluştur ve yönet.', icon:ShieldCheck },
]

export default async function Home({ searchParams }: { searchParams: Promise<{code?:string}> }) {
  const host = (await headers()).get('host') ?? ''
  const tenant = tenantFromHost(host) ?? siteTenant(host)
  if (tenant === 'app') redirect(panelPath)
  if (!tenant || tenant === 'preview' || !Object.hasOwn(tenantNames, tenant)) notFound()
  const {code} = await searchParams
  if (tenant !== 'demo' || typeof code === 'string') {
    return <Wallet name={tenantNames[tenant]} code={typeof code === 'string' ? code : undefined}/>
  }
  return <div className="portal portal-landing">
    <a className="skip-link" href="#main">İçeriğe geç</a>
    <PortalHeader/>
    <main className="portal-home" id="main">
      <section className="home-hero" aria-labelledby="home-title" data-enter>
        <div className="home-copy">
          <p className="home-category">Dijital sadakat cüzdanın</p>
          <h1 id="home-title">Bir damga.<br/>Bir sonraki<br/>gelişine.</h1>
          <p className="home-description">Sevdiğin yerlerde damga biriktir, ödülüne yaklaş.<br/>{' '}Bütün kartların tek bir Damgabir hesabında.</p>
          <Link className="brand-button" href="/musteri">Müşteri girişi <ArrowRight size={20} aria-hidden="true"/></Link>
          <p className="home-help">Telefon numaranla kartlarını aç.</p>
        </div>
        <CardPreview/>
      </section>
      <nav className="portal-roles" aria-label="Giriş seçenekleri">
        {roles.map(({href,label,description,icon:Icon}) => <Link href={href} key={href} className="portal-role">
          <span className="portal-role-icon"><Icon size={22} aria-hidden="true"/></span>
          <div><h2>{label}</h2><p>{description}</p></div><ArrowUpRight size={18} className="portal-arrow" aria-hidden="true"/>
        </Link>)}
      </nav>
    </main>
    <footer className="portal-footer"><span>damgabir</span><p>Sevdiğin yerler. Biriken güzellikler.</p><Link href="/marka">Marka kimliği</Link></footer>
  </div>
}

