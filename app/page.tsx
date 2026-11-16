import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { tenantFromHost, tenantNames } from '../lib/tenant'
import { panelPath, siteTenant } from '../lib/settings'
import Wallet from './components/wallet/wallet'
import HomeProduct from './components/portal/home-product'

export default async function Home({ searchParams }: { searchParams: Promise<{code?:string}> }) {
  const host = (await headers()).get('host') ?? ''
  const tenant = tenantFromHost(host) ?? siteTenant(host)
  if (tenant === 'app') redirect(panelPath)
  if (!tenant || tenant === 'preview' || !Object.hasOwn(tenantNames, tenant)) notFound()
  const {code} = await searchParams
  if (tenant !== 'demo' || typeof code === 'string') {
    return <Wallet name={tenantNames[tenant]} code={typeof code === 'string' ? code : undefined}/>
  }
  return <HomeProduct/>
}

