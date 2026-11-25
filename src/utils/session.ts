import type { Sesion } from '../types'

const SESSION_KEY = 'tienda-juegos.session'

function tokenValid(token: string): boolean {
  try {
    const payload = token.split('.')[1]
    if (!payload) return false
    const normalizado = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(normalizado)) as { exp?: number }
    return Boolean(claims.exp && claims.exp * 1000 > Date.now())
  } catch {
    return false
  }
}

export function leerSesion(): Sesion | null {
  try {
    const guardado = localStorage.getItem(SESSION_KEY)
    if (!guardado) return null
    const sesion = JSON.parse(guardado) as Sesion
    if (!sesion.token || !tokenValid(sesion.token)) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return sesion
  } catch {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // El navegador puede tener el almacenamiento desactivado.
    }
    return null
  }
}

export function guardarSesion(sesion: Sesion): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion))
}

export function borrarSesion(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function formatearDinero(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor)
}

export function formatearFecha(valor: string): string {
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha)
}

export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}
