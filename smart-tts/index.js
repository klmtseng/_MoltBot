#!/usr/bin/env node
/**
 * Smart TTS Node.js wrapper
 * Calls the Python edge-tts backend with language detection
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PYTHON_SCRIPT = join(__dirname, 'tts.py');

/**
 * Synthesize text to audio file
 * @param {string} text - Text to synthesize
 * @param {Object} options - Options
 * @param {string} options.output - Output file path (default: auto-generated)
 * @param {string} options.gender - Voice gender: 'female' or 'male' (default: 'female')
 * @param {string} options.rate - Speech rate (e.g., '+10%', '-20%')
 * @param {string} options.pitch - Voice pitch (e.g., '+5Hz', '-10Hz')
 * @param {string} options.volume - Volume (e.g., '+10%', '-20%')
 * @returns {Promise<string>} Path to generated audio file
 */
export async function synthesize(text, options = {}) {
  const {
    output = join(tmpdir(), `tts-${randomUUID()}.mp3`),
    gender = 'female',
    rate = '+0%',
    pitch = '+0Hz',
    volume = '+0%'
  } = options;

  return new Promise((resolve, reject) => {
    const args = [
      PYTHON_SCRIPT,
      text,
      '-o', output,
      '-g', gender,
      '-r', rate,
      '-p', pitch,
      '-v', volume
    ];

    const proc = spawn('python3', args);
    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && existsSync(output)) {
        resolve(output);
      } else {
        reject(new Error(`TTS failed (code ${code}): ${stderr}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Detect primary language in text
 * @param {string} text 
 * @returns {'zh' | 'en' | 'ja' | 'yue' | 'neutral'}
 */
export function detectLanguage(text) {
  // Japanese: Hiragana/Katakana
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  
  // Cantonese markers
  if (/[係唔佢嘅冇睇咗嚟喺哋俾諗乜嘢咁喎]/.test(text)) return 'yue';
  
  // Chinese (Hanzi)
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  
  // Latin (English)
  if (/[a-zA-Z]/.test(text)) return 'en';
  
  return 'neutral';
}

// CLI mode
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    console.log('Testing Smart TTS...');
    synthesize('哈囉！這是測試語音。Hello world!')
      .then(path => console.log('Generated:', path))
      .catch(err => console.error('Error:', err.message));
  } else if (args.length > 0) {
    const text = args.filter(a => !a.startsWith('-')).join(' ');
    const gender = args.includes('-m') || args.includes('--male') ? 'male' : 'female';
    synthesize(text, { gender })
      .then(path => console.log(path))
      .catch(err => {
        console.error(err.message);
        process.exit(1);
      });
  } else {
    console.log('Usage: smart-tts "text to speak" [-m|--male]');
    console.log('       smart-tts --test');
  }
}

export default { synthesize, detectLanguage };
