import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { listBusinesses } from '../../lib/business'
import { panelPath } from '../../lib/settings'
import { businessWalletPath, tenantNames } from '../../lib/tenant'
import PortalHeader from '../components/portal/portal-header'

export const dynamic = 'force-dynamic'

export default async function BusinessDirectory() {
  const businesses = await listBusinesses()
  const links = [{name:tenantNames.demo, href:panelPath}, ...businesses.map(business => ({
    name:business.name, href:businessWalletPath(business.slug) + '/panel',
  }))]
  return <div className="portal">
    <PortalHeader/>
    <main className="portal-main">
      <header className="portal-intro"><h1>İşletme girişi</h1><p>Panelini açmak için işletmeni seç.</p></header>
      <ul className="portal-list">
        {links.map(link => <li key={link.href}><Link href={link.href}><span>{link.name}</span><ArrowRight size={19} aria-hidden="true"/></Link></li>)}
      </ul>
    </main>
  </div>
}
