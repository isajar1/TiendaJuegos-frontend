import type { ReactNode } from 'react'
import type { Sesion, Vista } from '../types'

type Props = {
  sesion: Sesion | null
  vista: Vista
  carritoCount: number
  onNavegar: (vista: Vista) => void
  onIrAuth: () => void
  onLogout: () => void
  children: ReactNode
}

const ITEMS: { vista: Vista; etiqueta: string; icono: string }[] = [
  { vista: 'catalogo', etiqueta: 'Catálogo', icono: '◈' },
  { vista: 'carrito', etiqueta: 'Carrito', icono: '▣' },
  { vista: 'deseos', etiqueta: 'Deseos', icono: '♡' },
  { vista: 'historial', etiqueta: 'Historial', icono: '◷' },
]

export default function Shell({
  sesion,
  vista,
  carritoCount,
  onNavegar,
  onIrAuth,
  onLogout,
  children,
}: Props) {
  const esAdmin = sesion?.rol?.toLowerCase() === 'admin'
  const items = esAdmin ? [...ITEMS, { vista: 'admin' as Vista, etiqueta: 'Admin', icono: '✦' }] : ITEMS

  return (
    <main className="auth-page app-page">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="app-header">
        <button className="brand brand-button" type="button" onClick={() => onNavegar('catalogo')}>
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>TIENDA <span className="brand-light">JUEGOS</span></span>
        </button>
        <div className="user-area">
          {sesion ? (
            <>
              <span className="user-chip"><span aria-hidden="true">◉</span> {sesion.nombre}</span>
              <button
                className="icon-button"
                type="button"
                onClick={() => onNavegar('perfil')}
                aria-label="Perfil y configuración"
                title="Perfil y configuración"
              >
                <span aria-hidden="true">⚙</span>
              </button>
              <button className="text-button" type="button" onClick={onLogout}>Cerrar sesión</button>
            </>
          ) : (
            <button className="text-button" type="button" onClick={onIrAuth}>Iniciar sesión</button>
          )}
        </div>
      </header>

      <nav className="nav-bar" aria-label="Navegación principal">
        {items.map((item) => (
          <button
            key={item.vista}
            className={`nav-button${vista === item.vista || (vista === 'detalle' && item.vista === 'catalogo') ? ' activo' : ''}`}
            type="button"
            onClick={() => onNavegar(item.vista)}
          >
            <span aria-hidden="true">{item.icono}</span>
            {item.etiqueta}
            {item.vista === 'carrito' && carritoCount > 0 && (
              <span className="nav-badge">{carritoCount}</span>
            )}
          </button>
        ))}
      </nav>

      <section className="app-content">{children}</section>
      <footer className="page-footer">JUEGA A TU MANERA <span aria-hidden="true">·</span> COMPRA CON CONFIANZA</footer>
    </main>
  )
}
