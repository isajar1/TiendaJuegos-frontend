import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthScreen from './AuthScreen'
import { autenticar } from '../../services/api'
import type { Sesion } from '../../types'

vi.mock('../../services/api', () => ({ autenticar: vi.fn() }))

const autenticarMock = vi.mocked(autenticar)

const sesion: Sesion = {
  id: 1,
  nombre: 'Ana',
  correo: 'ana@correo.com',
  rol: 'cliente',
  token: 'token',
}

function renderAuth(onAutenticado = vi.fn(), onVerCatalogo = vi.fn()) {
  render(<AuthScreen onAutenticado={onAutenticado} onVerCatalogo={onVerCatalogo} />)
  return { onAutenticado, onVerCatalogo }
}

async function cambiarAModoRegistro() {
  fireEvent.click(screen.getByRole('button', { name: /regístrate/i }))
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument()
  })
}

describe('AuthScreen', () => {
  beforeEach(() => {
    autenticarMock.mockReset()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
  })

  it('muestra errores de validación en el inicio de sesión', async () => {
    renderAuth()
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }))
    expect(await screen.findByText(/ingresa tu correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByText(/ingresa tu contraseña/i)).toBeInTheDocument()
    expect(autenticarMock).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'correo-invalido' } })
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }))
    expect(await screen.findByText(/escribe un correo electrónico válido/i)).toBeInTheDocument()
  })

  it('autentica con credenciales válidas y conmuta a registro', async () => {
    autenticarMock.mockResolvedValue(sesion)
    const { onAutenticado, onVerCatalogo } = renderAuth()

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: ' ana@correo.com ' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }))

    await waitFor(() => expect(onAutenticado).toHaveBeenCalledWith(sesion))
    expect(autenticarMock).toHaveBeenCalledWith('login', { correo: 'ana@correo.com', contrasena: '12345678' })

    await cambiarAModoRegistro()
    fireEvent.click(screen.getByRole('button', { name: /inicia sesión/i }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /ver catálogo/i }))
    expect(onVerCatalogo).toHaveBeenCalledTimes(1)
  })

  it('muestra el error devuelto por el servicio al iniciar sesión', async () => {
    autenticarMock.mockRejectedValue(new Error('Correo o contraseña incorrectos.'))
    renderAuth()
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'ana@correo.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/correo o contraseña incorrectos/i)
  })

  it('valida el formulario de registro y crea la cuenta', async () => {
    autenticarMock.mockResolvedValue(sesion)
    const { onAutenticado } = renderAuth()
    await cambiarAModoRegistro()

    fireEvent.click(screen.getByRole('button', { name: /registrarme/i }))
    expect(await screen.findByText(/ingresa tu nombre completo/i)).toBeInTheDocument()
    expect(screen.getByText(/ingresa tu correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByText(/ingresa tu contraseña/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: '  Ana Pérez  ' } })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'ana@correo.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'corta' } })
    fireEvent.click(screen.getByRole('button', { name: /registrarme/i }))
    expect(await screen.findByText(/entre 8 y 72 caracteres/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: /registrarme/i }))
    await waitFor(() => expect(onAutenticado).toHaveBeenCalledWith(sesion))
    expect(autenticarMock).toHaveBeenCalledWith('register', {
      nombre: 'Ana Pérez',
      correo: 'ana@correo.com',
      contrasena: '12345678',
    })
  })

  it('informa de errores inesperados durante el registro', async () => {
    autenticarMock.mockRejectedValue('fallo inesperado')
    renderAuth()
    await cambiarAModoRegistro()
    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'ana@correo.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: /registrarme/i }))
    expect(await screen.findByText(/ocurrió un error inesperado/i)).toBeInTheDocument()
  })
})
