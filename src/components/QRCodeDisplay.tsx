'use client'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'

export default function QRCodeDisplay({ vehicleId, plate }: { vehicleId: string; plate: string }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}/vehicles/${vehicleId}`)
  }, [vehicleId])

  function handleDownload() {
    const svg = document.getElementById('vehicle-qr')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `qr-${plate}.svg`
    link.click()
  }

  if (!url) return <div className="w-48 h-48 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-xl">
        <QRCodeSVG id="vehicle-qr" value={url} size={168} />
      </div>
      <p className="text-xs text-slate-500 text-center break-all max-w-[200px]">{url}</p>
      <button onClick={handleDownload} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
        <Download size={14} />
        Descargar QR
      </button>
    </div>
  )
}
