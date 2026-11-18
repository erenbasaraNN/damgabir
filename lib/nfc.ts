import { createCipheriv, createHmac, timingSafeEqual } from 'node:crypto'

export type NfcPurpose = 'stamp' | 'redeem'
type Card = {tenant: string; key: Buffer; purpose: NfcPurpose}

function configuredCards(): Map<string, Card> {
  const cards = new Map<string, Card>()
  const config: unknown = JSON.parse(process.env.DAMGABIR_NFC_CARDS || '{}')
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('NFC kart ayarı geçersiz.')
  for (const [uid, value] of Object.entries(config)) {
    if (!/^[0-9a-f]{14}$/i.test(uid) || !value || typeof value.tenant !== 'string' ||
      typeof value.key !== 'string' || !/^[0-9a-f]{32}$/i.test(value.key) || /^0{32}$/.test(value.key) ||
      (value.purpose !== undefined && value.purpose !== 'stamp' && value.purpose !== 'redeem') ||
      cards.has(uid.toLowerCase())) throw new Error('NFC kart ayarı geçersiz.')
    cards.set(uid.toLowerCase(), {tenant: value.tenant, key: Buffer.from(value.key, 'hex'), purpose: value.purpose ?? 'stamp'})
  }
  return cards
}

function aesBlock(key: Buffer, block: Uint8Array) {
  const cipher = createCipheriv('aes-128-ecb', key, null)
  cipher.setAutoPadding(false)
  return Buffer.concat([cipher.update(block), cipher.final()])
}

function doubleBlock(block: Buffer) {
  const result = Buffer.alloc(16)
  for (let index = 0; index < 15; index++) result[index] = (block[index] << 1) | (block[index + 1] >> 7)
  result[15] = (block[15] << 1) ^ (block[0] & 0x80 ? 0x87 : 0)
  return result
}

// SDM in this configuration uses CMAC only for a complete block and an empty message.
function cmac(key: Buffer, block?: Buffer) {
  const firstSubkey = doubleBlock(aesBlock(key, Buffer.alloc(16)))
  if (block) return aesBlock(key, firstSubkey.map((byte, index) => byte ^ block[index]))
  const secondSubkey = doubleBlock(firstSubkey)
  secondSubkey[0] ^= 0x80
  return aesBlock(key, secondSubkey)
}

// NXP AN12196 §3.4.4.2.1. The MAC starts at its own offset, so its input is empty.
export function sdmMac(key: Buffer, uid: string, counter: string) {
  // The ASCII counter is most-significant byte first. The session vector uses the reverse order.
  const sessionVector = Buffer.concat([Buffer.from('3cc300010080' + uid, 'hex'), Buffer.from(counter, 'hex').reverse()])
  const fullMac = cmac(cmac(key, sessionVector))
  return Buffer.from([1, 3, 5, 7, 9, 11, 13, 15].map(index => fullMac[index]))
}

export function verifyNfcTap(params: URLSearchParams) {
  const uid = params.get('uid')?.toLowerCase() ?? ''
  const counter = params.get('ctr')?.toLowerCase() ?? ''
  const mac = params.get('mac') ?? ''
  if (!/^[0-9a-f]{14}$/.test(uid) || !/^[0-9a-f]{6}$/.test(counter) || !/^[0-9a-f]{16}$/i.test(mac)) return
  const card = configuredCards().get(uid)
  if (!card || !timingSafeEqual(sdmMac(card.key, uid, counter), Buffer.from(mac, 'hex'))) return
  const tap = uid + ':' + counter
  const code = createHmac('sha256', card.key).update('damgabir-nfc:' + card.tenant + ':' + tap).digest('base64url').slice(0, 32)
  return {tenant: card.tenant, code, purpose: card.purpose}
}
