import { teamColor } from './raceUtils.js'
import { useI18n } from '../i18n/context.js'

// Shows whose turn it is (or a paused notice). Hidden before a game starts and
// once there is a winner (the winner banner from #35 takes over then).
function TurnIndicator({ state }) {
  const { t } = useI18n()
  if (!state || state.active === 0 || state.winner != null) return null

  const name = state.teamNames[state.currentTeam - 1]
  const paused = state.active === 2

  // The team name is a coloured span, and word order differs by language
  // ("{name}'s turn" vs "Turno de {name}"), so split the template on {name} and
  // drop the coloured name span into the gap.
  const [before, after] = t('turn.turn').split('{name}')

  return (
    <div className="turn-indicator" style={{ '--team-color': teamColor(state.currentTeam) }}>
      {paused ? (
        <span>{t('turn.paused')}</span>
      ) : (
        <span>
          {before}
          <span className="turn-team">{name}</span>
          {after}
        </span>
      )}
    </div>
  )
}

export default TurnIndicator
