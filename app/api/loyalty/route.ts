import { NextRequest, NextResponse } from 'next/server'
import { campaign, counterQrCode, database, digest, findActiveCode, issueCode, ntagCards, publishCampaign, today, token, useCode, wallet } from '../../../lib/database'
import { businessWalletPath } from '../../../lib/tenant'
import { loyaltyContext } from '../../../lib/loyalty-context'
import { qrPath } from '../../../lib/qr'
import { keyMatches, ownerKeyHash, updateBusinessAppearance } from '../../../lib/business'
import { isWalletStyle, isWalletTheme } from '../../../lib/business-appearance'
import { ensureCard, findOrCreatePerson, legacyCard, membershipCard, merchantCustomers, readPerson, recentMerchantActivity, restoreLegacyPerson, startCustomerSession } from '../../../lib/customer'
import { phoneDigits, phoneFormatError, validPhone } from '../../../lib/phone'

export const runtime = 'nodejs'
const reply = (data: unknown, status = 200) => NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})
const str = (x: unknown, limit = 120) => typeof x === 'string' ? x.trim().slice(0,limit) : ''
const merchantSessionId = (session: string, keyHash: string) => digest(session + ':' + keyHash)
const hour = 60 * 60

function context(request: NextRequest) {
  const {searchParams} = request.nextUrl
  return loyaltyContext(request.headers.get('host') ?? '', searchParams.get('isletme'), searchParams.get('program') === 'kavak')
}

async function customerFor(request: NextRequest, current: NonNullable<Awaited<ReturnType<typeof context>>>) {
  const oldCookie = current.business ? 'damgabir_session_' + current.business.slug : 'damgabir_session'
  const oldSession = request.cookies.get(oldCookie)?.value
  return await readPerson(request) ?? (oldSession ? await restoreLegacyPerson(current.db,current.tenant,oldSession) : undefined)
}

