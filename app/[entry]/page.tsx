import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Merchant from '../components/merchant/merchant'
import { panelPath, siteTenant } from '../../lib/settings'
import { tenantFromHost } from '../../lib/tenant'

export default async function Entry({params}:{params:Promise<{entry:string}>}) {
  const host = (await headers()).get('host') ?? ''
  const tenant = tenantFromHost(host) ?? siteTenant(host)
  if ('/' + (await params).entry !== panelPath || !tenant) notFound()
  return <Merchant walletUrl={tenant === 'app' ? 'https://kavak.damgabir.com' : '/'} />
}
