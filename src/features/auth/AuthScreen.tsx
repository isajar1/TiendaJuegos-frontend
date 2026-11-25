import { useState, type FormEvent } from 'react'
import { Aviso, Field } from '../../components/ui'
import { autenticar } from '../../services/api'
import type { Sesion } from '../../types'

type AuthMode = 'login' | 'register'

type Props = {
  onAutenticado: (sesion: Sesion) => void
  onVerCatalogo: () => void
  mensaje?: string
}

export default function AuthScreen({ onAutenticado, onVerCatalogo, mensaje = '' }: Props) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [busy, setBusy] = useState<AuthMode | null>(null)
  const [login, setLogin] = useState({ correo: '', contrasena: '' })
  const [register, setRegister] = useState({ nombre: '', correo: '', contrasena: '' })
  const [errors, setErrors] = useState<Partial<Record<AuthMode, string>>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [transitioning, setTransitioning] = useState(false)

  const changeMode = (next: AuthMode) => {
    if (next === mode || transitioning) return
    setErrors({})
    setFieldErrors({})
    setTransitioning(true)
    window.setTimeout(() => {
      setMode(next)
      window.requestAnimationFrame(() => {
        document.getElementById(next === 'login' ? 'login-email' : 'register-name')?.focus()
        setTransitioning(false)
      })
    }, 180)
  }

  const submit = async (evento: FormEvent<HTMLFormElement>, form: AuthMode) => {
    evento.preventDefault()
    if (busy) return
    setErrors((actuales) => ({ ...actuales, [form]: undefined }))
    const correo = (form === 'login' ? login.correo : register.correo).trim()
    const contrasena = form === 'login' ? login.contrasena : register.contrasena
    const nuevosErrores: Record<string, string> = {}

    if (form === 'register' && !register.nombre.trim()) {
      nuevosErrores['register-name'] = 'Ingresa tu nombre completo.'
    }
    if (!correo) nuevosErrores[`${form}-email`] = 'Ingresa tu correo electrónico.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores[`${form}-email`] = 'Escribe un correo electrónico válido.'
    }
    if (!contrasena) nuevosErrores[`${form}-password`] = 'Ingresa tu contraseña.'
    else if (form === 'register' && (contrasena.length < 8 || contrasena.length > 72)) {
      nuevosErrores['register-password'] = 'La contraseña debe tener entre 8 y 72 caracteres.'
    }

    setFieldErrors(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setBusy(form)
    try {
      const payload: Record<string, string> =
        form === 'login'
          ? { correo, contrasena }
          : { nombre: register.nombre.trim(), correo, contrasena }
      onAutenticado(await autenticar(form, payload))
    } catch (error) {
      setErrors((actuales) => ({
        ...actuales,
        [form]: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      }))
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="auth-page">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />
      <header className="brand">
        <span className="brand-mark" aria-hidden="true">✦</span>
        <span>TIENDA <span className="brand-light">JUEGOS</span></span>
      </header>
      <p className="page-intro">Tu próxima aventura empieza aquí.</p>
      <Aviso tipo="exito" mensaje={mensaje} />

      <div className="auth-layout">
        {mode === 'login' ? (
          <section
            className={`auth-card login-card selected${transitioning ? ' switching' : ''}`}
            aria-labelledby="login-title"
          >
            <div className="card-orbit orbit-one" aria-hidden="true" />
            <div className="card-orbit orbit-two" aria-hidden="true" />
            <div className="card-content">
              <p className="eyebrow">BIENVENIDO DE VUELTA</p>
              <h1 id="login-title">Iniciar sesión</h1>
              <p className="card-subtitle">Continúa justo donde empezó la aventura.</p>
              <form noValidate onSubmit={(evento) => void submit(evento, 'login')}>
                <Field
                  id="login-email"
                  label="Correo electrónico"
                  type="email"
                  autoComplete="email"
                  maxLength={160}
                  value={login.correo}
                  error={fieldErrors['login-email']}
                  onChange={(correo) => {
                    setLogin({ ...login, correo })
                    setFieldErrors((actuales) => ({ ...actuales, 'login-email': '' }))
                  }}
                />
                <Field
                  id="login-password"
                  label="Contraseña"
                  type="password"
                  autoComplete="current-password"
                  value={login.contrasena}
                  error={fieldErrors['login-password']}
                  onChange={(contrasena) => {
                    setLogin({ ...login, contrasena })
                    setFieldErrors((actuales) => ({ ...actuales, 'login-password': '' }))
                  }}
                />
                <Aviso mensaje={errors.login ?? ''} />
                <button className="primary-button" type="submit" disabled={busy !== null}>
                  {busy === 'login' ? <><span className="spinner" aria-hidden="true" /> Ingresando…</> : 'Entrar'}
                </button>
              </form>
              <p className="switch-prompt">
                ¿Aún no tienes cuenta?{' '}
                <button className="text-button" type="button" onClick={() => changeMode('register')}>
                  Regístrate
                </button>
              </p>
            </div>
          </section>
        ) : (
          <section
            className={`auth-card register-card selected${transitioning ? ' switching' : ''}`}
            aria-labelledby="register-title"
          >
            <div className="card-orbit orbit-three" aria-hidden="true" />
            <div className="card-orbit orbit-four" aria-hidden="true" />
            <div className="card-content">
              <p className="eyebrow">EMPIEZA TU HISTORIA</p>
              <h2 id="register-title">Crear cuenta</h2>
              <p className="card-subtitle">Únete a la comunidad de jugadores.</p>
              <form noValidate onSubmit={(evento) => void submit(evento, 'register')}>
                <Field
                  id="register-name"
                  label="Nombre completo"
                  autoComplete="name"
                  maxLength={120}
                  value={register.nombre}
                  error={fieldErrors['register-name']}
                  onChange={(nombre) => {
                    setRegister({ ...register, nombre })
                    setFieldErrors((actuales) => ({ ...actuales, 'register-name': '' }))
                  }}
                />
                <Field
                  id="register-email"
                  label="Correo electrónico"
                  type="email"
                  autoComplete="email"
                  maxLength={160}
                  value={register.correo}
                  error={fieldErrors['register-email']}
                  onChange={(correo) => {
                    setRegister({ ...register, correo })
                    setFieldErrors((actuales) => ({ ...actuales, 'register-email': '' }))
                  }}
                />
                <Field
                  id="register-password"
                  label="Contraseña"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  value={register.contrasena}
                  error={fieldErrors['register-password']}
                  hint="Usa entre 8 y 72 caracteres."
                  onChange={(contrasena) => {
                    setRegister({ ...register, contrasena })
                    setFieldErrors((actuales) => ({ ...actuales, 'register-password': '' }))
                  }}
                />
                <Aviso mensaje={errors.register ?? ''} />
                <button className="primary-button" type="submit" disabled={busy !== null}>
                  {busy === 'register' ? <><span className="spinner" aria-hidden="true" /> Creando cuenta…</> : 'Registrarme'}
                </button>
              </form>
              <p className="switch-prompt">
                ¿Ya tienes cuenta?{' '}
                <button className="text-button" type="button" onClick={() => changeMode('login')}>
                  Inicia sesión
                </button>
              </p>
            </div>
          </section>
        )}
      </div>

      <button className="ghost-button catalogo-invite" type="button" onClick={onVerCatalogo}>
        Ver catálogo <span aria-hidden="true">→</span>
      </button>
      <footer className="page-footer">JUEGA A TU MANERA <span aria-hidden="true">·</span> COMPRA CON CONFIANZA</footer>
    </main>
  )
}
