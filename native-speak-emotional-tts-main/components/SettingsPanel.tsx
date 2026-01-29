import React from 'react';
import { TTSSettings } from '../types';
import { Gauge, Volume2, Music } from 'lucide-react';

interface SettingsPanelProps {
  settings: TTSSettings;
  onChange: (settings: TTSSettings) => void;
  isOpen: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange, isOpen }) => {
  const handleChange = (key: keyof TTSSettings, value: number) => {
    onChange({ ...settings, [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="w-full bg-surface/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Rate/Speed */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-secondary" />
            <span>Speed</span>
          </div>
          <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded">{settings.rate.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={settings.rate}
          onChange={(e) => handleChange('rate', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-secondary"
        />
      </div>

      {/* Pitch */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Music size={16} className="text-primary" />
            <span>Pitch</span>
          </div>
          <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded">{settings.pitch.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={settings.pitch}
          onChange={(e) => handleChange('pitch', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Volume */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-green-400" />
            <span>Volume</span>
          </div>
          <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded">{Math.round(settings.volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.volume}
          onChange={(e) => handleChange('volume', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-400"
        />
      </div>
    </div>
  );
};

export default SettingsPanel;
