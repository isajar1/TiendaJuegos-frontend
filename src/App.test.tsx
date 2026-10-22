import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('muestra el nombre de la tienda', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /tienda juegos/i })).toBeInTheDocument()
  })
})
