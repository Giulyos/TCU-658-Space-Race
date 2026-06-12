import QuestionBank from '../components/QuestionBank.jsx'
import GameSettings from '../components/GameSettings.jsx'

function AdminPanel() {
  return (
    <main>
      <h1>Admin Panel</h1>
      <GameSettings />
      <QuestionBank />
    </main>
  )
}

export default AdminPanel
