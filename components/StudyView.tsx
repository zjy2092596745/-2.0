import React, { useState, useEffect } from 'react';
import { Word, StudyMode } from '../types';
import { StorageService } from '../services/storageService';
import { X, Volume2, ArrowRight, RotateCcw, Trophy } from 'lucide-react';

interface StudyViewProps {
  queue: Word[];
  onComplete: (updatedWords: Word[], sessionStats: { learned: number, mastered: number }) => void;
  onExit: () => void;
}

export const StudyView: React.FC<StudyViewProps> = ({ queue, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<StudyMode>('flashcard');
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  
  // Track updates locally
  const [sessionUpdatedWords, setSessionUpdatedWords] = useState<Word[]>([]);
  const [sessionLearned, setSessionLearned] = useState(0);
  const [sessionMastered, setSessionMastered] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // Safety check
  if (!queue || queue.length === 0) return null;

  useEffect(() => {
    if (currentIndex >= queue.length) {
      setShowSummary(true);
    }
  }, [currentIndex, queue.length]);

  const handleFinish = () => {
    onComplete(sessionUpdatedWords, { learned: sessionLearned, mastered: sessionMastered });
    onExit();
  };

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const handleReveal = () => {
    setIsFlipped(true);
    speak(queue[currentIndex].word);
    setMode('flashcard');
  };

  const handleRate = (quality: number) => {
    const currentWord = queue[currentIndex];
    const { updatedWord, isLearnedToday, isMastered } = StorageService.processRating(currentWord, quality);
    
    setSessionUpdatedWords(prev => [...prev.filter(w => w.id !== updatedWord.id), updatedWord]);
    if (isLearnedToday) setSessionLearned(prev => prev + 1);
    if (isMastered) setSessionMastered(prev => prev + 1);

    setIsFlipped(false);
    setInputVal('');
    setFeedback('idle');
    setCurrentIndex(prev => prev + 1);
  };

  const checkSpelling = () => {
    if (inputVal.trim().toLowerCase() === queue[currentIndex].word.toLowerCase()) {
      setFeedback('correct');
      setTimeout(handleReveal, 800);
    } else {
      setFeedback('wrong');
    }
  };

  // --- Summary View ---
  if (showSummary) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 items-center justify-center p-6 animate-fade-in">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🏆
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">本次学习完成!</h2>
          <p className="text-slate-500 mb-8">休息一下，喝口水吧 ☕️</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-2xl">
              <div className="text-2xl font-bold text-blue-600">{sessionLearned}</div>
              <div className="text-xs text-blue-400">新学单词</div>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl">
              <div className="text-2xl font-bold text-green-600">{sessionMastered}</div>
              <div className="text-xs text-green-400">掌握单词</div>
            </div>
          </div>

          <button 
            onClick={handleFinish}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }

  const currentWord = queue[currentIndex];

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 bg-white border-b border-slate-100 z-10">
        <span className="font-bold text-blue-600">{currentIndex + 1} / {queue.length}</span>
        
        <div className="bg-slate-100 p-1 rounded-full flex">
          <button 
            onClick={() => setMode('flashcard')}
            className={`px-3 py-1 text-xs rounded-full transition-all ${mode === 'flashcard' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500'}`}
          >
            卡片
          </button>
          <button 
            onClick={() => {
              setMode('spelling');
              setIsFlipped(false);
            }}
            className={`px-3 py-1 text-xs rounded-full transition-all ${mode === 'spelling' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500'}`}
          >
            拼写
          </button>
        </div>

        <button onClick={() => { handleFinish(); }} className="text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
      </div>

      {/* Main Card Area */}
      <div className="flex-1 p-4 flex flex-col justify-center perspective-1000">
        <div 
          className="relative w-full aspect-[4/5] max-h-[500px] cursor-pointer"
          onClick={() => {
             if (mode === 'flashcard' && !isFlipped) handleReveal();
          }}
        >
          <div className={`w-full h-full bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center justify-center p-8 text-center transition-all duration-300 relative overflow-hidden`}>
            
            {/* Front / Spelling Mode */}
            {!isFlipped && (
              <>
                <span className="text-xs uppercase tracking-widest text-slate-400 mb-4">Term</span>
                
                {mode === 'flashcard' ? (
                  <>
                    <h1 className="text-4xl font-extrabold text-blue-600 mb-2">{currentWord.word}</h1>
                    <p className="font-mono text-slate-400 text-lg mb-8">{currentWord.ipa}</p>
                    <p className="text-blue-600/50 text-sm mt-auto">(点击翻转)</p>
                  </>
                ) : (
                  <div className="w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                    <p className="text-2xl font-bold text-slate-800 mb-8">{currentWord.def}</p>
                    <input 
                      type="text" 
                      className="text-2xl text-center border-b-2 border-slate-300 focus:border-blue-600 outline-none bg-transparent w-full py-2 mb-4 text-slate-800"
                      placeholder="Type here..."
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      autoCapitalize="off"
                      autoComplete="off"
                    />
                    <div className="h-6 mb-4 font-bold">
                       {feedback === 'correct' && <span className="text-green-600">✅ 正确!</span>}
                       {feedback === 'wrong' && <span className="text-red-500">❌ 错误</span>}
                    </div>
                    <button onClick={checkSpelling} className="bg-blue-100 text-blue-700 px-6 py-2 rounded-full font-bold">
                      检查
                    </button>
                    <button onClick={handleReveal} className="text-xs text-slate-400 mt-4 underline">
                      我不会，直接看答案
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Back (Revealed) */}
            {isFlipped && (
              <div className="flex flex-col items-center w-full h-full animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-extrabold text-blue-600">{currentWord.word}</h1>
                  <button onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }}>
                    <Volume2 className="text-blue-500" size={24} />
                  </button>
                </div>
                <p className="font-mono text-slate-400 mb-6">{currentWord.ipa}</p>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{currentWord.def}</h2>
                
                <div className="bg-slate-50 p-4 rounded-xl w-full text-left mt-auto">
                   <p className="text-slate-800 italic font-medium mb-1">{currentWord.ex_en}</p>
                   <p className="text-slate-500 text-sm">{currentWord.ex_cn}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-24 p-4 bg-white border-t border-slate-100 shrink-0">
        {!isFlipped ? (
           <button 
             onClick={handleReveal}
             className="w-full h-full bg-blue-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-blue-200 active:scale-98 transition-transform"
             disabled={mode === 'spelling'} 
             style={mode === 'spelling' ? { opacity: 0, pointerEvents: 'none' } : {}}
           >
             显示答案
           </button>
        ) : (
          <div className="grid grid-cols-4 gap-2 h-full">
            <SRSButton color="bg-red-500" label="忘记" sub="1m" onClick={() => handleRate(0)} />
            <SRSButton color="bg-orange-500" label="模糊" sub="12h" onClick={() => handleRate(1)} />
            <SRSButton color="bg-blue-600" label="熟悉" sub="3d" onClick={() => handleRate(2)} />
            <SRSButton color="bg-green-600" label="掌握" sub="7d" onClick={() => handleRate(3)} />
          </div>
        )}
      </div>
    </div>
  );
};

const SRSButton = ({ color, label, sub, onClick }: { color: string; label: string; sub: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`${color} text-white rounded-2xl flex flex-col items-center justify-center shadow-md active:scale-95 transition-transform`}
  >
    <span className="font-bold text-sm">{label}</span>
    <span className="text-[10px] opacity-80">{sub}</span>
  </button>
);