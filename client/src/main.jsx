import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Retro 8-bit styling, all bundled locally (no CDN / network) to stay offline:
// the Press Start 2P pixel font is self-hosted via @fontsource, and NES.css is
// a pure-CSS component library. Our own styles import last so they can override.
import '@fontsource/press-start-2p'
import 'nes.css/css/nes.min.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
