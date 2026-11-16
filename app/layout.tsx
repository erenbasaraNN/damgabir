import type { Metadata, Viewport } from 'next'
import './styles/globals.css'
import './styles/merchant.css'
import './styles/wallet.css'
import './styles/portal.css'
import './styles/brand.css'
import './styles/appearance.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.DAMGABIR_PUBLIC_ORIGIN || 'http://localhost:3000'),
  title: 'Damgabir — Her gelişin bir karşılığı var.',
  description: 'Sevdiğin yerlerde damga biriktir, ödülüne yaklaş. Bütün sadakat kartların tek bir Damgabir hesabında.',
  manifest: '/manifest.webmanifest',
  icons: {icon:'/brand/symbol.svg',apple:'/icon-192.png'},
  openGraph: {title:'Damgabir',description:'Her gelişin bir karşılığı var.',images:[{url:'/brand/social.png',width:1200,height:630}],locale:'tr_TR',type:'website'},
}
export const viewport: Viewport = { themeColor: '#0a1310', viewportFit: 'cover' }

export default function Layout({ children }: {children: React.ReactNode}) {
  return <html lang="tr" data-type="software"><body>{children}</body></html>
}
