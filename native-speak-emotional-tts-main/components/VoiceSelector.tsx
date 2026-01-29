
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Globe, AlertCircle } from 'lucide-react';

interface VoiceSelectorProps {
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
}

type LangFilter = 'all' | 'en' | 'zh' | 'yue' | 'ja';

const FILTERS: { id: LangFilter; label: string; flag: string }[] = [
  { id: 'all', label: 'All', flag: '🌏' },
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'zh', label: 'Mandarin', flag: '🇹🇼' },
  { id: 'yue', label: 'Cantonese', flag: '🇭🇰' },
  { id: 'ja', label: 'Japanese', flag: '🇯🇵' },
];

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ voices, selectedVoice, onVoiceChange }) => {
  const [filter, setFilter] = useState<LangFilter>('all');
  const [isLoaded, setIsLoaded] = useState(false);

  // Set loaded state once voices are detected to differentiate between "loading" and "no voices found"
  useEffect(() => {
    if (voices.length > 0) {
      setIsLoaded(true);
    } else {
      // Set a timeout to assume loaded (but empty) if it takes too long
      const timer = setTimeout(() => setIsLoaded(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [voices]);

  // Filter voices based on language code (BCP 47 tag)
  const filteredVoices = useMemo(() => {
    if (filter === 'all') return voices;
    
    return voices.filter(voice => {
      const lang = voice.lang.toLowerCase().replace('_', '-');
      
      if (filter === 'yue') {
        // Specific check for Hong Kong / Cantonese
        return lang === 'zh-hk' || lang.includes('yue');
      }
      
      if (filter === 'zh') {
        // Mandarin check: starts with zh but NOT HK/Cantonese
        return lang.startsWith('zh') && lang !== 'zh-hk' && !lang.includes('yue');
      }

      return lang.startsWith(filter);
    });
  }, [voices, filter]);

  // Sync Voice -> Filter
  useEffect(() => {
    if (!selectedVoice) return;
    
    const lang = selectedVoice.lang.toLowerCase().replace('_', '-');
    
    // Only switch if the current filter hides the selected voice
    if (filter !== 'all') {
       // Logic to check if selected voice belongs to current filter, if not reset or switch
       const isCantonese = lang === 'zh-hk' || lang.includes('yue');
       
       if (filter === 'yue' && !isCantonese) setFilter('all');
       else if (filter === 'zh' && (isCantonese || !lang.startsWith('zh'))) setFilter('all');
       else if (filter === 'en' && !lang.startsWith('en')) setFilter('all');
       else if (filter === 'ja' && !lang.startsWith('ja')) setFilter('all');
    } else {
       // Optional: Auto-select filter based on voice? (Maybe too jumpy, keeping 'all' is safer)
    }
  }, [selectedVoice]);

  return (
    <div className="w-full max-w-md mx-auto mb-4">
      {/* Language Filter Chips */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar mask-gradient touch-pan-x">
        {FILTERS.map((item) => {
          const isActive = filter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border
                ${isActive 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25' 
                  : 'bg-surface border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <span>{item.flag}</span>
              <span>{item.label}</span>
              {isActive && filteredVoices.length > 0 && (
                <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  {filteredVoices.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Voice Dropdown */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {voices.length === 0 && isLoaded ? (
             <AlertCircle className="h-5 w-5 text-red-400" />
          ) : (
             <Globe className={`h-5 w-5 transition-colors ${selectedVoice ? 'text-indigo-400' : 'text-gray-500'}`} />
          )}
        </div>
        
        <select
          value={selectedVoice?.voiceURI || ''}
          onChange={(e) => {
            const voice = voices.find(v => v.voiceURI === e.target.value);
            if (voice) onVoiceChange(voice);
          }}
          disabled={voices.length === 0}
          className={`
            block w-full pl-10 pr-10 py-3 text-base border-none rounded-2xl bg-surface text-white 
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-lg appearance-none 
            transition-colors cursor-pointer text-ellipsis overflow-hidden
            ${voices.length === 0 && isLoaded ? 'border border-red-500/30 text-red-200 bg-red-900/10' : ''}
            disabled:opacity-70 disabled:cursor-not-allowed
          `}
          aria-label="Select Voice"
        >
          {!isLoaded && voices.length === 0 ? (
            <option>Loading voices...</option>
          ) : voices.length === 0 ? (
            <option>No voices found (Check OS Settings)</option>
          ) : filteredVoices.length === 0 ? (
            <option>No voices found for this filter</option>
          ) : (
            filteredVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))
          )}
        </select>
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      {/* Helper text for Linux users specifically if no voices found */}
      {isLoaded && voices.length === 0 && (
        <div className="mt-2 px-2 text-xs text-red-300 flex items-start gap-1.5">
           <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
           <p>
             No voices detected. If you are on <strong>Linux</strong>, please install `speech-dispatcher` or `espeak`. 
             On other platforms, ensure TTS is enabled in system settings.
           </p>
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;
