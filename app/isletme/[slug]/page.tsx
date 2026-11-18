import { notFound } from 'next/navigation'
import { cache } from 'react'
import Wallet from '../../components/wallet/wallet'
import { findBusiness } from '../../../lib/business'
import { businessWalletPath } from '../../../lib/tenant'

const getBusiness = cache(findBusiness)

export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const business = await getBusiness(slug)
  return { title: business ? `${business.name} — Sadakat Cüzdanı` : undefined, manifest: businessWalletPath(slug) + '/manifest.webmanifest' }
}

export default async function BusinessWallet({params, searchParams}: {
  params: Promise<{slug: string}>
  searchParams: Promise<{code?: string; nfc?: string}>
}) {
  const {slug} = await params
  const business = await getBusiness(slug)
  if (!business) notFound()
  const {code, nfc} = await searchParams
  return <Wallet key={typeof code === 'string' ? code : undefined} name={business.name} theme={business.theme} style={business.style} logoUrl={business.logoUrl} business={slug} code={typeof code === 'string' ? code : undefined} nfcReward={nfc === 'reward'} />
}
