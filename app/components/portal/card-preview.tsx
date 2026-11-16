'use client'

import { useState } from 'react'
import { Check, Gift } from 'lucide-react'
import { BrandMark } from '../brand'

const themes = [
  {name:'Çam', key:'pine'}, {name:'Taş', key:'stone'}, {name:'Gece', key:'night'},
] as const

export default function CardPreview() {
  const [theme,setTheme] = useState<string>('pine')
  return <div className="home-preview" data-theme={theme}>
    <div className="preview-topline"><span>Kartının renkleri değişir.</span><span>Damgabir hep yanında.</span></div>
    <div className="preview-card">
      <div className="preview-card-top"><BrandMark/><span>Örnek sadakat kartı</span></div>
      <h2>Biriktirdikçe<br/>güzelleşir.</h2>
      <div className="preview-stamps" aria-label="8 damganın 5’i tamamlandı">
        {Array.from({length:8},(_,index) => <span key={index} className={index < 5 ? 'complete' : ''}>
          {index < 5 ? <BrandMark/> : index === 7 ? <Gift size={24} aria-hidden="true"/> : <span>{index + 1}</span>}
        </span>)}
      </div>
      <div className="preview-card-bottom"><span>Ödülüne 3 damga kaldı</span><strong>5 <span>/ 8</span></strong></div>
    </div>
    <div className="preview-controls"><span>Kart rengini dene</span><div role="group" aria-label="Örnek kart rengi">
      {themes.map(item => <button key={item.key} type="button" className="theme-swatch" data-swatch={item.key} aria-label={item.name} aria-pressed={theme === item.key} onClick={() => setTheme(item.key)}>{theme === item.key && <Check size={16} aria-hidden="true"/>}</button>)}
    </div></div>
  </div>
}
