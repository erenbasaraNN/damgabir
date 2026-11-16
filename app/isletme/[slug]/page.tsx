import { notFound } from 'next/navigation'
import Wallet from '../../components/wallet/wallet'
import { findBusiness } from '../../../lib/business'
import { businessWalletPath } from '../../../lib/tenant'

export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  return { manifest: businessWalletPath(slug) + '/manifest.webmanifest' }
}

export default async function BusinessWallet({params, searchParams}: {
  params: Promise<{slug: string}>
  searchParams: Promise<{code?: string}>
}) {
  const {slug} = await params
  const business = await findBusiness(slug)
  if (!business) notFound()
  const {code} = await searchParams
  return <Wallet name={business.name} business={slug} code={typeof code === 'string' ? code : undefined} />
}
