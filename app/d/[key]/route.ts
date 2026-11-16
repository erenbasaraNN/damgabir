import { NextRequest, NextResponse } from 'next/server'
import { issueCode } from '../../../lib/database'
import { loyaltyContext } from '../../../lib/loyalty-context'
import { businessWalletPath } from '../../../lib/tenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const headers = {'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'}

export async function HEAD() {
  return new NextResponse(null, {status: 405, headers: {...headers, Allow: 'GET'}})
}

export async function GET(request: NextRequest, {params}: {params: Promise<{key: string}>}) {
  const {key} = await params
  const missing = () => NextResponse.json({error: 'Damga bağlantısı bulunamadı.'}, {status: 404, headers})
  if (!/^[A-Za-z0-9_-]{22}$/.test(key)) return missing()

  try {
    const current = await loyaltyContext(request.headers.get('host') ?? '', request.nextUrl.searchParams.get('isletme'))
    if (!current || current.host === 'app') return missing()
    const authorized = await current.db.prepare('SELECT 1 FROM @stamp_entry WHERE id=1 AND key=?').get(key)
    if (!authorized) return missing()

    const {code} = await issueCode(current.db, 'stamp', 'Merkez', 'NFC / QR', undefined, undefined, 0)
    const path = current.business ? businessWalletPath(current.business.slug) : '/'
    return new NextResponse(null, {status: 302, headers: {...headers, Location: path + '?code=' + code}})
  } catch {
    return NextResponse.json({error: 'Damga bağlantısı açılamadı. Tekrar deneyin.'}, {status: 503, headers})
  }
}
