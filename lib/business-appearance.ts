export const walletThemes = [
  {id: 'orman', name: 'Orman', detail: 'Adaçayı ve yeşil mühür'},
  {id: 'keten', name: 'Keten', detail: 'Krem kâğıt ve serif yazı'},
  {id: 'gece', name: 'Gece', detail: 'Lacivert ve kobalt halkalar'},
  {id: 'nar', name: 'Nar', detail: 'Mercan ve kırmızı damgalar'},
  {id: 'altin', name: 'Altın', detail: 'Siyah ve ince altın çizgiler'},
] as const

export type WalletTheme = typeof walletThemes[number]['id']
export const defaultWalletTheme: WalletTheme = 'orman'
export type BusinessAppearance = {name: string; theme: WalletTheme; logoUrl: string | null}

export function isWalletTheme(value: unknown): value is WalletTheme {
  return walletThemes.some(theme => theme.id === value)
}

export const businessLogoTypes = ['image/png', 'image/jpeg', 'image/webp'] as const
export const maxBusinessLogoBytes = 192 * 1024

export function businessLogoType(value: string) {
  return businessLogoTypes.find(type => value.startsWith(`data:${type};base64,`))
}
