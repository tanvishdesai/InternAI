'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useTranslation } from '../utils/i18n';

interface AILoadingScreenProps {
  onComplete?: () => void;
  language?: string;
}

export const AILoadingScreen: React.FC<AILoadingScreenProps> = ({
  onComplete,
  language = 'en'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const { t } = useTranslation(language);

  const steps = [
    {
      text: t('analyzingProfile'),
      duration: 1500,
      icon: '🔍'
    },
    {
      text: t('scanningOpportunities'),
      duration: 2000,
      icon: '📊'
    },
    {
      text: t('findingMatches'),
      duration: 1500,
      icon: '🎯'
    },
    {
      text: t('readyWithResults'),
      duration: 800,
      icon: '✨'
    }
  ];

  useEffect(() => {
    // Set window size for confetti
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);

    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Show confetti when reaching the final step
        setShowConfetti(true);

        // Call onComplete after confetti animation
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 2000);
      }
    }, steps[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete, steps]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
          colors={['#f97316', '#3b82f6', '#10b981', '#d946ef', '#f59e0b']}
        />
      )}

      <div className="text-center max-w-md mx-auto px-6">
        {/* AI Avatar Animation */}
        <motion.div
          className="relative mb-8"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-24 h-24 mx-auto gradient-primary rounded-full flex items-center justify-center shadow-2xl">
            <motion.span
              className="text-3xl"
              animate={{
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {steps[currentStep].icon}
            </motion.span>
          </div>

          {/* Floating particles */}
          <motion.div
            className="absolute -top-4 -left-4 w-3 h-3 bg-primary-500 rounded-full opacity-60"
            animate={{
              y: [-10, -30, -10],
              x: [-10, 10, -10],
              opacity: [0.6, 0.3, 0.6]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -top-2 -right-6 w-2 h-2 bg-secondary-500 rounded-full opacity-60"
            animate={{
              y: [-8, -25, -8],
              x: [10, -5, 10],
              opacity: [0.6, 0.3, 0.6]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          <motion.div
            className="absolute -bottom-3 -left-6 w-2 h-2 bg-success-500 rounded-full opacity-60"
            animate={{
              y: [10, 25, 10],
              x: [-8, 8, -8],
              opacity: [0.6, 0.3, 0.6]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            className="h-full gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentStep + 1) / steps.length) * 100}%`
            }}
            transition={{
              duration: 0.5,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Animated Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.5,
              ease: "easeInOut"
            }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-heading font-bold text-gray-900">
              {steps[currentStep].text}
            </h2>

            {/* Loading dots */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((dot) => (
                <motion.div
                  key={dot}
                  className="w-3 h-3 bg-primary-500 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: dot * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Additional context text */}
        <motion.p
          className="text-gray-600 mt-6 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {currentStep === 0 && "We're learning about your background and skills..."}
          {currentStep === 1 && "Searching through thousands of opportunities..."}
          {currentStep === 2 && "Finding the best matches for you..."}
          {currentStep === 3 && "Your personalized recommendations are ready!"}
        </motion.p>

        {/* Loading percentage */}
        <motion.div
          className="mt-4 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
        </motion.div>
      </div>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary-300 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Enhanced version with more customization options
interface SmartAILoadingScreenProps extends AILoadingScreenProps {
  customSteps?: Array<{
    text: string;
    duration: number;
    icon: string;
  }>;
  showProgress?: boolean;
  theme?: 'default' | 'dark' | 'minimal';
}

export const SmartAILoadingScreen: React.FC<SmartAILoadingScreenProps> = ({
  customSteps,
  showProgress = true,
  theme = 'default',
  ...props
}) => {
  const stepsToUse = customSteps || [
    {
      text: props.language === 'hi' ? 'आपकी प्रोफ़ाइल का विश्लेषण कर रहे हैं...' : 'Analyzing your profile...',
      duration: 1500,
      icon: '🧠'
    },
    {
      text: props.language === 'hi' ? '10,000+ अवसर स्कैन कर रहे हैं...' : 'Scanning 10,000+ opportunities...',
      duration: 2000,
      icon: '🔍'
    },
    {
      text: props.language === 'hi' ? 'सही मिलान ढूंढ रहे हैं...' : 'Finding perfect matches...',
      duration: 1500,
      icon: '🎯'
    },
    {
      text: props.language === 'hi' ? 'तैयार! आपके रिजल्ट यहाँ हैं ✨' : 'Ready! Here are your matches ✨',
      duration: 800,
      icon: '✨'
    }
  ];

  const themeClasses = {
    default: 'bg-gradient-to-br from-primary-50 via-white to-secondary-50',
    dark: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
    minimal: 'bg-white'
  };

  return (
    <AILoadingScreen
      {...props}
      steps={stepsToUse}
      showProgress={showProgress}
      className={themeClasses[theme]}
    />
  );
};
