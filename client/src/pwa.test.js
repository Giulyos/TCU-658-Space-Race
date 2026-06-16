import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Guards the PWA install configuration. The real installability check runs in a
// browser (manifest + icons + active service worker), but these text assertions
// stop a silent regression of the manifest/icon wiring that would break the
// "Add to Home Screen" prompt and offline launch. Vitest cwd = client/.
const viteConfig = readFileSync('vite.config.js', 'utf8')
const indexHtml = readFileSync('index.html', 'utf8')

describe('PWA manifest config (vite.config.js)', () => {
  it('references 192, 512 and a maskable icon', () => {
    expect(viteConfig).toContain('pwa-192.png')
    expect(viteConfig).toContain('pwa-512.png')
    expect(viteConfig).toContain('pwa-maskable-512.png')
    expect(viteConfig).toMatch(/purpose:\s*'maskable'/)
  })

  it('declares a standalone, installable app shell', () => {
    expect(viteConfig).toMatch(/display:\s*'standalone'/)
    expect(viteConfig).toMatch(/start_url:\s*'\/'/)
  })
})

describe('Workbox offline precaching (vite.config.js)', () => {
  it('precaches the sound effects and fonts (not just the default globs)', () => {
    expect(viteConfig).toMatch(/globPatterns:/)
    // wav is NOT in vite-plugin-pwa's default glob — it must be listed explicitly
    // or the sounds break offline.
    expect(viteConfig).toMatch(/globPatterns:\s*\[[^\]]*wav[^\]]*\]/)
    expect(viteConfig).toMatch(/globPatterns:\s*\[[^\]]*woff2[^\]]*\]/)
  })

  it('serves the SPA shell offline but never falls back for /api', () => {
    expect(viteConfig).toMatch(/navigateFallback:\s*'\/index\.html'/)
    expect(viteConfig).toMatch(/navigateFallbackDenylist:.*\/\^\\\/api/)
  })
})

describe('index.html PWA head', () => {
  it('has the app title, theme color and an apple-touch-icon', () => {
    expect(indexHtml).toMatch(/<title>Space Race<\/title>/)
    expect(indexHtml).toMatch(/name="theme-color"/)
    expect(indexHtml).toContain('apple-touch-icon')
  })
})
