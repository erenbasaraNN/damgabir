import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { counterQrCode, database, registerNfcCode, useCode } from '../lib/database.ts'
import { sdmMac, verifyNfcTap } from '../lib/nfc.ts'

test('matches the NXP AN12196 Table 4 MAC for an ASCII read counter', () => {
  const mac = sdmMac(Buffer.alloc(16), '04DE5F1EACC040', '00003D')
  assert.equal(mac.toString('hex'), '94eed9ee65337086')
})

test('accepts only the registered card and the signed counter', () => {
  const uid = '04010203040506'
  const key = Buffer.alloc(16, 0x97)
  process.env.DAMGABIR_NFC_CARDS = JSON.stringify({[uid]: {tenant: 'demo', key: key.toString('hex')}})
  const counter = '000123'
  const params = new URLSearchParams({uid, ctr: counter, mac: sdmMac(key, uid, counter).toString('hex')})
  const tap = verifyNfcTap(params)
  assert.equal(tap.tenant, 'demo')
  assert.deepEqual(verifyNfcTap(params), tap)
  params.set('ctr', '000124')
  assert.equal(verifyNfcTap(params), undefined)
  params.set('mac', sdmMac(key, uid, '000124').toString('hex'))
  assert.notEqual(verifyNfcTap(params).code, tap.code)
  params.set('uid', '04010203040507')
  assert.equal(verifyNfcTap(params), undefined)
})

test('each signed tap and each merchant QR can give only one stamp across customers', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'damgabir-nfc-test-'))
  process.env.DAMGABIR_DATA_DIR = dir
  delete process.env.TURSO_DATABASE_URL
  delete process.env.VERCEL
  const db = await database('demo')
  try {
    await db.prepare("INSERT INTO @customer (id,phone) VALUES ('first',''),('second','')").run()
    const code = 'same-signed-tap'
    assert.deepEqual(await Promise.all([registerNfcCode(db, code), registerNfcCode(db, code)]), [true, true])
    const claims = await Promise.allSettled([useCode(db, code, 'first'), useCode(db, code, 'second')])
    assert.equal(claims.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(await registerNfcCode(db, code), false)

    const [qr, sameQr] = await Promise.all([counterQrCode(db), counterQrCode(db)])
    assert.equal(sameQr, qr)
    const nextCustomer = claims[0].status === 'fulfilled' ? 'second' : 'first'
    await useCode(db, qr, nextCustomer)
    assert.notEqual(await counterQrCode(db), qr)
    await assert.rejects(useCode(db, qr, nextCustomer), /Kod kullanıldı/)
  } finally {
    db.close()
    for (const suffix of ['', '-wal', '-shm']) rmSync(join(dir, 'demo.sqlite' + suffix), {force: true})
  }
})
