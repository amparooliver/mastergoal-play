import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import HowToPlay from './pages/HowToPlay';
import About from './pages/About';
import GameConfig from './pages/GameConfig';
import Game from './pages/Game';
import Navigation from './components/Navigation';
import './index.css';

function AppFrame({ gameSession, onStartGame }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const embedded = ['1', 'true', 'yes'].includes((params.get('embed') || params.get('embedded') || '').toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50">
      {!embedded && <Navigation />}
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/config"
          element={<GameConfig onStartGame={onStartGame} />}
        />
        <Route
          path="/game"
          element={<Game gameId={gameSession?.gameId} initialState={gameSession} />}
        />
      </Routes>
    </div>
  );
}

function App() {
  const [gameSession, setGameSession] = useState(null);

  const handleStartGame = (sessionData) => {
    setGameSession(sessionData);
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppFrame gameSession={gameSession} onStartGame={handleStartGame} />
    </Router>
  );
}

export default App;
