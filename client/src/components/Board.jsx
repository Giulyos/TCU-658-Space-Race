import { teamColor } from './raceUtils.js'
import { layoutFor, makeWindingPath, sampleAlong, planetVariant, BOARD_W, BOARD_H } from './boardLayout.js'
import PixelShip from './PixelShip.jsx'
import PixelPlanet from './PixelPlanet.jsx'
import { PLANET_COUNT } from './planetVariants.js'

const FINISH_SLOT = 99 // distinct slot so the finish planet varies independently

// The Jumanji-style board: each team starts on its own home planet and follows a
// winding path to a shared finish planet, one board space per step
// (0..finishLine). A team's ship sits on the space matching its score (on its
// home planet at 0); reaching the finish wins. Planet variants are chosen from
// the per-game map seed so each game looks different. Driven by polled state.
function Board({ state }) {
  if (!state) return null
  const { positions, finishLine, teamNames, currentTeam, winner, mapSeed } = state
  const { finish, starts } = layoutFor(teamNames.length)

  const teams = teamNames.map((name, i) => {
    const team = i + 1
    const start = starts[i] ?? starts[starts.length - 1]
    const path = makeWindingPath(start, finish)
    const spaces = sampleAlong(path, finishLine)
    const pos = Math.min(Math.max(positions[i] ?? 0, 0), finishLine)
    return { team, name, color: teamColor(team), start, path, spaces, ship: spaces[pos], pos }
  })

  return (
    <div className="board" role="group" aria-label="Race board">
      <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className="board-svg" preserveAspectRatio="xMidYMid meet">
        {/* each team's winding road (pixel tiles) + its board spaces (squares) */}
        {teams.map((t) => {
          const road = sampleAlong(t.path, finishLine * 2)
          return (
            <g key={t.team}>
              {road.map((p, idx) => (
                <rect
                  key={`road-${idx}`}
                  className="road-tile"
                  x={(p[0] - 0.65).toFixed(2)}
                  y={(p[1] - 0.65).toFixed(2)}
                  width="1.3"
                  height="1.3"
                />
              ))}
              {t.spaces.map((s, idx) => (
                <rect
                  key={`space-${idx}`}
                  className="board-space"
                  x={(s[0] - 1.5).toFixed(2)}
                  y={(s[1] - 1.5).toFixed(2)}
                  width="3"
                  height="3"
                  style={{ fill: t.color }}
                />
              ))}
            </g>
          )
        })}

        {/* each team's home planet at its start */}
        {teams.map((t) => (
          <PixelPlanet
            key={`home-${t.team}`}
            cx={t.start[0]}
            cy={t.start[1]}
            size={19}
            variant={planetVariant(mapSeed, t.team - 1, PLANET_COUNT)}
          />
        ))}

        {/* the shared finish planet (the destination) */}
        <g aria-label="Finish planet">
          <circle className="board-finish-halo" cx={finish[0]} cy={finish[1]} r="16" />
          <PixelPlanet
            cx={finish[0]}
            cy={finish[1]}
            size={27}
            variant={planetVariant(mapSeed, FINISH_SLOT, PLANET_COUNT)}
          />
        </g>

        {/* ships on top */}
        {teams.map((t) => {
          const isCurrent = currentTeam === t.team && winner == null
          const isWinner = winner === t.team
          const cls = ['board-ship', isCurrent ? 'is-current' : '', isWinner ? 'is-winner' : '']
            .filter(Boolean)
            .join(' ')
          return (
            <g
              key={`ship-${t.team}`}
              className={cls}
              data-team={t.team}
              data-x={t.ship[0].toFixed(3)}
              data-y={t.ship[1].toFixed(3)}
              aria-label={`Team ${t.team} spaceship`}
            >
              {(isCurrent || isWinner) && (
                <circle className="ship-halo" cx={t.ship[0]} cy={t.ship[1]} r="9" />
              )}
              <PixelShip cx={t.ship[0]} cy={t.ship[1]} size={14} color={t.color} />
            </g>
          )
        })}
      </svg>

      <ul className="board-legend">
        {teams.map((t) => (
          <li key={t.team} style={{ '--team-color': t.color }}>
            <span className="legend-name">{t.name}</span>
            <span className="legend-pos">
              {t.pos}/{finishLine}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Board
