import { NextRequest, NextResponse } from 'next/server'
import { database, digest, token, type LoyaltyDatabase } from './database'
import { businessWalletPath, tenantNames } from './tenant'
import { listBusinesses } from './business'
import { whatsappConsentVersion } from './contact-consent'

type Person = {id: string; phone: string}
export const customerCookie = 'damga_customer'
const sessionLifetime = 90 * 24 * 60 * 60
const platform = () => database('platform')

export async function findOrCreatePerson(phone: string): Promise<Person> {
  const db = await platform()
  await db.prepare('INSERT INTO @person (id,phone) VALUES (?,?) ON CONFLICT(phone) DO NOTHING').run(token(), phone)
  const row = await db.prepare('SELECT id FROM @person WHERE phone=?').get(phone)
  if (typeof row?.id !== 'string') throw new Error('Müşteri hesabı açılamadı.')
  return {id: row.id, phone}
}

export async function readPerson(request: NextRequest): Promise<Person | undefined> {
  const session = request.cookies.get(customerCookie)?.value
  if (!session) return
  const db = await platform()
  const row = await db.prepare('SELECT p.id,p.phone FROM @person_session s JOIN @person p ON p.id=s.person WHERE s.id=? AND s.expires>?')
    .get(digest(session), Date.now())
  if (typeof row?.id === 'string' && typeof row.phone === 'string') return {id: row.id, phone: row.phone}
}

export async function startCustomerSession(request: NextRequest, response: NextResponse, person: Person, origin: string) {
  const db = await platform()
  const session = token()
  const previous = request.cookies.get(customerCookie)?.value
  const now = Date.now()
  await db.transaction(async tx => {
    await tx.prepare('DELETE FROM @person_session WHERE expires<=?').run(now)
    if (previous) await tx.prepare('DELETE FROM @person_session WHERE id=?').run(digest(previous))
    await tx.prepare('INSERT INTO @person_session (id,person,expires) VALUES (?,?,?)')
      .run(digest(session), person.id, now + sessionLifetime * 1000)
  })
  response.cookies.set(customerCookie, session, {httpOnly:true, sameSite:'lax', secure:origin.startsWith('https:'), path:'/', maxAge:sessionLifetime})
}

export async function endCustomerSession(request: NextRequest, response: NextResponse, origin: string) {
  const session = request.cookies.get(customerCookie)?.value
  if (session) {
    const db = await platform()
    await db.prepare('DELETE FROM @person_session WHERE id=?').run(digest(session))
  }
  for (const {name} of request.cookies.getAll()) {
    if (name === customerCookie || name === 'damgabir_session' || name.startsWith('damgabir_session_')) {
      response.cookies.set(name, '', {httpOnly:true, sameSite:'lax', secure:origin.startsWith('https:'), path:'/', maxAge:0})
    }
  }
}

export async function membershipCard(person: Person, tenant: string) {
  const db = await platform()
  const row = await db.prepare('SELECT card FROM @membership WHERE person=? AND tenant=?').get(person.id, tenant)
  return typeof row?.card === 'string' ? row.card : undefined
}

async function linkCard(person: Person, tenant: string, card: string, walletDb: LoyaltyDatabase) {
  const db = await platform()
  await db.prepare('INSERT INTO @membership (person,tenant,card) VALUES (?,?,?) ON CONFLICT(person,tenant) DO NOTHING')
    .run(person.id, tenant, card)
  const linked = await membershipCard(person, tenant)
  if (!linked) throw new Error('Sadakat kartı bağlanamadı.')
  if (linked !== person.id) await walletDb.prepare("UPDATE @customer SET phone='' WHERE id=? AND phone=?").run(linked,person.phone)
  return linked
}

export async function legacyCard(db: LoyaltyDatabase, phone: string) {
  const row = await db.prepare('SELECT id FROM @customer WHERE phone=? ORDER BY rowid LIMIT 1').get(phone)
  return typeof row?.id === 'string' ? row.id : undefined
}

