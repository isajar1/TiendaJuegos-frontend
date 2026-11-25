import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Aviso, Cargando, EmptyState, EstadoBadge, Field, Precio, SelectField } from './ui'

describe('componentes de interfaz', () => {
  it('Field muestra la pista, propaga cambios y resalta errores', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Field id="correo" label="Correo" hint="Ejemplo: ana@correo.com" value="" onChange={onChange} />,
    )
    expect(screen.getByText(/ejemplo: ana@correo.com/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'ana@correo.com' } })
    expect(onChange).toHaveBeenCalledWith('ana@correo.com')

    rerender(<Field id="correo" label="Correo" error="Correo inválido" value="" onChange={onChange} />)
    expect(screen.queryByText(/ejemplo: ana@correo.com/i)).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/correo inválido/i)
    expect(screen.getByLabelText(/correo/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/correo/i)).toHaveAttribute('aria-describedby', 'correo-error')
  })

  it('SelectField, EmptyState y Cargando renderizan su contenido', () => {
    const onChange = vi.fn()
    render(
      <>
        <SelectField id="region" label="Región" value="Global" onChange={onChange}>
          <option value="Global">Global</option>
        </SelectField>
        <EmptyState titulo="Sin juegos" mensaje="Aún no hay resultados." />
        <Cargando texto="Cargando juegos…" />
      </>,
    )
    fireEvent.change(screen.getByLabelText(/región/i), { target: { value: 'Global' } })
    expect(onChange).toHaveBeenCalledWith('Global')
    expect(screen.getByRole('heading', { name: /sin juegos/i })).toBeInTheDocument()
    expect(screen.getByText(/aún no hay resultados/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/cargando juegos/i)
  })

  it('Aviso solo se muestra con mensaje y distingue error de éxito', () => {
    const { rerender } = render(<Aviso mensaje="" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    rerender(<Aviso mensaje="Fallo" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Fallo')
    rerender(<Aviso mensaje="Listo" tipo="exito" />)
    expect(screen.getByRole('status')).toHaveTextContent('Listo')
  })

  it('Precio formatea el valor y EstadoBadge normaliza la clase', () => {
    render(
      <>
        <Precio valor={1234567} />
        <EstadoBadge estado="En camino" />
      </>,
    )
    expect(screen.getByText(/1\.234\.567/)).toBeInTheDocument()
    expect(screen.getByText('En camino')).toHaveClass('estado-en-camino')
  })
})
