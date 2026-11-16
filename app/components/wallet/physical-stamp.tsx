'use client'

import { useEffect, useId } from 'react'
import { motion } from 'framer-motion'

/** The rubber face is anchored to the centre of the destination stamp slot. */
export default function PhysicalStamp() {
  const id = useId().replace(/:/g, '')

  useEffect(() => {
    const contact = setTimeout(() => navigator.vibrate?.([24, 18, 12]), 855)
    return () => clearTimeout(contact)
  }, [])


  return <div className="stamp-stage" aria-hidden="true">
    <motion.div className="stamp-cast-shadow"
      animate={{ opacity: [0, .15, .48, .5, .2, 0], scale: [1.8, 1.4, .85, .85, 1.4, 2], x: [30, 20, 0, 0, -20, -40] }}
      transition={{ duration: 1.9, times: [0, .25, .45, .58, .78, 1] }}/>
    <motion.svg className="physical-stamp" viewBox="0 0 180 250"
      initial={{ opacity: 0, y: -230, x: 65, rotate: 24, scale: 1.4 }}
      animate={{ opacity: [0, 1, 1, 1, 1, 0], y: [-230, -120, 0, 0, -65, -250], x: [65, 12, 0, 0, -12, -70], rotate: [24, -8, -5, -5, -10, -25], scale: [1.4, 1.15, 1, 1, 1.08, 1.3] }}
      transition={{ duration: 1.9, times: [0, .25, .45, .58, .78, 1], ease: [.35, 0, .25, 1] }}>
      <defs>
        <linearGradient id={id+'wood'}><stop stopColor="#301b11"/><stop offset=".2" stopColor="#85502c"/><stop offset=".42" stopColor="#d39b62"/><stop offset=".55" stopColor="#ab7141"/><stop offset=".82" stopColor="#64391f"/><stop offset="1" stopColor="#2b1a13"/></linearGradient>
        <linearGradient id={id+'metal'}><stop stopColor="#303733"/><stop offset=".2" stopColor="#aab1a5"/><stop offset=".46" stopColor="#ece6cc"/><stop offset=".65" stopColor="#777e72"/><stop offset="1" stopColor="#252f29"/></linearGradient>
        <linearGradient id={id+'top'} x2="0" y2="1"><stop stopColor="#be8955"/><stop offset="1" stopColor="#633b24"/></linearGradient>
      </defs>
      <path d="M71 98 C53 88 48 72 49 50 C50 23 65 12 90 12 C115 12 130 23 131 50 C132 72 127 88 109 98 L104 149 Q104 160 120 165 L60 165 Q76 160 76 149Z" fill={'url(#'+id+'wood)'} stroke="#51311f"/>
      <path d="M66 30 C58 51 65 76 80 87 M78 22 C69 47 77 70 83 81 M101 23 C116 50 108 69 101 84 M86 103 L84 143 M96 99 L98 150" fill="none" stroke="#efbc7b" strokeOpacity=".25" strokeWidth="2"/>
      <ellipse cx="90" cy="24" rx="23" ry="8" fill="#e0b180" opacity=".3"/>
      <path d="M58 160 Q90 151 122 160 L127 174 L53 174Z" fill={'url(#'+id+'metal)'}/>
      <path d="M23 184 Q90 162 157 184 L157 213 Q90 239 23 213Z" fill={'url(#'+id+'wood)'} stroke="#4d3020"/>
      <ellipse cx="90" cy="183" rx="67" ry="19" fill={'url(#'+id+'top)'} stroke="#d5a571" strokeWidth="2"/>
      <ellipse cx="90" cy="181" rx="32" ry="9" fill={'url(#'+id+'metal)'}/>
      <path d="M26 206 Q90 228 154 206 L154 219 Q90 244 26 219Z" fill="#262a25"/>
      <path d="M28 207 Q90 230 152 207" fill="none" stroke="#dac095" strokeWidth="2"/>
      <path d="M34 219 Q90 237 146 219" fill="none" stroke="#a94e38" strokeWidth="3"/>
      <path d="M30 193 Q90 213 150 193 M30 199 Q90 219 150 199" fill="none" stroke="#edbb7d" strokeOpacity=".22"/>
    </motion.svg>
    <span className="stamp-contact-ring"/>
  </div>
}
