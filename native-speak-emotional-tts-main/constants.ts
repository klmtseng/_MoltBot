
import { TTSSettings } from "./types";

export const DEFAULT_SETTINGS: TTSSettings = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

export const DEFAULT_TEXT = `NativeSpeak v1.3.5 Release (2026-01-30)

🎉 What's New / 更新重點：

1. Silent Emojis & Punctuation (符號靜音) 🤫
   "Parentheses like (this) or emojis like 🚀 won't be read aloud, but highlighting stays perfect!"
   "括號內的文字（如這段）或表情符號 😎 不會被讀出，但高亮依然精準！"

2. Gender Consistency (性別一致性) 👩👨
   Switching languages now maintains the voice gender (e.g., Female Chinese -> Female English).
   "我是女生，講英文時也會保持女聲。" -> "I am female, and I stay female in English."

3. Context-Aware Cantonese (智慧廣東話) 🇭🇰
   "係呀，因為前後都係廣東話，中間嘅數字 123 都會變廣東話讀出嚟！"

4. Privacy First (隱私優先)
   Still 100% offline. No data leaves your device.
   
(Click Play to test / 按下播放測試)`;
