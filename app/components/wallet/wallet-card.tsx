import { Coffee, Stamp, Ticket } from 'lucide-react'
import PhysicalStamp from './physical-stamp'

export function WalletIdentity({name,campaign,logoUrl,business,preview}: {name:string;campaign:string;logoUrl?:string|null;business?:boolean;preview?:boolean}) {
  const Mark = business ? Stamp : Coffee
  const Heading = preview ? 'h3' : 'h1'
  return <div className={`wallet-intro${logoUrl ? ' wallet-intro-with-logo' : ''}`} data-enter>
    {logoUrl ? <img className="business-logo wallet-identity-logo" src={logoUrl} alt=""/> :
      <div className="coffee-seal" aria-hidden="true"><Mark size={22} strokeWidth={1.6}/></div>}
    <Heading className="wallet-name">{name}</Heading>
    <p>{campaign}</p>
  </div>
}

export function WalletCard({goal,reward,stamps,impact = null,canStamp = false,hidden = false,business = true}: {
  goal:number;reward:string;stamps:number;impact?:number|null;canStamp?:boolean;hidden?:boolean;business?:boolean
}) {
  const Mark = business ? Stamp : Coffee
  return <article hidden={hidden} data-stamping={impact !== null} className={'paper'+(impact !== null ? ' paper-impact' : '')} aria-label="Sadakat kartı">
    <div className="wallet-card-finish" aria-hidden="true"/>
    <div className="paper-top"><div><span className="eyebrow">SADAKAT KARTI</span><h2>{reward}</h2></div><span className="stamp-counter">{stamps}<small> / {goal}</small></span></div>
    <div className="stamp-grid" aria-label={stamps + ' damga'}>
      {Array.from({length:goal},(_,index) => <div className="stamp-cell" data-next={canStamp && index === stamps && impact === null} key={index}>
        <div className={'stamp-slot'+(index < stamps ? ' inked' : '')+(impact === index ? ' landing' : '')}>
          {index < stamps || impact === index ? <><Mark size={22} strokeWidth={1.65}/><span className="ink-lettering">DAMGA</span></> : index === goal - 1 ? <Ticket size={20}/> : <span>{String(index+1).padStart(2,'0')}</span>}
        </div>
        {impact === index && <PhysicalStamp />}
      </div>)}
    </div>
    <div className="paper-foot"><span>{goal - stamps} damga sonra ödül senin.</span><div className="progress" aria-hidden="true"><i style={{width: stamps / goal * 100 + '%'}}/></div></div>
  </article>
}
