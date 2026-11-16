import manifest from '../../../manifest'
import { findBusiness } from '../../../../lib/business'
import { businessWalletPath } from '../../../../lib/tenant'

export async function GET(_request: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const business = await findBusiness(slug)
  if (!business) return new Response(null, {status: 404})
  return Response.json({
    ...manifest(),
    name: business.name + ' Sadakat Cüzdanı',
    short_name: business.name,
    start_url: businessWalletPath(slug),
  }, {headers: { 'Content-Type': 'application/manifest+json' }})
}
