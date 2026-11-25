import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Aviso, Cargando, EmptyState, Precio } from '../../components/ui'
import { borrarResena, crearResena, listarResenas } from '../../services/api'
import type { Juego, Resena, Sesion } from '../../types'
import { formatearFecha } from '../../utils/session'

type Props = {
  juego: Juego
  sesion: Sesion | null
  enDeseos: boolean
  onVolver: () => void
  onAgregar: (juego: Juego) => void
  onToggleDeseo: (juego: Juego) => void
  onIrAuth: () => void
}

export default function GameDetail({
  juego,
  sesion,
  enDeseos,
  onVolver,
  onAgregar,
  onToggleDeseo,
  onIrAuth,
}: Props) {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [cargando, setCargando] = useState(true)
  const [calificacion, setCalificacion] = useState(5)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(() => {
    setCargando(true)
    listarResenas(juego.id)
      .then((datos) => {
        setResenas(datos)
        setError('')
      })
      .catch((fallo: unknown) => setError(fallo instanceof Error ? fallo.message : 'No se pudieron cargar las reseñas.'))
      .finally(() => setCargando(false))
  }, [juego.id])

  useEffect(() => {
    // Carga inicial de reseñas; el estado se actualiza cuando llega la respuesta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar()
  }, [cargar])

  const publicar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (!sesion || enviando) return
    setEnviando(true)
    setError('')
    setMensaje('')
    try {
      await crearResena(juego.id, calificacion, comentario.trim())
      setComentario('')
      setMensaje('Tu reseña ya está publicada.')
      cargar()
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo publicar la reseña.')
    } finally {
      setEnviando(false)
    }
  }

  const eliminar = async (id: number) => {
    try {
      await borrarResena(id)
      cargar()
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo eliminar la reseña.')
    }
  }

  return (
    <div className="content-card">
      <div className="card-content content-inner">
        <button className="text-button volver" type="button" onClick={onVolver}>← Volver al catálogo</button>
        <div className="detail-hero">
          <div className="detail-cover" aria-hidden="true"><span>{juego.categoria.charAt(0)}</span></div>
          <div>
            <p className="eyebrow">{juego.categoria} · {juego.plataforma} · {juego.region}</p>
            <h1>{juego.titulo}</h1>
            <p className="card-subtitle">{juego.descripcion || 'Sin descripción disponible.'}</p>
            <div className="detail-actions">
              <Precio valor={juego.precio} />
              <button className="soft-button" type="button" onClick={() => onAgregar(juego)}>Añadir al carrito</button>
              <button
                className={`heart-button${enDeseos ? ' activo' : ''}`}
                type="button"
                onClick={() => onToggleDeseo(juego)}
                aria-label={enDeseos ? 'Quitar de deseos' : 'Agregar a deseos'}
                aria-pressed={enDeseos}
              >
                {enDeseos ? '♥' : '♡'}
              </button>
            </div>
          </div>
        </div>

        <section className="reviews-section">
          <div className="section-heading compacto">
            <h2>Reseñas de la comunidad</h2>
            <span className="count-pill">{resenas.length}</span>
          </div>
          <Aviso mensaje={error} />
          <Aviso tipo="exito" mensaje={mensaje} />
          {cargando ? (
            <Cargando texto="Cargando reseñas…" />
          ) : resenas.length === 0 ? (
            <EmptyState titulo="Aún no hay reseñas" mensaje="Sé la primera persona en compartir su experiencia." />
          ) : (
            <ul className="review-list">
              {resenas.map((resena) => (
                <li key={resena.id} className="review-item">
                  <div className="review-head">
                    <strong>{resena.nombreUsuario}</strong>
                    <span className="review-stars" aria-label={`${resena.calificacion} de 5`}>
                      {'★'.repeat(resena.calificacion)}{'☆'.repeat(5 - resena.calificacion)}
                    </span>
                    <time>{formatearFecha(resena.fecha)}</time>
                    {sesion && (sesion.id === resena.usuarioId || sesion.rol === 'admin') && (
                      <button className="text-button" type="button" onClick={() => void eliminar(resena.id)}>Eliminar</button>
                    )}
                  </div>
                  <p>{resena.comentario || 'Sin comentario.'}</p>
                </li>
              ))}
            </ul>
          )}

          {sesion ? (
            <form className="review-form" onSubmit={(evento) => void publicar(evento)}>
              <h3>Deja tu reseña</h3>
              <p className="field-hint">Solo puedes reseñar juegos que hayas comprado.</p>
              <label htmlFor="review-rating">Calificación</label>
              <select
                id="review-rating"
                value={calificacion}
                onChange={(evento) => setCalificacion(Number(evento.target.value))}
              >
                {[5, 4, 3, 2, 1].map((nota) => (
                  <option key={nota} value={nota}>{nota} {nota === 1 ? 'estrella' : 'estrellas'}</option>
                ))}
              </select>
              <label htmlFor="review-comment">Comentario</label>
              <textarea
                id="review-comment"
                rows={3}
                maxLength={600}
                value={comentario}
                onChange={(evento) => setComentario(evento.target.value)}
              />
              <button className="soft-button" type="submit" disabled={enviando}>
                {enviando ? 'Publicando…' : 'Publicar reseña'}
              </button>
            </form>
          ) : (
            <p className="auth-hint">
              <button className="text-button" type="button" onClick={onIrAuth}>Inicia sesión</button> para dejar tu reseña.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
