# Smart TTS 🗣️

多語言智慧 TTS，改編自 Aaron 的 [native-speak-emotional-tts](../native-speak-emotional-tts-main/)。

## 特色

- 🌏 **多語言自動偵測**：中文、粵語、日文、英文
- 🎭 **自然聲音**：使用 Microsoft Edge TTS（免費）
- 🇹🇼 **台灣聲音**：預設使用 HsiaoChenNeural（女）/ YunJheNeural（男）
- 📝 **混合語言支援**：自動判斷主要語言

## 安裝

```bash
# Python 依賴
pip install edge-tts

# Node.js (可選)
npm install
```

## 使用方式

### Python CLI

```bash
# 基本用法
python3 tts.py "你好，這是測試" -o output.mp3

# 男聲
python3 tts.py "Hello world" -o output.mp3 -g male

# 調整語速
python3 tts.py "快一點說話" -o output.mp3 -r "+20%"

# 列出所有聲音
python3 tts.py --list-voices --lang zh
```

### Node.js

```javascript
import { synthesize, detectLanguage } from './index.js';

// 生成語音
const audioPath = await synthesize('你好！這是測試。', {
  gender: 'female',
  rate: '+10%'
});

// 偵測語言
const lang = detectLanguage('這是中文'); // 'zh'
```

## 可用聲音

| 語言 | 女聲 | 男聲 |
|------|------|------|
| 台灣中文 | HsiaoChenNeural | YunJheNeural |
| 粵語 | HiuGaaiNeural | WanLungNeural |
| 日文 | NanamiNeural | KeitaNeural |
| 英文 | JennyNeural | GuyNeural |

## 感謝

原始語言偵測邏輯來自 Aaron 的瀏覽器版 TTS 應用 🙏
