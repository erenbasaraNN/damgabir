import { NextRequest, NextResponse } from 'next/server'
import { registerNtagRead } from '../../../../lib/database'
import { loyaltyContext } from '../../../../lib/loyalty-context'
import { businessWalletPath } from '../../../../lib/tenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const headers = {'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}

export function HEAD() {
  return new NextResponse(null,{status:405,headers:{...headers,Allow:'GET'}})
}

export async function GET(request: NextRequest, {params}: {params: Promise<{tenant:string;card:string}>}) {
  const {tenant,card} = await params
  const counters = request.nextUrl.searchParams.getAll('ctr')
  const value = counters[0] ?? card.slice(0,6)
  if (counters.length > 1 || !/^[0-9a-f]{6}$/i.test(value) || value === '000000') {
    return NextResponse.json({error:'Karttan okuma sayacı alınamadı. Kartı yeniden okutun. Sorun sürerse işletme kartın sayaç ayarını kontrol etmeli.'},{status:400,headers})
  }
  const missing = () => NextResponse.json({error:'NFC kartı bu işletmede kayıtlı değil.'},{status:404,headers})
  if (!/^[A-Za-z0-9_-]{32}$/.test(card)) return missing()

  try {
    const slug = tenant.startsWith('business-') ? tenant.slice(9) : null
    const current = await loyaltyContext(request.headers.get('host') ?? '',slug,tenant === 'kavak')
    if (!current || current.host === 'app' || current.tenant !== tenant) return missing()
    const read = await registerNtagRead(current.db,card,counters[0])
    if (!read) return missing()
    if (!read.active) return NextResponse.json({error:'Bu NFC okuması kullanıldı. Yeni işlem için kartı tekrar okutun.'},{status:410,headers})

    const legacyWallet = current.host === 'demo' && tenant === 'kavak'
    const path = current.business ? businessWalletPath(current.business.slug) : legacyWallet ? '/cuzdan' : '/'
    const query = new URLSearchParams({code:read.code})
    if (legacyWallet) query.set('program','kavak')
    if (read.purpose === 'redeem') query.set('nfc','reward')
    return new NextResponse(null,{status:302,headers:{...headers,Location:path + '?' + query}})
  } catch {
    return NextResponse.json({error:'NFC bağlantısı açılamadı. Tekrar deneyin.'},{status:503,headers})
  }
}