export async function ensureCard(person: Person, tenant: string, db: LoyaltyDatabase) {
  const card = await membershipCard(person, tenant) ??
    await linkCard(person, tenant, await legacyCard(db, person.phone) ?? person.id, db)
  await db.prepare("INSERT OR IGNORE INTO @customer (id,phone) VALUES (?,'')").run(card)
  return card
}

export async function whatsappPreference(person: Person, tenant: string) {
  const db = await platform()
  const row = await db.prepare('SELECT accepted FROM @whatsapp_consent WHERE person=? AND tenant=? ORDER BY id DESC LIMIT 1').get(person.id,tenant)
  return row ? Number(row.accepted) === 1 : null
}

export async function recordWhatsAppConsent(person: Person, tenant: string, sender: string, accepted: boolean, fullName: string, initial: boolean) {
  const db = await platform()
  const fields = [person.id,tenant,person.phone,sender,accepted ? fullName : null,Number(accepted),whatsappConsentVersion,new Date().toISOString()] as const
  const insert = 'INSERT INTO @whatsapp_consent (person,tenant,phone,sender,full_name,accepted,version,recorded_at) SELECT ?,?,?,?,?,?,?,?'
  if (initial) {
    await db.prepare(insert + ' WHERE NOT EXISTS (SELECT 1 FROM @whatsapp_consent WHERE person=? AND tenant=?)').run(...fields,person.id,tenant)
  } else {
    await db.prepare(insert + ' WHERE (SELECT accepted FROM @whatsapp_consent WHERE person=? AND tenant=? ORDER BY id DESC LIMIT 1) IS NOT ?')
      .run(...fields,person.id,tenant,Number(accepted))
  }
}

async function merchantMemberships(tenant: string) {
  const db = await platform()
  return db.prepare(`SELECT m.card,p.phone, c.accepted FROM @membership m
    JOIN @person p ON p.id=m.person
    LEFT JOIN @whatsapp_consent c ON c.id=(SELECT id FROM @whatsapp_consent WHERE person=m.person AND tenant=m.tenant ORDER BY id DESC LIMIT 1)
    WHERE m.tenant=?`).all(tenant)
}

export async function whatsappRecipients(tenant: string) {
  return (await merchantMemberships(tenant)).filter(row => Number(row.accepted) === 1).map(row => String(row.phone))
}

export async function restoreLegacyPerson(db: LoyaltyDatabase, tenant: string, session: string) {
  const row = await db.prepare('SELECT c.id,c.phone FROM @sessions s JOIN @customer c ON c.id=s.customer WHERE s.id=? AND s.expires>?')
    .get(digest(session), Date.now())
  if (typeof row?.phone === 'string' && row.phone) return findOrCreatePerson(row.phone)
  if (typeof row?.id === 'string') {
    const identity = await platform()
    const person = await identity.prepare('SELECT p.id,p.phone FROM @membership m JOIN @person p ON p.id=m.person WHERE m.tenant=? AND m.card=?')
      .get(tenant,row.id)
    if (typeof person?.id === 'string' && typeof person.phone === 'string') return {id:person.id,phone:person.phone}
  }
}

export async function merchantCustomers(db: LoyaltyDatabase, tenant: string) {
  const [cards, identities] = await Promise.all([
    db.prepare('SELECT id,phone,stamps,last_visit FROM @customer').all(),
    merchantMemberships(tenant),
  ])
  const phones = new Map(identities.map(row => [row.card, String(row.phone)]))
  const allowed = new Set(identities.filter(row => Number(row.accepted) === 1).map(row => String(row.phone)))
  const customers = new Map<string,{phone:string;stamps:number;last_visit:string|null;whatsappAllowed:boolean}>()
  for (const card of cards) {
    const phone = phones.get(card.id) ?? String(card.phone)
    if (!phone) continue
    const visit = typeof card.last_visit === 'string' ? card.last_visit : null
    const previous = customers.get(phone)
    customers.set(phone, {
      phone, whatsappAllowed:allowed.has(phone), stamps:Math.max(Number(card.stamps), previous?.stamps ?? 0),
      last_visit:(visit ?? '') > (previous?.last_visit ?? '') ? visit : previous?.last_visit ?? null,
    })
  }
  return [...customers.values()].sort((a,b) => (b.last_visit ?? '').localeCompare(a.last_visit ?? '') || a.phone.localeCompare(b.phone))
}

