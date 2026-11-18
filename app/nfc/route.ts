import { NextRequest, NextResponse } from 'next/server'
import { registerNfcCode } from '../../lib/database'
import { loyaltyContext } from '../../lib/loyalty-context'
import { verifyNfcTap } from '../../lib/nfc'
import { businessWalletPath } from '../../lib/tenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const headers = {'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'}

export async function HEAD() {
  return new NextResponse(null, {status: 405, headers: {...headers, Allow: 'GET'}})
}

export async function GET(request: NextRequest) {
  try {
    const tap = verifyNfcTap(request.nextUrl.searchParams)
    const slug = tap?.tenant.startsWith('business-') ? tap.tenant.slice(9) : null
    const current = tap && await loyaltyContext(request.headers.get('host') ?? '', slug)
    if (!tap || !current || current.host === 'app' || current.tenant !== tap.tenant) {
      return NextResponse.json({error: 'NFC kartı doğrulanamadı. Kartı tekrar okutun.'}, {status: 404, headers})
    }

    if (!await registerNfcCode(current.db, tap.code, tap.purpose)) {
      return NextResponse.json({error: 'Bu NFC bağlantısı artık geçerli değil. Kartı tekrar okutun.'}, {status: 410, headers})
    }
    const path = current.business ? businessWalletPath(current.business.slug) : '/'
    const query = new URLSearchParams({code: tap.code})
    if (tap.purpose === 'redeem') query.set('nfc', 'reward')
    return new NextResponse(null, {status: 302, headers: {...headers, Location: path + '?' + query}})
  } catch {
    return NextResponse.json({error: 'NFC bağlantısı açılamadı. Tekrar deneyin.'}, {status: 503, headers})
  }
}
