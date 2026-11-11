'use client'

import { useTranslations } from 'next-intl'
import type { Clima, Escenario, ZonaId } from '../types'

interface Props {
  zona: ZonaId
  escenario: Escenario
  onEscenario: (escenario: Escenario) => void
  clima: Clima | null
  /** Mensaje ya traducido si el escenario no se puede analizar */
  error: string | null
}

interface Tarjeta {
  id: string
  valor: string
  etiqueta: string
  alerta?: boolean
}

const ESCENARIOS: readonly Escenario[] = ['todas', 'nino', 'nina']
const esEscenario = (x: string): x is Escenario => (ESCENARIOS as readonly string[]).includes(x)
const conSigno = (n: number): string => `${n > 0 ? '+' : ''}${n}`

type T = ReturnType<typeof useTranslations<'fieldShift'>>

// Port de pintarClima (MVP web/app.js): mismos redondeos y mismos umbrales de alerta.
function armarTarjetas(t: T, c: Clima): Tarjeta[] {
  const cuales = t(`escenario.periodo.${c.escenario}`)
  const tendencia = Math.round(c.tendencia * 100)
  const nino = c.lluviaNino === null ? null : Math.round((c.lluviaNino / c.lluviaNormal - 1) * 100)
  const pct = (v: number) => t('unidades.pct', { v: String(v) })
  return [
    { id: 'lluvia', valor: t('unidades.mm', { v: String(Math.round(c.lluvia)) }), etiqueta: t('tarjetas.lluvia', { cuales }) },
    ...(nino === null
      ? []
      : [{ id: 'nino', valor: t('unidades.pct', { v: conSigno(nino) }), etiqueta: t('tarjetas.nino'), alerta: nino <= -10 }]),
    {
      id: 'secas',
      valor: pct(Math.round(c.frecuenciaSequia * 100)),
      etiqueta: c.campaniasSecas.length
        ? t('tarjetas.secasLista', { cuales, lista: c.campaniasSecas.join(', ') })
        : t('tarjetas.secas', { cuales }),
      alerta: c.frecuenciaSequia >= 0.2,
    },
    { id: 'tmin', valor: t('unidades.celsius', { v: c.tminPromedio.toFixed(1) }), etiqueta: t('tarjetas.tmin') },
    { id: 'helada', valor: pct(Math.round(c.riesgoHelada * 100)), etiqueta: t('tarjetas.helada'), alerta: c.riesgoHelada >= 0.2 },
    {
      id: 'tendencia',
      valor: t('unidades.pct', { v: conSigno(tendencia) }),
      etiqueta: t('tarjetas.tendencia'),
      alerta: tendencia <= -10,
    },
  ]
}

function SelectorEscenario({ escenario, onEscenario }: Pick<Props, 'escenario' | 'onEscenario'>) {
  const t = useTranslations('fieldShift')
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="fs-escenario" className="font-medium">
        {t('escenario.label')}
      </label>
      <select
        id="fs-escenario"
        data-testid="fs-escenario"
        value={escenario}
        onChange={(e) => {
          if (esEscenario(e.target.value)) onEscenario(e.target.value)
        }}
        className="rounded-md border border-gray-300 bg-white px-3 py-2"
      >
        {ESCENARIOS.map((e) => (
          <option key={e} value={e}>
            {t(`escenario.${e}`)}
          </option>
        ))}
      </select>
    </div>
  )
}

export function TarjetasClima({ zona, escenario, onEscenario, clima, error }: Props) {
  const t = useTranslations('fieldShift')

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t('clima.titulo')}</h2>
      <SelectorEscenario escenario={escenario} onEscenario={onEscenario} />
      {error && (
        <p role="alert" data-testid="fs-error-escenario" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {clima && (
        <>
          <p data-testid="fs-periodo" className="text-sm text-gray-600">
            {t('escenario.resumen', {
              zona: t(`zonas.${zona}`),
              cuales: t(`escenario.periodo.${clima.escenario}`),
              n: String(clima.nCampanias),
              total: String(clima.campanias.length),
              desde: clima.periodo[0],
              hasta: clima.periodo[1],
            })}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {armarTarjetas(t, clima).map((tarjeta) => (
              <div
                key={tarjeta.id}
                data-testid="fs-tarjeta"
                data-alerta={tarjeta.alerta ? 'true' : 'false'}
                className={`rounded-lg border p-4 ${
                  tarjeta.alerta ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="text-2xl font-semibold">{tarjeta.valor}</div>
                <div className="text-sm text-gray-700">{tarjeta.etiqueta}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
