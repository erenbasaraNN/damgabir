import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { counterQrCode, database, ntagCards, registerNfcCode, registerNtagRead, useCode } from '../lib/database.ts'
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
  assert.equal(tap.purpose, 'stamp')
  assert.deepEqual(verifyNfcTap(params), tap)
  params.set('ctr', '000124')
  assert.equal(verifyNfcTap(params), undefined)
  params.set('mac', sdmMac(key, uid, '000124').toString('hex'))
  assert.notEqual(verifyNfcTap(params).code, tap.code)
  params.set('uid', '04010203040507')
  assert.equal(verifyNfcTap(params), undefined)

  params.set('uid', uid)
  params.set('purpose', 'stamp')
  process.env.DAMGABIR_NFC_CARDS = JSON.stringify({[uid]: {tenant: 'demo', key: key.toString('hex'), purpose: 'redeem'}})
  assert.equal(verifyNfcTap(params).purpose, 'redeem')
})

test('each signed tap and each merchant QR can give only one stamp across customers', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'damgabir-nfc-test-'))
  process.env.DAMGABIR_DATA_DIR = dir
  delete process.env.LIBSQL_DATABASE_URL
  delete process.env.LIBSQL_AUTH_TOKEN
  delete process.env.TURSO_DATABASE_URL
  delete process.env.VERCEL
  const db = await database('demo')
  try {
    await db.prepare("INSERT INTO @customer (id,phone) VALUES ('first',''),('second','')").run()
    const code = 'same-signed-tap'
    assert.deepEqual(await Promise.all([registerNfcCode(db, code, 'stamp'), registerNfcCode(db, code, 'stamp')]), [true, true])
    assert.equal(await registerNfcCode(db, code, 'redeem'), false)
    const claims = await Promise.allSettled([useCode(db, code, 'first'), useCode(db, code, 'second')])
    assert.equal(claims.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(await registerNfcCode(db, code, 'stamp'), false)

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

test('NTAG213 uses each card counter once across customers and keeps card roles separate', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'damgabir-ntag213-test-'))
  process.env.DAMGABIR_DATA_DIR = dir
  delete process.env.TURSO_DATABASE_URL
  delete process.env.VERCEL
  const db = await database('business-nfc-test')
  const otherDb = await database('business-other-test')
  try {
    const [cards, sameCards] = await Promise.all([ntagCards(db),ntagCards(db)])
    assert.deepEqual(cards,sameCards)
    assert.notEqual(cards.stamp,cards.redeem)
    assert.equal(await registerNtagRead(otherDb,cards.stamp,'00000A'),undefined)
    assert.equal(await registerNtagRead(db,cards.stamp,'000000'),undefined)

    await db.prepare("INSERT INTO @customer (id,phone) VALUES ('first',''),('second','')").run()
    await db.prepare("INSERT INTO @ticket (id,customer,reward) VALUES ('one','first','Kahve'),('two','first','Kahve')").run()
    const counter = cards.stamp.startsWith('00000A') ? '00000B' : '00000A'
    const stampPath = counter + cards.stamp.slice(6)
    assert.equal(await registerNtagRead(db,cards.stamp),undefined)
    assert.equal(await registerNtagRead(otherDb,stampPath),undefined)
    const [stamp,repeat,pathRead] = await Promise.all([
      registerNtagRead(db,cards.stamp,counter),registerNtagRead(db,cards.stamp,counter.toLowerCase()),registerNtagRead(db,stampPath)
    ])
    assert.deepEqual(stamp,repeat)
    assert.deepEqual(stamp,pathRead)
    assert.equal(stamp.purpose,'stamp')
    const claims = await Promise.allSettled([useCode(db,stamp.code,'first'),useCode(db,stamp.code,'second')])
    assert.equal(claims.filter(result => result.status === 'fulfilled').length,1)
    assert.equal((await registerNtagRead(db,stampPath)).active,false)

    const rewardCounter = cards.redeem.startsWith(counter) ? '00000C' : counter
    const reward = await registerNtagRead(db,rewardCounter + cards.redeem.slice(6))
    assert.equal(reward.purpose,'redeem')
    const redeemed = await useCode(db,reward.code,'first')
    assert.equal(redeemed.action,'redeem')
    assert.equal(redeemed.tickets.filter(ticket => !ticket.redeemed).length,1)
    assert.equal((await registerNtagRead(db,cards.redeem,rewardCounter)).active,false)
    const next = await registerNtagRead(db,cards.stamp,'00000D')
    assert.equal((await useCode(db,next.code,'first')).action,'stamp')
  } finally {
    db.close()
    otherDb.close()
    for (const tenant of ['business-nfc-test','business-other-test']) {
      for (const suffix of ['', '-wal', '-shm']) rmSync(join(dir,tenant + '.sqlite' + suffix),{force:true})
    }
  }
})
