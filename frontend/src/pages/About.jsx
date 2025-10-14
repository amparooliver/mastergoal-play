import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../context/i18n2';

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
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-mg-green-1 py-16">
      <div className="container mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl md:text-5xl font-extrabold text-mg-cream text-center"
        >
          {t('aboutTitle')}
        </motion.h1>

        <div className="mt-10 grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="p-6 rounded-2xl bg-mg-brown/40 backdrop-blur border border-mg-cream/10">
              <div className="text-mg-cream font-bold text-lg">{t('researchContext')}</div>
              <p className="text-mg-cream/80 mt-2 text-sm leading-relaxed">{t('researchBlurb')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-mg-brown/40 backdrop-blur border border-mg-cream/10">
              <div className="text-mg-cream font-bold text-lg">{t('credits')}</div>
              <ul className="text-mg-cream/80 mt-2 text-sm list-disc list-inside space-y-1">
                <li>{t('thesisAuthor')}</li>
                <li>{t('advisors')}</li>
                <li>{t('thanksCreator')}</li>
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
              <div className="text-mg-cream font-bold text-lg">{t('repositories')}</div>
              <div className="grid gap-3 mt-3">
                <LinkCard title={t('webFrontend')} href="https://github.com/amparooliver/mastergoal-play/tree/main/frontend" desc="React + Vite + Tailwind + Framer Motion" />
                <LinkCard title={t('flaskBackend')} href="https://github.com/amparooliver/mastergoal-play/tree/main/backend" desc="REST API exposing Mastergoal tournament system" />
                <LinkCard title={t('tournamentSystem')} href="https://github.com/amparooliver/tournament-system-Mastergoal" desc="Core game logic and AI agents (MCTS, Minimax, Heuristics)" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-mg-brown/40 backdrop-blur border border-mg-cream/10">
              <div className="text-mg-cream font-bold text-lg">{t('contact')}</div>
              <div className="text-mg-cream/80 mt-2 text-sm">{t('email')}: amparooliverb@gmail.com</div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 text-center">
          <a href="/" className="text-mg-cream/90 underline underline-offset-4 hover:text-mg-cream">{t('returnHome')}</a>
        </div>
      </div>
    </div>
  );
};

export default About;
