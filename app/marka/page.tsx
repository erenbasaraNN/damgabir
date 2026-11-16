import type { Metadata } from 'next'
import Link from 'next/link'
import PortalHeader from '../components/portal/portal-header'
import Brand, { BrandMark } from '../components/brand'

export const metadata: Metadata = {title:'Damgabir — Marka kimliği'}
const colors = [
  ['Çam siyahı','#0A1310'],['Derin yeşil','#14251E'],['Filiz','#D4FFA3'],
  ['Gümüş yaprak','#DCE7DB'],['Kırık beyaz','#F1F5F0'],['Adaçayı','#A3B9B0'],
]

export default function BrandPage() {
  return <div className="portal">
    <PortalHeader/>
    <main className="brand-guide">
      <header><p>Damgabir / Marka kimliği</p><h1>Her gelişin<br/>bir karşılığı var.</h1><p>Farklı yerler, farklı renkler. Hepsinde aynı tanıdık imza.</p></header>
      <section aria-labelledby="logo-title"><h2 id="logo-title">Bir damgadan doğan kimlik.</h2><p>Küçük bir d, tamamlanan bir halka ve bir sonraki damgayı anlatan nokta. Her işletmenin yanında yer bulabilen, tek renkte de kendini gösteren bir imza.</p>
        <div className="brand-specimens"><div className="brand-specimen"><span className="brand"><Brand/></span></div><div className="brand-specimen brand-specimen-light"><BrandMark/></div></div>
        <div className="brand-downloads"><a href="/brand/wordmark-dark.svg" download>Koyu logo · SVG</a><a href="/brand/wordmark-light.svg" download>Açık logo · SVG</a><a href="/brand/wordmark-lime.svg" download>Filiz logo · SVG</a><a href="/brand/wordmark-dark.png" download>Şeffaf logo · PNG</a><a href="/brand/symbol-dark.svg" download>Sembol · SVG</a></div>
      </section>
      <section aria-labelledby="colors-title"><h2 id="colors-title">Karttan gelen renkler.</h2><p>Derin yeşil bir zemin, ışığı yakalayan açık kart yüzeyleri ve yalnızca gerektiği yerde filiz yeşili.</p><div className="brand-palette">{colors.map(([name,hex]) => <div key={name}><div style={{background:hex}}/><h3>{name}</h3><span>{hex}</span></div>)}</div></section>
      <section aria-labelledby="usage-title"><h2 id="usage-title">Her temaya yer açar.</h2><p>İşletmenin rengi kartına, Damgabir’in imzası ortak deneyime aittir. Logonun çevresinde sembol genişliğinin dörtte biri kadar boşluk bırakılır. Küçük alanlarda yalnızca sembol kullanılır.</p><div className="brand-downloads"><a href="/brand/README.md" download>Marka rehberini indir</a><a href="/brand/social.png" download>Paylaşım görselini indir</a></div></section>
    </main>
    <footer className="portal-footer"><span>damgabir</span><p>Marka kimliği / 01</p><Link href="/">Ana sayfa</Link></footer>
  </div>
}
