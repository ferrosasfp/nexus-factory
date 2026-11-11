'use client'

import { useTranslations } from 'next-intl'
import { backtest } from '../services/rotacion'
import type { Clima, PuntoBacktest } from '../types'

interface Props {
  /** Clima con todas las campañas: el backtest no depende del escenario */
  clima: Clima
  umbral: number
  onUmbral: (umbral: number) => void
}

type T = ReturnType<typeof useTranslations<'fieldShift'>>

// Mismas dimensiones que el gráfico del MVP (pintarBacktest en web/app.js).
const W = 760
const H = 280
const IZQ = 40
const DER = 12
const ARRIBA = 16
const ABAJO = 36
const EJES = [0, 0.25, 0.5, 0.75, 1]

const y = (v: number): number => ARRIBA + (1 - v) * (H - ARRIBA - ABAJO)

function tituloBarra(t: T, d: PuntoBacktest): string {
  const valores = { etiqueta: d.etiqueta, indice: d.indice.toFixed(3) }
  const clave = d.fase === 'nino' ? 'backtest.barraNino' : d.fase === 'nina' ? 'backtest.barraNina' : 'backtest.barra'
  const texto = t(clave, valores)
  return d.paga ? t('backtest.paga', { texto }) : texto
}

function Grafico({ t, datos, umbral }: { t: T; datos: PuntoBacktest[]; umbral: number }) {
  const ancho = (W - IZQ - DER) / datos.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('backtest.grafico')} className="w-full">
      {EJES.map((v) => (
        <g key={v}>
          <line x1={IZQ} x2={W - DER} y1={y(v)} y2={y(v)} className="stroke-stone-200" />
          <text x={IZQ - 6} y={y(v) + 4} fontSize={11} textAnchor="end" className="fill-stone-500">
            {v}
          </text>
        </g>
      ))}
      {datos.map((d, i) => {
        const x = IZQ + i * ancho + ancho * 0.15
        return (
          <g key={d.etiqueta} data-testid="fs-barra" data-paga={d.paga ? 'true' : 'false'}>
            <rect
              x={x}
              y={y(d.indice)}
              width={ancho * 0.7}
              height={y(0) - y(d.indice)}
              rx={2}
              className={d.paga ? 'fill-amber-600' : 'fill-emerald-300'}
            >
              <title>{tituloBarra(t, d)}</title>
            </rect>
            {d.fase === 'nino' && (
              <text x={x + ancho * 0.35} y={y(d.indice) - 6} fontSize={11} fontWeight={600} textAnchor="middle" className="fill-stone-800">
                {t('backtest.marcaNino')}
              </text>
            )}
            {i % 3 === 0 && (
              <text x={x + ancho * 0.35} y={H - 14} fontSize={11} textAnchor="middle" className="fill-stone-500">
                {d.etiqueta}
              </text>
            )}
          </g>
        )
      })}
      <line x1={IZQ} x2={W - DER} y1={y(umbral)} y2={y(umbral)} strokeWidth={1.5} strokeDasharray="5 4" className="stroke-amber-600" />
      <text x={IZQ + 4} y={ARRIBA + 10} fontSize={11} className="fill-amber-700">
        {t('backtest.leyendaUmbral')}
      </text>
      <text x={IZQ + 130} y={ARRIBA + 10} fontSize={11} className="fill-stone-800">
        <tspan fontWeight={600}>{t('backtest.marcaNino')}</tspan> {t('backtest.leyendaNino')}
      </text>
    </svg>
  )
}

export function BacktestSeguro({ clima, umbral, onUmbral }: Props) {
  const t = useTranslations('fieldShift')
  const datos = backtest(clima, umbral)
  const pagos = datos.filter((d) => d.paga)
  const conNino = pagos.filter((d) => d.fase === 'nino').length

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t('backtest.titulo')}</h2>
      <p className="text-sm text-gray-700">{t('backtest.explicacion')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="fs-umbral" className="font-medium">
          {t('backtest.umbral')}
        </label>
        <input
          id="fs-umbral"
          data-testid="fs-umbral"
          type="range"
          min={0.2}
          max={0.9}
          step={0.005}
          value={umbral}
          onChange={(e) => onUmbral(Number(e.target.value))}
          className="w-64 accent-amber-600"
        />
        <span data-testid="fs-umbral-valor" className="rounded-full bg-gray-100 px-3 py-1 font-mono text-sm">
          {umbral.toFixed(3)}
        </span>
      </div>
      <Grafico t={t} datos={datos} umbral={umbral} />
      <p data-testid="fs-backtest-resumen" aria-live="polite" className="text-sm">
        {pagos.length
          ? t('backtest.resumen', {
              pagos: String(pagos.length),
              total: String(datos.length),
              lista: pagos.map((d) => d.etiqueta).join(', '),
              nino: String(conNino),
            })
          : t('backtest.ninguno')}
      </p>
    </section>
  )
}
