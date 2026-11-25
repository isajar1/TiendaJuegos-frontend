import { randomUUID } from 'node:crypto'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

const admin = { correo: 'admin@example.test', contrasena: 'TiendaDemo21!' }
const cuentaNueva = () => ({
  nombre: 'Cliente de prueba',
  correo: `cliente-${randomUUID()}@example.test`,
  contrasena: 'ClienteDemo21!',
})

async function prepararCliente(request: APIRequestContext) {
  const cuenta = cuentaNueva()
  const alta = await request.post('/api/auth/register', { data: cuenta })
  expect(alta.status()).toBe(201)
  return cuenta
}

async function entrar(page: Page, cuenta: typeof admin) {
  await page.goto('/')
  await page.getByLabel('Correo electrónico').fill(cuenta.correo)
  await page.getByLabel('Contraseña').fill(cuenta.contrasena)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function panelAdmin(page: Page) {
  await entrar(page, admin)
  await page.getByRole('button', { name: 'Admin', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Nuevo juego' })).toBeVisible()
}

// Los datos se preparan por API. La acción que comprueba cada caso se hace en el navegador.
async function prepararJuego(request: APIRequestContext) {
  const sesion = await request.post('/api/auth/login', { data: admin })
  expect(sesion.ok()).toBeTruthy()
  const headers = { Authorization: 'Bearer ' + (await sesion.json()).token }
  const titulo = 'Juego E2E ' + randomUUID().slice(0, 8)
  const alta = await request.post('/api/juegos', {
    headers,
    data: { titulo, descripcion: 'Juego de prueba', precio: 60, region: 'Global', plataformaId: 1, categoriaId: 1 },
  })
  expect(alta.status()).toBe(201)
  const juego = await alta.json()
  const clave = 'DEMO-' + randomUUID()
  const stock = await request.post(`/api/juegos/${juego.id}/claves`, { headers, data: { claves: [clave] } })
  expect(stock.status()).toBe(201)
  return { titulo, clave }
}

function tarjeta(page: Page, titulo: string) {
  return page.getByRole('article').filter({ has: page.getByRole('heading', { name: titulo, exact: true }) })
}

async function carritoConJuego(page: Page, request: APIRequestContext) {
  const juego = await prepararJuego(request)
  await entrar(page, await prepararCliente(request))
  await tarjeta(page, juego.titulo).getByRole('button', { name: /Añadir/ }).click()
  await page.getByRole('button', { name: /Carrito\s*1/ }).click()
  await expect(page.getByRole('heading', { name: juego.titulo })).toBeVisible()
  await expect(page.locator('.summary-total dd')).toHaveText(/\$\s*60$/)
  return juego
}

test('01 HU-01 | Registro de un cliente nuevo', async ({ page }) => {
  const cuenta = cuentaNueva()
  await page.goto('/')
  await page.getByRole('button', { name: 'Regístrate' }).click()
  await page.getByLabel('Nombre completo').fill(cuenta.nombre)
  await page.getByLabel('Correo electrónico').fill(cuenta.correo)
  await page.getByLabel('Contraseña').fill(cuenta.contrasena)
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page.getByRole('heading', { name: 'Catálogo de juegos' })).toBeVisible()
  await expect(page.locator('.user-chip')).toContainText(cuenta.nombre)
  await expect(page.getByRole('button', { name: 'Admin', exact: true })).toHaveCount(0)
})

test('02 HU-02 | Login con credenciales correctas', async ({ page, request }) => {
  const cuenta = await prepararCliente(request)
  await entrar(page, cuenta)
  await expect(page.locator('.user-chip')).toContainText(cuenta.nombre)
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
})

test('03 HU-02 | Negativo: contraseña incorrecta', async ({ page, request }) => {
  const cuenta = await prepararCliente(request)
  await entrar(page, { ...cuenta, contrasena: 'OtraClave123!' })
  await expect(page.getByRole('alert')).toContainText(/incorrect/i)
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(0)
})

test('04 HU-04 | Listar juegos activos con sus datos', async ({ page, request }) => {
  const juego = await prepararJuego(request)
  await page.goto('/')
  await page.getByRole('button', { name: 'Ver catálogo' }).click()
  const ficha = tarjeta(page, juego.titulo)
  await expect(ficha).toContainText(/\$\s*60/)
  await expect(ficha).toContainText('PC')
  await expect(ficha).toContainText('Global')
})

test('05 HU-08 | Crear un juego desde administración', async ({ page }) => {
  await panelAdmin(page)
  const titulo = 'Alta E2E ' + randomUUID().slice(0, 8)
  await page.getByLabel('Título', { exact: true }).fill(titulo)
  await page.getByLabel('Descripción').fill('Juego creado desde el formulario')
  await page.getByLabel('Precio', { exact: true }).fill('75')
  await page.getByLabel('Plataforma', { exact: true }).selectOption({ label: 'PC' })
  await page.getByLabel('Categoría', { exact: true }).selectOption({ label: 'Aventura' })
  await page.getByRole('button', { name: 'Crear juego' }).click()
  await expect(page.getByRole('row').filter({ hasText: titulo })).toContainText(/\$\s*75/)
  await page.getByRole('button', { name: 'Catálogo', exact: true }).click()
  await expect(tarjeta(page, titulo)).toBeVisible()
})

test('06 HU-08 | Editar el precio y comprobarlo en el catálogo', async ({ page, request }) => {
  const juego = await prepararJuego(request)
  await panelAdmin(page)
  await page.getByRole('row').filter({ hasText: juego.titulo }).getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Precio', { exact: true }).fill('85')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByRole('row').filter({ hasText: juego.titulo })).toContainText(/\$\s*85/)
  await page.reload()
  await expect(tarjeta(page, juego.titulo)).toContainText(/\$\s*85/)
})

test('07 HU-08 y HU-04 | Desactivar un juego y retirarlo del catálogo', async ({ page, request }) => {
  const juego = await prepararJuego(request)
  const referencia = await prepararJuego(request)
  await panelAdmin(page)
  await page.getByRole('row').filter({ hasText: juego.titulo }).getByRole('button', { name: 'Desactivar' }).click()
  await expect(page.getByText('Juego desactivado.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(tarjeta(page, referencia.titulo)).toBeVisible()
  await expect(tarjeta(page, juego.titulo)).toHaveCount(0)
})

test('08 HU-12 | Agregar al carrito, recargar y quitar', async ({ page, request }) => {
  const juego = await carritoConJuego(page, request)
  await page.reload()
  await page.getByRole('button', { name: /Carrito\s*1/ }).click()
  await expect(page.getByRole('heading', { name: juego.titulo })).toBeVisible()
  await expect(page.locator('.summary-total dd')).toHaveText(/\$\s*60$/)
  await page.getByRole('button', { name: 'Quitar ' + juego.titulo + ' del carrito' }).click()
  await expect(page.getByText('Tu carrito está vacío', { exact: true })).toBeVisible()
})

test('09 HU-14 | Pago aprobado y compra guardada en el historial', async ({ page, request }) => {
  const juego = await carritoConJuego(page, request)
  await page.getByRole('button', { name: 'Pagar ahora' }).click()
  await expect(page.getByText('COMPRA CONFIRMADA', { exact: true })).toBeVisible()
  await expect(page.locator('.key-list code')).toHaveText(juego.clave)
  await page.getByRole('button', { name: 'Historial' }).click()
  const orden = page.getByRole('button', { name: /Orden #.*pagado/i })
  await expect(orden).toContainText(/\$\s*60/)
  await orden.click()
  await expect(page.locator('.order-detail')).toContainText(juego.titulo)
})

test('10 HU-14 | Negativo: pago rechazado y carrito conservado', async ({ page, request }) => {
  const juego = await carritoConJuego(page, request)
  await page.getByRole('button', { name: 'Simular pago rechazado' }).click()
  await expect(page.getByText('PAGO NO APROBADO', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copiar' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Seguir comprando' }).click()
  await page.getByRole('button', { name: /Carrito\s*1/ }).click()
  await expect(page.getByRole('heading', { name: juego.titulo })).toBeVisible()
  await expect(page.locator('.summary-total dd')).toHaveText(/\$\s*60$/)
})
