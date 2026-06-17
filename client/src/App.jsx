import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Home from './pages/Home.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import GameScreen from './pages/GameScreen.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
