
import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { DEFAULT_TEXT } from '../constants';

interface TextInputProps {
  text: string;
  setText: (text: string) => void;
  charIndex: number;
  isSpeaking: boolean;
  onFileDrop: (file: File) => void;
}

const TextInput: React.FC<TextInputProps> = ({ text, setText, charIndex, isSpeaking, onFileDrop }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync scroll between textarea and overlay
  const handleScroll = () => {
    if (textAreaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  };

  const handleFocus = () => {
    if (text === DEFAULT_TEXT) {
      setText('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|srt|vtt|json|js|ts|tsx)$/i)) {
          onFileDrop(file);
      }
    }
  };

  // Generate highlighted HTML with improved CJK support
  const getHighlightedText = () => {
    if (charIndex === -1 || !isSpeaking) return text;
    
    // Heuristic for finding word end
    let endIndex = charIndex + 1;
    const currentChar = text[charIndex];
    const isCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(currentChar);

    if (!isCJK) {
      // For non-CJK (English etc.), look for spaces or punctuation
      const nextSpace = text.indexOf(' ', charIndex);
      const nextPunc = text.search(/[\s.,!?;:。，！？：\n]/g, charIndex);
      
      if (nextSpace === -1 && nextPunc === -1) endIndex = text.length;
      else if (nextSpace === -1) endIndex = nextPunc;
      else if (nextPunc === -1) endIndex = nextSpace;
      else endIndex = Math.min(nextSpace, nextPunc);
      
      if (endIndex <= charIndex) endIndex = charIndex + 1;
    } else {
      // For CJK, usually highlighters work better char-by-char if the engine is fast
      endIndex = charIndex + 1;
    }

    const before = text.substring(0, charIndex);
    const highlight = text.substring(charIndex, endIndex);
    const after = text.substring(endIndex);

    return `${before}<span class="bg-primary/50 rounded-sm text-transparent ring-1 ring-primary/30">${highlight}</span>${after}`;
  };

  const typographyStyles = "text-lg md:text-xl font-normal leading-relaxed font-sans tracking-normal";

  return (
    <div 
        className={`
            relative flex-1 w-full max-w-4xl mx-auto mt-4 overflow-hidden rounded-3xl border shadow-inner transition-all duration-300
            ${isDragging ? 'border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.01]' : 'border-white/5 bg-surface/30'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {isDragging && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-primary/20 p-6 rounded-full mb-4">
                  <Upload size={48} className="text-primary animate-bounce" />
              </div>
              <p className="text-xl font-bold text-white">放開以讀取檔案</p>
              <p className="text-sm text-gray-400 mt-2">支援 .txt, .md, .srt</p>
          </div>
      )}

      <div 
        ref={overlayRef}
        className={`absolute inset-0 p-6 whitespace-pre-wrap break-words text-transparent pointer-events-none overflow-y-auto ${typographyStyles}`}
        style={{ fontVariantLigatures: 'none' }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
      />
      
      <textarea
        ref={textAreaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onScroll={handleScroll}
        onFocus={handleFocus}
        className={`absolute inset-0 w-full h-full p-6 bg-transparent text-gray-100 placeholder-gray-600 resize-none focus:outline-none focus:ring-0 z-10 ${typographyStyles}`}
        style={{ fontVariantLigatures: 'none', WebkitTextFillColor: 'currentColor' }}
        placeholder="在此輸入、貼上文字，或將檔案拖放到這裡..."
        spellCheck="false"
      />
    </div>
  );
};

export default TextInput;
