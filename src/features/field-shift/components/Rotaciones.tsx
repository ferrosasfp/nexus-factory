'use client'

import { useTranslations } from 'next-intl'
import { formatearRazon } from '../services/razones'
import type { Componentes, Rotacion } from '../types'

interface Props {
  rotaciones: Rotacion[]
}

// Port de pintarRecomendaciones (MVP web/app.js).
export function Rotaciones({ rotaciones }: Props) {
  const t = useTranslations('fieldShift')

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t('rotacion.titulo')}</h2>
      <div className="space-y-3">
        {rotaciones.map((r, i) => (
          <article
            key={`${r.anio1}-${r.anio2}`}
            data-testid="fs-rotacion"
            className={`rounded-lg border p-4 ${i === 0 ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 bg-white'}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong data-testid="fs-rotacion-titulo">
                {t('rotacion.item', {
                  n: String(i + 1),
                  a: t(`cultivos.${r.anio1}`),
                  b: t(`cultivos.${r.anio2}`),
                })}
              </strong>
              <span className="text-sm text-gray-600">
                {t('rotacion.puntaje', { n: String(Math.round(r.total * 100)) })}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-700 sm:grid-cols-2">
              {(Object.entries(r.componentes) as [keyof Componentes, number][]).map(([k, v]) => (
                <span key={k} className="flex items-center gap-2">
                  <span className="w-40 shrink-0">{t(`prioridades.${k}`)}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded bg-gray-200">
                    <i
                      className="block h-full bg-emerald-600"
                      style={{ width: `${Math.round(Math.min(1, v) * 100)}%` }}
                    />
                  </span>
                </span>
              ))}
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {r.razones.map((razon, j) => (
                <li key={j}>{formatearRazon(t, razon)}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
