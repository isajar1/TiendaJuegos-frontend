import { expect, test } from '@playwright/test'

test('el usuario puede cambiar entre inicio de sesión y registro', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Regístrate' }).click()
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible()
  await page.getByRole('button', { name: 'Inicia sesión' }).click()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
})
