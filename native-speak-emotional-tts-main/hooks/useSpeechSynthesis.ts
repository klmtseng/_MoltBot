
import { useState, useEffect, useCallback, useRef } from 'react';
import { TTSSettings, TTSState } from '../types';

interface UtteranceSegment {
  text: string;
  offset: number;
}

// Added 'yue' for Cantonese
type LangType = 'ja' | 'zh' | 'yue' | 'en' | 'neutral';
type Gender = 'female' | 'male' | 'unknown';

export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [ttsState, setTtsState] = useState<TTSState>({
    isSpeaking: false,
    isPaused: false,
    currentWord: '',
    charIndex: -1,
  });
  
  const synth = useRef<SpeechSynthesis>(window.speechSynthesis);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const segmentsRef = useRef<UtteranceSegment[]>([]);
  const userPreferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  
  // Helper: Normalize language tags for cross-browser comparison
  // e.g., "zh_HK" -> "zh-hk", "en-US" -> "en-us"
  const normalizeLang = (lang: string) => lang.toLowerCase().replace('_', '-');

  // Helper: Detect gender from voice name (Heuristic)
  // Expanded for iOS/macOS specific names
  const getVoiceGender = (voice: SpeechSynthesisVoice): Gender => {
    const name = voice.name.toLowerCase();
    
    // 1. Explicit labels (Common in Windows/Android/Edge/Chrome)
    if (name.includes('female') || name.includes('woman') || name.includes('girl')) return 'female';
    if (name.includes('male') || name.includes('man') || name.includes('boy')) return 'male';

    // 2. iOS / macOS / Apple Specific Names (Known defaults)
    // These voices often lack "female"/"male" descriptors in their name property.
    
    // Apple Female Voices
    const appleFemales = [
        'samantha', 'karen', 'tessa', 'moira', 'veena', 'fiona',   // English
        'ting-ting', 'meijia', 'sin-ji', 'shu-han',               // Chinese/Cantonese
        'kyoko', 'otoya',                                         // Japanese (Otoya is male but let's check explicit list below)
        'amelie', 'anna', 'carmit', 'lekha', 'mariska', 'melina', // European/Other
        'monica', 'nora', 'paulina', 'satu', 'yuna', 'zosia', 'zuzana', 'sara', 
        'alice', 'aurora', 'joana', 'alva', 'kanya', 'yuri'       // Yuri is Russian female
    ];

    // Apple Male Voices
    const appleMales = [
        'daniel', 'fred', 'gordon', 'rishi', 'xander',            // English
        'kangkang', // Chinese (often male)
        'hattori', // Japanese
        'aaron', 'arthur', 'jorge', 'juan', 'maged', 'martin', 'thomas'
    ];

    // Correcting specific Japanese/Cantonese overlap
    if (appleFemales.some(n => name.includes(n))) return 'female';
    if (appleMales.some(n => name.includes(n))) return 'male';

    // Default Fallback
    return 'unknown';
  };

  /**
   * Helper: Replace noisy punctuation and Emojis with spaces to silence them 
   * CRITICAL: Must preserve string length (match.length) to keep charIndex aligned for highlighting.
   */
  const sanitizeForSpeech = (text: string): string => {
      // 1. Replace noisy punctuation: brackets, slashes, asterisks, quotes, dashes
      // We keep sentence terminators (.,!?;:) because they provide natural pauses.
      let clean = text.replace(/[()\[\]{}<>"'_*@#$%^&+=`~|\\/\-]/g, (match) => ' '.repeat(match.length));
      
      // 2. Replace Emojis and Pictographs
      // Using Unicode Property Escapes for robust emoji detection.
      // NOTE: Emojis are often surrogate pairs (length 2). We must replace with 2 spaces if so.
      clean = clean.replace(/[\p{Extended_Pictographic}]/gu, (match) => ' '.repeat(match.length));
      
      return clean;
  };

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.current.getVoices();
      
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        
        if (!selectedVoice) {
            const meijiaVoice = availableVoices.find(v => v.name.toLowerCase().includes('meijia'));
            const defaultVoice = 
                meijiaVoice ||
                availableVoices.find(v => v.default) || 
                availableVoices.find(v => v.localService) ||
                availableVoices[0];
            setSelectedVoice(defaultVoice);
            userPreferredVoiceRef.current = defaultVoice;
        }
      }
    };

    loadVoices();
    
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoice]);

  // Lifecycle cleanup
  useEffect(() => {
    return () => {
      synth.current.cancel();
    };
  }, []);

  /**
   * Determine language category for a text segment
   */
  const getSegmentLang = (text: string): LangType => {
     // Hiragana/Katakana -> Japanese
     if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
     
     // Detect Cantonese specific colloquial characters
     // 係, 唔, 佢, 嘅, 冇, 睇, 咗, 嚟, 喺, 哋, 俾, 諗, 乜, 嘢, 咁, 喎
     const cantoneseMarkers = /[係唔佢嘅冇睇咗嚟喺哋俾諗乜嘢咁喎]/;
     if (cantoneseMarkers.test(text)) return 'yue';

     // Hanzi -> Chinese (Standard Mandarin)
     if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
     
     // Latin -> English
     if (/[a-zA-Z]/.test(text)) return 'en';
     return 'neutral';
  };

  /**
   * Helper: Parse text into smaller segments for better lang switching.
   */
  const parseTextToSegments = (fullText: string): UtteranceSegment[] => {
    const segments: UtteranceSegment[] = [];
    // 1. Coarse split by sentence endings (preserve delimiters)
    const sentenceRegex = /([^.!?。！？\n\r]+[.!?。！？\n\r]*)|([.!?。！？\n\r]+)/g;
    
    let match;
    while ((match = sentenceRegex.exec(fullText)) !== null) {
      const sentence = match[0];
      const sentenceOffset = match.index;

      // Check for mixed content (Latin vs CJK)
      const hasCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(sentence);
      const hasLatin = /[a-zA-Z]/.test(sentence);

      // 2. Intra-sentence splitting if mixed languages detected
      if (hasCJK && hasLatin) {
         // Regex to isolate CJK blocks (including full-width punctuation)
         const cjkRegex = /([\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]+)/g;
         
         let lastIndex = 0;
         let subMatch;

         while ((subMatch = cjkRegex.exec(sentence)) !== null) {
            // Push preceding non-CJK text (e.g., "3. Privacy First (")
            const nonCjkText = sentence.substring(lastIndex, subMatch.index);
            if (nonCjkText) { 
               segments.push({ text: nonCjkText, offset: sentenceOffset + lastIndex });
            }

            // Push CJK text (e.g., "隱私優先")
            segments.push({ text: subMatch[0], offset: sentenceOffset + subMatch.index });
            
            lastIndex = cjkRegex.lastIndex;
         }

         // Push remaining text (e.g., ")")
         const remaining = sentence.substring(lastIndex);
         if (remaining) {
            segments.push({ text: remaining, offset: sentenceOffset + lastIndex });
         }

      } else {
        // Simple sentence (all English, all CJK, or Neutral like "3.")
        if (sentence.trim()) {
          segments.push({ text: sentence, offset: sentenceOffset });
        }
      }
    }
    
    if (segments.length === 0 && fullText.trim().length > 0) {
      segments.push({ text: fullText, offset: 0 });
    }
    
    return segments;
  };

  /**
   * Helper to scan neighbors for a valid language
   */
  const scanContext = (currentIndex: number, allSegments: UtteranceSegment[]): LangType => {
      let foundLang: LangType = 'neutral';
      
      // Look ahead 1
      if (currentIndex + 1 < allSegments.length) {
          const next = getSegmentLang(allSegments[currentIndex + 1].text);
          if (next !== 'neutral') foundLang = next;
      }
      
      // Look ahead 2
      if (foundLang === 'neutral' && currentIndex + 2 < allSegments.length) {
           const next2 = getSegmentLang(allSegments[currentIndex + 2].text);
           if (next2 !== 'neutral') foundLang = next2;
      }

      // Look behind 1
      if (foundLang === 'neutral' && currentIndex - 1 >= 0) {
           const prev = getSegmentLang(allSegments[currentIndex - 1].text);
           if (prev !== 'neutral') foundLang = prev;
      }

      // Look behind 2
      if (foundLang === 'neutral' && currentIndex - 2 >= 0) {
           const prev2 = getSegmentLang(allSegments[currentIndex - 2].text);
           if (prev2 !== 'neutral') foundLang = prev2;
      }

      return foundLang;
  };

  /**
   * Play Segment with contextual voice detection
   */
  const playSegment = (index: number, settings: TTSSettings) => {
    if (index >= segmentsRef.current.length) {
      setTtsState(prev => ({ ...prev, isSpeaking: false, isPaused: false, charIndex: -1 }));
      activeUtteranceRef.current = null;
      return;
    }

    const segment = segmentsRef.current[index];
    const allSegments = segmentsRef.current;
    
    // 1. Identify Language Type
    let langType = getSegmentLang(segment.text);
    
    // 2. Resolve Context
    if (langType === 'neutral') {
        const contextLang = scanContext(index, allSegments);
        if (contextLang !== 'neutral') {
            langType = contextLang;
        }
    }
    
    // Ambiguous Standard Chinese (zh) -> Check if surrounding context is Cantonese (yue)
    if (langType === 'zh') {
        const contextLang = scanContext(index, allSegments);
        if (contextLang === 'yue') {
            langType = 'yue';
        }
    }

    // 3. Select Voice based on Resolved LangType AND Gender Consistency
    const availableVoices = voices.length > 0 ? voices : synth.current.getVoices();
    let targetVoice: SpeechSynthesisVoice | undefined;

    // Detect user's preferred gender
    const preferredGender = userPreferredVoiceRef.current ? getVoiceGender(userPreferredVoiceRef.current) : 'unknown';

    // Helper to find voice with gender preference
    const findVoice = (matcher: (v: SpeechSynthesisVoice) => boolean) => {
        // Try to match specific language AND same gender first
        if (preferredGender !== 'unknown') {
            const genderMatch = availableVoices.find(v => matcher(v) && getVoiceGender(v) === preferredGender);
            if (genderMatch) return genderMatch;
        }
        // Fallback to just matching language
        return availableVoices.find(matcher);
    };

    switch (langType) {
        case 'ja':
            targetVoice = findVoice(v => normalizeLang(v.lang).startsWith('ja'));
            break;
        case 'yue': // Cantonese
            targetVoice = findVoice(v => {
                const l = normalizeLang(v.lang);
                return l === 'zh-hk' || l === 'zh-yue' || l === 'yue';
            });
            break;
        case 'zh': // Mandarin
            // Check preferred voice first
            if (userPreferredVoiceRef.current) {
                const prefLang = normalizeLang(userPreferredVoiceRef.current.lang);
                if (prefLang === 'zh-hk' || prefLang.includes('yue')) {
                   targetVoice = userPreferredVoiceRef.current;
                }
            }
            
            if (!targetVoice) {
                // Priority: Mandarin matching gender -> Any Mandarin (excluding HK/Yue)
                targetVoice = findVoice(v => {
                    const l = normalizeLang(v.lang);
                    // Match generic zh or cmn, but EXCLUDE hk/yue
                    const isMandarin = (l.startsWith('zh') || l.startsWith('cmn')) && l !== 'zh-hk' && !l.includes('yue');
                    // Special preference for Meijia if user is unknown/female preference, but handled by findVoice generally
                    return isMandarin;
                });
            }
            break;
        case 'en':
            targetVoice = findVoice(v => normalizeLang(v.lang).startsWith('en'));
            break;
    }
    
    // 4. Fallback logic
    if (!targetVoice && langType !== 'neutral') {
        if (langType === 'yue') targetVoice = availableVoices.find(v => normalizeLang(v.lang).startsWith('zh'));
    }

    const finalVoice = targetVoice || userPreferredVoiceRef.current;

    // 5. Sanitize text for audio (remove noisy punctuation AND emojis) 
    const speakText = sanitizeForSpeech(segment.text);

    const utterance = new SpeechSynthesisUtterance(speakText);
    if (finalVoice) {
      utterance.voice = finalVoice;
      utterance.lang = finalVoice.lang; 
    }

    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onstart = () => {
      setTtsState(prev => ({ 
        ...prev, 
        isSpeaking: true, 
        isPaused: false, 
        charIndex: segment.offset 
      }));
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
         const globalIndex = segment.offset + event.charIndex;
         setTtsState(prev => ({ ...prev, charIndex: globalIndex }));
      }
    };

    const playNext = () => {
        if (activeUtteranceRef.current === utterance) {
            playSegment(index + 1, settings);
        }
    };

    utterance.onend = () => {
      setTimeout(playNext, 0); 
    };

    utterance.onerror = (e) => {
      console.warn("TTS Segment Error:", e);
      setTimeout(playNext, 0);
    };

    (window as any)._activeTTSUtterance = utterance;
    activeUtteranceRef.current = utterance;
    
    synth.current.speak(utterance);
  };

  const speak = useCallback((text: string, settings: TTSSettings) => {
    synth.current.cancel();
    if (!text.trim()) return;

    segmentsRef.current = parseTextToSegments(text);
    if (segmentsRef.current.length > 0) {
        playSegment(0, settings);
    }
  }, [voices]);

  const pause = useCallback(() => {
    if (synth.current.speaking && !synth.current.paused) {
      synth.current.pause();
      setTtsState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resume = useCallback(() => {
    if (synth.current.paused) {
      synth.current.resume();
      setTtsState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  const cancel = useCallback(() => {
    synth.current.cancel();
    activeUtteranceRef.current = null;
    (window as any)._activeTTSUtterance = null;
    segmentsRef.current = [];
    setTtsState({
      isSpeaking: false,
      isPaused: false,
      currentWord: '',
      charIndex: -1
    });
  }, []);

  // Wrap manual selection to update the ref
  const handleSetSelectedVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    userPreferredVoiceRef.current = voice;
  }, []);

  return {
    voices,
    selectedVoice,
    setSelectedVoice: handleSetSelectedVoice,
    speak,
    pause,
    resume,
    cancel,
    ttsState
  };
};
