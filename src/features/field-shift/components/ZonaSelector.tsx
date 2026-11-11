'use client'

import { useTranslations } from 'next-intl'
import { ZONAS, esZonaId } from '../services/cultivos'
import type { OrigenDatos, ZonaId } from '../types'

interface Props {
  zonaId: ZonaId
  onZona: (zona: ZonaId) => void
  onConsultar: () => void
  loading: boolean
  error: string | null
  /** Zona y origen de los datos cargados, si los hay */
  cargado: { zona: ZonaId; origen: OrigenDatos } | null
}

type T = ReturnType<typeof useTranslations<'fieldShift'>>

function textoEstado(t: T, loading: boolean, error: string | null, cargado: Props['cargado']): string {
  if (loading) return t('cargando')
  if (error) return t('errorDatos')
  if (cargado) return t('listo', { zona: t(`zonas.${cargado.zona}`), origen: t(`origen.${cargado.origen}`) })
  return ''
}

export function ZonaSelector({ zonaId, onZona, onConsultar, loading, error, cargado }: Props) {
  const t = useTranslations('fieldShift')

  const estado = textoEstado(t, loading, error, cargado)

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{t('zona.titulo')}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="fs-zona" className="sr-only">
          {t('zona.label')}
        </label>
        <select
          id="fs-zona"
          data-testid="fs-zona"
          value={zonaId}
          onChange={(e) => {
            if (esZonaId(e.target.value)) onZona(e.target.value)
          }}
          className="rounded-md border border-gray-300 bg-white px-3 py-2"
        >
          {ZONAS.map((z) => (
            <option key={z.id} value={z.id}>
              {t(`zonas.${z.id}`)}
            </option>
          ))}
        </select>
        <button
          type="button"
          data-testid="fs-consultar"
          onClick={onConsultar}
          disabled={loading}
          className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {t('consultar')}
        </button>
      </div>
      <p className="text-sm text-gray-600">{t('zona.nota')}</p>
      <p
        data-testid="fs-estado"
        aria-live="polite"
        className={`text-sm ${error ? 'text-red-700' : 'text-gray-800'}`}
      >
        {estado}
      </p>
    </section>
  )
}
