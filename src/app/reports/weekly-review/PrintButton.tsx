'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('autoprint') === '1') {
      // Small delay to ensure the page has fully rendered
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  return (
    <button
      onClick={() => window.print()}
      className="btn-primary flex items-center gap-2"
    >
      <Printer size={16} />
      Imprimir / Guardar PDF
    </button>
  )
}
