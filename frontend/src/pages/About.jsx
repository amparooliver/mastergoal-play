import React from 'react';
import { motion } from 'framer-motion';

const LinkCard = ({ title, href, desc }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="block p-5 rounded-xl bg-mg-brown/40 backdrop-blur border border-mg-cream/10 hover:bg-white/10 transition"
  >
    <div className="text-mg-cream font-semibold">{title}</div>
    <div className="text-mg-cream/80 text-sm mt-1">{desc}</div>
  </a>
);

const About = () => {
  return (
    <div className="min-h-screen bg-mg-green-1 py-16">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl md:text-5xl font-extrabold text-mg-cream text-center"
        >
          About This Thesis
        </motion.h1>

        <div className="mt-10 grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="p-6 rounded-2xl bg-mg-brown/40 backdrop-blur border border-mg-cream/10">
              <div className="text-mg-cream font-bold text-lg">Research Context</div>
              <p className="text-mg-cream/80 mt-2 text-sm leading-relaxed">
                This project evaluates competitive AI agents on a structured, turn-based football environment (Mastergoal),
                comparing Minimax, MCTS, and heuristic-driven strategies across different team sizes. The web interface provides
                a controlled setting to reproduce benchmark conditions and visualize agent behavior.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-mg-brown/40 backdrop-blur border border-mg-cream/10">
              <div className="text-mg-cream font-bold text-lg">Credits</div>
              <ul className="text-mg-cream/80 mt-2 text-sm list-disc list-inside space-y-1">
                <li>Thesis Author: Your Name</li>
                <li>Advisor(s): Advisor Name(s)</li>
                <li>Special thanks to contributors and reviewers</li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="p-6 rounded-2xl bg-mg-brown/40 backdrop-blur border border-mg-cream/10">
              <div className="text-mg-cream font-bold text-lg">Repositories</div>
              <div className="grid gap-3 mt-3">
                <LinkCard title="Web Frontend" href="#" desc="React + Vite + Tailwind + Framer Motion" />
                <LinkCard title="Flask Backend" href="#" desc="REST API exposing Mastergoal tournament system" />
                <LinkCard title="Tournament System" href="#" desc="Core game logic and AI agents (MCTS, Minimax, Heuristics)" />
              </div>
              <div className="text-mg-cream/70 text-xs mt-2">Replace # links with your GitHub URLs.</div>
            </div>

            <div className="p-6 rounded-2xl bg-mg-brown/40 backdrop-blur border border-mg-cream/10">
              <div className="text-mg-cream font-bold text-lg">Contact</div>
              <div className="text-mg-cream/80 mt-2 text-sm">Email: your.email@example.com</div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 text-center">
          <a href="/" className="text-mg-cream/90 underline underline-offset-4 hover:text-mg-cream">Return to Home</a>
        </div>
      </div>
    </div>
  );
};

export default About;