export async function GET(request: NextRequest) {
  try {
    const current = await context(request)
    if (!current) return reply({error:'İşletme bulunamadı.'},404)
    const {host,tenant,db} = current
    if (host === 'app') return reply({error:'Cüzdan adresini açın.'},403)
    const person = await customerFor(request, current)
    const card = person ? await membershipCard(person, tenant) ?? await legacyCard(db, person.phone) : undefined
    const state = await wallet(db,card)
    if (person && !state.customer) return reply({...state,customer:{id:person.id,stamps:0}})
    return reply(state)
  } catch { return reply({error:'Cüzdan açılamadı. Tekrar deneyin.'},503) }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const authority = request.headers.get('host')
  if (!origin || ![request.nextUrl.origin,`https://${authority}`,`http://${authority}`].includes(origin)) return reply({error:'İstek doğrulanamadı.'},403)
  try {
    const current = await context(request)
    if (!current) return reply({error:'İşletme bulunamadı.'},404)
    const {host,tenant,db: live,business} = current
    const body = await request.json()
    if (body.action === 'join' && host !== 'app') {
      const phone = phoneDigits(body.phone)
      if (!validPhone(phone)) return reply({error:phoneFormatError},400)
      const person = await findOrCreatePerson(phone)
      const card = await ensureCard(person,tenant,live)
      const response = reply(await wallet(live,card))
      await startCustomerSession(request,response,person,origin)
      return response
    }
    if ((body.action === 'claim' || body.action === 'claimNfcReward') && host !== 'app') {
      const person = await customerFor(request,current)
      if (!person) return reply({error:'Önce sadakat kartını aç.'},401)
      const code = str(body.code,64)
      const active = await findActiveCode(live,code)
      if (!active) return reply({error:'Kod kullanıldı veya süresi doldu.'},400)
      if ((body.action === 'claimNfcReward') !== (active.kind === 'nfc-reward')) return reply({error:'Kod bu işlem için geçerli değil.'},400)
      const card = active.kind === 'redeem' || active.kind === 'nfc-reward'
        ? await membershipCard(person,tenant) ?? await legacyCard(live,person.phone)
        : await ensureCard(person,tenant,live)
      const result = await useCode(live,code,card)
      return reply(result.customer ? result : {...result,customer:{id:person.id,stamps:0}})
    }
    const keyHash = business?.keyHash ?? ownerKeyHash()
    const merchantCookie = business ? 'damgabir_merchant_' + business.slug : 'damgabir_merchant'
    const merchantToken = request.cookies.get(merchantCookie)?.value
    const sessionId = merchantToken && keyHash ? merchantSessionId(merchantToken, keyHash) : undefined
    const cookieOptions = {httpOnly:true,sameSite:'lax' as const,secure:origin.startsWith('https:'),path:'/api/loyalty'}
    if (body.action === 'logout') {
      if (sessionId) await live.prepare('DELETE FROM @merchant_sessions WHERE id=?').run(sessionId)
      const response = reply({ok:true})
      response.cookies.set(merchantCookie,'',{...cookieOptions,maxAge:0})
      return response
    }

    const login = body.action === 'login'
    const keyAccepted = keyMatches(body.key, keyHash)
    if (!keyAccepted) {
      if (login || body.key !== undefined) return reply({error:'İşletme anahtarını kontrol edin.'},403)
      const active = sessionId && await live.prepare('SELECT 1 FROM @merchant_sessions WHERE id=? AND expires>?').get(sessionId,Date.now())
      if (!active) return reply({error:'İşletme paneline giriş yapın.'},401)
    }

    if (body.action === 'appearance' && business) {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const {theme,style,logo} = body
      if (name.length < 2 || name.length > 80 || !isWalletTheme(theme)) return reply({error:'2–80 karakterlik bir işletme adı girin ve bir tema seçin.'},400)
      if (logo !== undefined && logo !== null && typeof logo !== 'string') return reply({error:'Geçerli bir PNG, JPEG veya WebP logo seçin.'},400)
      if (style !== undefined && !isWalletStyle(style)) return reply({error:'Geçerli bir cüzdan görünümü seçin.'},400)
      const saved = await updateBusinessAppearance(business.slug,{name,theme,style,logo})
      return saved ? reply(saved) : reply({error:'Logo okunamadı veya dosya boyutu çok büyük.'},400)
    }

    if (body.action === 'preview') {
      const db = await database('preview-' + tenant)
      const id = 'sandbox-wallet'
      await db.prepare('INSERT OR IGNORE INTO @customer (id,phone) VALUES (?,?)').run(id,'5000000000')
      if (body.operation === 'reset') {
        const rules = await campaign(live)
        const revision = await live.prepare('SELECT name FROM @campaign_revision ORDER BY id DESC LIMIT 1').get()
        await db.transaction(async db => {
          await db.prepare('DELETE FROM @activity').run()
          await db.prepare('DELETE FROM @ticket').run()
          await db.prepare('DELETE FROM @codes').run()
          await db.prepare('UPDATE @customer SET stamps=0,last_visit=NULL').run()
          await db.prepare('UPDATE @campaign SET goal=?,daily=?,reward=?,locked=0').run(rules.goal,rules.daily,rules.reward)
          await db.prepare('DELETE FROM @campaign_revision').run()
          if (revision) await db.prepare('INSERT INTO @campaign_revision (name,goal,daily,reward,changed,kind) VALUES (?,?,?,?,?,?)')
            .run(String(revision.name),rules.goal,rules.daily,rules.reward,new Date().toISOString(),'initial')
        })
      }
      if (body.operation === 'stamp' || body.operation === 'redeem') {
        const {code} = await issueCode(db,'Sunum','Kasa',undefined,body.operation === 'redeem' ? 'nfc-reward' : 'stamp')
        return reply(await useCode(db,code,id))
      }
      return reply(await wallet(db,id))
    }

    let issued: number | undefined
    if (body.action === 'campaign') {
      const goal = Number(body.goal)
      const reward = str(body.reward,80)
      const name = str(body.name,60)
      const create = body.mode === 'new'
      if (!Number.isInteger(goal) || goal < 2 || goal > 20 || !reward || (create && !name)) {
        return reply({error:'Kampanya adını ve ödülü girin. Hedef 2–20 arasında olmalı.'},400)
      }
      issued = await publishCampaign(live,{goal,reward,name},create)
    }

    const base = host === 'demo' ? (process.env.DAMGABIR_PUBLIC_ORIGIN ?? origin) : `https://${tenant}.damgabir.com`
    if (body.action === 'ntagCards') {
      const nfcBase = host === 'app' ? (process.env.DAMGABIR_PUBLIC_ORIGIN ?? base) : base
      const path = `/nfc/${tenant}/`
      // Reserve 8 of the 144 bytes for the URI record and NFC Type 2 framing.
      const fits = new TextEncoder().encode(new URL(path + 'A'.repeat(32) + '?ctr=000001',nfcBase).href).length <= 136
      if (!fits) return reply({error:'NTAG213 kart için daha kısa bir alan adı kullanın.'},400)
      const cards = await ntagCards(live)
      return reply({stamp:new URL(path + cards.stamp,nfcBase).href,redeem:new URL(path + cards.redeem,nfcBase).href})
    }
    if (body.action === 'counterQr' || body.action === 'issue') {
      const path = business ? businessWalletPath(business.slug) : '/'
      const claimUrl = (code: string) => new URL(path + '?code=' + code,base).href
      if (new TextEncoder().encode(claimUrl('A'.repeat(32))).length > 106) return reply({error:'QR kod için daha kısa bir cüzdan adresi ayarlayın.'},400)
      if (body.action === 'counterQr') {
        const url = claimUrl(await counterQrCode(live))
        return reply({url,qr:qrPath(url)})
      }
      if (body.kind === 'redeem') return reply({error:'Ödül kullanımı için ödül NFC kartını okutun.'},400)
      const {code,expires} = await issueCode(live,str(body.branch,50) || 'Merkez',str(body.seal,50) || 'Kasa')
      const url = claimUrl(code)
      return reply({url,expires,qr:qrPath(url),code})
    }

    if (body.action === 'codeStatus') {
      return reply({active: Boolean(await findActiveCode(live,str(body.code,64)))})
    }

    if (!login && !['overview','campaign','activity'].includes(body.action)) return reply({error:'İşlem bulunamadı.'},400)
    const [activity,counts] = await Promise.all([
      recentMerchantActivity(live,tenant),
      live.prepare("SELECT (SELECT count(*) FROM @activity WHERE kind='stamp') AS stamps,(SELECT count(*) FROM @ticket WHERE redeemed IS NULL) AS tickets").get(),
    ])
    const totals = {stamps:Number(counts?.stamps),tickets:Number(counts?.tickets)}
    if (body.action === 'activity') return reply({activity,totals})
    const customers = await merchantCustomers(live,tenant)
    const response = reply({
      campaign:await campaign(live), day:today(), issued,
      history:await live.prepare('SELECT * FROM @campaign_revision ORDER BY id DESC').all(),
      customers,
      activity,
      totals:{customers:customers.length,...totals}
    })
    if (login && keyHash) {
      const session = token()
      const now = Date.now()
      const maxAge = body.remember === true ? 30 * 24 * hour : 24 * hour
      await live.transaction(async db => {
        await db.prepare('DELETE FROM @merchant_sessions WHERE expires<=?').run(now)
        if (sessionId) await db.prepare('DELETE FROM @merchant_sessions WHERE id=?').run(sessionId)
        await db.prepare('INSERT INTO @merchant_sessions (id,expires) VALUES (?,?)')
          .run(merchantSessionId(session,keyHash),now + maxAge * 1000)
      })
      response.cookies.set(merchantCookie,session,{...cookieOptions,...(body.remember === true ? {maxAge} : {})})
    }
    return response
  } catch (error) {
    const message = error instanceof Error && /^(Kod|Bu bilet)/.test(error.message) ? error.message : 'İşlem tamamlanamadı.'
    return reply({error:message},400)
  }
}

