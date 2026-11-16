import { timingSafeEqual } from 'node:crypto'
import { database, digest, token } from './database.ts'
import { launchMode } from './settings.ts'
import { businessWalletPath, validBusinessSlug } from './tenant.ts'
import { businessLogoType, defaultWalletTheme, isWalletTheme, maxBusinessLogoBytes, type BusinessAppearance, type WalletTheme } from './business-appearance.ts'

export type Business = {slug: string; name: string; created: string}

export function keyMatches(input: unknown, hash?: string) {
  return typeof input === 'string' && input.length <= 1024 && !!hash &&
    timingSafeEqual(Buffer.from(digest(input.trim()), 'hex'), Buffer.from(hash, 'hex'))
}

export function ownerKeyHash() {
  const key = process.env.DAMGABIR_OWNER_KEY || (launchMode ? 'damgabir-demo' : '')
  return key ? digest(key) : undefined
}

export async function findBusiness(slug: string) {
  if (!validBusinessSlug(slug)) return undefined
  const db = await database('platform')
  const row = await db.prepare(`
    SELECT b.name,b.key_hash,a.theme,a.logo_version FROM @business b
    LEFT JOIN @business_appearance a ON a.slug=b.slug WHERE b.slug=?
  `).get(slug)
  if (!row) return undefined
  const appearance: BusinessAppearance = {
    name: String(row.name),
    theme: isWalletTheme(row.theme) ? row.theme : defaultWalletTheme,
    logoUrl: typeof row.logo_version === 'string' ? `${businessWalletPath(slug)}/logo?v=${row.logo_version}` : null,
  }
  return { slug, ...appearance, keyHash: String(row.key_hash) }
}

function decodeLogo(value: string) {
  const type = businessLogoType(value)
  if (!type) return
  const data = value.slice(`data:${type};base64,`.length)
  if (data.length > Math.ceil(maxBusinessLogoBytes / 3) * 4 || !/^[a-z0-9+/]+={0,2}$/i.test(data)) return
  const bytes = Buffer.from(data,'base64')
  if (bytes.length > maxBusinessLogoBytes || bytes.toString('base64') !== data) return
  const png = type === 'image/png' && bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))
  const jpeg = type === 'image/jpeg' && bytes.subarray(0,3).equals(Buffer.from('ffd8ff','hex'))
  const webp = type === 'image/webp' && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP'
  if (png || jpeg || webp) return {type,bytes}
}

export async function updateBusinessAppearance(slug: string, name: string, theme: WalletTheme, logo?: string | null) {
  if (typeof logo === 'string' && !decodeLogo(logo)) return undefined
  const db = await database('platform')
  return db.transaction(async tx => {
    await tx.prepare('UPDATE @business SET name=? WHERE slug=?').run(name,slug)
    if (logo === undefined) {
      await tx.prepare('INSERT INTO @business_appearance (slug,theme) VALUES (?,?) ON CONFLICT(slug) DO UPDATE SET theme=excluded.theme').run(slug,theme)
    } else {
      await tx.prepare(`
        INSERT INTO @business_appearance (slug,theme,logo,logo_version) VALUES (?,?,?,?)
        ON CONFLICT(slug) DO UPDATE SET theme=excluded.theme,logo=excluded.logo,logo_version=excluded.logo_version
      `).run(slug,theme,logo,logo ? digest(logo) : null)
    }
    const row = await tx.prepare('SELECT logo_version FROM @business_appearance WHERE slug=?').get(slug)
    return {name,theme,logoUrl:typeof row?.logo_version === 'string' ? `${businessWalletPath(slug)}/logo?v=${row.logo_version}` : null}
  })
}

export async function readBusinessLogo(slug: string, version: string | null) {
  if (!validBusinessSlug(slug) || !version || !/^[a-f0-9]{64}$/.test(version)) return
  const db = await database('platform')
  const row = await db.prepare('SELECT logo FROM @business_appearance WHERE slug=? AND logo_version=?').get(slug,version)
  if (typeof row?.logo === 'string') return decodeLogo(row.logo)
}

export async function listBusinesses(): Promise<Business[]> {
  const db = await database('platform')
  const rows = await db.prepare('SELECT slug,name,created FROM @business ORDER BY created DESC,slug').all()
  return rows.map(row => ({ slug: String(row.slug), name: String(row.name), created: String(row.created) }))
}

export async function createBusiness(slug: string, name: string) {
  const db = await database('platform')
  const key = token()
  const created = new Date().toISOString()
  const result = await db.prepare('INSERT OR IGNORE INTO @business (slug,name,key_hash,created) VALUES (?,?,?,?)')
    .run(slug, name, digest(key), created)
  return result.changes ? { slug, name, created, key } : undefined
}
