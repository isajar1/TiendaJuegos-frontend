import { Aviso, Cargando, EmptyState, Precio } from '../../components/ui'
import type { Deseo } from '../../types'

type Props = {
  deseos: Deseo[]
  cargando: boolean
  error: string
  onAgregar: (juegoId: number) => void
  onQuitar: (juegoId: number) => void
  onVerCatalogo: () => void
}

export default function WishlistScreen({
  deseos,
  cargando,
  error,
  onAgregar,
  onQuitar,
  onVerCatalogo,
}: Props) {
  return (
    <div className="content-card">
      <div className="card-content content-inner">
        <div className="section-heading">
          <div>
            <p className="eyebrow">GUARDADOS PARA DESPUÉS</p>
            <h1>Mi lista de deseos</h1>
            <p className="card-subtitle">Tus juegos favoritos, listos cuando quieras comprarlos.</p>
          </div>
          <span className="count-pill">{deseos.length}</span>
        </div>
        <Aviso mensaje={error} />
        {cargando ? (
          <Cargando texto="Cargando deseos…" />
        ) : deseos.length === 0 ? (
          <EmptyState titulo="No tienes juegos guardados" mensaje="Toca el corazón en cualquier juego del catálogo." />
        ) : (
          <ul className="wishlist-list">
            {deseos.map((deseo) => (
              <li key={deseo.juegoId} className="wishlist-item">
                <span className="cart-glyph" aria-hidden="true">{deseo.titulo.charAt(0)}</span>
                <div>
                  <h3>{deseo.titulo}</h3>
                  <Precio valor={deseo.precio} />
                </div>
                <div className="game-actions">
                  <button className="soft-button" type="button" onClick={() => onAgregar(deseo.juegoId)}>Añadir al carrito</button>
                  <button className="heart-button activo" type="button" onClick={() => onQuitar(deseo.juegoId)} aria-label={`Quitar ${deseo.titulo} de deseos`}>♥</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button className="text-button" type="button" onClick={onVerCatalogo}>Explorar más juegos →</button>
      </div>
    </div>
  )
}
