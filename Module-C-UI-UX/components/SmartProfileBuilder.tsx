'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { useVoiceProfileBuilder } from '../hooks/useVoiceRecognition';
import { useTranslation } from '../utils/i18n';
import { useAccessibility } from './AccessibilityProvider';

// Profile sections configuration - aligned with ML engine requirements
// Only including fields that the ML backend actually uses
const profileSections = [
  {
    id: 'education_level',
    title: 'Your education level',
    subtitle: 'Select your current educational qualification',
    icon: '🎓',
    placeholder: 'Select education level',
    voicePrompt: 'What\'s your education level?',
    field: 'educationLevel',
    type: 'select',
    options: [
      { value: '12th', label: '12th Grade' },
      { value: 'diploma', label: 'Diploma' },
      { value: 'ug', label: 'Undergraduate' },
      { value: 'pg', label: 'Postgraduate' }
    ]
  },
  {
    id: 'skills',
    title: 'What skills do you have?',
    subtitle: 'Select your technical and soft skills',
    icon: '💡',
    placeholder: 'Select your skills',
    voicePrompt: 'What skills do you have?',
    field: 'skills',
    type: 'multiselect'
  },
  {
    id: 'major_field',
    title: 'Your major field',
    subtitle: 'What\'s your area of study?',
    icon: '📚',
    placeholder: 'e.g., Computer Science, Engineering',
    voicePrompt: 'What\'s your major field of study?',
    field: 'majorField',
    type: 'text'
  },
  {
    id: 'preferred_sectors',
    title: 'Preferred sectors',
    subtitle: 'Which industries interest you most?',
    icon: '🏢',
    placeholder: 'Select sectors',
    voicePrompt: 'Which sectors interest you?',
    field: 'preferredSectors',
    type: 'multiselect'
  },
  {
    id: 'preferred_locations',
    title: 'Preferred locations',
    subtitle: 'Where would you like to work?',
    icon: '📍',
    placeholder: 'Select preferred locations',
    voicePrompt: 'Where would you like to work?',
    field: 'preferredLocations',
    type: 'multiselect'
  },
  {
    id: 'remote_preference',
    title: 'Remote work preference',
    subtitle: 'Are you open to remote work opportunities?',
    icon: '🏠',
    placeholder: 'Select your preference',
    voicePrompt: 'Are you open to remote work?',
    field: 'remoteOk',
    type: 'select',
    options: [
      { value: 'true', label: 'Yes, I prefer remote work' },
      { value: 'false', label: 'No, I prefer onsite work' },
      { value: 'flexible', label: 'I\'m flexible with both' }
    ]
  },
  {
    id: 'duration_preference',
    title: 'Preferred internship duration',
    subtitle: 'How long would you like the internship to be?',
    icon: '⏰',
    placeholder: 'e.g., 8, 12, 16 weeks',
    voicePrompt: 'How long should the internship be?',
    field: 'durationWeeksPref',
    type: 'number'
  },
  {
    id: 'stipend_preference',
    title: 'Stipend expectations',
    subtitle: 'What monthly stipend range are you expecting?',
    icon: '💰',
    placeholder: 'e.g., 10000-20000 or 15000',
    voicePrompt: 'What stipend range are you expecting?',
    field: 'stipendPref',
    type: 'text'
  }
];

interface SmartProfileBuilderProps {
  onComplete?: (profileData: Record<string, unknown>) => void;
  onBack?: () => void;
  language?: string;
  initialProfileData?: Record<string, unknown>;
}

