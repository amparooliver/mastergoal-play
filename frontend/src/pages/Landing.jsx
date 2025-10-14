import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '../context/i18n2';

const Landing = () => {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-mg-green-1 overflow-x-hidden">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none select-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_20%_20%,#ffffff33,transparent_40%),radial-gradient(circle_at_80%_30%,#ffffff22,transparent_40%),radial-gradient(circle_at_40%_80%,#ffffff11,transparent_40%)]" />
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-mg-sand drop-shadow-sm">
              Mastergoal
            </h1>
            <p className="mt-6 text-lg md:text-2xl text-mg-cream/90 max-w-3xl mx-auto">
              {t('landingTagline')}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/config"
                className="inline-flex items-center justify-center rounded-xl bg-mg-sand text-mg-brown font-bold px-10 py-3 shadow hover:brightness-110 transition"
              >
                {t('playNow')}
              </Link>
              <Link
                to="/how-to-play"
                className="inline-flex items-center justify-center rounded-xl bg-white/10 text-mg-cream px-8 py-3 backdrop-blur border border-white/20 hover:bg-white/20 transition"
              >
                {t('howToPlay')}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-16 mx-auto max-w-5xl"
          >
            <div className="rounded-2xl bg-mg-brown/60 backdrop-blur border border-mg-cream/10 p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="text-mg-cream">
                  <div className="text-3xl font-extrabold">15x11</div>
                  <div className="text-white/80 text-sm">{t('pitchGrid')}</div>
                </div>
                <div className="text-mg-cream">
                  <div className="text-3xl font-extrabold">AI</div>
                  <div className="text-white/80 text-sm">MCTS / Minimax / Heuristics</div>
                </div>
                <div className="text-mg-cream">
                  <div className="text-3xl font-extrabold">3</div>
                  <div className="text-white/80 text-sm">{t('difficultyLevels')}</div>
                </div>
                <div className="text-mg-cream">
                  <div className="text-3xl font-extrabold">Real-time</div>
                  <div className="text-white/80 text-sm">{t('turnFeedback')}</div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mt-12 text-center">
            <Link to="/about" className="text-mg-cream/80 hover:text-mg-cream underline underline-offset-4">
              {t('learnMoreThesis')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
