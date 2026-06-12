// Placeholder for the game setup wizard. The full step-by-step create/edit flow
// (team setup -> question bank) is implemented in #48; this stub keeps the
// library navigation working in the meantime.
//
// Props:
//   game        — the game being edited, or null when creating a new one
//   onCancel()  — return to the library
function GameWizard({ game, onCancel }) {
  return (
    <section className="nes-container with-title">
      <p className="title">{game ? `Edit: ${game.name}` : 'New Game'}</p>
      <p>The step-by-step setup wizard is coming next.</p>
      <button type="button" className="nes-btn" onClick={onCancel}>
        Back to games
      </button>
    </section>
  )
}

export default GameWizard
