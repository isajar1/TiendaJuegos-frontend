import { useState, type FormEvent } from 'react'

type User = { id: number; nombre: string; correo: string; rol: string }
type AuthResponse = User & { token: string }
type AuthMode = 'login' | 'register'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const SESSION_KEY = 'tienda-juegos.session'

function readSession(): AuthResponse | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null
    const session = JSON.parse(stored) as AuthResponse
    const claims = JSON.parse(atob(session.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    if (!session.token || !claims.exp || claims.exp * 1000 <= Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    try { localStorage.removeItem(SESSION_KEY) } catch { /* Storage may be disabled by the browser. */ }
    return null
  }
}

async function authenticate(path: AuthMode, payload: Record<string, string>) {
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo en un momento.')
  }

  const data = (await response.json().catch(() => ({}))) as { message?: string } & Partial<AuthResponse>
  if (!response.ok) {
    if (response.status === 409) throw new Error('Este correo ya tiene una cuenta registrada.')
    if (response.status === 401) throw new Error('Correo o contraseña incorrectos.')
    throw new Error(data.message ?? 'No pudimos completar la solicitud. Revisa tus datos e inténtalo de nuevo.')
  }
  if (!data.token) throw new Error('El servidor respondió sin una sesión válida. Inténtalo de nuevo.')
  return data as AuthResponse
}

