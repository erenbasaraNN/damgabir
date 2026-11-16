import { createClient, type Client, type InValue, type Transaction } from '@libsql/client/web'
import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { createHash, randomBytes } from 'node:crypto'
import { tenantNames, validBusinessSlug } from './tenant.ts'

const connections = new Map<string, Promise<LoyaltyDatabase>>()
export const token = () => randomBytes(24).toString('base64url')
export const digest = (value: string) => createHash('sha256').update(value).digest('hex')
export const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' })

function tableNames(sql: string, prefix: string) {
  // Table markers keep each tenant and its preview separate in the shared cloud database.
  return sql.replace(/@([a-z_]+)/g, (_, table: string) => prefix + table)
}

class CloudDatabase {
  private client: Client | Transaction
  private prefix: string

  constructor(client: Client | Transaction, prefix: string) {
    this.client = client
    this.prefix = prefix
  }

  prepare(sql: string) {
    const execute = (args: InValue[]) => this.client.execute({ sql: tableNames(sql, this.prefix), args })
    return {
      get: async (...args: InValue[]) => (await execute(args)).rows[0],
      all: async (...args: InValue[]) => (await execute(args)).rows,
      run: async (...args: InValue[]) => ({ changes: (await execute(args)).rowsAffected }),
    }
  }

  async exec(sql: string) {
    await this.client.executeMultiple(tableNames(sql, this.prefix))
  }

  async transaction<T>(work: (db: CloudDatabase) => Promise<T>) {
    if (!('transaction' in this.client)) throw new Error('İç içe veritabanı işlemi desteklenmiyor.')
    const tx = await this.client.transaction('write')
    try {
      const result = await work(new CloudDatabase(tx, this.prefix))
      await tx.commit()
      return result
    } catch (error) {
      if (!tx.closed) await tx.rollback()
      throw error
    } finally {
      tx.close()
    }
  }

  close() {
    this.client.close()
  }
}

class LocalDatabase {
  private db: DatabaseSync
  private pending: Promise<unknown> = Promise.resolve()
  private transactionActive: boolean

  constructor(db: DatabaseSync, transactionActive = false) {
    this.db = db
    this.transactionActive = transactionActive
  }

  private run<T>(work: () => T | Promise<T>) {
    if (this.transactionActive) return Promise.resolve().then(work)
    const result = this.pending.then(work)
    this.pending = result.catch(() => {})
    return result
  }

  prepare(sql: string) {
    const statement = this.db.prepare(tableNames(sql, ''))
    return {
      get: (...args: SQLInputValue[]) => this.run(() => statement.get(...args)),
      all: (...args: SQLInputValue[]) => this.run(() => statement.all(...args)),
      run: (...args: SQLInputValue[]) => this.run(() => statement.run(...args)),
    }
  }

  exec(sql: string) {
    return this.run(() => this.db.exec(tableNames(sql, '')))
  }

  transaction<T>(work: (db: LocalDatabase) => Promise<T>) {
    return this.run(async () => {
      this.db.exec('BEGIN IMMEDIATE')
      try {
        const result = await work(new LocalDatabase(this.db, true))
        this.db.exec('COMMIT')
        return result
      } catch (error) {
        this.db.exec('ROLLBACK')
        throw error
      }
    })
  }

  close() {
    this.db.close()
  }
}

export type LoyaltyDatabase = LocalDatabase | CloudDatabase

export function database(tenant: string) {
  const name = tenant.replace(/^preview-/, '')
  const business = name.startsWith('business-') && validBusinessSlug(name.slice(9))
  if (tenant !== 'platform' && !business && !Object.hasOwn(tenantNames, name)) throw new Error('İşletme bulunamadı.')
  const initialSchema = tenant === 'platform' ? platformSchema : business ? businessSchema : schema
  const remoteUrl = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if ((remoteUrl && !authToken) || (!remoteUrl && process.env.VERCEL)) throw new Error('Veritabanı bağlantısı eksik.')
  const dir = resolve(process.env.DAMGABIR_DATA_DIR ?? '.data')
  const key = remoteUrl ? tenant : resolve(dir, tenant)
  const existing = connections.get(key)
  if (existing) return existing

  const initialize = async (): Promise<LoyaltyDatabase> => {
    if (!remoteUrl) {
      mkdirSync(dir, { recursive: true })
      const db = new LocalDatabase(new DatabaseSync(resolve(dir, tenant + '.sqlite')))
      try {
        await db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;' + initialSchema)
        return db
      } catch (error) {
        db.close()
        throw error
      }
    }
    const prefix = tenant.replaceAll('-', '_') + '_'
    const client = createClient({ url: remoteUrl, authToken })
    try {
      await client.batch(tableNames(initialSchema, prefix).split(';').map(sql => sql.trim()).filter(Boolean), 'write')
      return new CloudDatabase(client, prefix)
    } catch (error) {
      client.close()
      throw error
    }
  }
  const opening = initialize().catch(error => {
    connections.delete(key)
    throw error
  })
  connections.set(key, opening)
  return opening
}

