import { describe, it, expect, vi, afterEach } from 'vitest'
import { openBrowser } from './openBrowser.js'

const realPlatform = process.platform
const setPlatform = (value) =>
  Object.defineProperty(process, 'platform', { value, configurable: true })
const fakeChild = () => ({ on: vi.fn(), unref: vi.fn() })

afterEach(() => setPlatform(realPlatform))

describe('openBrowser', () => {
  it('uses `open` on macOS', () => {
    setPlatform('darwin')
    const spawn = vi.fn(fakeChild)
    expect(openBrowser('http://localhost:3001', spawn)).toBe(true)
    expect(spawn).toHaveBeenCalledWith('open', ['http://localhost:3001'], expect.any(Object))
  })

  it('uses `cmd /c start` on Windows', () => {
    setPlatform('win32')
    const spawn = vi.fn(fakeChild)
    openBrowser('http://localhost:3001', spawn)
    expect(spawn).toHaveBeenCalledWith('cmd', ['/c', 'start', '', 'http://localhost:3001'], expect.any(Object))
  })

  it('uses `xdg-open` on Linux', () => {
    setPlatform('linux')
    const spawn = vi.fn(fakeChild)
    openBrowser('http://localhost:3001', spawn)
    expect(spawn).toHaveBeenCalledWith('xdg-open', ['http://localhost:3001'], expect.any(Object))
  })

  it('never throws (returns false) if spawning fails', () => {
    const spawn = vi.fn(() => {
      throw new Error('no opener')
    })
    expect(openBrowser('http://localhost:3001', spawn)).toBe(false)
  })
})
