import Link from 'next/link'
import Brand from '../brand'

export default function PortalHeader() {
  return <header className="portal-header">
    <Link className="brand" href="/" aria-label="Damgabir ana sayfa"><Brand/></Link>
    <span className="portal-header-note">Her gelişin bir karşılığı var.</span>
  </header>
}
