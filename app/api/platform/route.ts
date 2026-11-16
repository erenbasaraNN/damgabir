import { NextRequest, NextResponse } from 'next/server'
import { createBusiness, keyMatches, listBusinesses, ownerKeyHash } from '../../../lib/business'
import { validBusinessSlug } from '../../../lib/tenant'

export const runtime = 'nodejs'
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: {'Cache-Control': 'no-store'} })

export async function POST(request: NextRequest) {
  const host = request.headers.get('host')
  const origin = request.headers.get('origin')
  if (!origin || ![request.nextUrl.origin, `https://${host}`, `http://${host}`].includes(origin)) {
    return reply({error: 'İstek doğrulanamadı.'}, 403)
  }
  const body = await request.json().catch(() => null)
  if (!keyMatches(body?.key, ownerKeyHash())) return reply({error: 'Uygulama sahibi anahtarını kontrol edin.'}, 403)

  try {
    if (body.action === 'list') return reply({businesses: await listBusinesses()})
    if (body.action !== 'create') return reply({error: 'İşlem bulunamadı.'}, 400)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''
    if (name.length < 2 || name.length > 80 || !validBusinessSlug(slug)) {
      return reply({error: 'İşletme adını ve en fazla 22 karakterlik bir adres girin.'}, 400)
    }
    const business = await createBusiness(slug, name)
    return business ? reply({business}, 201) : reply({error: 'Bu işletme adresi zaten kullanılıyor.'}, 409)
  } catch {
    return reply({error: 'İşletme bilgileri kaydedilemedi. Tekrar deneyin.'}, 503)
  }
}
