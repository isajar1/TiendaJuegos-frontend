import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  actualizarCupon,
  actualizarJuego,
  agregarAlCarrito,
  agregarDeseo,
  aplicarCupon,
  autenticar,
  borrarResena,
  cambiarEstadoOrden,
  cargarClaves,
  crearAdministrador,
  crearCategoria,
  crearCupon,
  crearJuego,
  crearPlataforma,
  crearResena,
  desactivarJuego,
  listarCategorias,
  listarCupones,
  listarDeseos,
  listarJuegos,
  listarMisOrdenes,
  listarOrdenes,
  listarPlataformas,
  listarResenas,
  obtenerCarrito,
  obtenerJuego,
  obtenerMiOrden,
  obtenerOrden,
  pagar,
  quitarDelCarrito,
  quitarDeseo,
  reporteClientes,
  reporteVentas,
  vaciarCarrito,
} from './api'

type Llamada = { url: string; method: string; headers: Record<string, string>; body?: string }

let estado: number
let cuerpo: unknown
let falloRed: boolean
let llamadas: Llamada[]

function tokenValido(): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  return `header.${payload.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}.firma`
}

async function verificar(
  accion: () => Promise<unknown>,
  method: string,
  path: string,
  respuesta: unknown = { ok: true },
) {
  estado = 200
  cuerpo = respuesta
  llamadas = []
  await accion()
  expect(llamadas).toHaveLength(1)
  expect(llamadas[0].method).toBe(method)
  expect(llamadas[0].url).toBe(path)
}

