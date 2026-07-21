import { useEffect, useRef, useState } from 'react'
import { teamColor } from './raceUtils.js'
import {
  layoutFor,
  makeWindingPath,
  sampleAlong,
  pointAtFraction,
  planetVariant,
  finishApproach,
  isUnderPlanet,
  BOARD_W,
  BOARD_H,
} from './boardLayout.js'
import PixelShip from './PixelShip.jsx'
import PixelPlanet from './PixelPlanet.jsx'
import WinnerBanner from './WinnerBanner.jsx'
import { PLANET_COUNT } from './planetVariants.js'
import { useI18n } from '../i18n/context.js'

const FINISH_SLOT = 99 // distinct slot so the finish planet varies independently
const ADVANCE_MS = 900 // duration of a ship's glide to its new space
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

// Smoothly animates each team's board position toward the latest target
// positions. On mount (and whenever a position already matches) it snaps with no
// animation; when a position changes (a turn was marked) it eases each ship
// along its road over ADVANCE_MS. Returns the per-team float positions plus
// whether an animation is currently running — used to defer the winner banner
// until the winning ship has actually arrived. Driven by the polled state, so a
// changed target interrupts cleanly from wherever the ship currently is.
function useAdvanceAnimation(targets) {
  const [display, setDisplay] = useState(targets)
  const [animating, setAnimating] = useState(false)
  const displayRef = useRef(targets)
  const rafRef = useRef(0)
  const key = targets.join(',')

  useEffect(() => {
    const from = displayRef.current
    const to = targets
    const sameLength = from.length === to.length
    if (!sameLength) {
      displayRef.current = to
      setDisplay(to)
      setAnimating(false)
      return
    }
    if (from.every((v, i) => v === to[i])) return // already there; no animation

    setAnimating(true)
    const start = performance.now()
    const step = (now) => {
      const t = Math.min((now - start) / ADVANCE_MS, 1)
      const e = easeInOut(t)
      const next = to.map((v, i) => from[i] + (v - from[i]) * e)
      displayRef.current = next
      setDisplay(next)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
      else setAnimating(false)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
    // key encodes the target positions; `targets` is read fresh inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { display, animating }
}

// The Jumanji-style board: each team starts on its own home planet and follows a
// winding path to a shared finish planet, one board space per step
// (0..finishLine). A team's ship sits on the space matching its score (on its
// home planet at 0); reaching the finish wins. Planet variants are chosen from
// the per-game map seed so each game looks different. Driven by polled state.
function Board({ state }) {
  // Aliased to `tr` because `t` is used below as the per-team map variable.
  const { t: tr } = useI18n()
  const { positions, finishLine, teamNames, currentTeam, winner, mapSeed } = state ?? {}

  // Clamp targets to the track, then animate the ships' displayed positions
  // toward them. Hooks must run before any early return, so guard with [].
  const targets = (positions ?? []).map((p) => Math.min(Math.max(p ?? 0, 0), finishLine))
  const { display, animating } = useAdvanceAnimation(targets)

  if (!state) return null
  const { finish, starts } = layoutFor(teamNames.length)

  const teamCount = teamNames.length
  const teams = teamNames.map((name, i) => {
    const team = i + 1
    const start = starts[i] ?? starts[starts.length - 1]
    // Route to a distinct point on the finish planet's rim so ships near the
    // finish fan out instead of stacking on the same spot.
    const approach = finishApproach(finish, start, i, teamCount)
    const path = makeWindingPath(start, approach)
    const spaces = sampleAlong(path, finishLine)
    const pos = targets[i] ?? 0
    // Ship sits at its animated (possibly fractional) position along the road;
    // at rest the float equals `pos`, landing exactly on space `pos`.
    const shown = display[i] ?? pos
    return {
      team,
      name,
      color: teamColor(team),
      start,
      path,
      spaces,
      ship: pointAtFraction(path, shown / Math.max(finishLine, 1)),
      pos,
    }
  })

  return (
    <div className="board" role="group" aria-label={tr('board.aria')}>
      <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className="board-svg" preserveAspectRatio="xMidYMid meet">
        {/* each team's winding road (pixel tiles) + its board spaces (squares).
            Tiles/markers hidden under a planet are skipped so every visible
            space is clear of the planets. */}
        {teams.map((t) => {
          const road = sampleAlong(t.path, finishLine * 2).filter(
            (p) => !isUnderPlanet(p, starts, finish),
          )
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
              {t.spaces.map((s, idx) =>
                isUnderPlanet(s, starts, finish) ? null : (
                  <rect
                    key={`space-${idx}`}
                    className="board-space"
                    x={(s[0] - 1.5).toFixed(2)}
                    y={(s[1] - 1.5).toFixed(2)}
                    width="3"
                    height="3"
                    style={{ fill: t.color }}
                  />
                ),
              )}
            </g>
          )
        })}

        {/* each team's home planet at its start */}
        {teams.map((t) => (
          <PixelPlanet
            key={`home-${t.team}`}
            cx={t.start[0]}
            cy={t.start[1]}
            size={16}
            variant={planetVariant(mapSeed, t.team - 1, PLANET_COUNT)}
          />
        ))}

        {/* the shared finish planet (the destination) */}
        <g aria-label={tr('board.finishAria')}>
          <circle className="board-finish-halo" cx={finish[0]} cy={finish[1]} r="14" />
          <PixelPlanet
            cx={finish[0]}
            cy={finish[1]}
            size={28}
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
              aria-label={tr('board.shipAria', { team: t.team })}
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

      {/* Held back until the winning ship has glided onto the finish planet. */}
      <WinnerBanner state={state} show={!animating} />
    </div>
  )
}

export default Board
