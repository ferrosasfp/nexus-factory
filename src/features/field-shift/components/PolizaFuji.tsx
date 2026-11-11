'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { avalancheFuji } from 'viem/chains'
import { ConnectWallet } from '@/features/wallet/components'
import { useWallet } from '@/features/wallet/hooks/useWallet'
import { useNetwork } from '@/features/wallet/hooks/useNetwork'
import { usePoliza } from '../hooks/usePoliza'
import { FIELD_SHIFT_CONTRACT } from '../services/config'

type Accion = 'comprar' | 'reclamar'

const ACCIONES: readonly Accion[] = ['comprar', 'reclamar']

const BOTON = 'rounded-md px-4 py-2 font-medium disabled:opacity-50'

/** Capa opcional: póliza paramétrica en Avalanche Fuji (contrato educativo, no auditado). */
export function PolizaFuji() {
  const t = useTranslations('fieldShift')
  const { isConnected, chain } = useWallet()
  const { switchToDefault } = useNetwork()
  const poliza = usePoliza()

  return (
    <section className="space-y-3 rounded-lg border border-dashed border-gray-300 p-4">
      <h2 className="text-xl font-semibold">{t('poliza.titulo')}</h2>
      <p className="text-sm text-gray-700">{t('poliza.descripcion')}</p>
      <p className="text-sm text-gray-700">{t('poliza.opcional')}</p>
      <ConnectWallet />
      {isConnected && chain?.id !== avalancheFuji.id && (
        <div role="alert" className="space-y-2 text-sm">
          <p>{t('poliza.redIncorrecta')}</p>
          <button type="button" onClick={switchToDefault} className={`${BOTON} border border-gray-300`}>
            {t('poliza.cambiarRed')}
          </button>
        </div>
      )}
      {isConnected && chain?.id === avalancheFuji.id && FIELD_SHIFT_CONTRACT && <PanelPoliza poliza={poliza} />}
    </section>
  )
}

type Poliza = ReturnType<typeof usePoliza>

function InfoZona({ poliza }: { poliza: Poliza }) {
  const t = useTranslations('fieldShift')
  const { zona, primas } = poliza
  if (!zona || !primas) return <p className="text-sm text-gray-600">{t('poliza.cargando')}</p>
  return (
    <ul className="space-y-1 text-sm">
      <li>{t('poliza.zona', { nombre: zona.nombre, umbral: zona.umbral.toFixed(3) })}</li>
      <li>{t('poliza.cobertura', { monto: zona.cobertura })}</li>
      <li>{t('poliza.prima', { monto: primas.sinRotacion })}</li>
      <li>{t('poliza.primaRotacion', { monto: primas.conRotacion })}</li>
      <li>
        {zona.reportada
          ? t('poliza.indiceReportado', {
              indice: zona.indice.toFixed(3),
              resultado: t(zona.disparada ? 'poliza.resultadoPaga' : 'poliza.resultadoNoPaga'),
            })
          : t('poliza.sinIndice')}
      </li>
      {poliza.tienePoliza && <li>{t('poliza.tienePoliza')}</li>}
    </ul>
  )
}

interface ResumenProps {
  texto: string
  onConfirmar: () => void
  onCancelar: () => void
}

function ResumenAccion({ texto, onConfirmar, onCancelar }: ResumenProps) {
  const t = useTranslations('fieldShift')
  return (
    <div data-testid="fs-poliza-resumen" className="space-y-2 rounded-md bg-gray-50 p-3 text-sm">
      <p>{texto}</p>
      <div className="flex gap-2">
        <button type="button" onClick={onConfirmar} className={`${BOTON} bg-emerald-700 text-white`}>
          {t('poliza.confirmar')}
        </button>
        <button type="button" onClick={onCancelar} className={`${BOTON} border border-gray-300`}>
          {t('poliza.cancelar')}
        </button>
      </div>
    </div>
  )
}

function PanelPoliza({ poliza }: { poliza: Poliza }) {
  const t = useTranslations('fieldShift')
  const [adopto, setAdopto] = useState(true)
  const [accion, setAccion] = useState<Accion | null>(null)
  const { zona, primas } = poliza

  const confirmar = async () => {
    const elegida = accion
    setAccion(null)
    if (elegida === 'comprar') await poliza.comprar(adopto)
    if (elegida === 'reclamar') await poliza.reclamar()
  }

  const resumen = () => {
    if (!zona || !primas || !accion) return ''
    return accion === 'comprar'
      ? t('poliza.resumenCompra', { monto: adopto ? primas.conRotacion : primas.sinRotacion, zona: zona.nombre })
      : t('poliza.resumenReclamo', { monto: zona.cobertura, zona: zona.nombre })
  }

  return (
    <div data-testid="fs-poliza" className="space-y-3">
      <p role="note" className="rounded-md border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-900">
        {t('poliza.avisoNoAuditado')}
      </p>
      <InfoZona poliza={poliza} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={adopto} onChange={(e) => setAdopto(e.target.checked)} />
        {t('poliza.adopto')}
      </label>
      <div className="flex flex-wrap gap-3">
        {ACCIONES.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAccion(a)}
            disabled={!zona || poliza.pendiente}
            className={`${BOTON} ${a === 'comprar' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'border border-gray-300'}`}
          >
            {t(`poliza.${a}`)}
          </button>
        ))}
      </div>
      {accion && (
        <ResumenAccion texto={resumen()} onConfirmar={confirmar} onCancelar={() => setAccion(null)} />
      )}
      <EstadoTx poliza={poliza} />
    </div>
  )
}

function EstadoTx({ poliza }: { poliza: Poliza }) {
  const t = useTranslations('fieldShift')
  return (
    <div aria-live="polite" className="text-sm">
      {poliza.pendiente && <p>{t('poliza.confirmaWallet')}</p>}
      {poliza.error && <p className="text-red-700">{poliza.error}</p>}
      {poliza.hash && (
        <p>
          {t('poliza.exito')}{' '}
          <a
            href={`${avalancheFuji.blockExplorers.default.url}/tx/${poliza.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline"
          >
            {t('poliza.verTx')}
          </a>
        </p>
      )}
    </div>
  )
}