function Field({
  id, label, type = 'text', autoComplete, minLength, maxLength, value, onChange, error,
}: {
  id: string; label: string; type?: string; autoComplete: string; minLength?: number; maxLength?: number
  value: string; onChange: (value: string) => void; error?: string
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        required
      />
      {error && <span className="field-error" id={`${id}-error`} role="alert">{error}</span>}
    </div>
  )
}

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [session, setSession] = useState<AuthResponse | null>(readSession)
  const [busy, setBusy] = useState<AuthMode | null>(null)
  const [login, setLogin] = useState({ correo: '', contrasena: '' })
  const [register, setRegister] = useState({ nombre: '', correo: '', contrasena: '' })
  const [errors, setErrors] = useState<Partial<Record<'login' | 'register', string>>>({})
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

  const submit = async (event: FormEvent<HTMLFormElement>, form: AuthMode) => {
    event.preventDefault()
    if (busy) return
    setErrors((current) => ({ ...current, [form]: undefined }))
    const email = form === 'login' ? login.correo.trim() : register.correo.trim()
    const password = form === 'login' ? login.contrasena : register.contrasena
    const nextFieldErrors: Record<string, string> = {}
    if (form === 'register' && !register.nombre.trim()) nextFieldErrors['register-name'] = 'Ingresa tu nombre completo.'
    if (!email) nextFieldErrors[`${form}-email`] = 'Ingresa tu correo electrónico.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextFieldErrors[`${form}-email`] = 'Escribe un correo electrónico válido.'
    if (!password) nextFieldErrors[`${form}-password`] = 'Ingresa tu contraseña.'
    else if (form === 'register' && (password.length < 8 || password.length > 72)) nextFieldErrors['register-password'] = 'La contraseña debe tener entre 8 y 72 caracteres.'
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) return
    setBusy(form)
    try {
      const payload = form === 'login' ? { ...login, correo: email } : { ...register, nombre: register.nombre.trim(), correo: email }
      const result = await authenticate(form, payload)
      localStorage.setItem(SESSION_KEY, JSON.stringify(result))
      setSession(result)
    } catch (error) {
      setErrors((current) => ({ ...current, [form]: error instanceof Error ? error.message : 'Ocurrió un error inesperado.' }))
    } finally {
      setBusy(null)
    }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
    setLogin({ correo: '', contrasena: '' })
    setRegister({ nombre: '', correo: '', contrasena: '' })
    changeMode('login')
  }

  return (
    <main className="auth-page">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />
      <header className="brand"><span className="brand-mark" aria-hidden="true">✦</span><span>TIENDA <span className="brand-light">JUEGOS</span></span></header>
      <p className="page-intro">Tu próxima aventura empieza aquí.</p>

      {session ? (
        <section className="welcome-card" aria-live="polite">
          <div className="success-mark" aria-hidden="true">✓</div>
          <p className="eyebrow">SESIÓN ACTIVA</p>
          <h1>¡Qué bueno verte, {session.nombre}!</h1>
          <p className="welcome-copy">Has iniciado sesión como <strong>{session.correo}</strong>.</p>
          <button className="text-button" type="button" onClick={logout}>Cerrar sesión</button>
        </section>
      ) : (
        <div className="auth-layout">
          {mode === 'login' ? <section className={`auth-card login-card selected${transitioning ? ' switching' : ''}`} aria-labelledby="login-title">
            <div className="card-orbit orbit-one" aria-hidden="true" /><div className="card-orbit orbit-two" aria-hidden="true" />
            <div className="card-content">
              <div className="card-icon" aria-hidden="true">◈</div>
              <p className="eyebrow">BIENVENIDO DE VUELTA</p>
              <h1 id="login-title">Iniciar sesión</h1>
              <p className="card-subtitle">Continúa justo donde empezó la aventura.</p>
              <form noValidate onSubmit={(event) => void submit(event, 'login')}>
                <Field id="login-email" label="Correo electrónico" type="email" autoComplete="email" maxLength={160} value={login.correo} error={fieldErrors['login-email']} onChange={(correo) => { setLogin({ ...login, correo }); setFieldErrors((current) => ({ ...current, 'login-email': '' })) }} />
                <Field id="login-password" label="Contraseña" type="password" autoComplete="current-password" value={login.contrasena} error={fieldErrors['login-password']} onChange={(contrasena) => { setLogin({ ...login, contrasena }); setFieldErrors((current) => ({ ...current, 'login-password': '' })) }} />
                {errors.login && <p className="form-error" role="alert">{errors.login}</p>}
                <button className="primary-button" type="submit" disabled={busy !== null}>
                  {busy === 'login' ? <><span className="spinner" aria-hidden="true" /> Ingresando…</> : 'Entrar'}
                </button>
              </form>
              <p className="switch-prompt">¿Aún no tienes cuenta? <button className="text-button" type="button" onClick={() => changeMode('register')}>Regístrate</button></p>
            </div>
          </section> : <section className={`auth-card register-card selected${transitioning ? ' switching' : ''}`} aria-labelledby="register-title">
            <div className="card-orbit orbit-three" aria-hidden="true" /><div className="card-orbit orbit-four" aria-hidden="true" />
            <div className="card-content">
              <div className="card-icon" aria-hidden="true">✧</div>
              <p className="eyebrow">EMPIEZA TU HISTORIA</p>
              <h2 id="register-title">Crear cuenta</h2>
              <p className="card-subtitle">Únete a la comunidad de jugadores.</p>
              <form noValidate onSubmit={(event) => void submit(event, 'register')}>
                <Field id="register-name" label="Nombre completo" autoComplete="name" maxLength={120} value={register.nombre} error={fieldErrors['register-name']} onChange={(nombre) => { setRegister({ ...register, nombre }); setFieldErrors((current) => ({ ...current, 'register-name': '' })) }} />
                <Field id="register-email" label="Correo electrónico" type="email" autoComplete="email" maxLength={160} value={register.correo} error={fieldErrors['register-email']} onChange={(correo) => { setRegister({ ...register, correo }); setFieldErrors((current) => ({ ...current, 'register-email': '' })) }} />
                <Field id="register-password" label="Contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={register.contrasena} error={fieldErrors['register-password']} onChange={(contrasena) => { setRegister({ ...register, contrasena }); setFieldErrors((current) => ({ ...current, 'register-password': '' })) }} />
                <p className="field-hint">Usa entre 8 y 72 caracteres.</p>
                {errors.register && <p className="form-error" role="alert">{errors.register}</p>}
                <button className="primary-button" type="submit" disabled={busy !== null}>
                  {busy === 'register' ? <><span className="spinner" aria-hidden="true" /> Creando cuenta…</> : 'Registrarme'}
                </button>
              </form>
              <p className="switch-prompt">¿Ya tienes cuenta? <button className="text-button" type="button" onClick={() => changeMode('login')}>Inicia sesión</button></p>
            </div>
          </section>}
        </div>
      )}
      <footer className="page-footer">JUEGA A TU MANERA <span aria-hidden="true">·</span> COMPRA CON CONFIANZA</footer>
    </main>
  )
}

export default App
