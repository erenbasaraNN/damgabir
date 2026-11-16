import { notFound } from 'next/navigation'
import Merchant from '../../../components/merchant/merchant'
import { findBusiness } from '../../../../lib/business'
import { businessWalletPath } from '../../../../lib/tenant'

export default async function BusinessPanel({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const business = await findBusiness(slug)
  if (!business) notFound()
  return <Merchant business={slug} initialAppearance={{name:business.name,theme:business.theme,logoUrl:business.logoUrl}} walletUrl={businessWalletPath(slug)} />
}
