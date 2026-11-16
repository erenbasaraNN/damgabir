import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { counterQrCode, database, issueCode, registerNfcCode, useCode } from '../lib/database.ts'

test('the fifth claim earns a reward and the sixth redeems it once through the same flow', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'damgabir-reward-test-'))
  process.env.DAMGABIR_DATA_DIR = dir
  delete process.env.TURSO_DATABASE_URL
  delete process.env.VERCEL
  const db = await database('demo')
  try {
    await db.prepare('UPDATE @campaign SET goal=5,daily=1 WHERE id=1').run()
    await db.prepare("INSERT INTO @customer (id,phone) VALUES ('customer','5550000001')").run()
    for (let number = 1; number <= 5; number++) {
      const result = await useCode(db, await counterQrCode(db), 'customer')
      assert.equal(result.action, 'stamp')
      assert.equal(result.customer.stamps, number % 5)
      assert.equal(result.tickets.length, number === 5 ? 1 : 0)
      if (number === 5) assert.equal(result.tickets[0].redeemed, null)
    }

    const tap = 'signed-sixth-tap'
    assert.equal(await registerNfcCode(db, tap), true)
    const redeemed = await useCode(db, tap, 'customer')
    assert.equal(redeemed.action, 'redeem')
    assert.equal(redeemed.customer.stamps, 0)
    assert.ok(redeemed.tickets[0].redeemed)
    await assert.rejects(useCode(db, tap, 'customer'), /Kod kullanıldı/)
    assert.equal(await registerNfcCode(db, tap), false)
    assert.equal((await db.prepare("SELECT count(*) AS count FROM @activity WHERE kind='redeem'").get()).count, 1)

    const next = await issueCode(db, 'Merkez', 'Kasa')
    const restarted = await useCode(db, next.code, 'customer')
    assert.equal(restarted.action, 'stamp')
    assert.equal(restarted.customer.stamps, 1)
    await assert.rejects(useCode(db, next.code, 'customer'), /Kod kullanıldı/)
  } finally {
    db.close()
    for (const suffix of ['', '-wal', '-shm']) rmSync(join(dir, 'demo.sqlite' + suffix), {force: true})
    rmdirSync(dir)
  }
})
