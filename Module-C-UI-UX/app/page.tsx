'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { SmartProfileBuilder } from '@/components/SmartProfileBuilder';
import { AILoadingScreen } from '@/components/AILoadingScreen';
import { RecommendationCards } from '@/components/RecommendationCards';
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import { useAuth } from '@/components/AuthProvider';
import { getBrowserLanguage } from '@/utils/i18n';

interface UserProfileData {
  name?: string;
  email?: string;
  educationLevel?: string;
  majorField?: string;
  skills?: string[] | string;
  yearsExperience?: number | string;
  preferredSectors?: string[] | string;
  preferredLocations?: string[] | string;
  remoteOk?: boolean | string;
  durationWeeksPref?: number | string;
  stipendPref?: string;
  careerGoal?: string;
  [key: string]: unknown;
}

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'remote' | 'onsite' | 'hybrid';
  salary?: string;
  skills: string[];
  description: string;
  logo?: string;
  matchScore: number;
  applicationDeadline?: string;
  duration: string;
  // Explainability fields from ML backend
  explanations?: string[];
  contributors?: { name: string; percentage: number }[];
}

type AppState = 'welcome' | 'profile' | 'loading' | 'recommendations' | 'error';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [, setUserProfile] = useState<UserProfileData | null>(null);
  const [recommendations, setRecommendations] = useState<Internship[]>([]);
  const [error, setError] = useState<string>('');
  const [language, setLanguage] = useState('en');
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Set initial language
    const browserLang = getBrowserLanguage();
    setLanguage(browserLang);
    // Respect "New Search" flag to force onboarding even if logged in
    if (typeof window !== 'undefined') {
      const urlHasNew = new URLSearchParams(window.location.search).has('new');
      const sessionNew = sessionStorage.getItem('newSearch') === '1';
      if (urlHasNew || sessionNew) {
        setAppState('profile');
        try { sessionStorage.removeItem('newSearch'); } catch {}
      }
    }
  }, []);

  // Listen for language changes from global navbar
  useEffect(() => {
    const handler = (e: CustomEvent) => setLanguage(e.detail || 'en');
    if (typeof window !== 'undefined') {
      window.addEventListener('languageChange', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('languageChange', handler as EventListener);
      }
    };
  }, []);

  const handleProfileCompleteFromAuth = useCallback(async (authUser: UserProfileData) => {
    try {
      setUserProfile(authUser);
      setError('');

      // Get recommendations from the ML engine using existing profile
      const recommendationsResponse = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: authUser.email })
      });

      if (!recommendationsResponse.ok) {
        console.warn('ML API failed, falling back to mock data');
        // Fallback to mock data if ML API fails
        const mockRecommendations: Internship[] = generateMockRecommendations(authUser);
        setRecommendations(mockRecommendations);
        setAppState('recommendations');
        return;
      }

      const recommendationsData = await recommendationsResponse.json();

      if (recommendationsData.success && recommendationsData.recommendations) {
        // Transform ML engine response to match frontend interface
        const transformedRecommendations: Internship[] = recommendationsData.recommendations.map((rec: Record<string, unknown>) => {
          const compScores = (rec?.scoring_breakdown as Record<string, unknown>)?.component_scores as Record<string, unknown> || {};
          const contributors = Object.entries(compScores)
            .filter(([, v]) => v && typeof (v as Record<string, unknown>).percentage === 'number')
            .map(([k, v]) => ({ name: String(k).replace(/_/g, ' '), percentage: Number((v as Record<string, unknown>).percentage) }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 4);

          const explanations = Array.isArray(rec?.match_reasons) ? (rec.match_reasons as string[]).slice(0, 4) : [];

          return {
          id: String(rec.internship_id || rec.id),
          title: String(rec.title),
          company: String(rec.organization),
          location: (rec.location as Record<string, unknown>)?.city ? String((rec.location as Record<string, unknown>).city) : 'Remote',
          type: rec.remote_allowed ? 'remote' : 'onsite',
          salary: String(rec.stipend || 'Competitive'),
          skills: Array.isArray(rec.preferred_skills)
            ? rec.preferred_skills as string[]
            : (rec.preferred_skills ? String(rec.preferred_skills).split(',').map((s: string) => s.trim()) : []),
          description: String(rec.description),
          logo: undefined,
          matchScore: Math.round(Number(rec.score) * 100),
          applicationDeadline: rec.application_deadline ? String(rec.application_deadline) : undefined,
          duration: rec.duration_weeks ? `${rec.duration_weeks} weeks` : 'Flexible',
          explanations,
          contributors
        };
        });

        setRecommendations(transformedRecommendations);
      } else {
        // Fallback to mock data
        const mockRecommendations: Internship[] = generateMockRecommendations(authUser);
        setRecommendations(mockRecommendations);
      }

      setAppState('recommendations');

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');

      // Even on error, show mock recommendations as fallback
      const mockRecommendations: Internship[] = generateMockRecommendations(authUser);
      setRecommendations(mockRecommendations);
      setAppState('recommendations');
    }
  }, []); // Empty dependency array since this function only uses setState functions

  const generateMockRecommendations = (profileData: UserProfileData): Internship[] => {
    return [
      {
        id: '1',
        title: 'Software Development Intern',
        company: 'TechCorp',
        location: Array.isArray(profileData.preferredLocations)
          ? profileData.preferredLocations[0] || 'Mumbai'
          : typeof profileData.preferredLocations === 'string'
          ? profileData.preferredLocations.split(',')[0]?.trim() || 'Mumbai'
          : 'Mumbai',
        type: profileData.remoteOk === true || profileData.remoteOk === 'true' ? 'remote' : 'onsite',
        salary: '₹25,000/month',
        skills: Array.isArray(profileData.skills) ? profileData.skills.slice(0, 3) : ['Python', 'JavaScript'],
        description: 'Join our development team to work on cutting-edge web applications using modern technologies.',
        matchScore: 92,
        duration: '6 months',
        applicationDeadline: '2024-02-15'
      },
      {
        id: '2',
        title: 'Data Science Intern',
        company: 'DataFlow Solutions',
        location: Array.isArray(profileData.preferredLocations)
          ? profileData.preferredLocations[0] || 'Delhi'
          : typeof profileData.preferredLocations === 'string'
          ? profileData.preferredLocations.split(',')[0]?.trim() || 'Delhi'
          : 'Delhi',
        type: 'hybrid',
        salary: '₹30,000/month',
        skills: ['Python', 'Machine Learning', 'SQL'],
        description: 'Work with large datasets and build predictive models for our analytics platform.',
        matchScore: 88,
        duration: '4 months',
        applicationDeadline: '2024-02-20'
      },
      {
        id: '3',
        title: 'UI/UX Design Intern',
        company: 'Creative Studios',
        location: Array.isArray(profileData.preferredLocations)
          ? profileData.preferredLocations[0] || 'Bangalore'
          : typeof profileData.preferredLocations === 'string'
          ? profileData.preferredLocations.split(',')[0]?.trim() || 'Bangalore'
          : 'Bangalore',
        type: 'onsite',
        salary: '₹20,000/month',
        skills: ['Figma', 'Adobe XD', 'Prototyping'],
        description: 'Design user interfaces and create amazing user experiences for our mobile applications.',
        matchScore: 85,
        duration: '3 months',
        applicationDeadline: '2024-02-10'
      }
    ];
  };

  // Check if user is logged in and has profile data
  useEffect(() => {
    if (!authLoading && isLoggedIn && user) {
      // If URL/session indicates a new search, skip auto-recommendations
      if (typeof window !== 'undefined') {
        const urlHasNew = new URLSearchParams(window.location.search).has('new');
        if (urlHasNew) {
          setAppState('profile');
          return;
        }
      }
      // If user is logged in and has complete profile, go directly to recommendations
      if (user.educationLevel && user.skills && user.skills.length > 0) {
        setAppState('loading');
        // Convert User to UserProfileData format
        const userProfileData: UserProfileData = {
          name: user.name || undefined,
          email: user.email,
          educationLevel: user.educationLevel || undefined,
          majorField: user.majorField || undefined,
          skills: user.skills,
          yearsExperience: user.yearsExperience || undefined,
          preferredSectors: user.preferredSectors,
          preferredLocations: user.preferredLocations,
          remoteOk: user.remoteOk || undefined,
          durationWeeksPref: user.durationWeeksPref || undefined,
          stipendPref: user.stipendPref || undefined,
          careerGoal: user.careerGoal || undefined,
        };
        handleProfileCompleteFromAuth(userProfileData);
      } else {
        // If logged in but incomplete profile, go to profile builder
        setAppState('profile');
      }
    }
  }, [isLoggedIn, user, authLoading, handleProfileCompleteFromAuth]);

  const handleStartJourney = () => {
    setAppState('profile');
  };

  const handleProfileComplete = async (profileData: UserProfileData) => {
    try {
      setAppState('loading');
      setUserProfile(profileData);
      setError('');
      let userEmail: string | undefined = undefined;
      // If this is a new search, do not persist profile changes
      const isNewSearch = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('new');
      if (!isNewSearch) {
        // Save the user profile to the database (email is now optional)
        const saveResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData)
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save user profile');
        }

        const saveData = await saveResponse.json();
        userEmail = saveData.user.email;
      } else {
        // For temporary flow, if logged in, use existing user email just for recommendations
        if (user?.email) userEmail = user.email;
      }

      // Now get recommendations from the ML engine
      const recommendationsResponse = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail })
      });

      if (!recommendationsResponse.ok) {
        console.warn('ML API failed, falling back to mock data');
        // Fallback to mock data if ML API fails
        const mockRecommendations: Internship[] = generateMockRecommendations(profileData);
        setRecommendations(mockRecommendations);
        setAppState('recommendations');
        return;
      }

      const recommendationsData = await recommendationsResponse.json();

      if (recommendationsData.success && recommendationsData.recommendations) {
        // Transform ML engine response to match frontend interface
        const transformedRecommendations: Internship[] = recommendationsData.recommendations.map((rec: Record<string, unknown>) => {
          const compScores = (rec?.scoring_breakdown as Record<string, unknown>)?.component_scores as Record<string, unknown> || {};
          const contributors = Object.entries(compScores)
            .filter(([, v]) => v && typeof (v as Record<string, unknown>).percentage === 'number')
            .map(([k, v]) => ({ name: String(k).replace(/_/g, ' '), percentage: Number((v as Record<string, unknown>).percentage) }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 4);

          const explanations = Array.isArray(rec?.match_reasons) ? (rec.match_reasons as string[]).slice(0, 4) : [];

          return {
          id: String(rec.internship_id || rec.id),
          title: String(rec.title),
          company: String(rec.organization),
          location: (rec.location as Record<string, unknown>)?.city ? String((rec.location as Record<string, unknown>).city) : 'Remote',
          type: rec.remote_allowed ? 'remote' : 'onsite',
          salary: String(rec.stipend || 'Competitive'),
          skills: Array.isArray(rec.preferred_skills)
            ? rec.preferred_skills as string[]
            : (rec.preferred_skills ? String(rec.preferred_skills).split(',').map((s: string) => s.trim()) : []),
          description: String(rec.description),
          logo: undefined,
          matchScore: Math.round(Number(rec.score) * 100),
          applicationDeadline: rec.application_deadline ? String(rec.application_deadline) : undefined,
          duration: rec.duration_weeks ? `${rec.duration_weeks} weeks` : 'Flexible',
          explanations,
          contributors
        };
        });

        setRecommendations(transformedRecommendations);
      } else {
        // Fallback to mock data
        const mockRecommendations: Internship[] = generateMockRecommendations(profileData);
        setRecommendations(mockRecommendations);
      }

      setAppState('recommendations');

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');

      // Even on error, show mock recommendations as fallback
      const mockRecommendations: Internship[] = generateMockRecommendations(profileData);
      setRecommendations(mockRecommendations);
      setAppState('recommendations');
    }
  };

  const handleLike = (internship: Internship) => {
    console.log('Liked:', internship.title);
  };

  const handlePass = (internship: Internship) => {
    console.log('Passed:', internship.title);
  };

  const handleApply = (internship: Internship) => {
    console.log('Applied to:', internship.title);
  };

  const handleSave = (internship: Internship) => {
    console.log('Saved:', internship.title);
  };

  const handleBackToWelcome = () => {
    setAppState('welcome');
    setError('');
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  return (
    <AccessibilityProvider>
      <div className="min-h-screen">

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {appState === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <WelcomeScreen
                onStartJourney={handleStartJourney}
                onLanguageChange={handleLanguageChange}
                initialLanguage={language}
              />
            </motion.div>
          )}

          {appState === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <SmartProfileBuilder
                onComplete={handleProfileComplete}
                onBack={handleBackToWelcome}
                language={language}
                initialProfileData={isLoggedIn && user ? {
                  name: user.name,
                  email: user.email,
                  educationLevel: user.educationLevel,
                  majorField: user.majorField,
                  skills: user.skills,
                  preferredSectors: user.preferredSectors,
                  preferredLocations: user.preferredLocations,
                  remoteOk: user.remoteOk,
                  durationWeeksPref: user.durationWeeksPref,
                  stipendPref: user.stipendPref,
                  yearsExperience: user.yearsExperience
                } : {}}
              />
            </motion.div>
          )}

          {appState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AILoadingScreen
                language={language}
                onComplete={() => {
                  // Loading screen handles its own completion
                }}
              />
            </motion.div>
          )}

          {appState === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50"
            >
              {/* Recommendations */}
              <main className="px-6 py-8">
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                    🎉 Perfect Matches Found!
                  </h2>
                  <p className="text-gray-600">
                    Swipe through these personalized recommendations
                  </p>
                </motion.div>

                <RecommendationCards
            recommendations={recommendations}
                  onLike={handleLike}
                  onPass={handlePass}
                  onApply={handleApply}
                  onSave={handleSave}
                  language={language}
                />
              </main>
            </motion.div>
        )}

        {appState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center"
            >
              <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md mx-auto text-center">
                <motion.div
                  className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-3xl">⚠️</span>
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <motion.button
                  onClick={handleBackToWelcome}
                  className="px-6 py-3 gradient-primary text-white rounded-xl font-medium shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
          </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
    </AccessibilityProvider>
  );
}
