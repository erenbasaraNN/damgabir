'use client'

import { useState } from 'react'
import { whatsappConsentText } from '../../../lib/contact-consent'

export function PrivacyNotice({sender}: {sender?:string}) {
  return <details className="privacy-notice">
    <summary>KVKK bilgilendirmesi</summary>
    <p>Telefon numaranı cüzdanını açmak ve sadakat kartlarını hesabınla eşleştirmek için kullanıyoruz. Damga ve ödül bilgilerin{sender ? ` ${sender} işletmesiyle` : ' ilgili işletmeyle'} sadakat programının yürütülmesi için paylaşılır.</p>
    {sender && <p>WhatsApp izni verirsen, adın, telefon numaran ve tercihin iletişim iznini kaydetmek ve işletmenin sana WhatsApp üzerinden kampanya ve duyuru göndermesi için kullanılır. Tercihini cüzdanındaki İletişim tercihleri bölümünden değiştirebilirsin.</p>}
  </details>
}

export function WhatsAppConsentFields({sender}: {sender:string}) {
  const [accepted,setAccepted] = useState(false)
  return <div className="whatsapp-consent">
    <label className="whatsapp-consent-choice">
      <input type="checkbox" name="whatsappConsent" checked={accepted} onChange={event => setAccepted(event.target.checked)}/>
      <span>{whatsappConsentText(sender)} <small>(İsteğe bağlı)</small></span>
    </label>
    {accepted && <label className="whatsapp-consent-name">Adın ve soyadın
      <input name="contactName" autoComplete="name" maxLength={120} required/>
    </label>}
  </div>
}

export function contactConsentValues(form: HTMLFormElement) {
  const fields = new FormData(form)
  return {whatsappConsent:fields.has('whatsappConsent'),contactName:fields.get('contactName')}
}
