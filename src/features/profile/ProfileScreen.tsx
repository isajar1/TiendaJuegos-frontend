import { useState } from 'react'
import { Aviso } from '../../components/ui'
import { eliminarMiCuenta } from '../../services/api'
import type { Sesion } from '../../types'

type Props = {
  sesion: Sesion
  onLogout: () => void
  onCuentaEliminada: () => void
}

export default function ProfileScreen({ sesion, onLogout, onCuentaEliminada }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  const eliminar = async () => {
    setEliminando(true)
    setError('')
    try {
      await eliminarMiCuenta()
      onCuentaEliminada()
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo eliminar la cuenta.')
      setEliminando(false)
      setConfirmando(false)
    }
  }

  const rol = sesion.rol.toLowerCase() === 'admin' ? 'Administrador' : 'Jugador'

  return (
    <section className="content-card" aria-labelledby="perfil-titulo">
      <div className="content-inner card-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TU ESPACIO</p>
            <h1 id="perfil-titulo">Mi perfil y configuración</h1>
          </div>
          <span className="count-pill">{rol}</span>
        </div>

        <Aviso mensaje={error} />

        <div className="profile-grid">
          <div className="profile-section">
            <h2>Tus datos</h2>
            <dl className="profile-datos">
              <div><dt>Nombre</dt><dd>{sesion.nombre}</dd></div>
              <div><dt>Correo</dt><dd>{sesion.correo}</dd></div>
              <div><dt>Tipo de cuenta</dt><dd>{rol}</dd></div>
            </dl>
          </div>
          <div className="profile-section">
            <h2>Sesión</h2>
            <p>Cierra tu sesión para que otra persona no use tu cuenta en este dispositivo.</p>
            <button className="soft-button" type="button" onClick={onLogout}>
              Cerrar sesión de mi cuenta
            </button>
          </div>
        </div>

        <div className="danger-zone">
          <h2>Eliminar cuenta</h2>
          <p>
            Esta acción es permanente: se borrarán tus datos personales, tu carrito y tu lista de
            deseos, y no podrás volver a ingresar con este correo. Tus compras y reseñas se conservan
            de forma anónima para no afectar el historial de ventas.
          </p>
          {confirmando ? (
            <div className="profile-confirm" role="alertdialog" aria-labelledby="confirmar-eliminacion">
              <strong id="confirmar-eliminacion">¿Estás seguro de eliminar tu cuenta?</strong>
              <div className="profile-confirm-actions">
                <button
                  className="soft-button"
                  type="button"
                  disabled={eliminando}
                  onClick={() => setConfirmando(false)}
                >
                  Cancelar
                </button>
                <button
                  className="soft-button danger"
                  type="button"
                  disabled={eliminando}
                  onClick={() => void eliminar()}
                >
                  {eliminando ? 'Eliminando…' : 'Confirmar eliminación'}
                </button>
              </div>
            </div>
          ) : (
            <button className="soft-button danger" type="button" onClick={() => setConfirmando(true)}>
              Eliminar mi cuenta
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
