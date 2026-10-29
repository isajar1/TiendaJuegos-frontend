import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('muestra el inicio de sesión y permite abrir el registro', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /crear cuenta/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /regístrate/i }))
    expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument()
  })
})
