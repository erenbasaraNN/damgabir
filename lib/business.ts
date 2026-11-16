import { timingSafeEqual } from 'node:crypto'
import { database, digest, token } from './database.ts'
import { launchMode } from './settings.ts'
import { validBusinessSlug } from './tenant.ts'

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
  const row = await db.prepare('SELECT slug,name,key_hash FROM @business WHERE slug=?').get(slug)
  if (!row) return undefined
  return { slug, name: String(row.name), keyHash: String(row.key_hash) }
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
