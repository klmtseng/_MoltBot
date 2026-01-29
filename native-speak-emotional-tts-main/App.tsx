
import React, { useState, useRef } from 'react';
import { Play, Pause, Settings, Mic2, Trash2, Upload, History } from 'lucide-react';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import VoiceSelector from './components/VoiceSelector';
import SettingsPanel from './components/SettingsPanel';
import TextInput from './components/TextInput';
import ChangelogModal from './components/ChangelogModal';
import { TTSSettings } from './types';
import { DEFAULT_SETTINGS, DEFAULT_TEXT } from './constants';

const App: React.FC = () => {
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showChangelog, setShowChangelog] = useState<boolean>(false);
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_SETTINGS);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    pause,
    resume,
    cancel,
    ttsState
  } = useSpeechSynthesis();

  // Unified Toggle Logic
  const handleTogglePlay = () => {
    if (ttsState.isSpeaking) {
      if (ttsState.isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      if (text.trim()) {
        speak(text, settings);
      }
    }
  };

  const handleClear = () => {
    cancel(); 
    setText('');
  };

  /**
   * Helper: Clean content based on file type
   */
  const processFileContent = (content: string, fileName: string): string => {
    const lowerName = fileName.toLowerCase();

    // 1. Handle SRT Subtitles (Strip timestamps and indices)
    if (lowerName.endsWith('.srt')) {
      return content
        .replace(/\r\n/g, '\n')
        .replace(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s-->\s\d{2}:\d{2}:\d{2}[,.]\d{3}/g, '')
        .replace(/^\d+$/gm, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // 2. Handle Markdown (Strip basic syntax for better reading flow)
    if (lowerName.endsWith('.md')) {
        return content
            .replace(/^#+\s/gm, '')
            .replace(/(\*\*|__)(.*?)\1/g, '$2')
            .replace(/(\*|_)(.*?)\1/g, '$2')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]+)`/g, '$1')
            .trim();
    }

    return content;
  };

  /**
   * Core logic to read and process a file object
   */
  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        cancel(); // Stop current speech
        const cleanText = processFileContent(content, file.name);
        setText(cleanText);
      }
    };
    reader.readAsText(file);
  };

  /**
   * Handle input element change event
   */
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    handleFileRead(file);
    
    // Reset to allow re-selecting same file
    event.target.value = '';
  };

  const triggerFileImport = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-slate-900">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Mic2 className="text-white h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">NativeSpeak</h1>
            <p className="text-xs text-gray-400 font-medium">On-Device Processing</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* File Input: Added .md, .srt support */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileImport} 
            accept=".txt,text/plain,.md,.srt,.vtt" 
            className="hidden" 
          />

          <button 
            onClick={triggerFileImport}
            className="p-3 rounded-full transition-all duration-300 text-gray-400 hover:text-blue-400 hover:bg-white/5"
            aria-label="Import File"
            title="Import .txt, .md, or .srt"
          >
            <Upload size={22} />
          </button>

          <button 
            onClick={handleClear}
            className="p-3 rounded-full transition-all duration-300 text-gray-400 hover:text-red-400 hover:bg-white/5"
            aria-label="Clear Text"
            title="Clear Text"
          >
            <Trash2 size={22} />
          </button>
          
          <button 
            onClick={() => setShowChangelog(true)}
            className="p-3 rounded-full transition-all duration-300 text-gray-400 hover:text-yellow-400 hover:bg-white/5"
            aria-label="Version History"
            title="Version History"
          >
            <History size={22} />
          </button>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-full transition-all duration-300 ${showSettings ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            aria-label="Settings"
          >
            <Settings size={22} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative px-4 pb-24 md:pb-32 overflow-hidden">
        
        {/* Settings Overlay */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showSettings ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
           <div className="max-w-md mx-auto">
             <SettingsPanel settings={settings} onChange={setSettings} isOpen={showSettings} />
           </div>
        </div>

        {/* Voice Select */}
        <div className="z-10">
          <VoiceSelector 
            voices={voices} 
            selectedVoice={selectedVoice} 
            onVoiceChange={setSelectedVoice} 
          />
        </div>

        {/* Text Area with Drag & Drop */}
        <TextInput 
          text={text} 
          setText={setText} 
          charIndex={ttsState.charIndex}
          isSpeaking={ttsState.isSpeaking}
          onFileDrop={handleFileRead}
        />
        
        {/* Visual Pulse */}
        {ttsState.isSpeaking && !ttsState.isPaused && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-pulse-slow mix-blend-screen" />
        )}
      </main>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-50">
        <div className="max-w-md mx-auto flex items-center justify-center">
          
          <button
            onClick={handleTogglePlay}
            disabled={!text.trim() && !ttsState.isSpeaking} 
            className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={ttsState.isSpeaking && !ttsState.isPaused ? "Pause" : "Play"}
          >
            {ttsState.isSpeaking && !ttsState.isPaused ? (
              <Pause size={32} fill="currentColor" className="group-hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Play size={32} fill="currentColor" className="ml-1 group-hover:scale-110 transition-transform duration-300" />
            )}
          </button>

        </div>
        <div className="h-4 w-full"></div>
      </div>

      {/* Changelog Modal */}
      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
    </div>
  );
};

export default App;