describe('servicio API', () => {
  beforeEach(() => {
    localStorage.setItem(
      'tienda-juegos.session',
      JSON.stringify({
        id: 1,
        nombre: 'Ana',
        correo: 'ana@correo.com',
        rol: 'cliente',
        token: tokenValido(),
      }),
    )
    estado = 200
    cuerpo = { ok: true }
    falloRed = false
    llamadas = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
        if (falloRed) throw new Error('sin conexión')
        llamadas.push({
          url: String(entrada),
          method: (init?.method ?? 'GET').toUpperCase(),
          headers: (init?.headers ?? {}) as Record<string, string>,
          body: init?.body ? String(init.body) : undefined,
        })
        return {
          ok: estado >= 200 && estado < 300,
          status: estado,
          text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
        }
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('autentica y traduce errores de credenciales y correo duplicado', async () => {
    cuerpo = { id: 1, token: tokenValido() }
    const sesion = await autenticar('login', { correo: 'ana@correo.com', contrasena: '12345678' })
    expect(sesion.id).toBe(1)
    expect(llamadas[0].url).toContain('/api/auth/login')
    expect(llamadas[0].body).toContain('12345678')

    estado = 401
    await expect(autenticar('login', {})).rejects.toThrow(/correo o contraseña incorrectos/i)
    estado = 409
    await expect(autenticar('register', {})).rejects.toThrow(/ya tiene una cuenta/i)
  })

  it('usa el mensaje del servidor y mensajes por defecto según el estado', async () => {
    estado = 404
    cuerpo = { message: 'Juego no encontrado' }
    await expect(obtenerJuego(99)).rejects.toMatchObject({ status: 404, message: 'Juego no encontrado' })

    estado = 400
    cuerpo = {}
    await expect(obtenerJuego(99)).rejects.toThrow(/revisa los datos/i)
    estado = 403
    await expect(obtenerJuego(99)).rejects.toThrow(/no tienes permiso/i)
    estado = 500
    await expect(obtenerJuego(99)).rejects.toThrow(/no pudimos completar/i)

    falloRed = true
    await expect(obtenerJuego(99)).rejects.toThrow(/no se pudo conectar/i)
  })

  it('construye la consulta del catálogo solo con filtros con valor', async () => {
    await listarJuegos({ q: '  nave  ', categoria: '', plataforma: ' PC ', region: '  ' })
    expect(llamadas[0].url).toBe('/api/juegos?q=nave&plataforma=PC')
    await listarJuegos({ q: '', categoria: '', plataforma: '', region: '' })
    expect(llamadas[1].url).toBe('/api/juegos')
  })

  it('envía la cabecera Bearer y el cuerpo JSON cuando corresponde', async () => {
    await agregarAlCarrito(5)
    expect(llamadas[0].headers.Authorization).toContain('Bearer ')
    expect(llamadas[0].headers['Content-Type']).toBe('application/json')
    expect(llamadas[0].body).toBe('{"juegoId":5}')
    await vaciarCarrito()
    expect(llamadas[1].body).toBeUndefined()
  })

  it('expone las rutas del catálogo y administración', async () => {
    await verificar(() => listarJuegos({ q: '', categoria: '', plataforma: '', region: '' }), 'GET', '/api/juegos', [])
    await verificar(() => obtenerJuego(1), 'GET', '/api/juegos/1')
    await verificar(() => crearJuego({ titulo: 'A', descripcion: '', precio: '1', region: 'Global', plataformaId: '1', categoriaId: '1' }), 'POST', '/api/juegos')
    await verificar(() => actualizarJuego(1, { titulo: 'A', descripcion: '', precio: '1', region: 'Global', plataformaId: '1', categoriaId: '1' }), 'PUT', '/api/juegos/1')
    await verificar(() => desactivarJuego(1), 'DELETE', '/api/juegos/1', undefined)
    await verificar(() => cargarClaves(1, ['ABC']), 'POST', '/api/juegos/1/claves')
    await verificar(() => listarCategorias(), 'GET', '/api/categorias', [])
    await verificar(() => crearCategoria('Aventura'), 'POST', '/api/categorias')
    await verificar(() => listarPlataformas(), 'GET', '/api/plataformas', [])
    await verificar(() => crearPlataforma('PC'), 'POST', '/api/plataformas')
  })

  it('envía el alta de administrador a la ruta protegida', async () => {
    cuerpo = { id: 3, nombre: 'Nuevo', correo: 'nuevo@mail.com', rol: 'admin' }
    await verificar(
      () => crearAdministrador({ nombre: 'Nuevo', correo: 'nuevo@mail.com', contrasena: 'password123' }),
      'POST',
      '/api/admin/usuarios/administradores',
    )
    expect(llamadas[0].body).toBe('{"nombre":"Nuevo","correo":"nuevo@mail.com","contrasena":"password123"}')
    expect(llamadas[0].headers.Authorization).toContain('Bearer ')
  })

  it('expone las rutas de carrito, pago, cupones y órdenes', async () => {
    await verificar(() => listarCupones(), 'GET', '/api/cupones', [])
    await verificar(() => crearCupon({ codigo: 'A', porcentajeDescuento: '10', fechaExpiracion: '2030-01-01' }), 'POST', '/api/cupones')
    await verificar(() => actualizarCupon(1, false), 'PUT', '/api/cupones/1')
    await verificar(() => obtenerCarrito(), 'GET', '/api/carrito')
    await verificar(() => quitarDelCarrito(2), 'DELETE', '/api/carrito/items/2')
    await verificar(() => aplicarCupon('BIENVENIDO10'), 'POST', '/api/carrito/cupon')
    await verificar(() => pagar(false), 'POST', '/api/checkout/pagar')
    await verificar(() => listarMisOrdenes(), 'GET', '/api/ordenes/mias', [])
    await verificar(() => obtenerMiOrden(1), 'GET', '/api/ordenes/mias/1')
    await verificar(() => listarOrdenes(), 'GET', '/api/ordenes', [])
    await verificar(() => obtenerOrden(1), 'GET', '/api/ordenes/1')
    await verificar(() => cambiarEstadoOrden(1, 'pagado'), 'PUT', '/api/ordenes/1/estado')
  })

  it('expone reseñas, deseos y reportes', async () => {
    await verificar(() => listarResenas(1), 'GET', '/api/juegos/1/resenas', [])
    await verificar(() => crearResena(1, 4, 'Bien'), 'POST', '/api/juegos/1/resenas')
    await verificar(() => borrarResena(3), 'DELETE', '/api/resenas/3', undefined)
    await verificar(() => listarDeseos(), 'GET', '/api/deseos', [])
    await verificar(() => agregarDeseo(1), 'POST', '/api/deseos')
    await verificar(() => quitarDeseo(1), 'DELETE', '/api/deseos/1', [])
    await verificar(() => reporteVentas('2026-01-01', '2026-01-31'), 'GET', '/api/reportes/ventas-juegos?desde=2026-01-01&hasta=2026-01-31', [])
    await verificar(() => reporteClientes('2026-01-01', '2026-01-31'), 'GET', '/api/reportes/compras-clientes?desde=2026-01-01&hasta=2026-01-31', [])
  })

  it('ApiError conserva el código de estado', () => {
    const error = new ApiError('Fallo', 409)
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ApiError')
    expect(error.status).toBe(409)
  })
})
