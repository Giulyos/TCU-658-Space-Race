import QuestionDisplay from '../components/QuestionDisplay.jsx'
import RaceTrack from '../components/RaceTrack.jsx'
import Scoreboard from '../components/Scoreboard.jsx'
import Spaceship from '../components/Spaceship.jsx'
import TurnIndicator from '../components/TurnIndicator.jsx'

function GameScreen() {
  // TODO: implement
  return (
    <main>
      <h1>Game Screen</h1>
      <TurnIndicator />
      <RaceTrack />
      <Spaceship />
      <QuestionDisplay />
      <Scoreboard />
    </main>
  )
}

export default GameScreen