const schema = `
    CREATE TABLE IF NOT EXISTS @campaign (id INTEGER PRIMARY KEY CHECK(id=1), goal INTEGER NOT NULL, daily INTEGER NOT NULL, reward TEXT NOT NULL, locked INTEGER NOT NULL DEFAULT 0);
    INSERT OR IGNORE INTO @campaign VALUES (1,8,1,'Bir kahve bizden',0);
    CREATE TABLE IF NOT EXISTS @campaign_revision (id INTEGER PRIMARY KEY, name TEXT NOT NULL, goal INTEGER NOT NULL, daily INTEGER NOT NULL, reward TEXT NOT NULL, changed TEXT NOT NULL, kind TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS @customer (id TEXT PRIMARY KEY, phone TEXT NOT NULL, stamps INTEGER NOT NULL DEFAULT 0, last_visit TEXT);
    CREATE INDEX IF NOT EXISTS @customer_phone ON @customer(phone);
    CREATE TABLE IF NOT EXISTS @sessions (id TEXT PRIMARY KEY, customer TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS @merchant_sessions (id TEXT PRIMARY KEY, expires INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS @merchant_sessions_expires ON @merchant_sessions(expires);
    CREATE TABLE IF NOT EXISTS @codes (id TEXT PRIMARY KEY, kind TEXT NOT NULL, expires INTEGER NOT NULL, branch TEXT NOT NULL, seal TEXT NOT NULL, customer TEXT, ticket TEXT);
    CREATE TABLE IF NOT EXISTS @stamp_entry (id INTEGER PRIMARY KEY CHECK(id=1), key TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS @ticket (id TEXT PRIMARY KEY, customer TEXT NOT NULL, reward TEXT NOT NULL, redeemed TEXT);
    CREATE TABLE IF NOT EXISTS @activity (id INTEGER PRIMARY KEY, customer TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, branch TEXT NOT NULL, seal TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS @activity_customer_day ON @activity(customer,day,kind);
`
const businessSchema = schema.replace('Bir kahve bizden', 'Sadakat ödülü') + `
    INSERT OR IGNORE INTO @campaign_revision (id,name,goal,daily,reward,changed,kind)
      VALUES (1,'Sadakat programı',8,1,'Sadakat ödülü',date('now'),'initial');
`
const platformSchema = `
    CREATE TABLE IF NOT EXISTS @business (slug TEXT PRIMARY KEY, name TEXT NOT NULL, key_hash TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS @person (id TEXT PRIMARY KEY, phone TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS @person_session (id TEXT PRIMARY KEY, person TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS @person_session_expiry ON @person_session(expires);
    CREATE TABLE IF NOT EXISTS @membership (person TEXT NOT NULL, tenant TEXT NOT NULL, card TEXT NOT NULL, PRIMARY KEY(person,tenant), UNIQUE(tenant,card));
    CREATE TABLE IF NOT EXISTS @legacy_import (person TEXT PRIMARY KEY);
`
export async function campaign(db: LoyaltyDatabase) {
  return (await db.prepare('SELECT goal,daily,reward,locked FROM @campaign WHERE id=1').get()) as unknown as {goal:number,daily:number,reward:string,locked:number}
}

export async function wallet(db: LoyaltyDatabase, customer?: string) {
  return {
    campaign: { ...await campaign(db), name: (await db.prepare('SELECT name FROM @campaign_revision ORDER BY id DESC LIMIT 1').get())?.name ?? 'Kahve Kulübü' },
    customer: customer ? await db.prepare('SELECT id,stamps FROM @customer WHERE id=?').get(customer) : null,
    tickets: customer ? await db.prepare('SELECT id,reward,redeemed FROM @ticket WHERE customer=? ORDER BY rowid DESC').all(customer) : []
  }
}

export async function stampEntryKey(db: LoyaltyDatabase) {
  const existing = await db.prepare('SELECT key FROM @stamp_entry WHERE id=1').get()
  if (typeof existing?.key === 'string') return existing.key
  await db.prepare('INSERT OR IGNORE INTO @stamp_entry (id,key) VALUES (1,?)').run(token().slice(0,22))
  const stored = await db.prepare('SELECT key FROM @stamp_entry WHERE id=1').get()
  if (typeof stored?.key !== 'string') throw new Error('Damga bağlantısı oluşturulamadı.')
  return stored.key
}

