import { useEffect } from 'react'
import { teamColor } from './raceUtils.js'
import { play } from '../sound/sounds.js'
import { useI18n } from '../i18n/context.js'

// Full-screen celebratory banner shown on the projected board when a team
// reaches the finish line. The Board defers it (show=false) until the winning
// ship has finished gliding onto the finish planet, so the win lands *after* the
// movement, not on top of it. Restart lives on the Admin panel, so the banner is
// purely a display — it captures no clicks.
function WinnerBanner({ state, show }) {
  const { t } = useI18n()
  const visible = !!state && state.winner != null && show

  // Play the win fanfare once, when the banner actually appears (after the ship
  // has glided in). Honors mute inside play(); follows the teacher's gestures so
  // playback is permitted.
  useEffect(() => {
    if (visible) play('win')
  }, [visible])

  if (!visible) return null

  const team = state.winner
  const name = state.teamNames[team - 1] ?? `Team ${team}`

  return (
    <div
      className="winner-banner"
      role="alert"
      aria-label={t('winner.ariaWins', { name })}
      style={{ '--team-color': teamColor(team) }}
    >
      <div className="winner-card nes-container is-dark">
        <p className="winner-stars">★ ★ ★</p>
        <p className="winner-name">{name}</p>
        <p className="winner-sub">{t('winner.wins')}</p>
      </div>
    </div>
  )
}

export default WinnerBanner
