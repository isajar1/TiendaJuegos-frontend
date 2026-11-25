export type Sesion = {
  id: number
  nombre: string
  correo: string
  rol: string
  token: string
}

export type Juego = {
  id: number
  titulo: string
  descripcion: string
  precio: number
  region: string
  plataforma: string
  categoria: string
  activo: boolean
  clavesDisponibles?: number
  calificacionPromedio?: number
  totalResenas?: number
}

export type CatalogoFiltros = {
  q: string
  categoria: string
  plataforma: string
  region: string
}

export type Categoria = { id: number; nombre: string }
export type Plataforma = { id: number; nombre: string }

export type Cupon = {
  id: number
  codigo: string
  porcentajeDescuento: number
  fechaExpiracion: string
  activo: boolean
}

export type CarritoItem = {
  juegoId: number
  titulo: string
  precio: number
}

export type Carrito = {
  items: CarritoItem[]
  subtotal: number
  descuento: number
  total: number
  cupon: string | null
}

export type OrdenItem = {
  juegoId: number
  titulo: string
  precioUnitario: number
  clave: string
}

export type Orden = {
  id: number
  fechaCreacion: string
  total: number
  estadoPago: string
  cupon: string | null
  items: OrdenItem[]
}

export type Resena = {
  id: number
  juegoId: number
  usuarioId: number
  nombreUsuario: string
  calificacion: number
  comentario: string
  fecha: string
}

export type Deseo = { juegoId: number; titulo: string; precio: number }

export type ReporteVenta = {
  juegoId: number
  titulo: string
  unidades: number
  ingresos: number
}

export type ReporteCliente = {
  usuarioId: number
  nombre: string
  ordenes: number
  total: number
}

export type Vista = 'catalogo' | 'detalle' | 'carrito' | 'deseos' | 'historial' | 'admin' | 'perfil'

export type JuegoForm = {
  titulo: string
  descripcion: string
  precio: string
  region: string
  plataformaId: string
  categoriaId: string
}

export type CuponForm = {
  codigo: string
  porcentajeDescuento: string
  fechaExpiracion: string
}
