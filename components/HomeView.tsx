import React, { useState } from 'react';
import { UserSettings, AppStats, Word, ViewState } from '../types';
import { Play, Calendar, Book, ChevronDown, Check } from 'lucide-react';

interface HomeViewProps {
  user: UserSettings;
  stats: AppStats;
  vocab: Word[];
  onStartStudy: () => void;
  onNavigate: (view: ViewState) => void;
  onUpdateUser: (settings: UserSettings) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, stats, vocab, onStartStudy, onNavigate, onUpdateUser }) => {
  const [isBookMenuOpen, setBookMenuOpen] = useState(false);

  // Extract unique categories
  const categories = Array.from(new Set(vocab.map(w => w.category || '未分类'))) as string[];
  const allCategories = ['全部单词', ...categories.filter(c => c !== '全部单词').sort()];
  
  const currentCategory = user.selectedCategory || '全部单词';

  // Filter vocab based on current book selection
  const activeVocab = currentCategory === '全部单词' 
    ? vocab 
    : vocab.filter(w => w.category === currentCategory);

  const now = Date.now();
  const dueCount = activeVocab.filter(w => w.srs.nextReview <= now && w.srs.reps > 0).length;
  const newAvailable = activeVocab.filter(w => w.srs.reps === 0).length;
  
  // Calculate remaining new cards for the day based on goal
  let dailyRemaining = user.dailyGoal - stats.todayLearned;
  if (dailyRemaining < 0) dailyRemaining = 0;
  // Cap by what's actually available in this book
  const newToLearn = Math.min(dailyRemaining, newAvailable);

  const progressPct = Math.min(100, (stats.todayLearned / user.dailyGoal) * 100);

  const selectCategory = (cat: string) => {
    onUpdateUser({ ...user, selectedCategory: cat });
    setBookMenuOpen(false);
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in pb-24 relative">
      
      {/* Header & Book Switcher */}
      <div className="mt-2 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {user.nickname}加油！
          </h2>
          <p className="text-slate-500 text-sm mt-1">今天也要努力进步哦！💪</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setBookMenuOpen(!isBookMenuOpen)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Book size={16} className="text-blue-600" />
            <span className="text-sm font-bold text-slate-700 max-w-[100px] truncate">{currentCategory}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {isBookMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBookMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-2 overflow-hidden animate-fade-in">
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">选择单词书</div>
                <div className="max-h-60 overflow-y-auto">
                  {allCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => selectCategory(cat)}
                      className="w-full text-left px-4 py-3 text-sm flex justify-between items-center hover:bg-slate-50 transition-colors"
                    >
                      <span className={`${currentCategory === cat ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                        {cat}
                      </span>
                      {currentCategory === cat && <Check size={14} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Daily Progress */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={18} />
            <span className="font-semibold text-slate-700">今日目标</span>
          </div>
          <span className="text-sm font-bold text-blue-600">{stats.todayLearned}/{user.dailyGoal}</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Stats Grid - Contextual to Category */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          onClick={() => onNavigate('library')}
          className="bg-red-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-transform"
        >
          <span className="text-3xl font-bold text-red-900 mb-1">{dueCount}</span>
          <span className="text-xs text-red-800 opacity-80">
            {currentCategory === '全部单词' ? '总待复习' : '本书待复习'}
          </span>
        </div>
        <div 
          onClick={() => onNavigate('library')}
          className="bg-purple-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-transform"
        >
          <span className="text-3xl font-bold text-purple-900 mb-1">{newToLearn}</span>
          <span className="text-xs text-purple-800 opacity-80">
            {currentCategory === '全部单词' ? '总新词计划' : '本书新词'}
          </span>
        </div>
        
        <div className="bg-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-slate-700 mb-1">{stats.todayLearned}</span>
          <span className="text-xs text-slate-500">今日已学</span>
        </div>
        <div className="bg-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-slate-700 mb-1">{stats.totalMastered}</span>
          <span className="text-xs text-slate-500">掌握单词</span>
        </div>
      </div>

      {/* Total Count */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Book className="text-slate-400" size={20} />
          <span className="text-sm font-bold text-slate-700">
             {currentCategory === '全部单词' ? '词库总量' : `Current Book: ${currentCategory}`}
          </span>
        </div>
        <span className="text-lg font-bold text-blue-600">{activeVocab.length}</span>
      </div>

      {/* Action Button */}
      <button 
        onClick={onStartStudy}
        className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full flex items-center justify-center gap-2 font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-98"
      >
        <Play fill="currentColor" size={20} />
        {currentCategory === '全部单词' ? '开始全库复习' : `背诵 "${currentCategory}"`}
      </button>
    </div>
  );
};