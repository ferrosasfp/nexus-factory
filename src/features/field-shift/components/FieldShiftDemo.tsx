'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useClima } from '../hooks/useClima'
import { analizarClima, recomendarRotaciones, umbralSugerido, FieldShiftError } from '../services/rotacion'
import type { Clima, Escenario, Mes, Prioridades as PrioridadesT, ZonaId } from '../types'
import { ZonaSelector } from './ZonaSelector'
import { TarjetasClima } from './TarjetasClima'
import { Prioridades } from './Prioridades'
import { Rotaciones } from './Rotaciones'
import { BacktestSeguro } from './BacktestSeguro'
import { PolizaFuji } from './PolizaFuji'

const PRIORIDADES_INICIALES: PrioridadesT = { comida: 2, ingreso: 1, suelo: 1, clima: 3 }

type Analisis = { clima: Clima; error: null } | { clima: null; error: FieldShiftError['code'] }

function analizar(meses: readonly Mes[], escenario: Escenario): Analisis {
  try {
    return { clima: analizarClima(meses, escenario), error: null }
  } catch (err) {
    if (err instanceof FieldShiftError) return { clima: null, error: err.code }
    throw err
  }
}

function Encabezado() {
  const t = useTranslations('fieldShift')
  return (
    <header className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">{t('eyebrow')}</p>
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="text-gray-700">{t('subtitle')}</p>
      <p role="note" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
        {t('avisoDatos')}
      </p>
    </header>
  )
}

/** Cálculos derivados de los datos: clima del escenario, clima de todas las campañas y top 3. */
function useAnalisis(meses: readonly Mes[] | null, escenario: Escenario, prioridades: PrioridadesT) {
  const analisis = useMemo(() => (meses ? analizar(meses, escenario) : null), [meses, escenario])
  const climaTodas = useMemo(() => (meses ? analizar(meses, 'todas').clima : null), [meses])
  const rotaciones = useMemo(
    () => (analisis?.clima ? recomendarRotaciones(analisis.clima, prioridades) : []),
    [analisis, prioridades],
  )
  return { analisis, climaTodas, rotaciones }
}

/** Orquestador de la demo pública Field Shift. */
export function FieldShiftDemo() {
  const t = useTranslations('fieldShift')
  const { datos, loading, error, consultar } = useClima()
  const [zonaId, setZonaId] = useState<ZonaId>('carumas')
  const [escenario, setEscenario] = useState<Escenario>('todas')
  const [prioridades, setPrioridades] = useState<PrioridadesT>(PRIORIDADES_INICIALES)
  // null = usar el umbral sugerido de los datos cargados
  const [umbral, setUmbral] = useState<number | null>(null)
  const { analisis, climaTodas, rotaciones } = useAnalisis(datos?.meses ?? null, escenario, prioridades)
  const umbralEfectivo = umbral ?? (climaTodas ? umbralSugerido(climaTodas) : null)

  const onConsultar = async () => {
    // Datos nuevos: el umbral vuelve al sugerido (percentil 20) de esa zona.
    if (await consultar(zonaId)) setUmbral(null)
  }

  return (
    <main className="mx-auto max-w-4xl space-y-10 p-6">
      <Encabezado />
      <ZonaSelector
        zonaId={zonaId}
        onZona={setZonaId}
        onConsultar={onConsultar}
        loading={loading}
        error={error}
        cargado={datos && !error ? { zona: datos.zona, origen: datos.origen } : null}
      />
      {datos && analisis && (
        <TarjetasClima
          zona={datos.zona}
          escenario={escenario}
          onEscenario={setEscenario}
          clima={analisis.clima}
          error={analisis.error ? t(`errores.${analisis.error}`) : null}
        />
      )}
      {analisis?.clima && <Prioridades prioridades={prioridades} onChange={setPrioridades} />}
      {analisis?.clima && <Rotaciones rotaciones={rotaciones} />}
      {climaTodas && umbralEfectivo !== null && (
        <BacktestSeguro clima={climaTodas} umbral={umbralEfectivo} onUmbral={setUmbral} />
      )}
      {datos && <PolizaFuji />}
      <footer className="border-t pt-4 text-xs text-gray-500">{t('pie')}</footer>
    </main>
  )
}
