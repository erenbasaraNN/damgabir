'use client'

import { formatPhone } from '../../../lib/phone'

export default function PhoneInput({value,onChange}: {value:string;onChange:(value:string)=>void}) {
  return <>
    <label htmlFor="phone">Telefon numaran</label>
    <div className="phone-input">
      <span aria-hidden="true">+90</span>
      <input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="500 000 00 00"
        maxLength={17} value={value} onChange={event => onChange(formatPhone(event.target.value))} required/>
    </div>
  </>
}
