import { differenceInDays, format, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

export type StatusLevel = 'ok' | 'warning' | 'danger' | 'unknown'

export function getVTVStatus(expirationDate: Date | string | null): StatusLevel {
  if (!expirationDate) return 'unknown'
  const days = differenceInDays(new Date(expirationDate), new Date())
  if (days < 0) return 'danger'
  if (days <= 30) return 'warning'
  return 'ok'
}

export function getOilChangeStatus(
  currentKm: number,
  nextKm: number | null | undefined,
  nextDate: Date | string | null | undefined
): StatusLevel {
  if (!nextKm) return 'unknown'
  const kmLeft = nextKm - currentKm
  if (kmLeft < 0) return 'danger'
  if (kmLeft <= 500) return 'warning'
  if (nextDate) {
    const days = differenceInDays(new Date(nextDate), new Date())
    if (days < 0) return 'danger'
    if (days <= 15) return 'warning'
  }
  return 'ok'
}

export function getTirePressureStatus(current: number | null, recommended: number): StatusLevel {
  if (current === null || current === undefined) return 'unknown'
  const pct = Math.abs(current - recommended) / recommended
  if (pct > 0.2) return 'danger'
  if (pct > 0.1) return 'warning'
  return 'ok'
}

export function statusColor(s: StatusLevel) {
  return {
    ok: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    unknown: 'text-slate-500',
  }[s]
}

export function statusDot(s: StatusLevel) {
  return {
    ok: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    unknown: 'bg-slate-600',
  }[s]
}

export function statusBg(s: StatusLevel) {
  return {
    ok: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    unknown: 'bg-slate-700/50 text-slate-400 border-slate-600',
  }[s]
}

export function fmtKm(km: number) {
  return km.toLocaleString('es-AR') + ' km'
}

export function fmtDate(d: Date | string | null) {
  if (!d) return '—'
  return format(new Date(d), 'dd/MM/yyyy', { locale: es })
}

export function getFluidStatus(
  currentKm: number,
  fluid: { expiryMode: string; nextKm?: number | null; nextDate?: Date | string | null }
): StatusLevel {
  if (fluid.expiryMode === 'km' || fluid.expiryMode === 'both') {
    if (fluid.nextKm != null) {
      const kmLeft = fluid.nextKm - currentKm
      if (kmLeft < 0) return 'danger'
      if (kmLeft <= 500) return 'warning'
    }
  }
  if (fluid.expiryMode === 'date' || fluid.expiryMode === 'both') {
    if (fluid.nextDate) {
      const days = differenceInDays(new Date(fluid.nextDate), new Date())
      if (days < 0) return 'danger'
      if (days <= 15) return 'warning'
    }
  }
  return 'ok'
}

export function getAlignmentStatus(
  currentKm: number,
  nextKm: number | null | undefined,
  nextDate: Date | string | null | undefined
): StatusLevel {
  return getOilChangeStatus(currentKm, nextKm, nextDate)
}

export function getFireExtinguisherStatus(expirationDate: Date | string | null): StatusLevel {
  if (!expirationDate) return 'unknown'
  const days = differenceInDays(new Date(expirationDate), new Date())
  if (days < 0) return 'danger'
  if (days <= 30) return 'warning'
  return 'ok'
}

export function getInsuranceStatus(policyExpirationDate: Date | string | null): StatusLevel {
  if (!policyExpirationDate) return 'unknown'
  const days = differenceInDays(new Date(policyExpirationDate), new Date())
  if (days < 0) return 'danger'
  if (days <= 30) return 'warning'
  return 'ok'
}

export function getDocumentStatus(expiryDate: Date | string | null): StatusLevel {
  if (!expiryDate) return 'unknown'
  const days = differenceInDays(new Date(expiryDate), new Date())
  if (days < 0) return 'danger'
  if (days <= 30) return 'warning'
  return 'ok'
}

export const DEFAULT_FLUID_CHECK_ITEMS = [
  'Aceite de motor',
  'Refrigerante',
  'Líquido de frenos',
  'Aceite hidráulico',
  'Líquido limpiaparabrisas',
  'Presión de neumáticos',
]

export const DEFAULT_INVENTORY_ITEMS: string[] = []

export const DAILY_ITEMS = [
  { id: 'engine_start', label: 'Motor arrancó correctamente' },
  { id: 'oil_level', label: 'Nivel de aceite OK' },
  { id: 'fuel_level', label: 'Nivel de combustible suficiente' },
  { id: 'lights', label: 'Luces delanteras y traseras' },
  { id: 'tires_visual', label: 'Estado visual de neumáticos' },
  { id: 'brakes', label: 'Frenos funcionando correctamente' },
  { id: 'no_leaks', label: 'Sin pérdidas visibles (aceite, agua)' },
  { id: 'cleanliness', label: 'Limpieza del vehículo' },
  { id: 'docs', label: 'Documentación presente en el vehículo' },
  { id: 'seatbelt', label: 'Cinturones de seguridad OK' },
]

export const WEEKLY_ITEMS = [
  { id: 'oil_check', label: 'Control de nivel de aceite' },
  { id: 'tire_pressure', label: 'Presión de neumáticos medida' },
  { id: 'brake_fluid', label: 'Nivel de líquido de frenos' },
  { id: 'coolant', label: 'Nivel de líquido refrigerante' },
  { id: 'washer_fluid', label: 'Nivel de limpiaparabrisas' },
  { id: 'belts', label: 'Estado de correas (visual)' },
  { id: 'tools_check', label: 'Revisión de herramientas en vehículo' },
  { id: 'full_lights', label: 'Revisión completa de luces' },
  { id: 'battery', label: 'Estado de batería' },
  { id: 'documentation', label: 'Documentación actualizada (VTV, seguro)' },
  { id: 'exterior', label: 'Estado exterior del vehículo' },
  { id: 'interior', label: 'Limpieza y estado interior' },
]
