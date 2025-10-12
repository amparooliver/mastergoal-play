import React from 'react';
import { motion } from 'framer-motion';

const Bullet = ({ title, desc }) => (
  <div className="p-4 rounded-xl bg-mg-brown/40 border border-mg-cream/10">
    <div className="text-mg-cream font-semibold">{title}</div>
    <div className="text-mg-cream/80 text-sm mt-1">{desc}</div>
  </div>
);

const MiniBoard = () => {
  // Render a small demo board 7x5 to explain concepts visually
  const rows = 5;
  const cols = 7;
  const players = [
    { team: 'LEFT', r: 2, c: 2, gk: false },
    { team: 'RIGHT', r: 2, c: 4, gk: false },
  ];
  const ball = { r: 2, c: 3 };

  return (
    <div className="inline-block rounded-xl overflow-hidden border border-mg-cream/10 shadow">
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
                className={`w-8 h-8 md:w-10 md:h-10 border border-mg-green-1 relative ${base}`}
                title={`(${r}, ${c})`}
              >
                {player && (
                  <div
                    className={`absolute inset-1 rounded-full border-2 flex items-center justify-center text-[10px] md:text-xs font-bold ${
                      player.team === 'LEFT'
                        ? 'bg-mg-sand text-mg-brown border-mg-cream'
                        : 'bg-mg-sage text-mg-cream border-mg-green-1'
                    }`}
                  >
                    {player.gk ? 'GK' : 'P'}
                  </div>
                )}
                {hasBall && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-mg-sand rounded-full border border-mg-cream shadow" />
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
  return (
    <div className="min-h-screen bg-mg-green-1 py-16">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl md:text-5xl font-extrabold text-mg-cream text-center"
        >
          How To Play
        </motion.h1>

        <div className="mt-10 grid md:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <Bullet title="Objective" desc="Score goals on a 15x11 grid. Move or kick to advance the ball into the opponent’s goal." />
            <Bullet title="Turns" desc="Players alternate turns by team (LEFT vs RIGHT). On your turn, execute a legal move or kick." />
            <Bullet title="Moves" desc="Move a player to an adjacent valid cell, or kick the ball from a player holding it to a reachable target." />
            <Bullet title="Legal Moves" desc="Only allowed positions are highlighted client-side. Server validates every move for fairness." />
            <Bullet title="Win Condition" desc="The game ends when a goal is scored or by termination rules from the tournament system." />
            <Bullet title="Difficulty" desc="Choose Easy/Medium/Hard which map to specific AI agents tuned per level." />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <MiniBoard />
            <div className="text-white/80 text-sm mt-4 text-center max-w-md">
              Example: two players contest the ball at center. White (LEFT) controls the ball and can pass or move to create a shooting lane.
            </div>
          </motion.div>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
            <div className="text-white font-bold text-lg">Controls</div>
            <ul className="mt-2 text-white/80 text-sm list-disc list-inside space-y-1">
              <li>Click a piece to select</li>
              <li>Highlighted cells are legal targets</li>
              <li>Click a target cell to move/kick</li>
              <li>Reset with the Restart button</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
            <div className="text-white font-bold text-lg">Tips</div>
            <ul className="mt-2 text-white/80 text-sm list-disc list-inside space-y-1">
              <li>Create passing triangles</li>
              <li>Use space, avoid traps by the sidelines</li>
              <li>Conserve turns; move towards goal lines</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
            <div className="text-white font-bold text-lg">AI</div>
            <ul className="mt-2 text-white/80 text-sm list-disc list-inside space-y-1">
              <li>Easy: simpler heuristics/random</li>
              <li>Medium: Minimax with tuned weights</li>
              <li>Hard: Advanced heuristics or MCTS</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 text-center">
          <a href="/config" className="inline-flex items-center justify-center rounded-xl bg-yellow-400 text-green-900 font-semibold px-8 py-3 shadow hover:bg-yellow-300 transition">
            Configure a Match
          </a>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;
