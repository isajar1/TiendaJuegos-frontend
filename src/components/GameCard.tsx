import type { Juego } from '../types'
import { formatearDinero } from '../utils/session'
import { Precio } from './ui'

type Props = {
  juego: Juego
  enDeseos?: boolean
  indice?: number
  onAgregar: (juego: Juego) => void
  onVerDetalle: (juego: Juego) => void
  onToggleDeseo?: (juego: Juego) => void
  onQuitar?: (juego: Juego) => void
}

export default function GameCard({
  juego,
  enDeseos = false,
  indice = 0,
  onAgregar,
  onVerDetalle,
  onToggleDeseo,
  onQuitar,
}: Props) {
  const sinStock = juego.clavesDisponibles === 0

  return (
    <article className="game-card" style={{ animationDelay: `${Math.min(indice, 8) * 45}ms` }}>
      <div className="game-cover" aria-hidden="true">
        <span className="cover-glyph">{juego.categoria?.charAt(0) ?? 'J'}</span>
        <span className="cover-platform">{juego.plataforma}</span>
      </div>
      <div className="game-body">
        <p className="game-meta">{juego.categoria} · {juego.region}</p>
        <h3>{juego.titulo}</h3>
        <p className="game-description">{juego.descripcion || 'Sin descripción disponible.'}</p>
        {typeof juego.calificacionPromedio === 'number' && (
          <p className="game-rating" aria-label={`Calificación ${juego.calificacionPromedio} de 5`}>
            <span aria-hidden="true">★</span> {juego.calificacionPromedio.toFixed(1)}
            <span className="rating-count">({juego.totalResenas ?? 0})</span>
          </p>
        )}
        <div className="game-footer">
          <Precio valor={juego.precio} />
          <button className="text-button" type="button" onClick={() => onVerDetalle(juego)}>Detalles</button>
        </div>
        {!juego.activo && <p className="game-warning">Juego desactivado</p>}
        <div className="game-actions">
          {onQuitar ? (
            <button className="soft-button" type="button" onClick={() => onQuitar(juego)}>Quitar</button>
          ) : (
            <button
              className="soft-button"
              type="button"
              disabled={sinStock}
              onClick={() => onAgregar(juego)}
              title={sinStock ? 'No hay claves disponibles' : 'Agregar al carrito'}
            >
              {sinStock ? 'Sin stock' : `Añadir · ${formatearDinero(juego.precio)}`}
            </button>
          )}
          {onToggleDeseo && (
            <button
              className={`heart-button${enDeseos ? ' activo' : ''}`}
              type="button"
              onClick={() => onToggleDeseo(juego)}
              aria-label={enDeseos ? `Quitar ${juego.titulo} de deseos` : `Agregar ${juego.titulo} a deseos`}
              aria-pressed={enDeseos}
            >
              {enDeseos ? '♥' : '♡'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
