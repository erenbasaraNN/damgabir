import { NextRequest, NextResponse } from 'next/server'
import { customerCards, endCustomerSession, findOrCreatePerson, readPerson, startCustomerSession } from '../../../lib/customer'
import { phoneDigits, phoneFormatError, validPhone } from '../../../lib/phone'

export const runtime = 'nodejs'
const reply = (data: unknown, status = 200) => NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})

export async function GET(request: NextRequest) {
  try {
    const person = await readPerson(request)
    if (!person) return reply({account:null})
    return reply({account:{phone:person.phone,cards:await customerCards(person)}})
  } catch {
    return reply({error:'Kartlar yüklenemedi. Tekrar deneyin.'},503)
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || ![request.nextUrl.origin,`https://${host}`,`http://${host}`].includes(origin)) return reply({error:'İstek doğrulanamadı.'},403)
  try {
    const body = await request.json()
    if (body.action === 'logout') {
      const response = reply({account:null})
      await endCustomerSession(request,response,origin)
      return response
    }
    if (body.action !== 'login') return reply({error:'İşlem bulunamadı.'},400)
    const phone = phoneDigits(body.phone)
    if (!validPhone(phone)) return reply({error:phoneFormatError},400)
    const person = await findOrCreatePerson(phone)
    const response = reply({account:{phone,cards:await customerCards(person)}})
    await startCustomerSession(request,response,person,origin)
    return response
  } catch {
    return reply({error:'Hesap açılamadı. Tekrar deneyin.'},503)
  }
}
