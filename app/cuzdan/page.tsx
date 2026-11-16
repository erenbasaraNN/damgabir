import Wallet from '../components/wallet/wallet'
import { tenantNames } from '../../lib/tenant'

export default async function DefaultWallet({searchParams}: {searchParams: Promise<{code?:string;program?:string}>}) {
  const {code,program} = await searchParams
  return <Wallet name={tenantNames.demo} program={program === 'kavak' ? 'kavak' : undefined}
    code={typeof code === 'string' ? code : undefined}/>
}
