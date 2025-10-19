import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/i18n2';

const Section = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const Card = ({ children, className = '', gradient = false }) => (
  <div className={`p-6 md:p-8 rounded-2xl backdrop-blur border transition-all duration-300 hover:border-mg-cream/30 hover:shadow-xl ${gradient ? 'bg-gradient-to-br from-mg-brown/50 to-mg-brown/30 border-mg-cream/20' : 'bg-mg-brown/40 border-mg-cream/10'} ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children, icon }) => (
  <div className="flex items-center gap-3 mb-4">
    {icon && <span className="text-2xl">{icon}</span>}
    <h2 className="text-xl md:text-2xl font-bold text-mg-sand">{children}</h2>
  </div>
);

const LinkCard = ({ title, href, desc }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="group block p-4 md:p-5 rounded-xl bg-mg-green-2/30 backdrop-blur border border-mg-cream/10 hover:border-mg-sand/40 hover:bg-mg-green-2/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1">
        <div className="text-mg-cream font-semibold mb-1 group-hover:text-mg-sand transition-colors">{title}</div>
        <div className="text-mg-cream/70 text-xs md:text-sm leading-relaxed">{desc}</div>
      </div>
      <svg className="w-5 h-5 text-mg-cream/40 group-hover:text-mg-sand group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </div>
  </a>
);

const CreditItem = ({ children }) => (
  <li className="flex items-start gap-3 text-mg-cream/90">
    <span className="text-mg-sand mt-1 flex-shrink-0">•</span>
    <span>{children}</span>
  </li>
);

const About = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-mg-green-1 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle_at_80%_20%,#F5EFD533,transparent_50%),radial-gradient(circle_at_20%_80%,#E6DCB722,transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20 relative z-10">
        {/* Header */}
        <Section delay={0}>
          <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-mg-sand mb-4 drop-shadow-sm">
              {t('aboutTitle')}
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-mg-sand to-transparent mx-auto mb-6" />
            <p className="text-mg-cream/70 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Mastergoal - A research project exploring competitive AI strategies in turn-based football environments
            </p>
          </div>
        </Section>

        {/* Main content grid */}
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

          {/* Research Context - Full Width */}
          <Section delay={0.1}>
            <Card gradient className="max-w-5xl mx-auto">
              <SectionTitle icon="🔬">{t('researchContext')}</SectionTitle>
              <p className="text-mg-cream/90 leading-relaxed text-sm md:text-base">
                {t('researchBlurb')}
              </p>
            </Card>
          </Section>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8">

            {/* Left Column */}
            <div className="space-y-6 md:space-y-8">

              {/* Credits */}
              <Section delay={0.2}>
                <Card>
                  <SectionTitle icon="👥">{t('credits')}</SectionTitle>
                  <ul className="space-y-3 text-sm md:text-base">
                    <CreditItem>{t('thesisAuthor')}</CreditItem>
                    <CreditItem>{t('advisors')}</CreditItem>
                    <CreditItem>{t('thanksCreator')}</CreditItem>
                  </ul>
                </Card>
              </Section>

              {/* Contact */}
              <Section delay={0.3}>
                <Card>
                  <SectionTitle icon="📧">{t('contact')}</SectionTitle>
                  <a
                    href="mailto:amparooliverb@gmail.com"
                    className="inline-flex items-center gap-2 text-mg-cream/90 hover:text-mg-sand transition-colors text-sm md:text-base group"
                  >
                    <span className="font-medium">{t('email')}:</span>
                    <span className="underline underline-offset-2 group-hover:underline-offset-4 transition-all">
                      amparooliverb@gmail.com
                    </span>
                  </a>
                </Card>
              </Section>

            </div>

            {/* Right Column - Repositories */}
            <Section delay={0.25}>
              <Card className="h-full">
                <SectionTitle icon="💻">{t('repositories')}</SectionTitle>
                <div className="space-y-3">
                  <LinkCard
                    title={t('webFrontend')}
                    href="https://github.com/amparooliver/mastergoal-play/tree/main/frontend"
                    desc="React + Vite + Tailwind + Framer Motion"
                  />
                  <LinkCard
                    title={t('flaskBackend')}
                    href="https://github.com/amparooliver/mastergoal-play/tree/main/backend"
                    desc="REST API exposing Mastergoal tournament system"
                  />
                  <LinkCard
                    title={t('tournamentSystem')}
                    href="https://github.com/amparooliver/tournament-system-Mastergoal"
                    desc="Core game logic and AI agents (MCTS, Minimax, Heuristics)"
                  />
                </div>
              </Card>
            </Section>

          </div>
        </div>

        {/* Footer Navigation */}
        <Section delay={0.4}>
          <div className="mt-12 md:mt-16 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-mg-cream/90 hover:text-mg-sand underline underline-offset-4 hover:underline-offset-8 transition-all font-medium group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('returnHome')}
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default About;
