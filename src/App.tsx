import { useCallback, useEffect, useState } from 'react'
import Shell from './components/Shell'
import { Aviso } from './components/ui'
import AdminScreen from './features/admin/AdminScreen'
import AuthScreen from './features/auth/AuthScreen'
import CartScreen from './features/cart/CartScreen'
import CatalogScreen from './features/catalog/CatalogScreen'
import HistoryScreen from './features/history/HistoryScreen'
import GameDetail from './features/reviews/GameDetail'
import WishlistScreen from './features/wishlist/WishlistScreen'
import {
  ApiError,
  agregarAlCarrito,
  agregarDeseo,
  aplicarCupon,
  listarDeseos,
  listarMisOrdenes,
  obtenerCarrito,
  pagar,
  quitarDelCarrito,
  quitarDeseo,
  vaciarCarrito,
} from './services/api'
import type { Carrito, Deseo, Juego, Orden, Sesion, Vista } from './types'
import { borrarSesion, guardarSesion, leerSesion } from './utils/session'

function mensajeDe(fallo: unknown, porDefecto: string): string {
  return fallo instanceof Error ? fallo.message : porDefecto
}

export default function App() {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion)
  const [enAuth, setEnAuth] = useState(() => leerSesion() === null)
  const [vista, setVista] = useState<Vista>('catalogo')
  const [juegoActual, setJuegoActual] = useState<Juego | null>(null)
  const [carrito, setCarrito] = useState<Carrito | null>(null)
  const [deseos, setDeseos] = useState<Deseo[]>([])
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [resultadoPago, setResultadoPago] = useState<Orden | null>(null)
  const [cargandoCarrito, setCargandoCarrito] = useState(false)
  const [cargandoDeseos, setCargandoDeseos] = useState(false)
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false)
  const [procesandoPago, setProcesandoPago] = useState(false)
  const [error, setError] = useState('')
  const [errorCupon, setErrorCupon] = useState('')
  const [mensaje, setMensaje] = useState('')

  const cerrarSesion = useCallback(() => {
    borrarSesion()
    setSesion(null)
    setEnAuth(true)
    setVista('catalogo')
    setJuegoActual(null)
    setCarrito(null)
    setDeseos([])
    setOrdenes([])
    setResultadoPago(null)
    setError('')
    setMensaje('')
  }, [])

  const resolverFallo = useCallback(
    (fallo: unknown, porDefecto: string, destino: (texto: string) => void) => {
      if (fallo instanceof ApiError && fallo.status === 401) {
        cerrarSesion()
        setError('Tu sesión expiró. Vuelve a iniciar sesión.')
        return
      }
      destino(mensajeDe(fallo, porDefecto))
    },
    [cerrarSesion],
  )

  const cargarCarrito = useCallback(() => {
    setCargandoCarrito(true)
    obtenerCarrito()
      .then((datos) => {
        setCarrito(datos)
        setError('')
      })
      .catch((fallo: unknown) => resolverFallo(fallo, 'No se pudo cargar el carrito.', setError))
      .finally(() => setCargandoCarrito(false))
  }, [resolverFallo])

  const cargarDeseos = useCallback(() => {
    setCargandoDeseos(true)
    listarDeseos()
      .then((datos) => {
        setDeseos(datos)
        setError('')
      })
      .catch((fallo: unknown) => resolverFallo(fallo, 'No se pudo cargar tu lista de deseos.', setError))
      .finally(() => setCargandoDeseos(false))
  }, [resolverFallo])

  const cargarHistorial = useCallback(() => {
    setCargandoOrdenes(true)
    listarMisOrdenes()
      .then((datos) => {
        setOrdenes(datos)
        setError('')
      })
      .catch((fallo: unknown) => resolverFallo(fallo, 'No se pudo cargar el historial.', setError))
      .finally(() => setCargandoOrdenes(false))
  }, [resolverFallo])

  useEffect(() => {
    if (sesion) {
      // Sincronización inicial con la API al iniciar sesión; las respuestas actualizan el estado.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarCarrito()
      cargarDeseos()
      cargarHistorial()
    }
  }, [sesion, cargarCarrito, cargarDeseos, cargarHistorial])

  const irAuth = () => {
    setEnAuth(true)
    setError('')
  }

  const navegar = (siguiente: Vista) => {
    const protegida = siguiente === 'carrito' || siguiente === 'deseos' || siguiente === 'historial' || siguiente === 'admin'
    if (protegida && !sesion) {
      irAuth()
      return
    }
    if (siguiente === 'admin' && sesion?.rol.toLowerCase() !== 'admin') return
    setEnAuth(false)
    setVista(siguiente)
    setError('')
    setMensaje('')
    if (siguiente !== 'carrito') setResultadoPago(null)
    if (siguiente !== 'detalle') setJuegoActual(null)
  }

  const autenticado = (nuevaSesion: Sesion) => {
    guardarSesion(nuevaSesion)
    setSesion(nuevaSesion)
    setEnAuth(false)
    setVista('catalogo')
    setMensaje(`¡Hola, ${nuevaSesion.nombre}!`)
  }

  const verCatalogo = () => {
    setEnAuth(false)
    setVista('catalogo')
  }

  const verDetalle = (juego: Juego) => {
    setJuegoActual(juego)
    setVista('detalle')
  }

  const agregar = async (juego: Juego) => {
    if (!sesion) {
      irAuth()
      return
    }
    try {
      setCarrito(await agregarAlCarrito(juego.id))
      setMensaje(`${juego.titulo} se agregó al carrito.`)
      setError('')
    } catch (fallo) {
      resolverFallo(fallo, 'No se pudo agregar el juego al carrito.', setError)
    }
  }

  const agregarPorId = async (juegoId: number) => {
    try {
      setCarrito(await agregarAlCarrito(juegoId))
      setMensaje('Juego agregado al carrito.')
      setError('')
    } catch (fallo) {
      resolverFallo(fallo, 'No se pudo agregar el juego al carrito.', setError)
    }
  }

  const quitar = async (juegoId: number) => {
    try {
      setCarrito(await quitarDelCarrito(juegoId))
      setMensaje('Juego quitado del carrito.')
    } catch (fallo) {
      resolverFallo(fallo, 'No se pudo quitar el juego.', setError)
    }
  }

  const vaciar = async () => {
    try {
      await vaciarCarrito()
      setCarrito({ items: [], subtotal: 0, descuento: 0, total: 0, cupon: null })
      setMensaje('Carrito vaciado.')
    } catch (fallo) {
      resolverFallo(fallo, 'No se pudo vaciar el carrito.', setError)
    }
  }

  const aplicar = async (codigo: string) => {
    setErrorCupon('')
    try {
      setCarrito(await aplicarCupon(codigo))
      setMensaje(`Cupón ${codigo} aplicado.`)
    } catch (fallo) {
      setErrorCupon(mensajeDe(fallo, 'No se pudo aplicar el cupón.'))
    }
  }

  const pagarCarrito = async (aprobar: boolean) => {
    setProcesandoPago(true)
    setError('')
    try {
      const orden = await pagar(aprobar)
      setResultadoPago(orden)
      if (orden.estadoPago.toLowerCase() === 'pagado') {
        setCarrito({ items: [], subtotal: 0, descuento: 0, total: 0, cupon: null })
        cargarHistorial()
      }
    } catch (fallo) {
      resolverFallo(fallo, 'No se pudo completar el pago.', setError)
    } finally {
      setProcesandoPago(false)
    }
  }

  const toggleDeseo = async (juego: Juego) => {
    if (!sesion) {
      irAuth()
      return
    }
    try {
      const actualizados = deseos.some((deseo) => deseo.juegoId === juego.id)
        ? await quitarDeseo(juego.id)
        : await agregarDeseo(juego.id)
      setDeseos(actualizados)
    } catch (fallo) {
      resolverFallo(fallo, 'No se pudo actualizar la lista de deseos.', setError)
    }
  }

  const quitarDeseoDeLista = async (juegoId: number) => {
    try {
      setDeseos(await quitarDeseo(juegoId))
    } catch (fallo) {
      resolverFallo(fallo, 'No se pudo quitar el juego de deseos.', setError)
    }
  }

  if (enAuth) {
    return <AuthScreen onAutenticado={autenticado} onVerCatalogo={verCatalogo} />
  }

  return (
    <Shell
      sesion={sesion}
      vista={vista}
      carritoCount={carrito?.items.length ?? 0}
      onNavegar={navegar}
      onIrAuth={irAuth}
      onLogout={cerrarSesion}
    >
      <Aviso mensaje={error} />
      <Aviso tipo="exito" mensaje={mensaje} />
      {vista === 'catalogo' && (
        <CatalogScreen
          sesion={sesion}
          deseos={deseos.map((deseo) => deseo.juegoId)}
          onAgregar={(juego) => void agregar(juego)}
          onVerDetalle={verDetalle}
          onToggleDeseo={(juego) => void toggleDeseo(juego)}
        />
      )}
      {vista === 'detalle' && juegoActual && (
        <GameDetail
          juego={juegoActual}
          sesion={sesion}
          enDeseos={deseos.some((deseo) => deseo.juegoId === juegoActual.id)}
          onVolver={() => navegar('catalogo')}
          onAgregar={(juego) => void agregar(juego)}
          onToggleDeseo={(juego) => void toggleDeseo(juego)}
          onIrAuth={irAuth}
        />
      )}
      {vista === 'carrito' && (
        <CartScreen
          carrito={carrito}
          cargando={cargandoCarrito}
          procesando={procesandoPago}
          error={error}
          cuponError={errorCupon}
          orden={resultadoPago}
          onQuitar={(juegoId) => void quitar(juegoId)}
          onVaciar={() => void vaciar()}
          onAplicarCupon={(codigo) => void aplicar(codigo)}
          onPagar={(aprobar) => void pagarCarrito(aprobar)}
          onVerCatalogo={() => navegar('catalogo')}
        />
      )}
      {vista === 'deseos' && (
        <WishlistScreen
          deseos={deseos}
          cargando={cargandoDeseos}
          error={error}
          onAgregar={(juegoId) => void agregarPorId(juegoId)}
          onQuitar={(juegoId) => void quitarDeseoDeLista(juegoId)}
          onVerCatalogo={() => navegar('catalogo')}
        />
      )}
      {vista === 'historial' && (
        <HistoryScreen
          ordenes={ordenes}
          cargando={cargandoOrdenes}
          error={error}
          onVerCatalogo={() => navegar('catalogo')}
        />
      )}
      {vista === 'admin' && sesion?.rol.toLowerCase() === 'admin' && <AdminScreen />}
    </Shell>
  )
}
