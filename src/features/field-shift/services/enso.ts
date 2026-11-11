// Campañas con El Niño y La Niña, identificadas por el año en que empiezan
// (2015 = campaña 2015-16).
//
// Fuente: Índice Oceánico de El Niño relativo (RONI) de NOAA CPC, el índice oficial
// de monitoreo desde 2026, en la lista de Golden Gate Weather Services:
// https://ggweather.com/enso/roni.htm
//
// Mide el Pacífico central (región Niño 3.4). Para la sierra sur del Perú es el que
// más importa: Senamhi asocia la mayoría de sus sequías severas a calentamientos en esa
// zona. El Perú también vigila el "Niño costero" (región Niño 1+2), que pega más en
// la costa norte.
//
// La campaña 2026-27 viene con El Niño: ENFEN lo califica de "muy fuerte" en el Pacífico
// central y de magnitud "extraordinaria" frente a la costa (comunicado N.° 19-2026).
// Port exacto de web/enso.js.

import type { Fase } from '../types'

export const EL_NINO: readonly number[] = [2002, 2004, 2006, 2009, 2014, 2015, 2018, 2023]
export const LA_NINA: readonly number[] = [2005, 2007, 2008, 2010, 2011, 2016, 2017, 2020, 2021, 2022, 2024]

export function fase(inicioCampania: number): Fase {
  if (EL_NINO.includes(inicioCampania)) return 'nino'
  if (LA_NINA.includes(inicioCampania)) return 'nina'
  return 'neutro'
}
