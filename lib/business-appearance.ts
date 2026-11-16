export const walletThemes = [
  {id: 'orman', name: 'Orman', detail: 'Adaçayı ve yeşil mühür'},
  {id: 'keten', name: 'Keten', detail: 'Krem ve kahve'},
  {id: 'gece', name: 'Gece', detail: 'Lacivert ve kobalt halkalar'},
  {id: 'nar', name: 'Nar', detail: 'Mercan ve kırmızı damgalar'},
  {id: 'altin', name: 'Altın', detail: 'Siyah ve ince altın çizgiler'},
  {id: 'safran', name: 'Safran', detail: 'Bal sarısı ve amber'},
  {id: 'zeytin', name: 'Zeytin', detail: 'Haki ve açık fıstık'},
  {id: 'okyanus', name: 'Okyanus', detail: 'Petrol mavisi ve turkuaz'},
  {id: 'buz', name: 'Buz', detail: 'Buz mavisi ve kobalt'},
  {id: 'sedir', name: 'Sedir', detail: 'Koyu kahve ve karamel'},
  {id: 'kiremit', name: 'Kiremit', detail: 'Pişmiş toprak ve kum'},
  {id: 'grafit', name: 'Grafit', detail: 'Antrasit ve çelik gri'},
  {id: 'cay', name: 'Yeşil çay', detail: 'Nane ve açık yeşil'},
  {id: 'visne', name: 'Vişne', detail: 'Bordo ve gül kurusu'},
  {id: 'bakir', name: 'Bakır', detail: 'Koyu petrol ve bakır'},
] as const

export const walletStyles = [
  {id: 'modern', name: 'Modern', detail: 'Sade yazı, yuvarlatılmış köşeler'},
  {id: 'editorial', name: 'Editoryal', detail: 'Serif başlık, çizgili kart'},
  {id: 'rozet', name: 'Rozet', detail: 'Ortalanmış başlık, yuvarlak damgalar'},
  {id: 'bilet', name: 'Bilet', detail: 'Tek aralıklı yazı, çentikli kart'},
] as const

export type WalletTheme = typeof walletThemes[number]['id']
export type WalletStyle = typeof walletStyles[number]['id']
export const defaultWalletTheme: WalletTheme = 'orman'
export const defaultWalletStyle: WalletStyle = 'modern'
export type BusinessAppearance = {name: string; theme: WalletTheme; style: WalletStyle; logoUrl: string | null}

export function isWalletTheme(value: unknown): value is WalletTheme {
  return walletThemes.some(theme => theme.id === value)
}

export function isWalletStyle(value: unknown): value is WalletStyle {
  return walletStyles.some(style => style.id === value)
}

export function initialWalletStyle(theme: WalletTheme): WalletStyle {
  if (theme === 'keten' || theme === 'altin') return 'editorial'
  if (theme === 'gece' || theme === 'nar') return 'rozet'
  return defaultWalletStyle
}

export const businessLogoTypes = ['image/png', 'image/jpeg', 'image/webp'] as const
export const maxBusinessLogoBytes = 192 * 1024

export function businessLogoType(value: string) {
  return businessLogoTypes.find(type => value.startsWith(`data:${type};base64,`))
}
