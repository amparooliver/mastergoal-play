import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import HowToPlay from './pages/HowToPlay';
import About from './pages/About';
import GameConfig from './pages/GameConfig';
import Game from './pages/Game';
import Navigation from './components/Navigation';
import './index.css';

function App() {
  const [gameSession, setGameSession] = useState(null);

  const handleStartGame = (sessionData) => {
    setGameSession(sessionData);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route path="/about" element={<About />} />
          <Route 
            path="/config" 
            element={<GameConfig onStartGame={handleStartGame} />} 
          />
          <Route 
            path="/game" 
            element={<Game gameId={gameSession?.gameId} initialState={gameSession} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
