'use client'

import { useId, useState } from 'react'
import { ArrowDown, Check, ImagePlus, Save, Stamp, Ticket } from 'lucide-react'
import { businessLogoTypes, maxBusinessLogoBytes, walletThemes, type BusinessAppearance, type WalletTheme } from '../../../lib/business-appearance'
import { loyalty, LoyaltyError, type Campaign } from '../../client'
import Brand from '../brand'
import { WalletCard, WalletIdentity } from '../wallet/wallet-card'

async function prepareLogo(file: File) {
  if (!businessLogoTypes.some(type => type === file.type)) throw new Error('PNG, JPEG veya WebP seçin.')
  if (file.size > 8 * 1024 * 1024) throw new Error('En fazla 8 MB boyutunda bir dosya seçin.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    const scale = Math.min(1,256 / Math.max(image.naturalWidth,image.naturalHeight))
    canvas.width = Math.max(1,Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1,Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Logo hazırlanamadı.')
    context.drawImage(image,0,0,canvas.width,canvas.height)
    const logo = canvas.toDataURL('image/webp',.86)
    if (logo.length > Math.ceil(maxBusinessLogoBytes / 3) * 4) throw new Error('Logo çok büyük. Daha küçük bir görsel seçin.')
    return logo
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function BusinessSettings({business,appearance,campaign,onSave,onSessionExpired}: {
  business:string;appearance:BusinessAppearance;campaign:Campaign;onSave:(appearance:BusinessAppearance)=>void;onSessionExpired:()=>void
}) {
  const inputId = useId()
  const [name,setName] = useState(appearance.name)
  const [theme,setTheme] = useState<WalletTheme>(appearance.theme)
  const [logo,setLogo] = useState<string|null>()
  const [uploading,setUploading] = useState(false)
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const [logoError,setLogoError] = useState('')
  const [saved,setSaved] = useState(false)
  const logoUrl = logo === undefined ? appearance.logoUrl : logo
  const busy = saving || uploading
  const changed = name.trim() !== appearance.name || theme !== appearance.theme || logo !== undefined

  async function upload(file?: File) {
    if (!file) return
    setUploading(true)
    setLogoError('')
    setSaved(false)
    try { setLogo(await prepareLogo(file)) }
    catch (reason) { setLogoError(reason instanceof Error && reason.name !== 'EncodingError' ? reason.message : 'Logo okunamadı. Başka bir görsel seçin.') }
    finally { setUploading(false) }
  }

  async function save() {
    if (!changed || busy) return
    setSaving(true)
    setError('')
    try {
      const result = await loyalty<BusinessAppearance>({action:'appearance',name,theme,logo},business)
      onSave(result)
      setName(result.name)
      setLogo(undefined)
      setSaved(true)
    } catch (reason) {
      if (reason instanceof LoyaltyError && reason.status === 401) onSessionExpired()
      else setError(reason instanceof Error ? reason.message : 'Ayarlar kaydedilemedi.')
    } finally { setSaving(false) }
  }

  return <div className="appearance-layout" data-enter>
    <form className="panel appearance-form" onSubmit={event => {event.preventDefault();void save()}}>
      <fieldset disabled={busy}>
        <legend>İşletme kimliği</legend>
        <label className="appearance-name">Görünen işletme adı
          <input value={name} minLength={2} maxLength={80} required onChange={event => {setName(event.target.value);setSaved(false)}}/>
        </label>
        <div className="appearance-logo-row">
          {logoUrl ? <img className="business-logo appearance-upload-logo" src={logoUrl} alt=""/> :
            <div className="appearance-logo-tile" aria-hidden="true"><Stamp size={25} strokeWidth={1.6}/></div>}
          <div>
            <label className="appearance-upload" htmlFor={inputId}><ImagePlus size={16}/>{logoUrl ? 'Logoyu değiştir' : 'Logo yükle'}</label>
            <input id={inputId} className="appearance-file" type="file" accept={businessLogoTypes.join(',')} aria-describedby={`${inputId}-hint`} onChange={event => {void upload(event.currentTarget.files?.[0]);event.currentTarget.value = ''}}/>
            <p id={`${inputId}-hint`}>PNG, JPEG veya WebP · En fazla 8 MB</p>
          </div>
          {logoUrl && <button className="appearance-remove" type="button" onClick={() => {setLogo(null);setSaved(false);setLogoError('')}}>Kaldır</button>}
        </div>
        {uploading && <p role="status">Logo hazırlanıyor…</p>}
        {logoError && <p className="error" role="alert">{logoError}</p>}
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Cüzdan teması</legend>
        <div className="appearance-themes">
          {walletThemes.map(option => <label className="appearance-theme" key={option.id}>
            <input type="radio" name="wallet-theme" value={option.id} checked={theme === option.id} onChange={() => {setTheme(option.id);setSaved(false)}}/>
            <span className="appearance-theme-swatch" data-wallet-theme={option.id} aria-hidden="true">
              <span className="appearance-swatch-card"><span/><span/><strong><Stamp size={13}/><Stamp size={13}/><Ticket size={13}/></strong></span>
              {theme === option.id && <span className="appearance-check"><Check size={13}/></span>}
            </span>
            <span className="appearance-theme-name">{option.name}</span><span className="appearance-theme-detail">{option.detail}</span>
          </label>)}
        </div>
        <a className="appearance-preview-jump" href={`#${inputId}-preview`}>Canlı önizlemeyi gör <ArrowDown size={16}/></a>
      </fieldset>
      <div className="appearance-actions">
        <button className="primary" disabled={!changed || busy}><Save size={17}/>{saving ? 'Kaydediliyor…' : 'Ayarları kaydet'}</button>
        {saved && <span role="status"><Check size={16}/> Ayarlar kaydedildi.</span>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
    <aside className="appearance-preview" id={`${inputId}-preview`} aria-label="Cüzdan önizlemesi">
      <h2>Canlı önizleme</h2>
      <div className="wallet-shell appearance-wallet" data-wallet-theme={theme}>
        <div className="wallet-header"><span className="brand"><Brand/></span><span className="wallet-header-label">Sadakat cüzdanı</span></div>
        <div className="wallet-main">
          <WalletIdentity name={name.trim() || appearance.name} campaign={campaign.name ?? 'Sadakat programı'} logoUrl={logoUrl} business preview/>
          <WalletCard goal={campaign.goal} reward={campaign.reward} stamps={Math.min(3,campaign.goal - 1)} canStamp/>
          <span className="primary appearance-preview-action" aria-hidden="true"><Stamp size={18}/> Damganı bas</span>
        </div>
      </div>
    </aside>
  </div>
}
