// Traduce una Razon estructurada (de rotacion.ts) a texto con next-intl.
// Sirve con useTranslations('fieldShift') y con createTranslator({ namespace: 'fieldShift' }).

import type { CultivoId, Razon } from '../types'

/** Subconjunto del traductor de next-intl que usamos aquí (namespace fieldShift). */
export type Traductor = (key: string, values?: Record<string, string>) => string

function listaCultivos(t: Traductor, cultivos: readonly CultivoId[]): string {
  return cultivos.map((c) => t(`cultivos.${c}`)).join(t('conjuncion'))
}

// mm y pct van como string para que ICU no aplique separadores de miles por locale.
export function formatearRazon(t: Traductor, razon: Razon): string {
  switch (razon.clave) {
    case 'aguaCubre':
    case 'aguaParcial': {
      const { cultivo, mm, escenario } = razon.params
      return t(`razones.${razon.clave}`, {
        cultivo: t(`cultivos.${cultivo}`),
        mm: String(mm),
        cuando: t(`razones.cuando.${escenario}`),
        ...(razon.clave === 'aguaParcial' ? { pct: String(razon.params.pct) } : {}),
      })
    }
    case 'sequiaTolerantes':
      return t('razones.sequiaTolerantes', {
        pct: String(razon.params.pct),
        de: t(`razones.de.${razon.params.escenario}`),
        cultivos: listaCultivos(t, razon.params.cultivos),
      })
    case 'sequiaNinguno':
      return t('razones.sequiaNinguno', {
        pct: String(razon.params.pct),
        de: t(`razones.de.${razon.params.escenario}`),
      })
    case 'heladaSensibles':
    case 'heladaResistentes':
      return t(`razones.${razon.clave}`, {
        pct: String(razon.params.pct),
        cultivos: listaCultivos(t, razon.params.cultivos),
      })
    default:
      return t(`razones.${razon.clave}`)
  }
}
