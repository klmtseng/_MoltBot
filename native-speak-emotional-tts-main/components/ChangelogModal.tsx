
import React from 'react';
import { X, GitCommit, CheckCircle2, Upload, History, Trash2, Languages } from 'lucide-react';

interface ControlGuide {
  icon: React.ReactNode;
  label: string;
  desc: string;
}

interface UpdateEntry {
  version: string;
  date: string;
  title: string;
  features: string[];
  controls?: ControlGuide[];
}

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UPDATES: UpdateEntry[] = [
  {
    version: 'v1.3.5',
    date: '2026-01-30',
    title: 'iOS Polish & Silent Emojis',
    features: [
      'Emoji 靜音 (Silent Emojis)：現在 Emoji 與特殊表情符號不會被讀出來（例如不會讀出 "Smiling face with sunglasses"），避免打斷閱讀體驗。',
      'iOS 性別一致性修復：修正了在 iPhone/iPad 上，語音切換無法正確維持性別（例如選了女生卻跳回男生）的問題。我們擴增了對 Apple 內建語音名稱的辨識庫。',
    ]
  },
  {
    version: 'v1.3.4',
    date: '2026-01-30',
    title: 'Natural Flow & Gender Sync',
    features: [
      '性別一致性 (Gender Consistency)：現在切換語言時（如中翻英），系統會自動選擇與您當前聲音相同性別（男/女）的語音引擎，保持聽感連貫。',
      '標點符號靜音 (Silent Punctuation)：括號、引號、連接線等符號現在不會被讀出來，但仍保留視覺高亮位置，讓朗讀更像真人。',
    ]
  },
  {
    version: 'v1.3.3',
    date: '2026-01-22',
    title: 'Unified Context Logic',
    features: [
      '邏輯統一：將廣東話的判斷邏輯升級為與日語/英語相同的標準。',
      '標準中文同化 (Context Promotion)：當「標準書面語」句子被廣東話段落包圍時（前後文判斷），系統會自動將其視為廣東話來朗讀，確保語音流暢度，不會突然切換回國語。',
      '深度上下文掃描：採用了雙層（2-step）的前後文搜尋機制，大幅提升混合語言文章的朗讀準確性。',
    ]
  },
  {
    version: 'v1.3.2',
    date: '2026-01-21',
    title: 'Context-Aware Cantonese',
    features: [
      '智慧廣東話辨識：新增粵語（Cantonese）支援，能識別口語特徵字（如：係、唔、嘅）。',
      '標點與數字優化：在廣東話段落中的數字（如 "123"）與符號現在會正確使用粵語朗讀。',
      '語音篩選器：新增「Cantonese」專屬分類標籤。',
    ]
  },
  {
    version: 'v1.3.1',
    date: '2026-01-20',
    title: 'Smart Polyglot Support',
    features: [
      '智慧語系切換：現在遇到日文、英文、中文交錯的句子，程式會自動切換發音引擎。',
      '修復日文漢字問題：解決了日文內容被誤判為中文發音的 Bug。',
      '優化 CJK 文字高亮：針對不使用空格的語言（中日韓）改進了分詞與高亮顯示邏輯。',
      '安全性驗證通過：代碼審計確認為 100% 離線架構。',
    ],
    controls: [
      { 
        icon: <Upload size={18} />, 
        label: 'Import / Drag & Drop', 
        desc: '支援 .txt, .md, .srt 等多種檔案格式。' 
      },
      { 
        icon: <History size={18} />, 
        label: 'Version History', 
        desc: '查看開發日誌與功能更新進度。' 
      },
      { 
        icon: <Trash2 size={18} />, 
        label: 'Clear / Reset', 
        desc: '一鍵清空所有文字內容。' 
      },
      { 
        icon: <Languages size={18} />, 
        label: 'Auto Detection', 
        desc: '智慧偵測語系，自動選擇發音引擎。' 
      }
    ]
  },
  {
    version: 'v1.3.0',
    date: '2026-01-18',
    title: 'Drag & Drop Experience',
    features: [
      '新增拖曳支援：現在可以直接將檔案拖入文字區域來讀取內容。',
      '視覺互動優化：新增檔案拖曳時的覆蓋層提示效果。',
      '核心重構：優化了檔案讀取的效能與穩定性。',
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-01-17',
    title: 'Core TTS Engine',
    features: [
      '離線語音合成：使用瀏覽器原生的 Web Speech API。',
      '即時文字跟隨：支援卡拉 OK 風格的逐字高亮顯示。',
      '隱私優先架構：所有資料皆在本地處理，不會上傳至伺服器。',
    ]
  }
];

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-surface border border-white/10 w-full max-w-lg max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white">開發日誌 (Changelog)</h2>
            <p className="text-xs text-gray-400 mt-1">追蹤 NativeSpeak 的進化過程</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="overflow-y-auto p-6 space-y-8">
          {UPDATES.map((update, index) => (
            <div key={update.version} className="relative pl-8 border-l border-white/10 last:border-0">
              {/* Timeline Dot */}
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${index === 0 ? 'bg-primary border-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-surface border-gray-600'}`} />
              
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono font-bold ${index === 0 ? 'text-primary' : 'text-gray-300'}`}>
                    {update.version}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                    {update.date}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">{update.title}</h3>
              </div>

              {/* Icon Guide (Icon Legend) */}
              {update.controls && (
                <div className="grid grid-cols-1 gap-2 mb-4 bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 px-1">功能圖示說明</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {update.controls.map((ctrl, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-white/5">
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                          {ctrl.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-gray-200 truncate">{ctrl.label}</span>
                          <span className="text-[10px] text-gray-500 leading-tight">{ctrl.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ul className="space-y-2 mt-3">
                {update.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400 leading-relaxed">
                    <CheckCircle2 size={14} className="mt-1 text-secondary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Bottom Footer */}
           <div className="pt-8 flex items-center justify-center gap-2 text-gray-500 text-xs">
              <GitCommit size={14} />
              <span>NativeSpeak v1.3.5 (Fully Offline)</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ChangelogModal;