// Zero represents a code with no expiration.
export async function issueCode(db: LoyaltyDatabase, kind: 'stamp' | 'redeem', branch: string, seal: string, holder?: string, ticket?: string, expires = Date.now() + 120000) {
  const code = token()
  await db.prepare('INSERT INTO @codes VALUES (?,?,?,?,?,?,?)').run(digest(code),kind,expires,branch,seal,holder ?? null,ticket ?? null)
  return {code,expires}
}

export function findActiveCode(db: LoyaltyDatabase, code: string) {
  return db.prepare('SELECT * FROM @codes WHERE id=? AND (expires=0 OR expires>?)').get(digest(code),Date.now())
}

export async function useCode(db: LoyaltyDatabase, code: string, customer: string, unlimited = false) {
  return db.transaction(async db => {
    const row = await findActiveCode(db,code)
    if (!row) throw new Error('Kod kullanıldı veya süresi doldu.')
    if (row.kind === 'redeem') {
      if (row.customer !== customer || typeof row.ticket !== 'string') throw new Error('Kod bu ödül bileti için geçerli değil.')
      const result = await db.prepare('UPDATE @ticket SET redeemed=? WHERE id=? AND customer=? AND redeemed IS NULL').run(new Date().toISOString(), row.ticket, customer)
      if (!result.changes) throw new Error('Bu bilet daha önce kullanıldı.')
    } else {
      const rules = await campaign(db)
      const day = today()
      const visits = await db.prepare("SELECT count(*) AS total FROM @activity WHERE customer=? AND day=? AND kind='stamp'").get(customer, day)
      if (!unlimited && Number(visits?.total) >= rules.daily) throw new Error('Bugünkü damga limitine ulaştın.')
      const count = Number((await db.prepare('SELECT stamps FROM @customer WHERE id=?').get(customer))?.stamps) + 1
      const earned = count >= rules.goal
      await db.prepare('UPDATE @customer SET stamps=?,last_visit=? WHERE id=?').run(earned ? 0 : count, day, customer)
      await db.prepare('UPDATE @campaign SET locked=1 WHERE id=1').run()
      if (earned) await db.prepare('INSERT INTO @ticket (id,customer,reward) VALUES (?,?,?)').run(token(),customer,rules.reward)
    }
    await db.prepare('DELETE FROM @codes WHERE id=?').run(digest(code))
    await db.prepare('INSERT INTO @activity (customer,day,kind,branch,seal) VALUES (?,?,?,?,?)').run(customer,today(),String(row.kind),String(row.branch),String(row.seal))
    return { ...await wallet(db,customer), action: row.kind }
  })
}

export async function publishCampaign(db: LoyaltyDatabase, rules: {name:string;goal:number;daily:number;reward:string}, create: boolean) {
  return db.transaction(async db => {
    const before = await campaign(db)
    const previousName = String((await db.prepare('SELECT name FROM @campaign_revision ORDER BY id DESC LIMIT 1').get())?.name ?? 'Kahve Kulübü')
    let issued = 0
    const insert = db.prepare('INSERT INTO @ticket (id,customer,reward) VALUES (?,?,?)')
    const eligible = await db.prepare('SELECT id,stamps FROM @customer WHERE stamps>=?').all(rules.goal)
    for (const row of eligible) {
      const count = Number(row.stamps)
      for (let i=0;i<Math.floor(count / rules.goal);i++) {
        await insert.run(token(),String(row.id), rules.reward)
        issued++
      }
    }
    await db.prepare('UPDATE @customer SET stamps=stamps % ? WHERE stamps>=?').run(rules.goal,rules.goal)
    await db.prepare('UPDATE @campaign SET goal=?,daily=?,reward=?,locked=0 WHERE id=1').run(rules.goal,rules.daily,rules.reward)
    const revision = db.prepare('INSERT INTO @campaign_revision (name,goal,daily,reward,changed,kind) VALUES (?,?,?,?,?,?)')
    if (!(await db.prepare('SELECT id FROM @campaign_revision LIMIT 1').get())) {
      await revision.run(previousName,before.goal,before.daily,before.reward,new Date().toISOString(),'initial')
    }
    await revision.run(create ? rules.name : previousName,rules.goal,rules.daily,rules.reward,new Date().toISOString(),create ? 'new' : 'update')
    return issued
  })
}


