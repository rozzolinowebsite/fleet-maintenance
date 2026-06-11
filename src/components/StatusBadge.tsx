import { statusBg, StatusLevel } from '@/lib/utils'

interface Props {
  status: StatusLevel
  label?: string
}

const defaultLabel: Record<StatusLevel, string> = {
  ok: 'OK',
  warning: 'Atención',
  danger: 'Alerta',
  unknown: 'Sin datos',
}

export default function StatusBadge({ status, label }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusBg(status)}`}>
      {label ?? defaultLabel[status]}
    </span>
  )
}
