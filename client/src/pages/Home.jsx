import PixelShip from '../components/PixelShip.jsx'
import PixelPlanet from '../components/PixelPlanet.jsx'
import { TEAM_COLORS } from '../components/raceUtils.js'
import { useI18n } from '../i18n/context.js'

// The graphic title screen (route "/", and what the installed PWA opens to). An
// 8-bit "attract screen": pixel ships racing toward a planet over a starfield,
// with a single Play button that always leads to the Admin Panel — the teacher
// picks/launches a game there, and only then does the board (/game) open. (The
// per-game "Resume" affordance lives on the Admin library, not here.)

// A scattered starfield for the title scene (coordinates in the 200x100 viewBox).
const STARS = [
  [12, 18], [34, 70], [60, 12], [88, 40], [120, 22], [150, 64],
  [180, 16], [24, 52], [72, 84], [104, 60], [168, 84], [190, 48],
]

// Three ships trailing up toward the planet, each a different team colour.
const SHIPS = [
  { x: 44, y: 78, size: 20, color: TEAM_COLORS[0] },
  { x: 78, y: 64, size: 17, color: TEAM_COLORS[1] },
  { x: 110, y: 50, size: 14, color: TEAM_COLORS[2] },
]

function Home() {
  const { lang, setLang, t } = useI18n()
  return (
    <main className="title-screen">
      <svg
        className="title-scene"
        viewBox="0 0 200 100"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {STARS.map(([x, y], i) => (
          <rect key={i} className="title-star" x={x} y={y} width="1.4" height="1.4" />
        ))}

        {/* destination planet, top-right */}
        <circle className="title-planet-halo" cx="168" cy="30" r="24" />
        <PixelPlanet cx={168} cy={30} size={40} variant={2} />

        {/* racing ships with little exhaust trails */}
        {SHIPS.map((s, i) => (
          <g key={i} className={`title-ship title-ship-${i}`}>
            <rect x={s.x - s.size * 0.7} y={s.y + 2} width="2.5" height="2.5" fill={s.color} opacity="0.5" />
            <rect x={s.x - s.size * 1.1} y={s.y + 4} width="2" height="2" fill={s.color} opacity="0.25" />
            <PixelShip cx={s.x} cy={s.y} size={s.size} color={s.color} />
          </g>
        ))}
      </svg>

      <h1 className="title-logo">Space Race</h1>
      <p className="title-tagline">{t('home.tagline')}</p>

      <a className="title-play nes-btn is-success" href="/admin">
        {t('home.play')}
      </a>

      {/* Language toggle for the whole game (persisted). Language names are shown
          in their own language, as is conventional for a language switcher. */}
      <div className="title-lang" role="group" aria-label={t('home.language')}>
        <button
          type="button"
          className={`nes-btn ${lang === 'en' ? 'is-primary' : ''}`}
          aria-pressed={lang === 'en'}
          onClick={() => setLang('en')}
        >
          English
        </button>
        <button
          type="button"
          className={`nes-btn ${lang === 'es' ? 'is-primary' : ''}`}
          aria-pressed={lang === 'es'}
          onClick={() => setLang('es')}
        >
          Español
        </button>
      </div>
    </main>
  )
}

export default Home
