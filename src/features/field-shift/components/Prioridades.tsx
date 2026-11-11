'use client'

import { useTranslations } from 'next-intl'
import type { Prioridades as PrioridadesT } from '../types'

interface Props {
  prioridades: PrioridadesT
  onChange: (prioridades: PrioridadesT) => void
}

const CLAVES: readonly (keyof PrioridadesT)[] = ['comida', 'ingreso', 'suelo', 'clima']

export function Prioridades({ prioridades, onChange }: Props) {
  const t = useTranslations('fieldShift')

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t('prioridades.titulo')}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CLAVES.map((k) => (
          <div key={k} className="space-y-1">
            <label htmlFor={`fs-prioridad-${k}`} className="flex justify-between text-sm font-medium">
              <span>{t(`prioridades.${k}`)}</span>
              <span data-testid={`fs-prioridad-valor-${k}`}>{prioridades[k]}</span>
            </label>
            <input
              id={`fs-prioridad-${k}`}
              data-testid={`fs-prioridad-${k}`}
              type="range"
              min={0}
              max={3}
              step={1}
              value={prioridades[k]}
              onChange={(e) => onChange({ ...prioridades, [k]: Number(e.target.value) })}
              className="w-full accent-emerald-700"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
