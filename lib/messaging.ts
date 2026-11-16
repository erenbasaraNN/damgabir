export function whatsappLink(phone: string, message: string) {
  return 'https://wa.me/90' + phone + '?text=' + encodeURIComponent(message)
}

export function recipientCsv(phones: string[], message: string) {
  const safeMessage = /^[\s]*[=+@-]/.test(message) ? "'" + message : message
  const field = '"' + safeMessage.replaceAll('"', '""') + '"'
  return '\ufeff' + ['telefon,mesaj', ...phones.map(phone => '90' + phone + ',' + field)].join('\r\n')
}
