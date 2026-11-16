/** The platform mark inherits colour so merchant themes can remain independent. */
export function BrandMark({className = ''}: {className?:string}) {
  return <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden="true">
    <path fill="currentColor" fillRule="evenodd" d="M29 5h10v20c0 10-7 16-17 16S5 35 5 25s7-16 17-16h7V5Zm-7 14c-4 0-7 2-7 6s3 6 7 6 7-2 7-6v-6h-7Z"/>
    <circle cx="10" cy="7" r="4" fill="currentColor"/>
  </svg>
}

export default function Brand() {
  return <><BrandMark className="damgabir-symbol"/><span className="damgabir-wordmark">damgabir</span></>
}
