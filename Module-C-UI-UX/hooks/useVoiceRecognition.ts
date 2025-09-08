import { useState, useEffect, useRef } from 'react';

interface VoiceRecognition {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
    SpeechRecognition: typeof SpeechRecognition;
  }
}

export const useVoiceRecognition = (language: string = 'en-US'): VoiceRecognition => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const cumulativeFinalRef = useRef('');

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);

        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false; // Changed to false for better control
          recognition.interimResults = true;
          recognition.lang = language; // Support for multiple languages
          recognition.maxAlternatives = 1;

          recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            // Do not clear cumulative final here; we only reset when user requests
          };

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalChunk = '';
            let interimChunk = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const piece = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalChunk += piece;
              } else {
                interimChunk += piece;
              }
            }

            // Accumulate only final results once, and render interim live without duplicating
            if (finalChunk) {
              cumulativeFinalRef.current += finalChunk;
            }
            setTranscript(cumulativeFinalRef.current + interimChunk);
          };

          recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            setError(event.error);
            setIsListening(false);

            // Handle specific error types
            switch (event.error) {
              case 'not-allowed':
                setError('Microphone access denied. Please allow microphone access and refresh the page.');
                break;
              case 'network':
                setError('Network error. Please check your connection.');
                break;
              case 'no-speech':
                setError('No speech detected. Please try speaking again.');
                break;
              case 'aborted':
                setError('Speech recognition was aborted.');
                break;
              case 'audio-capture':
                setError('No microphone found. Please check your microphone.');
                break;
              case 'service-not-allowed':
                setError('Speech recognition service not allowed.');
                break;
              default:
                setError(`Speech recognition error: ${event.error}`);
            }
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        } catch (err) {
          console.error('Error initializing speech recognition:', err);
          setIsSupported(false);
          setError('Failed to initialize speech recognition. Please refresh the page.');
        }
      } else {
        setIsSupported(false);
        setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error stopping speech recognition:', err);
        }
      }
    };
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('Failed to start speech recognition. Please try again.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Failed to stop speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    cumulativeFinalRef.current = '';
    setError(null);
  };

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error
  };
};

// Enhanced hook with additional features for the internship platform
export const useVoiceProfileBuilder = () => {
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript, error } = useVoiceRecognition('en-US');

  const [voicePrompts] = useState({
    education_level: "What is your education level?",
    skills: "What skills do you have?",
    major_field: "What is your major field of study?",
    preferred_sectors: "Which sectors are you interested in?",
    preferred_locations: "Where would you like to do your internship?",
    remote_preference: "Do you prefer remote work?",
    duration_preference: "How many weeks would you like the internship to be?",
    stipend_preference: "What stipend range are you expecting?"
  });

  const [currentField, setCurrentField] = useState<keyof typeof voicePrompts>('education_level');
  const [profileData, setProfileData] = useState<Record<string, string>>({});

  const nextField = () => {
    const fields = Object.keys(voicePrompts) as Array<keyof typeof voicePrompts>;
    const currentIndex = fields.indexOf(currentField);
    if (currentIndex < fields.length - 1) {
      setCurrentField(fields[currentIndex + 1]);
      resetTranscript();
    }
  };

  const saveCurrentResponse = () => {
    if (transcript.trim()) {
      setProfileData(prev => ({
        ...prev,
        [currentField]: transcript.trim()
      }));
    }
  };

  const getCurrentPrompt = () => {
    return voicePrompts[currentField];
  };

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
    currentField,
    profileData,
    voicePrompts,
    nextField,
    saveCurrentResponse,
    getCurrentPrompt
  };
};
