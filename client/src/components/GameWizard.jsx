import { useState } from 'react'
import { createGame, updateGame } from '../api/gamesApi.js'
import QuestionBank from './QuestionBank.jsx'
import { useI18n } from '../i18n/context.js'

// Step-by-step game setup, used for both creating and editing a game:
//   Step 1 — name, spaces to win, number of teams (2-4)
//   Step 2 — the team names
//   Step 3 — the game's question bank (scoped to this game)
//
// Moving past Step 2 persists the game (create when new, update when editing),
// which yields the game id that Step 3's question bank is scoped to.
//
// Props:
//   game     — the game being edited, or null when creating a new one
//   onDone() — finished; return to the library
//   onCancel() — cancelled; return to the library
const MIN_TEAMS = 2
const MAX_TEAMS = 4

const initialNames = (game) =>
  game?.team_names ?? ['Team 1', 'Team 2', 'Team 3', 'Team 4']

function GameWizard({ game, onDone, onCancel }) {
  const { t } = useI18n()
  const editing = Boolean(game)
  const [step, setStep] = useState(1)
  const [gameId, setGameId] = useState(game?.id ?? null)
  const [name, setName] = useState(game?.name ?? '')
  const [finishLine, setFinishLine] = useState(game?.finish_line ?? 10)
  const [names, setNames] = useState(initialNames(game))
  const [teamCount, setTeamCount] = useState(initialNames(game).length)
  const [error, setError] = useState(null)

  const handleCountChange = (count) => {
    setTeamCount(count)
    setNames((prev) => {
      const next = prev.slice(0, count)
      while (next.length < count) next.push(`Team ${next.length + 1}`)
      return next
    })
  }

  const handleNameChange = (index, value) =>
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)))

  // Step 1 -> Step 2: name + rules entered; team names come next.
  const handleRulesNext = (e) => {
    e.preventDefault()
    setError(null)
    if (name.trim() === '') return setError(t('wizard.nameRequired'))
    setStep(2)
  }

  // Step 2 -> Step 3: persist the game (create or update), which yields the id
  // the question bank is scoped to.
  const handleTeamsNext = async (e) => {
    e.preventDefault()
    setError(null)
    const teamNames = names.slice(0, teamCount)
    if (teamNames.some((n) => n.trim() === '')) return setError(t('wizard.everyTeamName'))

    const payload = { name, finishLine: Number(finishLine), teamNames }
    try {
      if (gameId == null) {
        const created = await createGame(payload)
        setGameId(created.id)
      } else {
        await updateGame(gameId, payload)
      }
      setStep(3)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="nes-container with-title">
      <p className="title">
        {editing ? t('wizard.editTitle', { name: game.name }) : t('wizard.newTitle')}
      </p>
      {error && <p role="alert">{error}</p>}

      {step === 1 && (
        <form onSubmit={handleRulesNext}>
          <p>{t('wizard.step1')}</p>

          <div className="nes-field">
            <label htmlFor="w-name">{t('wizard.gameName')}</label>
            <input
              id="w-name"
              className="nes-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="nes-field">
            <label htmlFor="w-finish">{t('wizard.spacesToWin')}</label>
            <input
              id="w-finish"
              type="number"
              min="3"
              max="10"
              className="nes-input"
              value={finishLine}
              onChange={(e) => setFinishLine(e.target.value)}
            />
          </div>

          <div className="nes-field">
            <label htmlFor="w-teams">{t('wizard.numTeams')}</label>
            <div className="nes-select">
              <select
                id="w-teams"
                value={teamCount}
                onChange={(e) => handleCountChange(Number(e.target.value))}
              >
                {Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => MIN_TEAMS + i).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="button" className="nes-btn" onClick={onCancel}>
            {t('wizard.cancel')}
          </button>
          <button type="submit" className="nes-btn is-primary">
            {t('wizard.nextTeams')}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleTeamsNext}>
          <p>{t('wizard.step2')}</p>

          {names.slice(0, teamCount).map((teamName, i) => (
            <div className="nes-field" key={i}>
              <label htmlFor={`w-name-${i}`}>{t('wizard.teamNameLabel', { n: i + 1 })}</label>
              <input
                id={`w-name-${i}`}
                className="nes-input"
                value={teamName}
                onChange={(e) => handleNameChange(i, e.target.value)}
              />
            </div>
          ))}

          <button type="button" className="nes-btn" onClick={() => setStep(1)}>
            {t('wizard.back')}
          </button>
          <button type="submit" className="nes-btn is-primary">
            {t('wizard.nextQuestions')}
          </button>
        </form>
      )}

      {step === 3 && (
        <div>
          <p>{t('wizard.step3')}</p>
          <QuestionBank gameId={gameId} />
          <button type="button" className="nes-btn" onClick={() => setStep(2)}>
            {t('wizard.back')}
          </button>
          <button type="button" className="nes-btn is-success" onClick={onDone}>
            {t('wizard.done')}
          </button>
        </div>
      )}
    </section>
  )
}

export default GameWizard
