export const panelPath = '/' + (process.env.DAMGABIR_PANEL_PATH || 'TMGSS74-24')
export const launchMode = process.env.NODE_ENV === 'development' || process.env.DAMGABIR_LOCAL_DEMO === '1'
export function siteTenant(host: string) {
  if (process.env.DAMGABIR_PUBLIC_ORIGIN && new URL(process.env.DAMGABIR_PUBLIC_ORIGIN).host === host.toLowerCase()) return 'demo'
  return null
}
