import type { ReactNode } from 'react'
import { formatearDinero } from '../utils/session'

type FieldProps = {
  id: string
  label: string
  type?: string
  autoComplete?: string
  minLength?: number
  maxLength?: number
  placeholder?: string
  value: string
  onChange: (valor: string) => void
  error?: string
  hint?: string
  required?: boolean
}

export function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  minLength,
  maxLength,
  placeholder,
  value,
  onChange,
  error,
  hint,
  required = true,
}: FieldProps) {
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
        placeholder={placeholder}
        value={value}
        onChange={(evento) => onChange(evento.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        required={required}
      />
      {hint && !error && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (valor: string) => void
  children: ReactNode
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(evento) => onChange(evento.target.value)}>
        {children}
      </select>
    </div>
  )
}

export function EmptyState({ titulo, mensaje }: { titulo: string; mensaje: string }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">◇</span>
      <h3>{titulo}</h3>
      <p>{mensaje}</p>
    </div>
  )
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  )
}

export function Aviso({ mensaje, tipo = 'error' }: { mensaje: string; tipo?: 'error' | 'exito' }) {
  if (!mensaje) return null
  return (
    <p className={tipo === 'error' ? 'form-error' : 'form-success'} role={tipo === 'error' ? 'alert' : 'status'}>
      {mensaje}
    </p>
  )
}

export function Precio({ valor }: { valor: number }) {
  return <strong className="precio">{formatearDinero(valor)}</strong>
}

export function EstadoBadge({ estado }: { estado: string }) {
  const clase = estado.toLowerCase().replace(/\s+/g, '-')
  return <span className={`estado-badge estado-${clase}`}>{estado}</span>
}
