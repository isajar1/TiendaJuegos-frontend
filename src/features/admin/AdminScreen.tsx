import { useEffect, useState, type FormEvent } from 'react'
import { Aviso, Cargando, EmptyState, EstadoBadge, Field, Precio, SelectField } from '../../components/ui'
import {
  actualizarCupon,
  actualizarJuego,
  cambiarEstadoOrden,
  cargarClaves,
  crearCupon,
  crearJuego,
  desactivarJuego,
  listarCategorias,
  listarCupones,
  listarJuegos,
  listarOrdenes,
  listarPlataformas,
  reporteClientes,
  reporteVentas,
} from '../../services/api'
import type {
  CatalogoFiltros,
  Categoria,
  Cupon,
  CuponForm,
  Juego,
  JuegoForm,
  Orden,
  Plataforma,
  ReporteCliente,
  ReporteVenta,
} from '../../types'
import { formatearDinero, formatearFecha, hoyISO } from '../../utils/session'

type Tab = 'juegos' | 'cupones' | 'ordenes' | 'reportes'
const FILTROS_VACIOS: CatalogoFiltros = { q: '', categoria: '', plataforma: '', region: '' }
const JUEGO_VACIO: JuegoForm = {
  titulo: '',
  descripcion: '',
  precio: '',
  region: 'Global',
  plataformaId: '',
  categoriaId: '',
}
const CUPON_VACIO: CuponForm = { codigo: '', porcentajeDescuento: '', fechaExpiracion: '' }

