import { readBusinessLogo } from '../../../../lib/business'

export const runtime = 'nodejs'

export async function GET(request: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const logo = await readBusinessLogo(slug,new URL(request.url).searchParams.get('v'))
  if (!logo) return new Response(null,{status:404})
  return new Response(new Uint8Array(logo.bytes),{headers:{
    'Content-Type':logo.type,
    'X-Content-Type-Options':'nosniff',
    'Cache-Control':'public, max-age=86400, immutable',
  }})
}
