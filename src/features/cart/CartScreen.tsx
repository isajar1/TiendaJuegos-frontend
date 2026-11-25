import { useState, type FormEvent } from 'react'
import { Aviso, Cargando, EmptyState, EstadoBadge, Precio } from '../../components/ui'
import { copiarTexto } from '../../utils/clipboard'
import { formatearDinero } from '../../utils/session'
import type { Carrito, Orden } from '../../types'

type Props = {
  carrito: Carrito | null
  cargando: boolean
  procesando: boolean
  error: string
  cuponError: string
  orden: Orden | null
  onQuitar: (juegoId: number) => void
  onVaciar: () => void
  onAplicarCupon: (codigo: string) => void
  onPagar: (aprobar: boolean) => void
  onVerCatalogo: () => void
}

export default function CartScreen({
  carrito,
  cargando,
  procesando,
  error,
  cuponError,
  orden,
  onQuitar,
  onVaciar,
  onAplicarCupon,
  onPagar,
  onVerCatalogo,
}: Props) {
  const [codigo, setCodigo] = useState('')

  const aplicar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (codigo.trim()) onAplicarCupon(codigo.trim())
  }

  if (orden) {
    const pagada = orden.estadoPago.toLowerCase() === 'pagado'
    return (
      <div className="content-card">
        <div className="card-content content-inner receipt">
          <p className="eyebrow">{pagada ? 'COMPRA CONFIRMADA' : 'PAGO NO APROBADO'}</p>
          <h1>{pagada ? '¡Tus claves están listas!' : 'La transacción no fue aprobada'}</h1>
          <p className="card-subtitle">
            {pagada
              ? 'Guardamos tu compra en el historial. Copia tus claves y disfruta.'
              : 'Tu carrito se conserva para que puedas intentarlo de nuevo.'}
          </p>
          <div className="receipt-head">
            <span>Orden #{orden.id}</span>
            <EstadoBadge estado={orden.estadoPago} />
            <Precio valor={orden.total} />
          </div>
          {pagada && (
            <ul className="key-list">
              {orden.items.map((item) => (
                <li key={item.juegoId}>
                  <span className="key-game">{item.titulo}</span>
                  <code>{item.clave}</code>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => void copiarTexto(item.clave)}
                  >
                    Copiar
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button className="primary-button" type="button" onClick={onVerCatalogo}>Seguir comprando</button>
        </div>
      </div>
    )
  }

  const items = carrito?.items ?? []

  return (
    <div className="content-card">
      <div className="card-content content-inner">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TU SELECCIÓN</p>
            <h1>Carrito de compras</h1>
            <p className="card-subtitle">Revisa tus juegos y aplica un cupón antes de pagar.</p>
          </div>
          {items.length > 0 && (
            <button className="text-button" type="button" onClick={onVaciar}>Vaciar carrito</button>
          )}
        </div>

        <Aviso mensaje={error} />
        {cargando ? (
          <Cargando texto="Cargando carrito…" />
        ) : items.length === 0 ? (
          <EmptyState titulo="Tu carrito está vacío" mensaje="Agrega juegos desde el catálogo para continuar." />
        ) : (
          <div className="cart-layout">
            <ul className="cart-list">
              {items.map((item) => (
                <li key={item.juegoId} className="cart-item">
                  <span className="cart-glyph" aria-hidden="true">{item.titulo.charAt(0)}</span>
                  <div className="cart-item-info">
                    <h3>{item.titulo}</h3>
                    <Precio valor={item.precio} />
                  </div>
                  <button
                    className="soft-button danger"
                    type="button"
                    onClick={() => onQuitar(item.juegoId)}
                    aria-label={`Quitar ${item.titulo} del carrito`}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>

            <aside className="summary-card">
              <h2>Resumen</h2>
              <dl className="summary-rows">
                <div><dt>Subtotal</dt><dd>{formatearDinero(carrito?.subtotal ?? 0)}</dd></div>
                <div><dt>Descuento</dt><dd className="descuento">-{formatearDinero(carrito?.descuento ?? 0)}</dd></div>
                <div className="summary-total"><dt>Total</dt><dd>{formatearDinero(carrito?.total ?? 0)}</dd></div>
              </dl>
              <form className="coupon-form" onSubmit={aplicar}>
                <label htmlFor="cupon-codigo">Cupón</label>
                <div className="coupon-row">
                  <input
                    id="cupon-codigo"
                    value={codigo}
                    placeholder="Ej. BIENVENIDO10"
                    onChange={(evento) => setCodigo(evento.target.value)}
                  />
                  <button className="soft-button" type="submit" disabled={procesando}>Aplicar</button>
                </div>
              </form>
              {carrito?.cupon && <Aviso tipo="exito" mensaje={`Cupón ${carrito.cupon} aplicado.`} />}
              <Aviso mensaje={cuponError} />
              <button
                className="primary-button"
                type="button"
                disabled={procesando}
                onClick={() => onPagar(true)}
              >
                {procesando ? <><span className="spinner" aria-hidden="true" /> Procesando…</> : 'Pagar ahora'}
              </button>
              <button
                className="text-button secondary-action"
                type="button"
                disabled={procesando}
                onClick={() => onPagar(false)}
              >
                Simular pago rechazado
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
