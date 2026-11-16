export class LoyaltyError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function loyalty<T>(body?: Record<string, unknown>, business?: string, program?: 'kavak'): Promise<T> {
  const path = business ? '/api/loyalty?isletme=' + encodeURIComponent(business) :
    program ? '/api/loyalty?program=' + program : '/api/loyalty'
  const response = await fetch(path, body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {cache:'no-store'})
  const data = await response.json()
  if (!response.ok) throw new LoyaltyError(data.error ?? 'İşlem tamamlanamadı.', response.status)
  return data
}
export type Campaign = {name?:string;goal:number;daily:number;reward:string;locked:number}


