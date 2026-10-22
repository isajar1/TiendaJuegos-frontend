import { expect, test } from '@playwright/test'

test('el usuario puede ver la pagina principal de la tienda', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Tienda Juegos' })).toBeVisible()
})
