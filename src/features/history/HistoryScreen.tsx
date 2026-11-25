import { useState } from 'react'
import { Aviso, Cargando, EmptyState, EstadoBadge, Precio } from '../../components/ui'
import { copiarTexto } from '../../utils/clipboard'
import type { Orden } from '../../types'
import { formatearFecha } from '../../utils/session'

type Props = {
  ordenes: Orden[]
  cargando: boolean
  error: string
  onVerCatalogo: () => void
}

export default function HistoryScreen({ ordenes, cargando, error, onVerCatalogo }: Props) {
  const [abierta, setAbierta] = useState<number | null>(null)

  return (
    <div className="content-card">
      <div className="card-content content-inner">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TUS COMPRAS</p>
            <h1>Historial de compras</h1>
            <p className="card-subtitle">Consulta tus órdenes y recupera tus claves cuando las necesites.</p>
          </div>
          <span className="count-pill">{ordenes.length}</span>
        </div>
        <Aviso mensaje={error} />
        {cargando ? (
          <Cargando texto="Cargando historial…" />
        ) : ordenes.length === 0 ? (
          <EmptyState titulo="Aún no hay compras" mensaje="Cuando pagues una orden, aparecerá aquí con sus claves." />
        ) : (
          <ul className="order-list">
            {ordenes.map((orden) => (
              <li key={orden.id} className="order-item">
                <button className="order-summary" type="button" onClick={() => setAbierta(abierta === orden.id ? null : orden.id)} aria-expanded={abierta === orden.id}>
                  <span className="order-id">Orden #{orden.id}</span>
                  <time>{formatearFecha(orden.fechaCreacion)}</time>
                  <EstadoBadge estado={orden.estadoPago} />
                  <Precio valor={orden.total} />
                  <span aria-hidden="true">{abierta === orden.id ? '▴' : '▾'}</span>
                </button>
                {abierta === orden.id && (
                  <div className="order-detail">
                    {orden.cupon && <p className="cupon-usado">Cupón aplicado: <strong>{orden.cupon}</strong></p>}
                    <ul className="key-list">
                      {orden.items.map((item) => (
                        <li key={item.juegoId}>
                          <span className="key-game">{item.titulo}</span>
                          <code>{item.clave || 'Clave no disponible'}</code>
                          {item.clave && (
                            <button className="text-button" type="button" onClick={() => void copiarTexto(item.clave)}>Copiar</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <button className="text-button" type="button" onClick={onVerCatalogo}>Volver al catálogo →</button>
      </div>
    </div>
  )
}
