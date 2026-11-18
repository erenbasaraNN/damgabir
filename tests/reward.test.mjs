import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { counterQrCode, database, issueCode, registerNfcCode, useCode } from '../lib/database.ts'

test('stamp codes accumulate rewards and reward NFC uses one oldest ticket without giving stamps', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'damgabir-reward-test-'))
  process.env.DAMGABIR_DATA_DIR = dir
  delete process.env.TURSO_DATABASE_URL
  delete process.env.VERCEL
  const db = await database('demo')
  try {
    await db.prepare('UPDATE @campaign SET goal=5,daily=1 WHERE id=1').run()
    await db.prepare("INSERT INTO @customer (id,phone) VALUES ('customer','5550000001')").run()
    for (let number = 1; number <= 11; number++) {
      const nfc = 'signed-stamp-' + number
      if (number % 2 === 0) await registerNfcCode(db, nfc, 'stamp')
      const result = await useCode(db, number % 2 === 0 ? nfc : await counterQrCode(db), 'customer')
      assert.equal(result.action, 'stamp')
      assert.equal(result.customer.stamps, number % 5)
      assert.equal(result.tickets.length, Math.floor(number / 5))
      assert.ok(result.tickets.every(ticket => !ticket.redeemed))
    }

    const tap = 'signed-reward-tap'
    assert.equal(await registerNfcCode(db, tap, 'redeem'), true)
    const claims = await Promise.allSettled([useCode(db, tap, 'customer'), useCode(db, tap, 'customer')])
    const successful = claims.filter(result => result.status === 'fulfilled')
    assert.equal(successful.length, 1)
    const redeemed = successful[0].value
    assert.equal(redeemed.action, 'redeem')
    assert.equal(redeemed.customer.stamps, 1)
    assert.equal(redeemed.tickets[0].redeemed, null)
    assert.ok(redeemed.tickets[1].redeemed)
    assert.equal(await registerNfcCode(db, tap, 'redeem'), false)
    assert.equal((await db.prepare("SELECT count(*) AS count FROM @activity WHERE kind='redeem'").get()).count, 1)

    const next = await issueCode(db, 'Merkez', 'Kasa')
    const restarted = await useCode(db, next.code, 'customer')
    assert.equal(restarted.action, 'stamp')
    assert.equal(restarted.customer.stamps, 2)
    assert.equal(restarted.tickets[0].redeemed, null)
    await assert.rejects(useCode(db, next.code, 'customer'), /Kod kullanıldı/)

    await registerNfcCode(db, 'second-reward', 'redeem')
    assert.equal((await useCode(db, 'second-reward', 'customer')).action, 'redeem')
    await registerNfcCode(db, 'no-reward', 'redeem')
    const unavailable = await useCode(db, 'no-reward', 'customer')
    assert.equal(unavailable.action, 'reward-unavailable')
    assert.equal(unavailable.customer.stamps, 2)
    assert.equal(await registerNfcCode(db, 'no-reward', 'redeem'), false)
    assert.equal((await db.prepare('SELECT count(*) AS count FROM @activity').get()).count, 14)
  } finally {
    db.close()
    for (const suffix of ['', '-wal', '-shm']) rmSync(join(dir, 'demo.sqlite' + suffix), {force: true})
    rmdirSync(dir)
  }
})
