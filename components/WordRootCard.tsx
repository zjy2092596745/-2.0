import React from 'react';
import { Word } from '../types';
import { BookOpen, Link2, Languages } from 'lucide-react';

interface WordRootCardProps {
  word: Word;
  isRevealed: boolean;
}

export const WordRootCard: React.FC<WordRootCardProps> = ({ word, isRevealed }) => {
  const hasRoots = word.roots && word.roots.length > 0;

  if (!isRevealed) {
    // Front: Show only the word
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <span className="text-xs uppercase tracking-widest text-slate-400 mb-4">Word Root Analysis</span>
        <h1 className="text-4xl font-extrabold text-blue-600 mb-2">{word.word}</h1>
        <p className="font-mono text-slate-400 text-lg mb-8">{word.ipa}</p>
        <p className="text-blue-600/50 text-sm mt-auto">(点击查看词根)</p>
      </div>
    );
  }

  // Back: Show root breakdown
  return (
    <div className="flex flex-col w-full h-full overflow-y-auto p-2">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-3xl font-extrabold text-blue-600">{word.word}</h1>
      </div>
      <p className="font-mono text-slate-400 text-sm mb-2">{word.ipa}</p>
      <h2 className="text-xl font-bold text-slate-800 mb-4">{word.def}</h2>

      {hasRoots ? (
        <>
          {/* Root Components */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl mb-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="text-blue-600" size={18} />
              <h3 className="font-bold text-blue-900">词根构成</h3>
            </div>

            <div className="space-y-3">
              {word.roots.map((root, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 backdrop-blur p-3 rounded-lg border border-blue-200 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                      root.type === 'prefix' ? 'bg-purple-100 text-purple-700' :
                      root.type === 'suffix' ? 'bg-pink-100 text-pink-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {root.type === 'prefix' ? '前缀' : root.type === 'suffix' ? '后缀' : '词根'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-lg text-slate-800">{root.text}</span>
                        {root.origin && (
                          <span className="text-xs text-slate-400">({root.origin})</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{root.meaning}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Word Construction Visualization */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {word.roots.map((root, idx) => (
                  <React.Fragment key={idx}>
                    <div className={`px-3 py-2 rounded-lg font-bold text-base ${
                      root.type === 'prefix' ? 'bg-purple-200 text-purple-900' :
                      root.type === 'suffix' ? 'bg-pink-200 text-pink-900' :
                      'bg-blue-200 text-blue-900'
                    }`}>
                      {root.text}
                    </div>
                    {idx < word.roots.length - 1 && (
                      <span className="text-slate-400 font-bold text-xl">+</span>
                    )}
                  </React.Fragment>
                ))}
                <span className="text-slate-400 font-bold text-xl">=</span>
                <div className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-base">
                  {word.word}
                </div>
              </div>
            </div>
          </div>

          {/* Etymology (if available) */}
          {word.etymology && (
            <div className="bg-amber-50 p-4 rounded-xl mb-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="text-amber-600" size={18} />
                <h3 className="font-bold text-amber-900">词源说明</h3>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">{word.etymology}</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
          <Languages className="mx-auto mb-3 text-slate-400" size={32} />
          <p className="text-slate-500 text-sm mb-2">该单词暂无词根数据</p>
          <p className="text-slate-400 text-xs">您可以在词库中为此单词添加词根信息</p>
        </div>
      )}

      {/* Example Sentence */}
      {word.ex_en && (
        <div className="bg-slate-50 p-4 rounded-xl mt-auto">
          <p className="text-slate-800 italic font-medium mb-1">{word.ex_en}</p>
          {word.ex_cn && <p className="text-slate-500 text-sm">{word.ex_cn}</p>}
        </div>
      )}
    </div>
  );
};
