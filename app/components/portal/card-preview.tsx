'use client'

import { useState } from 'react'
import { Check, Gift, RotateCcw, Stamp } from 'lucide-react'
import { BrandMark } from '../brand'

const themes = [
  {name:'Çam', key:'pine'}, {name:'Taş', key:'stone'}, {name:'Gece', key:'night'},
] as const

export default function CardPreview() {
  const [theme,setTheme] = useState<string>('pine')
  const [stamps,setStamps] = useState(5)
  const earned = stamps === 8
  return <div className="home-preview" data-theme={theme} data-visual>
    <div className="preview-card">
      <div className="preview-card-top"><BrandMark/><span>Örnek sadakat kartı</span></div>
      <p className="preview-offer">Bir kahve bizden.</p>
      <div className="preview-stamps" aria-hidden="true">
        {Array.from({length:8},(_,index) => <span key={index} className={index < stamps ? `complete${index === stamps - 1 && stamps > 5 ? ' preview-stamped' : ''}` : ''}>
          {index < stamps ? <BrandMark/> : index === 7 ? <Gift size={24} aria-hidden="true"/> : <span>{index + 1}</span>}
        </span>)}
      </div>
      <div className="preview-card-bottom" role="status"><span>{earned ? 'Ödülün hazır' : `Ödülüne ${8-stamps} damga kaldı`}</span><strong>{stamps} <span>/ 8</span></strong></div>
    </div>
    <div className="preview-controls">
      <button className="product-demo-button" type="button" onClick={() => setStamps(value => value === 8 ? 5 : value+1)}>
        {earned ? <RotateCcw size={16} aria-hidden="true"/> : <Stamp size={17} aria-hidden="true"/>}
        {earned ? 'Örneği sıfırla' : 'Bir damga dene'}
      </button>
      <div role="group" aria-label="Örnek kart rengi">
        {themes.map(item => <button key={item.key} type="button" className="theme-swatch" data-swatch={item.key} aria-label={item.name} aria-pressed={theme === item.key} onClick={() => setTheme(item.key)}>{theme === item.key && <Check size={16} aria-hidden="true"/>}</button>)}
      </div>
    </div>
  </div>
}
