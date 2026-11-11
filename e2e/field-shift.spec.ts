import { test, expect } from '@playwright/test'

// Funciona con y sin internet (con FIELD_SHIFT_OFFLINE=true usa los snapshots):
// solo se asertan estructura y cambios, no números concretos.
test.describe('Field Shift (demo pública)', () => {
  test('flujo de 5 clics en /es/field-shift sin login', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/es/field-shift')
    await expect(page).toHaveURL(/\/es\/field-shift/)

    // Clic 1: zona + Consultar NASA
    await page.getByTestId('fs-zona').selectOption('carumas')
    // toPass: reintenta si el clic llegó antes de la hidratación de React
    await expect(async () => {
      await page.getByTestId('fs-consultar').click()
      await expect(page.getByTestId('fs-estado')).toContainText('Listo', { timeout: 10_000 })
    }).toPass({ timeout: 60_000 })

    // Clic 2: las 6 tarjetas del clima
    await expect(page.getByTestId('fs-tarjeta')).toHaveCount(6)
    for (const tarjeta of await page.getByTestId('fs-tarjeta').all()) await expect(tarjeta).toBeVisible()

    // Clic 3: escenario El Niño
    const primeraAntes = await page.getByTestId('fs-rotacion').first().textContent()
    await page.getByTestId('fs-escenario').selectOption('nino')
    await expect
      .poll(async () => {
        const primera = await page.getByTestId('fs-rotacion').first().textContent()
        const periodo = await page.getByTestId('fs-periodo').textContent()
        return primera !== primeraAntes || (periodo ?? '').includes('El Niño')
      })
      .toBe(true)

    // Clic 4: slider de prioridad
    await page.getByTestId('fs-prioridad-ingreso').fill('3')
    await expect(page.getByTestId('fs-prioridad-valor-ingreso')).toHaveText('3')
    await expect(page.getByTestId('fs-rotacion')).toHaveCount(3)

    // Clic 5: umbral del backtest
    const resumenAntes = await page.getByTestId('fs-backtest-resumen').textContent()
    await page.getByTestId('fs-umbral').fill('0.6')
    await expect(page.getByTestId('fs-backtest-resumen')).not.toHaveText(resumenAntes ?? '')
    await expect(page.locator('svg[role="img"] text').filter({ hasText: /^N$/ }).first()).toBeVisible()

    // Sin wallet no aparece el bloque de la póliza
    await expect(page.getByTestId('fs-poliza')).toHaveCount(0)
  })

  test('/en/field-shift está en inglés', async ({ page }) => {
    await page.goto('/en/field-shift')
    await expect(page).toHaveURL(/\/en\/field-shift/)
    await expect(page.getByTestId('fs-consultar')).toHaveText('Query NASA')
  })
})
