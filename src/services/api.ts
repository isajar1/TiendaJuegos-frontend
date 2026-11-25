import { leerSesion } from '../utils/session'
import type {
  AdminCreado,
  AdminForm,
  Carrito,
  CatalogoFiltros,
  Categoria,
  Cupon,
  CuponForm,
  Deseo,
  Juego,
  JuegoForm,
  Orden,
  Plataforma,
  ReporteCliente,
  ReporteVenta,
  Resena,
  Sesion,
} from '../types'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function mensajePorEstado(status: number): string {
  if (status === 400) return 'Revisa los datos enviados e inténtalo de nuevo.'
  if (status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  if (status === 403) return 'No tienes permiso para realizar esta acción.'
  if (status === 404) return 'No encontramos el recurso solicitado.'
  if (status === 409) return 'La operación entra en conflicto con un registro existente.'
  return 'No pudimos completar la solicitud. Inténtalo de nuevo.'
}

type Opciones = {
  method?: string
  body?: unknown
}

async function request<T>(path: string, opciones: Opciones = {}): Promise<T> {
  const sesion = leerSesion()
  const cabeceras: Record<string, string> = {}
  if (opciones.body !== undefined) cabeceras['Content-Type'] = 'application/json'
  if (sesion?.token) cabeceras.Authorization = `Bearer ${sesion.token}`

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${path}`, {
      method: opciones.method ?? 'GET',
      headers: cabeceras,
      body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Intenta de nuevo en un momento.', 0)
  }

  const texto = await respuesta.text()
  const datos = texto ? (JSON.parse(texto) as { message?: string }) : null
  if (!respuesta.ok) throw new ApiError(datos?.message ?? mensajePorEstado(respuesta.status), respuesta.status)
  return datos as T
}

function conQuery(path: string, filtros: Record<string, string>): string {
  const parametros = new URLSearchParams()
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor.trim()) parametros.set(clave, valor.trim())
  })
  const query = parametros.toString()
  return query ? `${path}?${query}` : path
}

export async function autenticar(
  modo: 'login' | 'register',
  payload: Record<string, string>,
): Promise<Sesion> {
  try {
    return await request<Sesion>(`/api/auth/${modo}`, { method: 'POST', body: payload })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new ApiError('Correo o contraseña incorrectos.', 401)
    }
    if (error instanceof ApiError && error.status === 409) {
      throw new ApiError('Este correo ya tiene una cuenta registrada.', 409)
    }
    throw error
  }
}

export const listarJuegos = (filtros: CatalogoFiltros) =>
  request<Juego[]>(conQuery('/api/juegos', filtros))

export const obtenerJuego = (id: number) => request<Juego>(`/api/juegos/${id}`)

export const crearJuego = (juego: JuegoForm) =>
  request<Juego>('/api/juegos', { method: 'POST', body: juego })

export const actualizarJuego = (id: number, juego: JuegoForm) =>
  request<Juego>(`/api/juegos/${id}`, { method: 'PUT', body: juego })

export const desactivarJuego = (id: number) =>
  request<null>(`/api/juegos/${id}`, { method: 'DELETE' })

export const cargarClaves = (id: number, claves: string[]) =>
  request<{ creadas: number }>(`/api/juegos/${id}/claves`, { method: 'POST', body: { claves } })

export const listarCategorias = () => request<Categoria[]>('/api/categorias')
export const crearCategoria = (nombre: string) =>
  request<Categoria>('/api/categorias', { method: 'POST', body: { nombre } })
export const listarPlataformas = () => request<Plataforma[]>('/api/plataformas')
export const crearPlataforma = (nombre: string) =>
  request<Plataforma>('/api/plataformas', { method: 'POST', body: { nombre } })

export const crearAdministrador = (admin: AdminForm) =>
  request<AdminCreado>('/api/admin/usuarios/administradores', { method: 'POST', body: admin })

export const listarCupones = () => request<Cupon[]>('/api/cupones')
export const crearCupon = (cupon: CuponForm) =>
  request<Cupon>('/api/cupones', { method: 'POST', body: cupon })
export const actualizarCupon = (id: number, activo: boolean) =>
  request<Cupon>(`/api/cupones/${id}`, { method: 'PUT', body: { activo } })

export const obtenerCarrito = () => request<Carrito>('/api/carrito')
export const agregarAlCarrito = (juegoId: number) =>
  request<Carrito>('/api/carrito/items', { method: 'POST', body: { juegoId } })
export const quitarDelCarrito = (juegoId: number) =>
  request<Carrito>(`/api/carrito/items/${juegoId}`, { method: 'DELETE' })
export const vaciarCarrito = () => request<null>('/api/carrito', { method: 'DELETE' })
export const aplicarCupon = (codigo: string) =>
  request<Carrito>('/api/carrito/cupon', { method: 'POST', body: { codigo } })

export const pagar = (aprobar = true) =>
  request<Orden>('/api/checkout/pagar', { method: 'POST', body: { aprobar } })

export const eliminarMiCuenta = () => request<null>('/api/usuarios/mi-cuenta', { method: 'DELETE' })

export const listarMisOrdenes = () => request<Orden[]>('/api/ordenes/mias')
export const obtenerMiOrden = (id: number) => request<Orden>(`/api/ordenes/mias/${id}`)
export const listarOrdenes = () => request<Orden[]>('/api/ordenes')
export const obtenerOrden = (id: number) => request<Orden>(`/api/ordenes/${id}`)
export const cambiarEstadoOrden = (id: number, estadoPago: string) =>
  request<Orden>(`/api/ordenes/${id}/estado`, { method: 'PUT', body: { estadoPago } })

export const listarResenas = (juegoId: number) => request<Resena[]>(`/api/juegos/${juegoId}/resenas`)
export const crearResena = (juegoId: number, calificacion: number, comentario: string) =>
  request<Resena>(`/api/juegos/${juegoId}/resenas`, {
    method: 'POST',
    body: { calificacion, comentario },
  })
export const borrarResena = (id: number) => request<null>(`/api/resenas/${id}`, { method: 'DELETE' })

export const listarDeseos = () => request<Deseo[]>('/api/deseos')
export const agregarDeseo = (juegoId: number) =>
  request<Deseo[]>('/api/deseos', { method: 'POST', body: { juegoId } })
export const quitarDeseo = (juegoId: number) =>
  request<Deseo[]>(`/api/deseos/${juegoId}`, { method: 'DELETE' })

export const reporteVentas = (desde: string, hasta: string) =>
  request<ReporteVenta[]>(conQuery('/api/reportes/ventas-juegos', { desde, hasta }))
export const reporteClientes = (desde: string, hasta: string) =>
  request<ReporteCliente[]>(conQuery('/api/reportes/compras-clientes', { desde, hasta }))
