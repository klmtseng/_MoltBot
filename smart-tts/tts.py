#!/usr/bin/env python3
"""
Smart TTS with multi-language detection
Adapted from Aaron's native-speak-emotional-tts
Uses edge-tts for natural Microsoft voices
"""

import asyncio
import argparse
import re
import sys
import os
from typing import List, Tuple, Literal

try:
    import edge_tts
except ImportError:
    print("Please install edge-tts: pip install edge-tts", file=sys.stderr)
    sys.exit(1)

# Language type detection
LangType = Literal['ja', 'zh', 'yue', 'en', 'neutral']

# Voice mappings (Microsoft Edge voices)
VOICES = {
    'zh': {
        'female': 'zh-TW-HsiaoChenNeural',  # 台灣女聲
        'male': 'zh-TW-YunJheNeural',        # 台灣男聲
    },
    'yue': {
        'female': 'zh-HK-HiuGaaiNeural',     # 粵語女聲
        'male': 'zh-HK-WanLungNeural',       # 粵語男聲
    },
    'ja': {
        'female': 'ja-JP-NanamiNeural',
        'male': 'ja-JP-KeitaNeural',
    },
    'en': {
        'female': 'en-US-JennyNeural',
        'male': 'en-US-GuyNeural',
    },
}

# Cantonese-specific characters
CANTONESE_MARKERS = re.compile(r'[係唔佢嘅冇睇咗嚟喺哋俾諗乜嘢咁喎]')

def detect_lang(text: str) -> LangType:
    """Detect language type from text segment"""
    # Japanese: Hiragana/Katakana
    if re.search(r'[\u3040-\u309F\u30A0-\u30FF]', text):
        return 'ja'
    
    # Cantonese markers
    if CANTONESE_MARKERS.search(text):
        return 'yue'
    
    # Chinese (Hanzi)
    if re.search(r'[\u4E00-\u9FFF]', text):
        return 'zh'
    
    # Latin (English)
    if re.search(r'[a-zA-Z]', text):
        return 'en'
    
    return 'neutral'

def parse_segments(text: str) -> List[Tuple[str, int]]:
    """Parse text into segments with their offsets"""
    segments = []
    # Split by sentence endings
    sentence_pattern = re.compile(r'([^.!?。！？\n\r]+[.!?。！？\n\r]*)|([.!?。！？\n\r]+)')
    
    for match in sentence_pattern.finditer(text):
        sentence = match.group(0)
        offset = match.start()
        
        # Check for mixed content
        has_cjk = bool(re.search(r'[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]', sentence))
        has_latin = bool(re.search(r'[a-zA-Z]', sentence))
        
        if has_cjk and has_latin:
            # Split mixed content
            cjk_pattern = re.compile(r'([\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]+)')
            last_idx = 0
            
            for sub_match in cjk_pattern.finditer(sentence):
                # Non-CJK part
                if sub_match.start() > last_idx:
                    non_cjk = sentence[last_idx:sub_match.start()]
                    if non_cjk.strip():
                        segments.append((non_cjk, offset + last_idx))
                
                # CJK part
                segments.append((sub_match.group(0), offset + sub_match.start()))
                last_idx = sub_match.end()
            
            # Remaining
            if last_idx < len(sentence):
                remaining = sentence[last_idx:]
                if remaining.strip():
                    segments.append((remaining, offset + last_idx))
        else:
            if sentence.strip():
                segments.append((sentence, offset))
    
    if not segments and text.strip():
        segments.append((text, 0))
    
    return segments

def get_voice(lang: LangType, gender: str = 'female') -> str:
    """Get appropriate voice for language"""
    if lang == 'neutral':
        lang = 'zh'  # Default to Chinese
    
    voices = VOICES.get(lang, VOICES['zh'])
    return voices.get(gender, voices['female'])

def sanitize_for_speech(text: str) -> str:
    """Remove noisy characters while preserving length"""
    # Remove brackets, special chars
    text = re.sub(r'[()\[\]{}<>"\'_*@#$%^&+=`~|\\/\-]', ' ', text)
    # Remove emojis
    text = re.sub(r'[\U0001F300-\U0001F9FF]', ' ', text)
    return text

async def synthesize(text: str, output: str, gender: str = 'female', 
                     rate: str = '+0%', pitch: str = '+0Hz', volume: str = '+0%'):
    """Synthesize text to audio file with smart language switching"""
    
    segments = parse_segments(text)
    
    if not segments:
        print("No text to synthesize", file=sys.stderr)
        return False
    
    # If single language, use simple synthesis
    langs = [detect_lang(seg[0]) for seg in segments]
    unique_langs = set(l for l in langs if l != 'neutral')
    
    if len(unique_langs) <= 1:
        # Simple case: single language
        lang = unique_langs.pop() if unique_langs else 'zh'
        voice = get_voice(lang, gender)
        clean_text = sanitize_for_speech(text)
        
        communicate = edge_tts.Communicate(clean_text, voice, rate=rate, pitch=pitch, volume=volume)
        await communicate.save(output)
        print(f"Generated: {output} (voice: {voice})")
        return True
    
    # Multi-language: synthesize segments and concatenate
    # For now, use dominant language (most common)
    lang_counts = {}
    for l in langs:
        if l != 'neutral':
            lang_counts[l] = lang_counts.get(l, 0) + 1
    
    dominant = max(lang_counts, key=lang_counts.get) if lang_counts else 'zh'
    voice = get_voice(dominant, gender)
    clean_text = sanitize_for_speech(text)
    
    communicate = edge_tts.Communicate(clean_text, voice, rate=rate, pitch=pitch, volume=volume)
    await communicate.save(output)
    print(f"Generated: {output} (voice: {voice}, dominant lang: {dominant})")
    return True

async def list_voices(lang_filter: str = None):
    """List available voices"""
    voices = await edge_tts.list_voices()
    for v in voices:
        if lang_filter and not v['ShortName'].lower().startswith(lang_filter.lower()):
            continue
        print(f"{v['ShortName']:40} {v['Gender']:8} {v.get('VoiceTag', {}).get('VoicePersonalities', [''])[0] if v.get('VoiceTag') else ''}")

def main():
    parser = argparse.ArgumentParser(description='Smart TTS with multi-language detection')
    parser.add_argument('text', nargs='?', help='Text to synthesize')
    parser.add_argument('-o', '--output', default='output.mp3', help='Output file path')
    parser.add_argument('-g', '--gender', choices=['female', 'male'], default='female', help='Voice gender')
    parser.add_argument('-r', '--rate', default='+0%', help='Speech rate (e.g., +10%, -20%)')
    parser.add_argument('-p', '--pitch', default='+0Hz', help='Voice pitch (e.g., +5Hz, -10Hz)')
    parser.add_argument('-v', '--volume', default='+0%', help='Volume (e.g., +10%, -20%)')
    parser.add_argument('--list-voices', action='store_true', help='List available voices')
    parser.add_argument('--lang', help='Filter voices by language prefix')
    parser.add_argument('-f', '--file', help='Read text from file')
    
    args = parser.parse_args()
    
    if args.list_voices:
        asyncio.run(list_voices(args.lang))
        return
    
    text = args.text
    if args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            text = f.read()
    
    if not text:
        # Read from stdin if no text provided
        if not sys.stdin.isatty():
            text = sys.stdin.read()
        else:
            parser.print_help()
            return
    
    asyncio.run(synthesize(
        text=text,
        output=args.output,
        gender=args.gender,
        rate=args.rate,
        pitch=args.pitch,
        volume=args.volume
    ))

if __name__ == '__main__':
    main()