export default function AdminScreen() {
  const [tab, setTab] = useState<Tab>('juegos')
  const [juegos, setJuegos] = useState<Juego[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [plataformas, setPlataformas] = useState<Plataforma[]>([])
  const [cupones, setCupones] = useState<Cupon[]>([])
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [juegoForm, setJuegoForm] = useState<JuegoForm>(JUEGO_VACIO)
  const [editando, setEditando] = useState<number | null>(null)
  const [juegoClaves, setJuegoClaves] = useState('')
  const [clavesTexto, setClavesTexto] = useState('')
  const [cuponForm, setCuponForm] = useState<CuponForm>(CUPON_VACIO)
  const [desde, setDesde] = useState(hoyISO())
  const [hasta, setHasta] = useState(hoyISO())
  const [ventas, setVentas] = useState<ReporteVenta[]>([])
  const [clientes, setClientes] = useState<ReporteCliente[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const cargarDatos = () => {
    setCargando(true)
    Promise.all([
      listarJuegos(FILTROS_VACIOS),
      listarCategorias(),
      listarPlataformas(),
      listarCupones(),
      listarOrdenes(),
    ])
      .then(([j, c, p, cup, ord]) => {
        setJuegos(j)
        setCategorias(c)
        setPlataformas(p)
        setCupones(cup)
        setOrdenes(ord)
        if (!juegoClaves && j.length > 0) setJuegoClaves(String(j[0].id))
      })
      .catch((fallo: unknown) => setError(fallo instanceof Error ? fallo.message : 'No se pudo cargar el panel.'))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    // La carga inicial se hace una sola vez; las recargas se disparan manualmente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ejecutar = async (accion: () => Promise<unknown>, exito: string) => {
    setProcesando(true)
    setError('')
    setMensaje('')
    try {
      await accion()
      setMensaje(exito)
      cargarDatos()
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo completar la operación.')
    } finally {
      setProcesando(false)
    }
  }

  const guardarJuego = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const accion = () =>
      editando === null ? crearJuego(juegoForm) : actualizarJuego(editando, juegoForm)
    void ejecutar(accion, editando === null ? 'Juego creado correctamente.' : 'Juego actualizado.').then(() => {
      setJuegoForm(JUEGO_VACIO)
      setEditando(null)
    })
  }

  const editarJuego = (juego: Juego) => {
    setEditando(juego.id)
    setJuegoForm({
      titulo: juego.titulo,
      descripcion: juego.descripcion,
      precio: String(juego.precio),
      region: juego.region,
      plataformaId: String(plataformas.find((p) => p.nombre === juego.plataforma)?.id ?? ''),
      categoriaId: String(categorias.find((c) => c.nombre === juego.categoria)?.id ?? ''),
    })
  }

  const guardarClaves = () => {
    const claves = clavesTexto.split('\n').map((clave) => clave.trim()).filter(Boolean)
    if (!juegoClaves || claves.length === 0) {
      setError('Selecciona un juego y escribe al menos una clave.')
      return
    }
    void ejecutar(() => cargarClaves(Number(juegoClaves), claves), `${claves.length} clave(s) cargadas.`).then(() =>
      setClavesTexto(''),
    )
  }

  const guardarCupon = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    void ejecutar(() => crearCupon(cuponForm), 'Cupón creado correctamente.').then(() => setCuponForm(CUPON_VACIO))
  }

  const generarReportes = () => {
    if (desde > hasta) {
      setError('La fecha inicial no puede ser posterior a la final.')
      return
    }
    setProcesando(true)
    setError('')
    Promise.all([reporteVentas(desde, hasta), reporteClientes(desde, hasta)])
      .then(([v, c]) => {
        setVentas(v)
        setClientes(c)
        setMensaje(v.length + c.length === 0 ? 'No hay datos en el rango seleccionado.' : 'Reportes actualizados.')
      })
      .catch((fallo: unknown) => setError(fallo instanceof Error ? fallo.message : 'No se pudieron generar los reportes.'))
      .finally(() => setProcesando(false))
  }

  const pestañas: { id: Tab; etiqueta: string }[] = [
    { id: 'juegos', etiqueta: 'Juegos y claves' },
    { id: 'cupones', etiqueta: 'Cupones' },
    { id: 'ordenes', etiqueta: 'Órdenes' },
    { id: 'reportes', etiqueta: 'Reportes' },
  ]

  return (
    <div className="content-card">
      <div className="card-content content-inner">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PANEL DE CONTROL</p>
            <h1>Administración</h1>
            <p className="card-subtitle">Gestiona catálogo, claves, promociones, órdenes y reportes.</p>
          </div>
        </div>

        <div className="tab-bar" role="tablist" aria-label="Secciones de administración">
          {pestañas.map((pestaña) => (
            <button
              key={pestaña.id}
              className={`tab-button${tab === pestaña.id ? ' activo' : ''}`}
              type="button"
              role="tab"
              aria-selected={tab === pestaña.id}
              onClick={() => setTab(pestaña.id)}
            >
              {pestaña.etiqueta}
            </button>
          ))}
        </div>

        <Aviso mensaje={error} />
        <Aviso tipo="exito" mensaje={mensaje} />
        {cargando && <Cargando texto="Cargando panel…" />}

        {tab === 'juegos' && !cargando && (
          <div className="admin-grid">
            <form className="admin-form" onSubmit={guardarJuego}>
              <h2>{editando === null ? 'Nuevo juego' : 'Editar juego'}</h2>
              <Field id="admin-titulo" label="Título" value={juegoForm.titulo} onChange={(titulo) => setJuegoForm({ ...juegoForm, titulo })} />
              <label htmlFor="admin-descripcion">Descripción</label>
              <textarea id="admin-descripcion" rows={2} value={juegoForm.descripcion} onChange={(evento) => setJuegoForm({ ...juegoForm, descripcion: evento.target.value })} />
              <Field id="admin-precio" label="Precio" type="number" value={juegoForm.precio} onChange={(precio) => setJuegoForm({ ...juegoForm, precio })} />
              <Field id="admin-region" label="Región" value={juegoForm.region} onChange={(region) => setJuegoForm({ ...juegoForm, region })} />
              <SelectField id="admin-plataforma" label="Plataforma" value={juegoForm.plataformaId} onChange={(plataformaId) => setJuegoForm({ ...juegoForm, plataformaId })}>
                <option value="">Selecciona…</option>
                {plataformas.map((plataforma) => <option key={plataforma.id} value={plataforma.id}>{plataforma.nombre}</option>)}
              </SelectField>
              <SelectField id="admin-categoria" label="Categoría" value={juegoForm.categoriaId} onChange={(categoriaId) => setJuegoForm({ ...juegoForm, categoriaId })}>
                <option value="">Selecciona…</option>
                {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
              </SelectField>
              <button className="soft-button" type="submit" disabled={procesando}>{editando === null ? 'Crear juego' : 'Guardar cambios'}</button>
              {editando !== null && <button className="text-button" type="button" onClick={() => { setEditando(null); setJuegoForm(JUEGO_VACIO) }}>Cancelar edición</button>}
            </form>

            <div className="admin-form">
              <h2>Cargar claves cifradas</h2>
              <SelectField id="admin-claves-juego" label="Juego" value={juegoClaves} onChange={setJuegoClaves}>
                <option value="">Selecciona…</option>
                {juegos.map((juego) => <option key={juego.id} value={juego.id}>{juego.titulo}</option>)}
              </SelectField>
              <label htmlFor="admin-claves">Claves (una por línea)</label>
              <textarea id="admin-claves" rows={4} value={clavesTexto} onChange={(evento) => setClavesTexto(evento.target.value)} placeholder="ABCD-EFGH-IJKL" />
              <button className="soft-button" type="button" disabled={procesando} onClick={guardarClaves}>Cargar claves</button>
            </div>
          </div>
        )}

        {tab === 'juegos' && !cargando && (
          <div className="admin-table-wrap">
            <h2>Juegos existentes</h2>
            {juegos.length === 0 ? <EmptyState titulo="Sin juegos" mensaje="Crea el primero con el formulario anterior." /> : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead><tr><th>Juego</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {juegos.map((juego) => (
                      <tr key={juego.id}>
                        <td>{juego.titulo}<small>{juego.categoria} · {juego.plataforma}</small></td>
                        <td>{formatearDinero(juego.precio)}</td>
                        <td><EstadoBadge estado={juego.activo ? 'activo' : 'inactivo'} /></td>
                        <td>
                          <button className="text-button" type="button" onClick={() => editarJuego(juego)}>Editar</button>
                          {juego.activo && <button className="text-button" type="button" disabled={procesando} onClick={() => void ejecutar(() => desactivarJuego(juego.id), 'Juego desactivado.')}>Desactivar</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'cupones' && !cargando && (
          <div className="admin-grid">
            <form className="admin-form" onSubmit={guardarCupon}>
              <h2>Nuevo cupón</h2>
              <Field id="cupon-codigo-admin" label="Código" value={cuponForm.codigo} onChange={(codigo) => setCuponForm({ ...cuponForm, codigo })} />
              <Field id="cupon-porcentaje" label="Descuento (%)" type="number" value={cuponForm.porcentajeDescuento} onChange={(porcentajeDescuento) => setCuponForm({ ...cuponForm, porcentajeDescuento })} />
              <Field id="cupon-expiracion" label="Fecha de expiración" type="date" value={cuponForm.fechaExpiracion} onChange={(fechaExpiracion) => setCuponForm({ ...cuponForm, fechaExpiracion })} />
              <button className="soft-button" type="submit" disabled={procesando}>Crear cupón</button>
            </form>
            <div className="admin-form">
              <h2>Cupones registrados</h2>
              {cupones.length === 0 ? <EmptyState titulo="Sin cupones" mensaje="Crea uno para ofrecer descuentos." /> : (
                <ul className="admin-list">
                  {cupones.map((cupon) => (
                    <li key={cupon.id}>
                      <div><strong>{cupon.codigo}</strong><small>{cupon.porcentajeDescuento}% · vence {formatearFecha(cupon.fechaExpiracion)}</small></div>
                      <EstadoBadge estado={cupon.activo ? 'activo' : 'inactivo'} />
                      <button
                        className="text-button"
                        type="button"
                        disabled={procesando}
                        onClick={() => void ejecutar(() => actualizarCupon(cupon.id, !cupon.activo), cupon.activo ? 'Cupón desactivado.' : 'Cupón activado.')}
                      >
                        {cupon.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === 'ordenes' && !cargando && (
          <div className="admin-table-wrap">
            <h2>Órdenes de la tienda</h2>
            {ordenes.length === 0 ? <EmptyState titulo="Sin órdenes" mensaje="Todavía no hay compras registradas." /> : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead><tr><th>Orden</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Cambiar estado</th></tr></thead>
                  <tbody>
                    {ordenes.map((orden) => (
                      <tr key={orden.id}>
                        <td>#{orden.id}<small>{orden.items.length} juego(s)</small></td>
                        <td>{formatearFecha(orden.fechaCreacion)}</td>
                        <td>{formatearDinero(orden.total)}</td>
                        <td><EstadoBadge estado={orden.estadoPago} /></td>
                        <td>
                          <select
                            value={orden.estadoPago}
                            disabled={procesando}
                            onChange={(evento) => void ejecutar(() => cambiarEstadoOrden(orden.id, evento.target.value), 'Estado actualizado.')}
                          >
                            {['pendiente', 'pagado', 'rechazado', 'reembolsado'].map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'reportes' && (
          <div className="report-section">
            <div className="filter-bar report-filters">
              <Field id="reporte-desde" label="Desde" type="date" value={desde} onChange={setDesde} />
              <Field id="reporte-hasta" label="Hasta" type="date" value={hasta} onChange={setHasta} />
              <div className="filter-actions">
                <button className="soft-button" type="button" disabled={procesando} onClick={generarReportes}>Generar reportes</button>
              </div>
            </div>
            <div className="admin-grid">
              <div>
                <h2>Ventas por juego</h2>
                {ventas.length === 0 ? <p className="field-hint">Sin datos para el rango seleccionado.</p> : (
                  <ul className="admin-list">
                    {ventas.map((venta) => (
                      <li key={venta.juegoId}>
                        <div><strong>{venta.titulo}</strong><small>{venta.unidades} unidades</small></div>
                        <Precio valor={venta.ingresos} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h2>Compras por cliente</h2>
                {clientes.length === 0 ? <p className="field-hint">Sin datos para el rango seleccionado.</p> : (
                  <ul className="admin-list">
                    {clientes.map((cliente) => (
                      <li key={cliente.usuarioId}>
                        <div><strong>{cliente.nombre}</strong><small>{cliente.ordenes} orden(es)</small></div>
                        <Precio valor={cliente.total} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
