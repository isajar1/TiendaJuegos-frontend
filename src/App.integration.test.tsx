import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Carrito, Deseo, Juego, Orden, Sesion } from './types'

const CLAVE_SESION = 'tienda-juegos.session'

type Llamada = { url: string; method: string; body?: unknown }
type RespuestaSimulada = { ok: boolean; status: number; text: () => Promise<string> }

const JUEGOS: Juego[] = [
  {
    id: 1,
    titulo: 'Aventura',
    descripcion: 'Explora mundos nuevos.',
    precio: 100000,
    region: 'Global',
    plataforma: 'PC',
    categoria: 'Aventura',
    activo: true,
    clavesDisponibles: 3,
    calificacionPromedio: 4.5,
    totalResenas: 1,
  },
  {
    id: 2,
    titulo: 'Estrategia',
    descripcion: 'Conquista tu reino.',
    precio: 80000,
    region: 'Global',
    plataforma: 'PC',
    categoria: 'Estrategia',
    activo: true,
    clavesDisponibles: 2,
  },
]
const CATEGORIAS = [
  { id: 1, nombre: 'Aventura' },
  { id: 2, nombre: 'Estrategia' },
]
const PLATAFORMAS = [{ id: 1, nombre: 'PC' }]
const CUPON = {
  id: 1,
  codigo: 'BIENVENIDO10',
  porcentajeDescuento: 10,
  fechaExpiracion: '2030-12-31',
  activo: true,
}
const RESENAS = [
  {
    id: 7,
    juegoId: 1,
    usuarioId: 1,
    nombreUsuario: 'Ana',
    calificacion: 5,
    comentario: 'Excelente aventura.',
    fecha: '2026-01-02T10:00:00',
  },
]
const VENTAS = [{ juegoId: 1, titulo: 'Aventura', unidades: 2, ingresos: 180000 }]
const CLIENTES = [{ usuarioId: 1, nombre: 'Ana', ordenes: 1, total: 90000 }]

const CARRITO_LLENO: Carrito = {
  items: [{ juegoId: 1, titulo: 'Aventura', precio: 100000 }],
  subtotal: 100000,
  descuento: 0,
  total: 100000,
  cupon: null,
}
const CARRITO_VACIO: Carrito = { items: [], subtotal: 0, descuento: 0, total: 0, cupon: null }
const DESEOS_INICIALES: Deseo[] = [{ juegoId: 2, titulo: 'Estrategia', precio: 80000 }]

function tokenValido(): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  return `header.${payload.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}.firma`
}

function sesionDePrueba(rol = 'cliente'): Sesion {
  return {
    id: 1,
    nombre: 'Ana',
    correo: 'ana@correo.com',
    rol,
    token: tokenValido(),
  }
}

function establecerSesion(rol = 'cliente') {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionDePrueba(rol)))
}

