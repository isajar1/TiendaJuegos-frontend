import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameCard from './GameCard'
import type { Juego } from '../types'

const juego: Juego = {
  id: 3,
  titulo: 'Aventura espacial',
  descripcion: 'Explora la galaxia.',
  precio: 49900,
  region: 'Global',
  plataforma: 'PC',
  categoria: 'Aventura',
  activo: true,
  clavesDisponibles: 2,
  calificacionPromedio: 4.5,
  totalResenas: 3,
}

describe('GameCard', () => {
  it('muestra la información del juego y permite ver detalle, agregar y desear', () => {
    const onAgregar = vi.fn()
    const onVerDetalle = vi.fn()
    const onToggleDeseo = vi.fn()
    render(
      <GameCard
        juego={juego}
        indice={20}
        onAgregar={onAgregar}
        onVerDetalle={onVerDetalle}
        onToggleDeseo={onToggleDeseo}
      />,
    )

    expect(screen.getByRole('heading', { name: juego.titulo })).toBeInTheDocument()
    expect(screen.getByText(/aventura · global/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/calificación 4\.5 de 5/i)).toBeInTheDocument()
    expect(screen.getByText('(3)')).toBeInTheDocument()
    expect(screen.getAllByText(/49\.900/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /^detalles$/i }).closest('article')).toHaveStyle({ animationDelay: '360ms' })

    fireEvent.click(screen.getByRole('button', { name: /^detalles$/i }))
    fireEvent.click(screen.getByRole('button', { name: /añadir/i }))
    fireEvent.click(screen.getByRole('button', { name: /agregar aventura espacial a deseos/i }))
    expect(onVerDetalle).toHaveBeenCalledWith(juego)
    expect(onAgregar).toHaveBeenCalledWith(juego)
    expect(onToggleDeseo).toHaveBeenCalledWith(juego)
  })

  it('deshabilita la compra cuando no hay claves disponibles', () => {
    const onAgregar = vi.fn()
    const sinStock = { ...juego, clavesDisponibles: 0, descripcion: '', calificacionPromedio: undefined, activo: false }
    render(<GameCard juego={sinStock} onAgregar={onAgregar} onVerDetalle={vi.fn()} />)
    expect(screen.getByRole('button', { name: /sin stock/i })).toBeDisabled()
    expect(screen.getByText(/sin descripción disponible/i)).toBeInTheDocument()
    expect(screen.getByText(/juego desactivado/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /sin stock/i }))
    expect(onAgregar).not.toHaveBeenCalled()
  })

  it('permite quitar del carrito y mostrar un juego marcado como deseado', () => {
    const onQuitar = vi.fn()
    render(<GameCard juego={juego} enDeseos onAgregar={vi.fn()} onVerDetalle={vi.fn()} onToggleDeseo={vi.fn()} onQuitar={onQuitar} />)
    expect(screen.getByRole('button', { name: 'Quitar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quitar aventura espacial de deseos/i })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Quitar' }))
    expect(onQuitar).toHaveBeenCalledWith(juego)
  })
})
