'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from '../utils/i18n';
import { useAccessibility } from './AccessibilityProvider';

// Icon components for features
const VoiceIcon = () => (
  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

interface WelcomeScreenProps {
  onStartJourney?: () => void;
  onLanguageChange?: (language: string) => void;
  initialLanguage?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartJourney,
  onLanguageChange,
  initialLanguage = 'en'
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [hasMounted, setHasMounted] = useState(false);
  const { t } = useTranslation(selectedLanguage);
  const { reducedMotion } = useAccessibility();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' }
  ];

  const features = [
    {
      icon: VoiceIcon,
      title: "Voice-Powered",
      description: "Tell us about yourself in your preferred language",
      color: "from-primary-400 to-primary-600"
    },
    {
      icon: TargetIcon,
      title: "Smart Matching",
      description: "AI finds opportunities that match your skills",
      color: "from-secondary-400 to-secondary-600"
    },
    {
      icon: SparklesIcon,
      title: "Personalized",
      description: "Get recommendations tailored to your profile",
      color: "from-success-400 to-success-600"
    },
    {
      icon: UsersIcon,
      title: "Community",
      description: "Connect with mentors and fellow learners",
      color: "from-accent-400 to-accent-600"
    }
  ];

  useEffect(() => {
    setHasMounted(true);

    // Sync with external changes (from global navbar)
    if (initialLanguage) {
      setSelectedLanguage(initialLanguage);
      return;
    }

    // Auto-detect language if not provided
    const browserLang = navigator.language?.split('-')[0];
    const supportedLang = languages.find(lang => lang.code === browserLang);
    if (supportedLang) {
      setSelectedLanguage(supportedLang.code);
    }
  }, [initialLanguage, languages]);


  const handleStartJourney = () => {
    onStartJourney?.();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Avoid SSR/client mismatch by rendering dots only after mount */}
        {hasMounted && (
          [...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary-300 rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: reducedMotion ? 0 : [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: Math.random() * 3 + 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))
        )}
      </div>

      {/* Language controls moved to global navbar */}

      {/* Main Content */}
      <main className="relative z-10 px-6 pt-12 pb-24">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-heading font-bold text-gray-900 mb-6 leading-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t('welcome')}
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {t('welcomeSubtitle')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.button
              onClick={() => window.location.href = '/login'}
              className="px-8 py-4 gradient-primary text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus-ring btn-touch"
              whileHover={{ scale: reducedMotion ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center space-x-2">
                <UsersIcon />
                <span>Register / Login</span>
              </span>
            </motion.button>

            <motion.button
              onClick={handleStartJourney}
              className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus-ring btn-touch"
              whileHover={{ scale: reducedMotion ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center space-x-2">
                <SparklesIcon />
                <span>Take Demo</span>
              </span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <FeaturesGrid features={features} reducedMotion={reducedMotion} />

        {/* Voice Preview */}
        <motion.div
          className="max-w-md mx-auto mt-16 bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
              <VoiceIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('voicePrompt')}
            </h3>
            <p className="text-gray-600 text-sm">
              {t('tapToSpeak')}
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

// Features Grid Component
const FeaturesGrid: React.FC<{ features: Array<{ icon: React.ReactNode; title: string; description: string }>, reducedMotion: boolean }> = ({ features, reducedMotion }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <motion.div
      ref={ref}
      className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 1 }}
    >
      {features.map((feature, index) => (
        <motion.div
          key={index}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.6,
            delay: 1.2 + index * 0.1
          }}
          whileHover={{
            scale: reducedMotion ? 1 : 1.02,
            y: reducedMotion ? 0 : -5
          }}
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
            <feature.icon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {feature.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {feature.description}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
};