export const SmartProfileBuilder: React.FC<SmartProfileBuilderProps> = ({
  onComplete,
  onBack,
  language = 'en',
  initialProfileData = {}
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [profileData, setProfileData] = useState<Record<string, unknown>>(initialProfileData);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [metadata, setMetadata] = useState<{ skills: string[]; locations: string[]; sectors: string[] } | null>(null);

  const { t } = useTranslation(language);
  const { reducedMotion } = useAccessibility();

  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error
  } = useVoiceProfileBuilder();

  // Update input value when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Load dynamic metadata (skills, sectors, locations)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/metadata', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setMetadata({ skills: data.skills || [], locations: data.locations || [], sectors: data.sectors || [] });
        }
      } catch (e) {
        console.warn('Failed to fetch metadata', e);
      }
    };
    load();
  }, []);

  // Gesture support for swiping between sections
  const bind = useGesture({
    onDrag: ({ down, movement: [mx], direction: [xDir], distance, cancel }) => {
      const swipeDistance = typeof distance === 'number' ? distance : Math.sqrt(mx * mx);
      if (down && swipeDistance > 100) {
        if (xDir > 0 && currentSection > 0) {
          // Swipe right - go to previous section
          navigateToSection(currentSection - 1);
          cancel();
        } else if (xDir < 0 && currentSection < profileSections.length - 1) {
          // Swipe left - go to next section
          handleNext();
          cancel();
        }
      }
    }
  });

  const navigateToSection = (sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    const nextField = profileSections[sectionIndex].field;
    const nextType = profileSections[sectionIndex].type;

    if (nextType === 'multiselect') {
      // For multiselect, show the selected skills as comma-separated string
      const selectedSkills = Array.isArray(profileData[nextField]) ? profileData[nextField] : [];
      setInputValue(selectedSkills.join(', '));
    } else {
      setInputValue(String(profileData[nextField] || ''));
    }

    resetTranscript();
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const getNextButtonDisabled = () => {
    const currentType = profileSections[currentSection].type;

    if (currentType === 'multiselect') {
      // For multiselect, check if skills are selected
      const selectedSkills = Array.isArray(profileData[profileSections[currentSection].field])
        ? profileData[profileSections[currentSection].field] as string[]
        : [];
      return selectedSkills.length === 0;
    } else if (currentType === 'select') {
      // For select, check if a value is selected
      return !inputValue;
    } else {
      // For other types, check if input has content
      return !inputValue.trim();
    }
  };

  const handleNext = () => {
    // Save current input
    const currentField = profileSections[currentSection].field;
    const currentType = profileSections[currentSection].type;

    if (currentType === 'multiselect') {
      // For multiselect, data is already saved in profileData by SkillSelector
    } else if (currentType === 'select') {
      if (inputValue) {
        setProfileData(prev => ({
          ...prev,
          [currentField]: inputValue
        }));
      }
    } else {
      // For other types, save the input value
      if (inputValue.trim()) {
        setProfileData(prev => ({
          ...prev,
          [currentField]: inputValue.trim()
        }));
      }
    }

    if (currentSection < profileSections.length - 1) {
      navigateToSection(currentSection + 1);
    } else {
      // Profile completion - include final input
      const finalProfileData = { ...profileData };

      if (currentType === 'multiselect') {
        // Data already saved
      } else if (currentType === 'select') {
        if (inputValue) {
          finalProfileData[currentField] = inputValue;
        }
      } else {
        if (inputValue.trim()) {
          finalProfileData[currentField] = inputValue.trim();
        }
      }

      // Convert remoteOk from string to boolean
      if (finalProfileData.remoteOk === 'true') {
        finalProfileData.remoteOk = true;
      } else if (finalProfileData.remoteOk === 'false') {
        finalProfileData.remoteOk = false;
      } else if (finalProfileData.remoteOk === 'flexible') {
        finalProfileData.remoteOk = true; // Treat flexible as open to remote
      }

      // Convert preferred sectors and locations from comma-separated strings to arrays
      if (finalProfileData.preferredSectors && typeof finalProfileData.preferredSectors === 'string') {
        finalProfileData.preferredSectors = finalProfileData.preferredSectors.split(',').map(s => s.trim()).filter(s => s);
      }

      if (finalProfileData.preferredLocations && typeof finalProfileData.preferredLocations === 'string') {
        finalProfileData.preferredLocations = finalProfileData.preferredLocations.split(',').map(s => s.trim()).filter(s => s);
      }

      // Convert yearsExperience to number
      if (finalProfileData.yearsExperience) {
        finalProfileData.yearsExperience = parseInt(String(finalProfileData.yearsExperience)) || 0;
      }

      // Convert durationWeeksPref to number
      if (finalProfileData.durationWeeksPref) {
        finalProfileData.durationWeeksPref = parseInt(String(finalProfileData.durationWeeksPref)) || 12;
      }

      onComplete?.(finalProfileData);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      navigateToSection(currentSection - 1);
    } else {
      onBack?.();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      setIsVoiceActive(false);
    } else {
      startListening();
      setIsVoiceActive(true);
      setTimeout(() => {
        stopListening();
        setIsVoiceActive(false);
      }, 5000); // Auto-stop after 5 seconds
    }
  };

  const currentProfileSection = profileSections[currentSection];
  const progress = ((currentSection + 1) / profileSections.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header with Progress */}
      <motion.header
        className="px-6 py-4 bg-white/80 backdrop-blur-sm shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <motion.button
            onClick={handlePrevious}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus-ring"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          <div className="text-sm text-gray-600">
            {currentSection + 1} of {profileSections.length}
          </div>

          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="h-full gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div {...bind()} className="touch-none max-w-md mx-auto select-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: reducedMotion ? 0.1 : 0.5
              }}
              className="bg-white rounded-3xl p-8 shadow-lg"
            >
              {/* Section Icon */}
              <motion.div
                className="w-16 h-16 mx-auto mb-6 gradient-primary rounded-full flex items-center justify-center text-2xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: 0.2
                }}
              >
                {currentProfileSection.icon}
              </motion.div>

              {/* Section Title */}
              <motion.h2
                className="text-2xl font-heading font-bold text-center text-gray-900 mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {t(currentProfileSection.title)}
              </motion.h2>

              {/* Section Subtitle */}
              <motion.p
                className="text-gray-600 text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {t(currentProfileSection.subtitle)}
              </motion.p>

              {/* Input Field */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="relative">
                  {currentProfileSection.type === 'select' && currentProfileSection.options ? (
                    <select
                      value={inputValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-center text-lg focus-ring bg-white text-gray-900"
                      autoFocus
                      style={{ color: '#0f172a' }}
                    >
                      <option value="" style={{ color: '#94a3b8' }}>{t(currentProfileSection.placeholder)}</option>
                      {currentProfileSection.options.map((option) => (
                        <option key={option.value} value={option.value} style={{ color: '#0f172a', background: '#ffffff' }}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : currentProfileSection.type === 'multiselect' ? (
                    <div className="space-y-4">
                      <SkillSelector
                        items={
                          currentProfileSection.field === 'skills'
                            ? (metadata?.skills || [])
                            : currentProfileSection.field === 'preferredSectors'
                            ? (metadata?.sectors || [])
                            : (metadata?.locations || [])
                        }
                        selected={Array.isArray(profileData[currentProfileSection.field])
                          ? profileData[currentProfileSection.field] as string[]
                          : []}
                        onChange={(skills: string[]) => {
                          setProfileData(prev => ({
                            ...prev,
                            [currentProfileSection.field]: skills
                          }));
                          setInputValue(skills.join(', '));
                        }}
                      />
                    </div>
                  ) : currentProfileSection.type === 'textarea' ? (
                    <textarea
                      value={inputValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={t(currentProfileSection.placeholder)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-center text-lg focus-ring resize-none text-gray-900 placeholder-gray-400"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <input
                      type={currentProfileSection.type === 'number' ? 'number' : currentProfileSection.type === 'email' ? 'email' : 'text'}
                      value={inputValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={t(currentProfileSection.placeholder)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-center text-lg focus-ring text-gray-900 placeholder-gray-400"
                      autoFocus
                    />
                  )}

                  {/* Voice Button - Only show for text inputs */}
                  {isSupported && currentProfileSection.type === 'text' && (
                    <motion.button
                      onClick={handleVoiceToggle}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 ${
                        isVoiceActive
                          ? 'bg-primary-500 text-white voice-active'
                          : 'bg-gray-100 text-gray-600 hover:bg-primary-100'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={!isSupported}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </motion.button>
                  )}
                </div>

                {/* Voice Status */}
                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      className="mt-3 text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <div className="inline-flex items-center space-x-2 text-primary-600">
                        <motion.div
                          className="w-2 h-2 bg-primary-500 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-sm font-medium">{t('listening')}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <p className="text-red-600 text-sm text-center">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Voice Prompt */}
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-gray-500 text-sm mb-2">💬</p>
                <p className="text-gray-600 text-sm">
                  {t('voicePrompt')}: &quot;{currentProfileSection.voicePrompt}&quot;
                </p>
              </motion.div>

              {/* Navigation Buttons */}
              <motion.div
                className="flex space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.button
                  onClick={handlePrevious}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors focus-ring"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('previous')}
                </motion.button>

                <motion.button
                  onClick={handleNext}
                  disabled={getNextButtonDisabled()}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all focus-ring ${
                    !getNextButtonDisabled()
                      ? 'gradient-primary text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  whileHover={!getNextButtonDisabled() ? { scale: reducedMotion ? 1 : 1.02 } : {}}
                  whileTap={!getNextButtonDisabled() ? { scale: 0.98 } : {}}
                >
                  {currentSection === profileSections.length - 1 ? t('finish') : t('next')}
                </motion.button>
              </motion.div>

              {/* Swipe Hint */}
              <motion.div
                className="text-center mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p className="text-xs text-gray-400">
                  💡 {t('swipeLeftToContinue')}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// Skill Selection Component (for skills section)
export const SkillSelector: React.FC<{
  items: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}> = ({ items, selected, onChange }) => {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(s => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {(items || []).map((skill) => (
        <motion.button
          key={skill}
          onClick={() => toggle(skill)}
          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
            selected.includes(skill)
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {skill}
        </motion.button>
      ))}
    </div>
  );
};
