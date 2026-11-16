export function tenantFromHost(host: string) {
  const name = host.toLowerCase().split(':')[0]
  if (['localhost', '127.0.0.1'].includes(name)) return 'demo'
  return /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.damgabir\.com$/.exec(name)?.[1] ?? null
}

export const tenantNames: Record<string, string> = { demo: 'Kavak Kahve', kavak: 'Kavak Kahve' }

export const businessSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const maxBusinessSlugLength = 22
export function validBusinessSlug(slug: string) {
  return slug.length <= maxBusinessSlugLength && businessSlugPattern.test(slug)
}

export const businessWalletPath = (slug: string) => '/isletme/' + slug



