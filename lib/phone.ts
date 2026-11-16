export function phoneDigits(value: unknown) {
  if (typeof value !== 'string' || value.length > 30 || /[^0-9+\s().-]/.test(value)) return ''
  return value.replace(/[^0-9]/g, '').replace(/^(90|0)(?=5\d{9}$)/, '')
}

export const validPhone = (phone: string) => /^5\d{9}$/.test(phone)
export const phoneFormatError = 'Telefon numaranı 5XX XXX XX XX biçiminde gir.'

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^(90|0)(?=5)/, '').slice(0, 10)
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8)].filter(Boolean).join(' ')
}
