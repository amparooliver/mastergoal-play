import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ChipIcon from '../components/ChipIcon.jsx';

const MiniBoard = () => {
  const rows = 5;
  const cols = 7;
  const players = [
    { team: 'LEFT', r: 2, c: 1, gk: false },
    { team: 'RIGHT', r: 2, c: 5, gk: false },
  ];
  const ball = { r: 2, c: 3 };

  const sessionConfig = (() => {
    try {
      const saved = sessionStorage.getItem('gameSession');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const TEAM_COLORS = sessionConfig?.chipColors || {
    LEFT: '#E6DCB7',
    RIGHT: '#F18F01',
  };

  return (
    <div className="inline-block max-w-full rounded-xl overflow-hidden border border-mg-cream/10 shadow">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex">
          {Array.from({ length: cols }).map((_, c) => {
            const isDark = (r + c) % 2 === 0;
            const player = players.find(p => p.r === r && p.c === c);
            const hasBall = ball.r === r && ball.c === c;
            const isGoalLeft = r === 0 && c >= 2 && c <= 4;
            const isGoalRight = r === rows - 1 && c >= 2 && c <= 4;
            const base = isGoalLeft
              ? 'bg-mg-green-3'
              : isGoalRight
              ? 'bg-mg-green-2'
              : isDark
              ? 'bg-mg-green-2'
              : 'bg-mg-green-3';
            return (
              <div
                key={`${r}-${c}`}
                className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border border-mg-green-1 relative ${base}`}
                title={`(${r}, ${c})`}
              >
                {player && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none w-3/4 h-3/4 mx-auto my-auto">
                    <ChipIcon color={TEAM_COLORS[player.team]} width="100%" height="100%" />
                  </div>
                )}
                {hasBall && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img src="/assets/bw-ball.svg" alt="ball" className="w-1/2 h-1/2 drop-shadow" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const HowToPlay = () => {
  const sections = [
    {
      key: 'basics',
      label: 'Game Basics',
      title: 'Welcome to Mastergoal',
      lead: 'A strategic turn-based game inspired by football. Two teams compete to be the first to score 2 goals.',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">The Board</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">15 rows × 11 columns grid. Goals are located in the middle 5 columns at the top and bottom edges of the board.</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Teams</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">LEFT team (starts first) scores at the bottom goal. RIGHT team scores at the top goal. Teams alternate turns.</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Your Turn</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">On each turn, move one of your player chips OR kick the ball if you have possession.</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Winning</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">First team to score 2 goals wins. After each goal, the game resets and the team that didn't score kicks off.</p>
          </div>
        </div>
      ),
      imageSlot: (  <img 
        src="/assets/mod2osc.png" 
        alt="Game Movement Diagram" 
        className="w-full h-full object-contain" // Tailwind classes for sizing
      />)
    },
    {
      key: 'movement',
      label: 'Movement',
      title: 'How Players Move',
      lead: 'Players can move horizontally, vertically, or diagonally across the board.',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Distance</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">Move 1 or 2 squares per turn in any direction (horizontal, vertical, or diagonal).</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Restrictions</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">Cannot move to a square occupied by another chip (player or ball). Cannot move to your own team's forbidden corners.</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Gaining Possession</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">When you move adjacent to the ball, you gain possession and must kick it.</p>
          </div>
        </div>
      ),
      imageSlot: (  <img 
        src="/assets/MovValidosOscuro.png" 
        alt="Game Movement Diagram" 
        className="w-3/4 h-auto mx-auto object-contain"
      />)
    },
    {
      key: 'kicking',
      label: 'Kicking',
      title: 'How the Ball Moves',
      lead: 'When you have possession, kick the ball 1-4 squares in a straight line.',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Kick Distance</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">Kick the ball 1 to 4 squares in a straight line (horizontal, vertical, or diagonal).</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Jump Over Players</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">The ball can jump over other player chips during its movement.</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Restriction</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">Cannot kick the ball to land in your own penalty area (large box near your goal).</p>
          </div>
        </div>
      ),
      imageSlot: (  <img 
        src="/assets/MovValPelota.png" 
        alt="Game Movement Diagram" 
        className="w-3/4 h-auto mx-auto object-contain"
      />)
    },
    {
      key: 'level1',
      label: 'Level 1',
      title: 'Level 1: Learn the Basics',
      lead: 'Start with 1 player per team. Focus on movement and scoring fundamentals.',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Players</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">1 player per team</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Starting Positions</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">Ball in center • Left player in upper-mid area • Right player in lower-mid area</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Rules</h3>
            <ul className="text-sm text-mg-brown/85 leading-relaxed list-disc list-inside space-y-1">
              <li>Move your player 1-2 squares</li>
              <li>Kick the ball 1-4 squares when adjacent</li>
              <li>Score by getting ball into opponent's goal</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Goal</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">Master basic movement and shooting mechanics</p>
          </div>
        </div>
      ),
        imageSlot: (  <img 
        src="/assets/mod1osc.png" 
        alt="Game Movement Diagram" 
        className="w-full h-auto mx-auto object-contain"
      />)
    },
    {
      key: 'level2',
      label: 'Level 2',
      title: 'Level 2: Teamwork',
      lead: 'Add a second player and introduce passing mechanics and neutral squares.',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Players</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">2 players per team</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Starting Positions</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">Ball in center • Left team: 2 players in upper area • Right team: 2 players in lower area</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">New Rules: Passing</h3>
            <ul className="text-sm text-mg-brown/85 leading-relaxed list-disc list-inside space-y-1">
              <li>Pass by kicking to a square near your teammate</li>
              <li>Maximum 3 consecutive passes per possession</li>
              <li>Cannot pass to yourself</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Neutral Squares</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">When the ball is equally adjacent to both teams, it's neutral. Must gain numerical advantage to move it.</p>
          </div>
        </div>
      ),
        imageSlot: (  <img 
        src="/assets/mod2osc.png" 
        alt="Game Movement Diagram" 
        className="w-full h-auto mx-auto object-contain"
      />)
    },
    {
      key: 'level3',
      label: 'Level 3',
      title: 'Level 3: Advanced Play',
      lead: 'Full 5v5 gameplay with goalkeepers, special squares, and advanced tactics.',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Players</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">5 players per team (including 1 goalkeeper)</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Goalkeeper Special Rules</h3>
            <ul className="text-sm text-mg-brown/85 leading-relaxed list-disc list-inside space-y-1">
              <li>Has "arms": 2 adjacent horizontal squares in penalty area</li>
              <li>Catches ball automatically if it lands on arms</li>
              <li>Ball cannot pass over goalkeeper's body</li>
              <li>Opponent's ball cannot pass over goalkeeper's arms in penalty area</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Special Squares</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">Land the ball on opponent's corners or their goal-front squares: they lose their next turn!</p>
          </div>
          <div>
            <h3 className="font-bold text-mg-green-3 mb-2">Small Box Rule</h3>
            <p className="text-sm text-mg-brown/85 leading-relaxed">Ball cannot pass over opponent's players inside their small box (goal area).</p>
          </div>
        </div>
      ),
        imageSlot: (  <img 
        src="/assets/mod3osc.png" 
        alt="Game Movement Diagram" 
        className="w-full h-auto mx-auto object-contain"
      />)
    },
  ];

  const [active, setActive] = useState(sections[0].key);
  const current = sections.find(s => s.key === active) || sections[0];

  return (
    <div className="min-h-screen bg-mg-green-1 py-10 md:py-16 overflow-x-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl md:text-5xl font-extrabold text-mg-sand text-center"
        >
          Rule Book
        </motion.h1>

        {/* Book shell */}
        <div className="mt-8 md:mt-12 relative flex justify-center">
          <div className="relative w-full max-w-4xl">
            {/* cover shadow */}
            <div className="absolute -inset-2 md:-inset-3 bg-black/20 rounded-3xl"></div>
            {/* book body */}
            <div className="relative bg-mg-brown rounded-3xl p-3 md:p-5">
              {/* red bookmark */}
              <div className="absolute right-10 -top-1 h-10 w-4 bg-red-600 rounded-b-sm md:right-16" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                {/* Left page - Visual/Image */}
                <div className="rounded-2xl bg-[#F6F1DE] text-mg-brown p-6 md:p-8 min-h-[480px] flex flex-col">
                  <div className="text-sm font-semibold uppercase tracking-wide text-mg-green-3">Mastergoal Rules</div>
                  <div className="mt-3 text-3xl md:text-4xl font-extrabold text-mg-green-3">{current.title}</div>
                  <p className="mt-3 text-mg-brown/80 leading-relaxed text-sm">{current.lead}</p>

                  <div className="mt-6 flex-1 flex items-center justify-center">
                    <div className="w-full">
                      {current.imageSlot}
                    </div>
                  </div>
                </div>

                {/* Right page - Details */}
                <div className="relative rounded-2xl bg-[#F6F1DE] text-mg-brown p-6 md:p-8 min-h-[480px] overflow-y-auto">
                  <div className="text-2xl font-bold text-mg-green-3 mb-4">Rules & Details</div>
                  {current.content}
                </div>
              </div>

              {/* Right-side tabs (desktop) */}
              <div className="hidden md:flex flex-col gap-2 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                {sections.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setActive(s.key)}
                    className={`px-3 py-3 rounded-r-xl shadow font-semibold text-sm transition-all ${
                      active === s.key 
                        ? 'bg-mg-orange text-mg-brown' 
                        : 'bg-mg-green-2 text-mg-cream/90 hover:brightness-110'
                    }`}
                    aria-pressed={active === s.key}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden mt-6 flex items-center justify-center gap-2 flex-wrap">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                active === s.key 
                  ? 'bg-mg-cream text-mg-brown' 
                  : 'bg-white/10 text-mg-cream border border-white/20'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a 
            href="/config" 
            className="inline-flex items-center justify-center rounded-xl bg-mg-cream text-green-900 font-semibold px-8 py-3 shadow hover:bg-yellow-300 transition"
          >
            Configure a Match
          </a>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;