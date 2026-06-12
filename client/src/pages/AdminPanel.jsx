import QuestionBank from '../components/QuestionBank.jsx'
import GameSettings from '../components/GameSettings.jsx'
import TurnControls from '../components/TurnControls.jsx'

function AdminPanel() {
  return (
    <main>
      <h1>Admin Panel</h1>
      <TurnControls />
      <GameSettings />
      <QuestionBank />
    </main>
  )
}

export default AdminPanel