function respuesta(body: unknown, status = 200): RespuestaSimulada {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

let llamadas: Llamada[]
let juegos: Juego[]
let cupones: typeof CUPON[]
let carrito: Carrito
let deseos: Deseo[]
let ordenes: Orden[]

function instalarFetch() {
  llamadas = []
  juegos = [...JUEGOS]
  cupones = [{ ...CUPON }]
  carrito = { ...CARRITO_LLENO, items: [...CARRITO_LLENO.items] }
  deseos = [...DESEOS_INICIALES]
  ordenes = [
    {
      id: 10,
      fechaCreacion: '2026-01-01T10:00:00',
      total: 90000,
      estadoPago: 'pagado',
      cupon: 'BIENVENIDO10',
      items: [
        { juegoId: 1, titulo: 'Aventura', precioUnitario: 90000, clave: 'CLAVE-123' },
      ],
    },
  ]

  const fetchSimulado = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(entrada), 'http://localhost')
    const ruta = url.pathname
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined
    llamadas.push({ url: `${ruta}${url.search}`, method, body })

    if (ruta === '/api/auth/login' || ruta === '/api/auth/register') {
      return respuesta({ ...sesionDePrueba(), token: tokenValido() }, ruta.endsWith('register') ? 201 : 200)
    }
    if (ruta === '/api/juegos' && method === 'GET') return respuesta(juegos)
    if (ruta === '/api/juegos' && method === 'POST') {
      const creado: Juego = {
        id: 3,
        titulo: String(body?.titulo ?? 'Nuevo'),
        descripcion: String(body?.descripcion ?? ''),
        precio: Number(body?.precio ?? 0),
        region: String(body?.region ?? 'Global'),
        plataforma: PLATAFORMAS[0].nombre,
        categoria: CATEGORIAS[0].nombre,
        activo: true,
        clavesDisponibles: 0,
      }
      juegos = [...juegos, creado]
      return respuesta(creado, 201)
    }
    if (ruta === '/api/categorias') return respuesta(CATEGORIAS)
    if (ruta === '/api/plataformas') return respuesta(PLATAFORMAS)
    if (ruta === '/api/juegos/1/resenas' && method === 'GET') return respuesta(RESENAS)
    if (ruta === '/api/juegos/1/resenas' && method === 'POST') {
      return respuesta(
        {
          id: 8,
          juegoId: 1,
          usuarioId: 1,
          nombreUsuario: 'Ana',
          calificacion: Number(body?.calificacion ?? 5),
          comentario: String(body?.comentario ?? ''),
          fecha: '2026-01-03T10:00:00',
        },
        201,
      )
    }
    if (ruta === '/api/resenas/7' && method === 'DELETE') return respuesta(undefined, 204)
    if (ruta === '/api/juegos/1/claves' && method === 'POST') return respuesta({ creadas: 2 }, 201)
    if (/^\/api\/juegos\/\d+$/.test(ruta)) {
      if (method === 'GET') return respuesta(juegos[0])
      if (method === 'PUT') return respuesta({ ...juegos[0], titulo: String(body?.titulo ?? juegos[0].titulo) })
      return respuesta(undefined, 204)
    }
    if (ruta === '/api/cupones' && method === 'GET') return respuesta(cupones)
    if (ruta === '/api/cupones' && method === 'POST') {
      return respuesta({ ...CUPON, codigo: String(body?.codigo ?? 'NUEVO') }, 201)
    }
    if (/^\/api\/cupones\/\d+$/.test(ruta) && method === 'PUT') {
      cupones = cupones.map((cupon) => ({ ...cupon, activo: Boolean(body?.activo) }))
      return respuesta(cupones[0])
    }
    if (ruta === '/api/carrito' && method === 'GET') return respuesta(carrito)
    if (ruta === '/api/carrito' && method === 'DELETE') {
      carrito = { ...CARRITO_VACIO }
      return respuesta(undefined, 204)
    }
    if (ruta === '/api/carrito/items' && method === 'POST') return respuesta(carrito)
    if (ruta.startsWith('/api/carrito/items/') && method === 'DELETE') {
      carrito = { ...CARRITO_VACIO }
      return respuesta(carrito)
    }
    if (ruta === '/api/carrito/cupon' && method === 'POST') {
      carrito = { ...carrito, cupon: 'BIENVENIDO10', descuento: 10000, total: 90000 }
      return respuesta(carrito)
    }
    if (ruta === '/api/checkout/pagar' && method === 'POST') {
      const aprobado = body?.aprobar !== false
      const nuevaOrden: Orden = {
        id: 11,
        fechaCreacion: '2026-01-04T10:00:00',
        total: aprobado ? 90000 : 100000,
        estadoPago: aprobado ? 'pagado' : 'rechazado',
        cupon: aprobado ? 'BIENVENIDO10' : null,
        items: [
          {
            juegoId: 1,
            titulo: 'Aventura',
            precioUnitario: aprobado ? 90000 : 100000,
            clave: aprobado ? 'CLAVE-123' : '',
          },
        ],
      }
      ordenes = [nuevaOrden, ...ordenes]
      if (aprobado) carrito = { ...CARRITO_VACIO }
      return respuesta(nuevaOrden)
    }
    if (ruta === '/api/ordenes/mias' && method === 'GET') return respuesta(ordenes)
    if (ruta === '/api/ordenes' && method === 'GET') return respuesta(ordenes)
    if (/^\/api\/ordenes\/\d+\/estado$/.test(ruta) && method === 'PUT') {
      return respuesta({ ...ordenes[0], estadoPago: String(body?.estadoPago ?? 'pendiente') })
    }
    if (ruta === '/api/deseos' && method === 'GET') return respuesta(deseos)
    if (ruta === '/api/deseos' && method === 'POST') {
      deseos = [...deseos, { juegoId: 1, titulo: 'Aventura', precio: 100000 }]
      return respuesta(deseos, 201)
    }
    if (ruta.startsWith('/api/deseos/') && method === 'DELETE') {
      deseos = []
      return respuesta(deseos)
    }
    if (ruta === '/api/usuarios/mi-cuenta' && method === 'DELETE') return respuesta(undefined, 204)
    if (ruta === '/api/reportes/ventas-juegos') return respuesta(VENTAS)
    if (ruta === '/api/reportes/compras-clientes') return respuesta(CLIENTES)
    return respuesta({ message: 'Ruta no simulada' }, 404)
  })

  vi.stubGlobal('fetch', fetchSimulado)
  return fetchSimulado
}

