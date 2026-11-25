import { useEffect, useState, type FormEvent } from 'react'
import GameCard from '../../components/GameCard'
import { Aviso, Cargando, EmptyState, Field, SelectField } from '../../components/ui'
import { listarCategorias, listarJuegos, listarPlataformas } from '../../services/api'
import type { CatalogoFiltros, Categoria, Juego, Plataforma, Sesion } from '../../types'

type Props = {
  sesion: Sesion | null
  deseos: number[]
  onAgregar: (juego: Juego) => void
  onVerDetalle: (juego: Juego) => void
  onToggleDeseo: (juego: Juego) => void
}

const FILTROS_VACIOS: CatalogoFiltros = { q: '', categoria: '', plataforma: '', region: '' }

export default function CatalogScreen({
  sesion,
  deseos,
  onAgregar,
  onVerDetalle,
  onToggleDeseo,
}: Props) {
  const [borrador, setBorrador] = useState<CatalogoFiltros>(FILTROS_VACIOS)
  const [filtros, setFiltros] = useState<CatalogoFiltros>(FILTROS_VACIOS)
  const [juegos, setJuegos] = useState<Juego[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [plataformas, setPlataformas] = useState<Plataforma[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    Promise.all([listarCategorias(), listarPlataformas()])
      .then(([cats, plats]) => {
        if (!activo) return
        setCategorias(cats)
        setPlataformas(plats)
      })
      .catch(() => {
        // Los filtros siguen funcionando con texto libre si no cargan los catálogos.
      })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    let activo = true
    // La carga inicial sincroniza la vista con la API; el estado se actualiza tras la respuesta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true)
    listarJuegos(filtros)
      .then((datos) => {
        if (activo) {
          setJuegos(datos)
          setError('')
        }
      })
      .catch((fallo: unknown) => {
        if (activo) setError(fallo instanceof Error ? fallo.message : 'No se pudo cargar el catálogo.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [filtros])

  const aplicar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setFiltros({ ...borrador })
  }

  const limpiar = () => {
    setBorrador(FILTROS_VACIOS)
    setFiltros(FILTROS_VACIOS)
  }

  return (
    <div className="content-card">
      <div className="card-content content-inner">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EXPLORA LA TIENDA</p>
            <h1>Catálogo de juegos</h1>
            <p className="card-subtitle">Encuentra tu próxima aventura y guárdala donde quieras.</p>
          </div>
          <span className="count-pill">{juegos.length} {juegos.length === 1 ? 'juego' : 'juegos'}</span>
        </div>

        <form className="filter-bar" onSubmit={aplicar}>
          <Field
            id="filtro-q"
            label="Buscar"
            placeholder="Título o descripción"
            value={borrador.q}
            onChange={(q) => setBorrador({ ...borrador, q })}
            required={false}
          />
          <SelectField
            id="filtro-categoria"
            label="Categoría"
            value={borrador.categoria}
            onChange={(categoria) => setBorrador({ ...borrador, categoria })}
          >
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.nombre}>{categoria.nombre}</option>
            ))}
          </SelectField>
          <SelectField
            id="filtro-plataforma"
            label="Plataforma"
            value={borrador.plataforma}
            onChange={(plataforma) => setBorrador({ ...borrador, plataforma })}
          >
            <option value="">Todas</option>
            {plataformas.map((plataforma) => (
              <option key={plataforma.id} value={plataforma.nombre}>{plataforma.nombre}</option>
            ))}
          </SelectField>
          <Field
            id="filtro-region"
            label="Región"
            placeholder="Global"
            value={borrador.region}
            onChange={(region) => setBorrador({ ...borrador, region })}
            required={false}
          />
          <div className="filter-actions">
            <button className="soft-button" type="submit">Buscar</button>
            <button className="text-button" type="button" onClick={limpiar}>Limpiar</button>
          </div>
        </form>

        {!sesion && (
          <Aviso
            tipo="exito"
            mensaje="Puedes explorar el catálogo sin cuenta. Inicia sesión para comprar, guardar deseos o reseñar."
          />
        )}
        <Aviso mensaje={error} />

        {cargando ? (
          <Cargando texto="Cargando juegos…" />
        ) : juegos.length === 0 ? (
          <EmptyState titulo="No encontramos juegos" mensaje="Prueba con otros filtros o vuelve más tarde." />
        ) : (
          <div className="game-grid">
            {juegos.map((juego, indice) => (
              <GameCard
                key={juego.id}
                juego={juego}
                indice={indice}
                enDeseos={deseos.includes(juego.id)}
                onAgregar={onAgregar}
                onVerDetalle={onVerDetalle}
                onToggleDeseo={onToggleDeseo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
