import { db } from '@/lib/db'
import { startOfWeek, endOfWeek, format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { DEFAULT_INVENTORY_ITEMS, DEFAULT_FLUID_CHECK_ITEMS } from '@/lib/utils'
import PrintButton from './PrintButton'

export const revalidate = 0

function kmLeft(nextKm: number | null | undefined, current: number): number | null {
  if (nextKm == null) return null
  return nextKm - current
}

function daysLeft(date: Date | string | null | undefined): number | null {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

function fmtKmLeft(km: number | null): string {
  if (km === null) return '—'
  if (km < 0) return `${Math.abs(km).toLocaleString('es-AR')} km excedido`
  return `${km.toLocaleString('es-AR')} km`
}

function fmtDaysLeft(days: number | null): string {
  if (days === null) return '—'
  if (days < 0) return `Venció hace ${Math.abs(days)} días`
  if (days === 0) return 'Vence hoy'
  return `${days} días`
}

function maintStatus(isExpiredKm: boolean | null, isExpiredDate: boolean | null, warnKm: boolean, warnDate: boolean): string {
  if (isExpiredKm || isExpiredDate) return 'maint-danger'
  if (warnKm || warnDate) return 'maint-warning'
  return 'maint-ok'
}

export default async function WeeklyReviewReportPage() {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const vehicles = await db.vehicle.findMany({
    orderBy: { plate: 'asc' },
    include: {
      oilChange: true,
      alignmentBalance: true,
      vtv: true,
      fireExtinguisher: true,
      weeklyReviews: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  const weekLabel = `${format(weekStart, "d 'de' MMMM", { locale: es })} al ${format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}`
  const printDate = format(now, "EEEE d 'de' MMMM yyyy", { locale: es })

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reporte semanal</h1>
          <p className="text-slate-400 text-sm mt-0.5">Semana del {weekLabel}</p>
        </div>
        <PrintButton />
      </div>

      <div className="print-container">
        {/* ── Header ── */}
        <div className="rpt-header">
          <div className="rpt-logo">FleetMaint</div>
          <div className="rpt-header-text">
            <div className="rpt-title">REVISIÓN DE VEHÍCULOS SEMANAL</div>
            <div className="rpt-week">Semana del {weekLabel}</div>
          </div>
          <div className="rpt-date-box">
            <div className="rpt-date-label">Fecha de revisión</div>
            <div className="rpt-date-value" style={{ textTransform: 'capitalize' }}>{printDate}</div>
          </div>
        </div>

        {/* ── Vehicles ── */}
        {vehicles.map(v => {
          const oc = v.oilChange
          const ab = v.alignmentBalance
          const vtv = v.vtv
          const fe = v.fireExtinguisher

          const ocKm = kmLeft(oc?.nextKm, v.kmCurrent)
          const ocDays = daysLeft(oc?.nextDate)
          const abKm = kmLeft(ab?.nextKm, v.kmCurrent)
          const vtvDays = daysLeft(vtv?.expirationDate)
          const feDays = daysLeft(fe?.expirationDate)

          const ocStatus = !oc ? 'maint-unknown'
            : maintStatus(ocKm !== null && ocKm < 0, ocDays !== null && ocDays < 0, ocKm !== null && ocKm <= 500, ocDays !== null && ocDays <= 15)
          const abStatus = !ab ? 'maint-unknown'
            : maintStatus(abKm !== null && abKm < 0, null, abKm !== null && abKm <= 500, false)
          const vtvStatus = !vtv ? 'maint-unknown'
            : maintStatus(null, vtvDays !== null && vtvDays < 0, false, vtvDays !== null && vtvDays <= 30)
          const feStatus = !fe ? 'maint-unknown'
            : maintStatus(null, feDays !== null && feDays < 0, false, feDays !== null && feDays <= 30)

          const invItems: string[] = (v.weeklyInventoryItems as string[] | null) ?? DEFAULT_INVENTORY_ITEMS
          const fluidItems: string[] = (v.weeklyFluidItems as string[] | null) ?? DEFAULT_FLUID_CHECK_ITEMS
          const lastReview = v.weeklyReviews[0] ?? null
          const invChecks = (lastReview?.inventoryChecks as { item: string; ok: boolean }[] | null) ?? []
          const invCheckMap = Object.fromEntries(invChecks.map(c => [c.item, c.ok]))
          const fluidChecks = (lastReview?.fluidChecks as { item: string; ok: boolean }[] | null) ?? []
          const fluidCheckMap = Object.fromEntries(fluidChecks.map(c => [c.item, c.ok]))

          const insuranceOk = lastReview?.insuranceOk ?? null
          const reviewer = lastReview?.reviewer ?? null

          return (
            <div key={v.id} className="v-block">
              {/* Vehicle header */}
              <div className="v-header">
                <div className="v-header-top">
                  <div className="v-name-row">
                    <span className="v-brand-model">{v.brand} {v.model}</span>
                    <span className="v-plate">{v.plate}</span>
                  </div>
                  <div className="v-km-badge">{v.kmCurrent.toLocaleString('es-AR')} km actuales</div>
                </div>
                <div className="v-header-bottom">
                  <span className="v-reviewer">
                    Revisión por: <strong>{reviewer ?? 'Sin revisión registrada'}</strong>
                  </span>
                  <span className={`v-insurance ${insuranceOk === true ? 'ins-ok' : insuranceOk === false ? 'ins-no' : 'ins-unknown'}`}>
                    {insuranceOk === true ? '☑' : '☐'} Seguros actualizados
                  </span>
                </div>
              </div>

              <div className="v-body">
                {/* Mantenimientos */}
                <div className="v-section">
                  <div className="v-section-title">Mantenimientos</div>
                  <div className="maint-grid">

                    <div className={`maint-card ${ocStatus}`}>
                      <div className="maint-card-name">Cambio de aceite</div>
                      <div className="maint-row">
                        <span className="ml">Próximo cambio</span>
                        <span className="mv">{oc?.nextKm ? oc.nextKm.toLocaleString('es-AR') + ' km' : '—'}</span>
                      </div>
                      <div className="maint-row">
                        <span className="ml">Km restantes</span>
                        <span className="mv">{fmtKmLeft(ocKm)}</span>
                      </div>
                      <div className="maint-row">
                        <span className="ml">Vencimiento</span>
                        <span className="mv">{oc?.nextDate ? format(new Date(oc.nextDate), 'dd/MM/yyyy') : '—'}</span>
                      </div>
                      <div className="maint-row">
                        <span className="ml">Días restantes</span>
                        <span className="mv">{fmtDaysLeft(ocDays)}</span>
                      </div>
                      {!oc && <div className="maint-no-data">Sin datos registrados</div>}
                    </div>

                    <div className={`maint-card ${abStatus}`}>
                      <div className="maint-card-name">Alineación y balanceo</div>
                      <div className="maint-row">
                        <span className="ml">Próximo servicio</span>
                        <span className="mv">{ab?.nextKm ? ab.nextKm.toLocaleString('es-AR') + ' km' : '—'}</span>
                      </div>
                      <div className="maint-row">
                        <span className="ml">Km restantes</span>
                        <span className="mv">{fmtKmLeft(abKm)}</span>
                      </div>
                      {!ab && <div className="maint-no-data">Sin datos registrados</div>}
                    </div>

                    <div className={`maint-card ${vtvStatus}`}>
                      <div className="maint-card-name">VTV / RTO</div>
                      <div className="maint-row">
                        <span className="ml">Vencimiento</span>
                        <span className="mv">{vtv?.expirationDate ? format(new Date(vtv.expirationDate), 'dd/MM/yyyy') : '—'}</span>
                      </div>
                      <div className="maint-row">
                        <span className="ml">Días restantes</span>
                        <span className="mv">{fmtDaysLeft(vtvDays)}</span>
                      </div>
                      {!vtv && <div className="maint-no-data">Sin datos registrados</div>}
                    </div>

                    <div className={`maint-card ${feStatus}`}>
                      <div className="maint-card-name">Matafuego</div>
                      <div className="maint-row">
                        <span className="ml">Vencimiento</span>
                        <span className="mv">{fe?.expirationDate ? format(new Date(fe.expirationDate), 'dd/MM/yyyy') : '—'}</span>
                      </div>
                      <div className="maint-row">
                        <span className="ml">Días restantes</span>
                        <span className="mv">{fmtDaysLeft(feDays)}</span>
                      </div>
                      {!fe && <div className="maint-no-data">Sin datos registrados</div>}
                    </div>

                  </div>
                </div>

                {/* Inventario */}
                <div className="v-section">
                  <div className="v-section-title">Inventario</div>
                  <div className="inv-grid">
                    {invItems.map(item => {
                      const checked = invCheckMap[item] === true
                      return (
                        <div key={item} className="inv-item">
                          <span className="inv-box" style={{ color: checked ? '#16a34a' : '#94a3b8' }}>
                            {checked ? '☑' : '☐'}
                          </span>
                          <span className="inv-name" style={{ color: checked ? '#111' : '#888' }}>{item}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Revisión de niveles */}
                <div className="v-section">
                  <div className="v-section-title">Revisión de niveles</div>
                  <div className="inv-grid">
                    {fluidItems.map(item => {
                      const checked = fluidCheckMap[item] === true
                      return (
                        <div key={item} className="inv-item">
                          <span className="inv-box" style={{ color: checked ? '#16a34a' : '#94a3b8' }}>
                            {checked ? '☑' : '☐'}
                          </span>
                          <span className="inv-name" style={{ color: checked ? '#111' : '#888' }}>{item}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        <div className="rpt-footer">
          Generado el {format(now, "dd/MM/yyyy 'a las' HH:mm", { locale: es })} · FleetMaint — Sistema de mantenimiento de flota
        </div>
      </div>

      <style suppressHydrationWarning>{`
        .print-container {
          background: white;
          color: #111;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 10px;
          line-height: 1.35;
          padding: 20px 24px;
          border-radius: 12px;
        }

        /* ── Report header ── */
        .rpt-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 3px solid #1e3a5f;
        }
        .rpt-logo {
          background: #2563eb;
          color: white;
          font-weight: 800;
          font-size: 13px;
          padding: 7px 12px;
          border-radius: 7px;
          white-space: nowrap;
          letter-spacing: 0.3px;
          flex-shrink: 0;
        }
        .rpt-header-text { flex: 1; }
        .rpt-title {
          font-size: 15px;
          font-weight: 800;
          color: #1e3a5f;
          letter-spacing: 0.4px;
        }
        .rpt-week {
          color: #555;
          font-size: 10px;
          margin-top: 1px;
        }
        .rpt-date-box { text-align: right; flex-shrink: 0; }
        .rpt-date-label {
          font-size: 8px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 600;
        }
        .rpt-date-value {
          font-size: 10px;
          color: #333;
          font-weight: 600;
          margin-top: 1px;
        }

        /* ── Vehicle block ── */
        .v-block {
          margin-bottom: 10px;
          border: 1px solid #c8d4e0;
          border-radius: 7px;
          overflow: hidden;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .v-header {
          background: #1e3a5f;
          padding: 7px 12px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .v-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 4px;
        }
        .v-header-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 4px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .v-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .v-brand-model {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.3px;
        }
        .v-plate {
          font-size: 9px;
          font-weight: 600;
          color: #94b4d4;
          background: rgba(255,255,255,0.1);
          padding: 1.5px 6px;
          border-radius: 4px;
          letter-spacing: 1px;
        }
        .v-km-badge {
          font-size: 10px;
          color: #c8ddf0;
          font-weight: 500;
          white-space: nowrap;
        }
        .v-reviewer {
          font-size: 9px;
          color: #a0bfd8;
        }
        .v-reviewer strong {
          color: #e2f0fb;
          font-weight: 600;
        }
        .v-insurance {
          font-size: 9px;
          font-weight: 600;
          white-space: nowrap;
        }
        .ins-ok      { color: #6ee7a0; }
        .ins-no      { color: #fca5a5; }
        .ins-unknown { color: #94a3b8; }

        /* ── Vehicle body ── */
        .v-body {
          padding: 8px 12px;
          display: flex;
          gap: 12px;
        }
        .v-section { flex: 1; }
        .v-section-title {
          font-size: 8px;
          font-weight: 700;
          color: #1e3a5f;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 5px;
          padding-bottom: 3px;
          border-bottom: 1px solid #dde6ef;
        }

        /* ── Maintenance grid ── */
        .maint-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
        }
        .maint-card {
          border-radius: 5px;
          padding: 5px 7px;
          border-left: 3px solid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .maint-ok      { background: #f0fdf4; border-left-color: #16a34a; }
        .maint-warning { background: #fffbeb; border-left-color: #d97706; }
        .maint-danger  { background: #fef2f2; border-left-color: #dc2626; }
        .maint-unknown { background: #f8fafc; border-left-color: #94a3b8; }

        .maint-card-name {
          font-weight: 700;
          font-size: 9px;
          color: #1a1a1a;
          margin-bottom: 3px;
        }
        .maint-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 1px 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .ml { color: #555; font-size: 8.5px; }
        .mv { font-weight: 600; font-size: 8.5px; color: #1a1a1a; }
        .maint-danger .mv  { color: #dc2626; }
        .maint-warning .mv { color: #b45309; }
        .maint-no-data { font-size: 8px; color: #aaa; font-style: italic; margin-top: 3px; }

        /* ── Inventory ── */
        .inv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px 8px;
        }
        .inv-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 1.5px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .inv-box  { font-size: 11px; line-height: 1; flex-shrink: 0; }
        .inv-name { font-size: 9px; }

        /* ── Footer ── */
        .rpt-footer {
          margin-top: 14px;
          padding-top: 8px;
          border-top: 1px solid #d0d7e0;
          text-align: center;
          color: #aaa;
          font-size: 8px;
        }

        /* ── Print overrides ── */
        @media print {
          .print-container {
            border-radius: 0;
            padding: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  )
}