function nav(): HTMLElement {
  return screen.getByRole('navigation', { name: /navegación principal/i })
}

async function abrirCarrito() {
  fireEvent.click(within(nav()).getByRole('button', { name: /carrito/i }))
  expect(await screen.findByRole('heading', { name: /carrito de compras/i })).toBeInTheDocument()
}

describe('App: flujos completos', () => {
  beforeEach(() => {
    localStorage.clear()
    instalarFetch()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('permite explorar el catálogo sin sesión, filtrar y ver reseñas', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /ver catálogo/i }))

    expect(await screen.findByRole('heading', { name: /catálogo de juegos/i })).toBeInTheDocument()
    expect(screen.getByText('Explora mundos nuevos.')).toBeInTheDocument()
    expect(screen.getByText(/puedes explorar el catálogo sin cuenta/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'Aventura' } })
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'Aventura' } })
    fireEvent.change(screen.getByLabelText('Plataforma'), { target: { value: 'PC' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => {
      expect(
        llamadas.some(
          (llamada) =>
            llamada.url.includes('q=Aventura') &&
            llamada.url.includes('categoria=Aventura') &&
            llamada.url.includes('plataforma=PC'),
        ),
      ).toBe(true)
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Detalles' })[0])
    expect(await screen.findByRole('heading', { name: 'Aventura' })).toBeInTheDocument()
    expect(await screen.findByText('Excelente aventura.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /inicia sesión/i }))
    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('agrega juegos al carrito y publica reseñas con sesión', async () => {
    establecerSesion()
    render(<App />)
    expect(await screen.findByRole('heading', { name: /catálogo de juegos/i })).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: /agregar .* a deseos/i })[0])
    await waitFor(() => {
      expect(llamadas.some((llamada) => llamada.url === '/api/deseos' && llamada.method === 'POST')).toBe(true)
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Detalles' })[0])
    fireEvent.click(screen.getByRole('button', { name: /añadir al carrito/i }))
    expect(await screen.findByText(/se agregó al carrito/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Calificación'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Comentario'), { target: { value: 'Muy divertido' } })
    fireEvent.click(screen.getByRole('button', { name: /publicar reseña/i }))
    expect(await screen.findByText('Tu reseña ya está publicada.')).toBeInTheDocument()
    expect(llamadas.some((llamada) => llamada.url === '/api/juegos/1/resenas' && llamada.method === 'POST')).toBe(true)
  })

  it('aplica un cupón, rechaza un pago y luego confirma la compra con claves', async () => {
    establecerSesion()
    render(<App />)
    await abrirCarrito()

    expect(screen.getByText('Aventura')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Cupón'), { target: { value: 'BIENVENIDO10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect((await screen.findAllByText(/cupón BIENVENIDO10 aplicado/i)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/10\.000/).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /simular pago rechazado/i }))
    expect(await screen.findByRole('heading', { name: /transacción no fue aprobada/i })).toBeInTheDocument()
    expect(screen.queryByText('CLAVE-123')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /seguir comprando/i }))
    await abrirCarrito()
    fireEvent.click(screen.getByRole('button', { name: /pagar ahora/i }))
    expect(await screen.findByRole('heading', { name: /claves están listas/i })).toBeInTheDocument()
    expect(screen.getByText('CLAVE-123')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /seguir comprando/i }))
    await abrirCarrito()
    expect(screen.getByText(/carrito está vacío/i)).toBeInTheDocument()
  })

  it('gestiona deseos, vacía el carrito y consulta el historial', async () => {
    establecerSesion()
    render(<App />)
    await abrirCarrito()
    fireEvent.click(screen.getByRole('button', { name: /vaciar carrito/i }))
    expect(await screen.findByText(/carrito está vacío/i)).toBeInTheDocument()

    fireEvent.click(within(nav()).getByRole('button', { name: /deseos/i }))
    expect(await screen.findByRole('heading', { name: /mi lista de deseos/i })).toBeInTheDocument()
    expect(screen.getByText('Estrategia')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /añadir al carrito/i }))
    expect(await screen.findByText(/juego agregado al carrito/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /quitar Estrategia de deseos/i }))
    expect(await screen.findByText(/no tienes juegos guardados/i)).toBeInTheDocument()

    fireEvent.click(within(nav()).getByRole('button', { name: /historial/i }))
    expect(await screen.findByRole('heading', { name: /historial de compras/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /orden #10/i }))
    expect(await screen.findByText('CLAVE-123')).toBeInTheDocument()
    expect(screen.getByText(/cupón aplicado/i)).toBeInTheDocument()
  })

  it('administra juegos, claves, cupones, órdenes y reportes', async () => {
    establecerSesion('admin')
    render(<App />)
    fireEvent.click(within(nav()).getByRole('button', { name: /admin/i }))
    expect(await screen.findByRole('heading', { name: /administración/i })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nuevo juego' } })
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '55000' } })
    fireEvent.change(screen.getByLabelText('Plataforma'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear juego' }))
    expect(await screen.findByText('Juego creado correctamente.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Juego'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Claves (una por línea)'), {
      target: { value: 'ABC-123\nDEF-456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cargar claves' }))
    expect(await screen.findByText('2 clave(s) cargadas.')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    expect(await screen.findByRole('heading', { name: /editar juego/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Juego actualizado.')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Desactivar' })[0])
    expect(await screen.findByText('Juego desactivado.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Cupones' }))
    expect(await screen.findByText('BIENVENIDO10')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }))
    expect(await screen.findByText('Cupón desactivado.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Órdenes' }))
    expect(await screen.findByRole('heading', { name: /órdenes de la tienda/i })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'rechazado' } })
    expect(await screen.findByText('Estado actualizado.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Reportes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Generar reportes' }))
    expect(await screen.findByText('Reportes actualizados.')).toBeInTheDocument()
    expect(screen.getAllByText('Aventura').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ana').length).toBeGreaterThan(1)
  })

  it('cierra la sesión y vuelve a la pantalla de acceso', async () => {
    establecerSesion()
    render(<App />)
    expect(await screen.findByRole('heading', { name: /catálogo de juegos/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('abre el perfil desde el icono y cierra sesión desde allí', async () => {
    establecerSesion()
    render(<App />)
    expect(await screen.findByRole('heading', { name: /catálogo de juegos/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /perfil y configuración/i }))
    expect(await screen.findByRole('heading', { name: /mi perfil y configuración/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión de mi cuenta' }))
    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('elimina la cuenta solo después de confirmarlo', async () => {
    establecerSesion()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /perfil y configuración/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(llamadas.some((llamada) => llamada.url === '/api/usuarios/mi-cuenta')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    await waitFor(() =>
      expect(
        llamadas.some(
          (llamada) => llamada.url === '/api/usuarios/mi-cuenta' && llamada.method === 'DELETE',
        ),
      ).toBe(true),
    )
    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
    expect(await screen.findByText(/tu cuenta se eliminó correctamente/i)).toBeInTheDocument()
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('mantiene la sesión si falla la eliminación de la cuenta', async () => {
    establecerSesion()
    instalarFetch()
    vi.stubGlobal('fetch', vi.fn(async () => respuesta({ message: 'No se pudo eliminar la cuenta.' }, 500)))
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /perfil y configuración/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo eliminar la cuenta.')
    expect(localStorage.getItem(CLAVE_SESION)).not.toBeNull()
  })
})
