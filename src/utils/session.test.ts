import { beforeEach, describe, expect, it } from 'vitest'
import { borrarSesion, formatearDinero, formatearFecha, guardarSesion, hoyISO, leerSesion } from './session'
import type { Sesion } from '../types'

const CLAVE = 'tienda-juegos.session'

function token(exp: number): string {
  const payload = btoa(JSON.stringify({ exp }))
  return `header.${payload.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}.firma`
}

const sesion: Sesion = {
  id: 4,
  nombre: 'Prueba',
  correo: 'prueba@correo.com',
  rol: 'cliente',
  token: token(Math.floor(Date.now() / 1000) + 600),
}

describe('utilidades de sesión', () => {
  beforeEach(() => localStorage.clear())

  it('devuelve null cuando no hay sesión guardada', () => {
    expect(leerSesion()).toBeNull()
  })

  it('guarda y recupera una sesión válida', () => {
    guardarSesion(sesion)
    expect(localStorage.getItem(CLAVE)).toContain('prueba@correo.com')
    expect(leerSesion()).toEqual(sesion)
  })

  it('descarta y elimina una sesión con token expirado', () => {
    localStorage.setItem(CLAVE, JSON.stringify({ ...sesion, token: token(Math.floor(Date.now() / 1000) - 10) }))
    expect(leerSesion()).toBeNull()
    expect(localStorage.getItem(CLAVE)).toBeNull()
  })

  it('descarta sesiones con token sin payload o sin expiración', () => {
    localStorage.setItem(CLAVE, JSON.stringify({ ...sesion, token: 'sin-payload' }))
    expect(leerSesion()).toBeNull()
    localStorage.setItem(CLAVE, JSON.stringify({ ...sesion, token: token(0) }))
    expect(leerSesion()).toBeNull()
  })

  it('limpia el almacenamiento cuando el JSON está corrupto', () => {
    localStorage.setItem(CLAVE, '{json invalido')
    expect(leerSesion()).toBeNull()
    expect(localStorage.getItem(CLAVE)).toBeNull()
  })

  it('borra la sesión guardada', () => {
    guardarSesion(sesion)
    borrarSesion()
    expect(leerSesion()).toBeNull()
  })

  it('formatea dinero, fechas y la fecha de hoy en ISO', () => {
    expect(formatearDinero(1234567)).toContain('1.234.567')
    expect(formatearFecha('no-fecha')).toBe('no-fecha')
    expect(formatearFecha('2026-01-02T10:00:00')).toContain('2026')
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