export async function recentMerchantActivity(db: LoyaltyDatabase, tenant: string) {
  const rows = await db.prepare(`
    SELECT a.id,a.customer,a.day,a.kind,a.branch,a.seal,c.phone
    FROM @activity a LEFT JOIN @customer c ON c.id=a.customer ORDER BY a.id DESC LIMIT 12
  `).all()
  const cards = [...new Set(rows.filter(row => row.kind === 'redeem').map(row => String(row.customer)))]
  const phones = new Map<string, string>()
  if (cards.length) {
    const identity = await platform()
    const members = await identity.prepare(`
      SELECT m.card,p.phone FROM @membership m JOIN @person p ON p.id=m.person
      WHERE m.tenant=? AND m.card IN (${cards.map(() => '?').join(',')})
    `).all(tenant,...cards)
    for (const member of members) phones.set(String(member.card),String(member.phone))
  }
  return rows.map(({id,customer,day,kind,branch,seal,phone}) => ({
    id,day,kind,branch,seal,phone:kind === 'redeem' ? phones.get(String(customer)) ?? (phone || null) : null,
  }))
}

export async function customerCards(person: Person) {
  const db = await platform()
  const businesses = await listBusinesses()
  const legacyChecked = await db.prepare('SELECT 1 FROM @legacy_import WHERE person=?').get(person.id)
  if (!legacyChecked) {
    // Import existing cards by phone once. New cards link to the global account when created.
    const tenants = [...Object.keys(tenantNames), ...businesses.map(business => 'business-' + business.slug)]
    for (let offset = 0; offset < tenants.length; offset += 6) {
      await Promise.all(tenants.slice(offset, offset + 6).map(async tenant => {
        const walletDb = await database(tenant)
        const oldCard = await legacyCard(walletDb,person.phone)
        if (oldCard) await linkCard(person,tenant,oldCard,walletDb)
      }))
    }
    await db.prepare('INSERT OR IGNORE INTO @legacy_import (person) VALUES (?)').run(person.id)
  }
  const rows = await db.prepare('SELECT tenant,card FROM @membership WHERE person=? ORDER BY tenant').all(person.id)
  const businessNames = new Map(businesses.map(business => [business.slug, business.name]))
  const cards = await Promise.all(rows.map(async row => {
    const tenant = String(row.tenant)
    const slug = tenant.startsWith('business-') ? tenant.slice(9) : undefined
    const name = slug ? businessNames.get(slug) : tenantNames[tenant]
    if (!name) return
    const walletDb = await database(tenant)
    const progress = await walletDb.prepare(`
      SELECT c.stamps,c.last_visit,r.goal,
        (SELECT count(*) FROM @ticket WHERE customer=c.id AND redeemed IS NULL) AS rewards
      FROM @customer c CROSS JOIN @campaign r WHERE c.id=? AND r.id=1
    `).get(String(row.card))
    if (!progress) return
    return {name, href:slug ? businessWalletPath(slug) : tenant === 'demo' ? '/cuzdan' : '/cuzdan?program=kavak',
      stamps:Number(progress.stamps), goal:Number(progress.goal), rewards:Number(progress.rewards),
      lastVisit:typeof progress.last_visit === 'string' ? progress.last_visit : ''}
  }))
  return cards.filter(card => card !== undefined).sort((a,b) => b.lastVisit.localeCompare(a.lastVisit) || a.name.localeCompare(b.name, 'tr'))
}
