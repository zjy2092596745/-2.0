import React, { useState, useMemo } from 'react';
import { Word, FilterType, AuthUser } from '../types';
import { Search, Plus, FileUp, CheckSquare, Square, Globe, Filter } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface LibraryViewProps {
  vocab: Word[];
  authUser: AuthUser;
  onUpdateVocab: (vocab: Word[], addedWords?: Word[]) => void;
  onStartSession: (list: Word[]) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ vocab, authUser, onUpdateVocab, onStartSession }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  
  // New state for import flow
  const [importFileState, setImportFileState] = useState<{ file: File, category: string } | null>(null);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    return Array.from(new Set(vocab.map(w => w.category || '未分类'))).sort();
  }, [vocab]);

  // Filter Logic
  const filteredData = useMemo(() => {
    const now = Date.now();
    let data = vocab;

    // Apply Status Filter
    if (filter === 'due') {
      data = data.filter(w => w.srs.nextReview <= now && w.srs.reps > 0);
    } else if (filter === 'new') {
      data = data.filter(w => w.srs.reps === 0);
    } else if (filter === 'learned') {
      data = data.filter(w => w.srs.reps > 0 && w.srs.interval < 21);
    } else if (filter === 'mastered') {
      data = data.filter(w => w.srs.interval >= 21);
    }

    // Apply Category Filter
    if (categoryFilter !== 'all') {
      data = data.filter(w => w.category === categoryFilter);
    }

    // Apply Search
    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(w => w.word.toLowerCase().includes(lower) || w.def.includes(lower));
    }

    return data;
  }, [vocab, filter, categoryFilter, search]);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-detect category from filename
    let detected = '导入单词';
    const name = file.name.toLowerCase();
    
    if (name.includes('pte')) {
        detected = 'PTE';
    } else if (name.includes('nurse') || name.includes('nursing') || name.includes('护理') || name.includes('医护')) {
        detected = '护理英语';
    }
    
    setImportFileState({ file, category: detected });
    e.target.value = ''; // Reset input
  };

  const confirmImport = async (finalCategory: string) => {
    if (!importFileState) return;
    
    try {
      const newWords = await StorageService.importFile(importFileState.file, finalCategory);
      // Filter duplicates against existing vocab
      const existing = new Set(vocab.map(w => w.word.toLowerCase()));
      const uniqueNew = newWords.filter(w => !existing.has(w.word.toLowerCase()));
      
      onUpdateVocab([...vocab, ...uniqueNew], uniqueNew);
      alert(`✅ 导入成功！\n\n文件: ${importFileState.file.name}\n分类: ${finalCategory}\n新增: ${uniqueNew.length} 个单词`);
    } catch (err) {
      alert("❌ 导入失败，请检查文件格式。");
      console.error(err);
    }
    setImportFileState(null);
  };

  return (
    <div className="p-4 pb-24 min-h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">我的词库</h2>
        <div className="flex gap-2">
           <label className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${authUser.isAdmin ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
             <FileUp size={18} />
             <input type="file" accept=".json,.xlsx,.xls,.csv,.docx,.pdf,.txt" className="hidden" onChange={handleFileSelect} />
           </label>
           <button 
             onClick={() => setAddModalOpen(true)} 
             className={`w-8 h-8 rounded-lg text-white flex items-center justify-center transition-colors ${authUser.isAdmin ? 'bg-red-600' : 'bg-blue-600'}`}
           >
             <Plus size={18} />
           </button>
        </div>
      </div>

      {authUser.isAdmin && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4 flex items-center gap-3 text-xs text-red-700">
          <Globe size={16} />
          <div>
            <strong>管理员模式：</strong> 添加或导入的单词将自动同步到公共词库。
          </div>
        </div>
      )}

      {/* Category Filter Dropdown */}
      <div className="relative mb-3">
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2 px-3 pr-8 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium"
        >
          <option value="all">📚 所有书籍 (Categories)</option>
          {categories.map(c => (
             <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
      </div>

      {/* Status Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
        {(['all', 'due', 'new', 'learned', 'mastered'] as FilterType[]).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
              filter === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {t === 'all' ? '全部状态' : t === 'due' ? '待复习' : t === 'new' ? '新词' : t === 'learned' ? '学习中' : '已掌握'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="搜索单词..." 
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredData.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">暂无单词</div>
        ) : (
          filteredData.map(w => (
            <div key={w.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
              <button onClick={() => toggleSelect(w.id)} className="text-slate-300 hover:text-blue-600">
                {selectedIds.has(w.id) ? <CheckSquare className="text-blue-600" /> : <Square />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <h4 className="font-bold text-slate-800 truncate">{w.word}</h4>
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">{w.ipa}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded truncate max-w-[80px]">
                      {w.category || '未分类'}
                    </span>
                    <p className="text-sm text-slate-600 truncate">{w.def}</p>
                  </div>
                </div>
              </div>
              <div className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap ${
                 w.srs.reps === 0 ? 'text-slate-500 border-slate-200' : 
                 w.srs.interval >= 21 ? 'text-green-600 border-green-200 bg-green-50' : 
                 'text-blue-600 border-blue-200 bg-blue-50'
              }`}>
                {w.srs.reps === 0 ? 'New' : w.srs.interval >= 21 ? 'Master' : 'Review'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-800 text-white p-3 rounded-full shadow-xl flex justify-between items-center z-50 animate-bounce-in">
          <span className="ml-4 font-bold text-sm">已选 {selectedIds.size} 个</span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1 text-xs text-slate-300">取消</button>
            <button 
              onClick={() => {
                const list = vocab.filter(w => selectedIds.has(w.id));
                onStartSession(list);
                setSelectedIds(new Set());
              }}
              className="px-4 py-1.5 bg-blue-500 rounded-full text-xs font-bold"
            >
              开始学习
            </button>
          </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {isAddModalOpen && (
        <AddWordModal 
          onClose={() => setAddModalOpen(false)} 
          isAdmin={authUser.isAdmin}
          existingCategories={categories}
          onSave={(word, def, ex, cat) => {
             const newWord: Word = {
               id: Date.now(),
               word, def, ex_en: ex, ex_cn: '', ipa: '',
               category: cat,
               srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 }
             };
             onUpdateVocab([newWord, ...vocab], [newWord]);
             setAddModalOpen(false);
          }}
        />
      )}

      {/* Import Confirmation Modal */}
      {importFileState && (
        <ImportConfirmModal 
            fileName={importFileState.file.name}
            initialCategory={importFileState.category}
            existingCategories={categories}
            onConfirm={confirmImport}
            onCancel={() => setImportFileState(null)}
        />
      )}
    </div>
  );
};

const AddWordModal = ({ onClose, onSave, isAdmin, existingCategories }: { onClose: () => void; onSave: (w: string, d: string, e: string, c: string) => void; isAdmin: boolean, existingCategories: string[] }) => {
  const [word, setWord] = useState('');
  const [def, setDef] = useState('');
  const [ex, setEx] = useState('');
  const [category, setCategory] = useState('护理英语');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in">
        <h3 className="text-lg font-bold mb-4 flex justify-between items-center">
          添加新单词
          {isAdmin && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded">全局同步</span>}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-blue-600 block mb-1">单词</label>
            <input className="w-full border p-2 rounded-lg" value={word} onChange={e => setWord(e.target.value)} placeholder="e.g. Hypertension" />
          </div>
          <div>
            <label className="text-xs font-bold text-blue-600 block mb-1">释义</label>
            <input className="w-full border p-2 rounded-lg" value={def} onChange={e => setDef(e.target.value)} placeholder="e.g. 高血压" />
          </div>
          <div>
            <label className="text-xs font-bold text-blue-600 block mb-1">分类 (书名)</label>
            <input 
              className="w-full border p-2 rounded-lg" 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              list="category-list"
              placeholder="e.g. 护理英语" 
            />
            <datalist id="category-list">
              {existingCategories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="text-xs font-bold text-blue-600 block mb-1">例句 (选填)</label>
            <input className="w-full border p-2 rounded-lg" value={ex} onChange={e => setEx(e.target.value)} placeholder="English example" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button onClick={onClose} className="py-2 border rounded-lg text-slate-500">取消</button>
          <button 
            onClick={() => { if(word && def && category) onSave(word, def, ex, category); }}
            className={`py-2 text-white rounded-lg font-bold ${isAdmin ? 'bg-red-600' : 'bg-blue-600'}`}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

const ImportConfirmModal = ({ fileName, initialCategory, existingCategories, onConfirm, onCancel }: { fileName: string, initialCategory: string, existingCategories: string[], onConfirm: (cat: string) => void, onCancel: () => void }) => {
    const [category, setCategory] = useState(initialCategory);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FileUp size={20} className="text-blue-600"/>
                    导入确认
                </h3>
                
                <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm text-slate-600 border border-slate-100 break-all">
                    📄 {fileName}
                </div>

                <div className="mb-6">
                    <label className="text-xs font-bold text-blue-600 block mb-1">选择或输入分类 (Book)</label>
                    <p className="text-[10px] text-slate-400 mb-2">系统已根据文件名为您自动推荐，您也可以修改。</p>
                    <div className="relative">
                        <input 
                            className="w-full border p-2 rounded-lg font-medium text-slate-800"
                            value={category} 
                            onChange={e => setCategory(e.target.value)} 
                            list="import-category-list"
                            placeholder="例如: 护理英语" 
                        />
                        <datalist id="import-category-list">
                            {existingCategories.map(c => <option key={c} value={c} />)}
                            <option value="PTE" />
                            <option value="护理英语" />
                        </datalist>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onCancel} className="py-2.5 border rounded-xl text-slate-500 font-medium hover:bg-slate-50">取消</button>
                    <button 
                        onClick={() => onConfirm(category)}
                        className="py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200"
                    >
                        确认导入
                    </button>
                </div>
            </div>
        </div>
    );
};