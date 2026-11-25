import { afterEach, describe, expect, it, vi } from 'vitest'
import { copiarTexto } from './clipboard'

describe('copiarTexto', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('devuelve true cuando el portapapeles acepta el texto', async () => {
    const escribir = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText: escribir } })
    await expect(copiarTexto('CLAVE-123')).resolves.toBe(true)
    expect(escribir).toHaveBeenCalledWith('CLAVE-123')
  })

  it('devuelve false cuando el navegador bloquea el portapapeles', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('bloqueado')) } })
    await expect(copiarTexto('CLAVE-123')).resolves.toBe(false)
  })
})
