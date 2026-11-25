import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminScreen from './AdminScreen'
import { crearAdministrador } from '../../services/api'

vi.mock('../../services/api', () => ({
  actualizarCupon: vi.fn(),
  actualizarJuego: vi.fn(),
  cambiarEstadoOrden: vi.fn(),
  cargarClaves: vi.fn(),
  crearAdministrador: vi.fn(),
  crearCupon: vi.fn(),
  crearJuego: vi.fn(),
  desactivarJuego: vi.fn(),
  listarCategorias: vi.fn(async () => []),
  listarCupones: vi.fn(async () => []),
  listarJuegos: vi.fn(async () => []),
  listarOrdenes: vi.fn(async () => []),
  listarPlataformas: vi.fn(async () => []),
  reporteClientes: vi.fn(async () => []),
  reporteVentas: vi.fn(async () => []),
}))

const crearAdministradorMock = vi.mocked(crearAdministrador)

async function abrirPestañaUsuarios() {
  fireEvent.click(screen.getByRole('tab', { name: 'Usuarios' }))
  expect(await screen.findByRole('heading', { name: /nuevo administrador/i })).toBeInTheDocument()
}

function llenarFormulario() {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nuevo admin' } })
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'nuevo@mail.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
}

describe('AdminScreen: alta de administradores', () => {
  beforeEach(() => {
    crearAdministradorMock.mockReset()
  })

  afterEach(cleanup)

  it('crea un administrador y limpia el formulario', async () => {
    crearAdministradorMock.mockResolvedValue({ id: 3, nombre: 'Nuevo admin', correo: 'nuevo@mail.com', rol: 'admin' })
    render(<AdminScreen />)
    await abrirPestañaUsuarios()

    llenarFormulario()
    fireEvent.click(screen.getByRole('button', { name: 'Crear administrador' }))

    expect(await screen.findByText('Administrador creado. Ya puede iniciar sesión.')).toBeInTheDocument()
    expect(crearAdministradorMock).toHaveBeenCalledWith({
      nombre: 'Nuevo admin',
      correo: 'nuevo@mail.com',
      contrasena: 'password123',
    })
    await waitFor(() => expect(screen.getByLabelText('Nombre')).toHaveValue(''))
  })

  it('muestra el error cuando el servidor rechaza el alta', async () => {
    crearAdministradorMock.mockRejectedValue(new Error('No tienes permiso para realizar esta acción.'))
    render(<AdminScreen />)
    await abrirPestañaUsuarios()

    llenarFormulario()
    fireEvent.click(screen.getByRole('button', { name: 'Crear administrador' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para realizar esta acción.')
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('nuevo@mail.com')
  })
})
