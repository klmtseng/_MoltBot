# _MoltBot
Multiple test

Personal sandbox repo for text-to-speech experiments. Not a maintained product.

Contains two subprojects:

- `smart-tts/` — CLI for multilingual TTS via Microsoft Edge TTS
  (`edge-tts`): auto-detects Chinese / Cantonese / Japanese / English and picks
  a matching voice (Taiwanese voices by default). Python CLI (`tts.py`) plus a
  thin Node.js wrapper (`index.js`). See its own README for usage.
- `native-speak-emotional-tts-main/` — vendored copy of a React/Vite emotional
  TTS web app that `smart-tts` was adapted from.

## Quick try

```bash
pip install edge-tts
python3 smart-tts/tts.py "你好，這是測試" -o output.mp3
```
