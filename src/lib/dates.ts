export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

export function dateInputValue(value: Date | string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function addOneYear(value: Date): Date {
  const next = new Date(value)
  next.setUTCFullYear(next.getUTCFullYear() + 1)
  return next
}

export function addOneYearInput(value: string | null | undefined): string {
  const date = parseDateOnly(value)
  return date ? dateInputValue(addOneYear(date)) : ''
}
