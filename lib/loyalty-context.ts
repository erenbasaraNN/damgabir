import { database } from './database'
import { findBusiness } from './business'
import { siteTenant } from './settings'
import { tenantFromHost, tenantNames } from './tenant'

export async function loyaltyContext(rawHost: string, slug: string | null, legacyProgram = false) {
  const host = tenantFromHost(rawHost) ?? siteTenant(rawHost)
  const business = slug && host === 'demo' ? await findBusiness(slug) : undefined
  if (slug && !business) return null
  const tenant = business ? 'business-' + business.slug : host === 'app' || (host === 'demo' && legacyProgram) ? 'kavak' : host
  if (!tenant || (!business && !Object.hasOwn(tenantNames, tenant))) return null
  return {host, tenant, db: await database(tenant), business}
}
