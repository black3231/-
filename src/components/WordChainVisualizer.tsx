import React, { useEffect, useRef } from 'react';
import { ChevronRight, Zap, Flame, BookOpen } from 'lucide-react';
import { WordHistoryItem } from '../types/game';

interface WordChainVisualizerProps {
  history: WordHistoryItem[];
  onSelectWord: (item: WordHistoryItem) => void;
}

export const WordChainVisualizer: React.FC<WordChainVisualizerProps> = ({
  history,
  onSelectWord,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [history.length]);

  if (history.length === 0) {
    return (
      <div className="w-full bg-slate-900/60 rounded-2xl border border-slate-800 p-6 text-center text-slate-500 text-xs font-medium">
        아직 시작된 단어가 없습니다. 첫 단어를 입력하고 끝말잇기를 시작해보세요!
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-800/80 p-3 shadow-lg">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-amber-400"></span>
          단어 체인 기록 ({history.length}단어 연결됨)
        </span>
        <span className="text-[11px] text-slate-500">
          단어를 클릭하면 국어사전 뜻을 볼 수 있습니다
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        {history.map((item, idx) => {
          const isLatest = idx === history.length - 1;
          const isUser = item.player === 'user' || item.player === 'player1';

          return (
            <React.Fragment key={item.id}>
              {idx > 0 && (
                <div className="flex-shrink-0 flex items-center justify-center text-slate-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}

              <button
                onClick={() => onSelectWord(item)}
                className={`group flex-shrink-0 relative text-left rounded-xl p-2.5 px-3.5 transition-all duration-200 border cursor-pointer ${
                  isLatest
                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/10 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : isUser
                    ? 'bg-slate-800/90 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    : 'bg-indigo-950/40 border-indigo-900/60 hover:border-indigo-700 hover:bg-indigo-950/60'
                }`}
              >
                {/* 상단 태그 행 */}
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-slate-400">
                  <span
                    className={`px-1.5 py-0.2 rounded ${
                      isUser ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {item.playerName}
                  </span>

                  {item.dueumApplied && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      <Zap className="w-2.5 h-2.5" />
                      두음
                    </span>
                  )}

                  {item.isOneShot && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                      <Flame className="w-2.5 h-2.5" />
                      한방
                    </span>
                  )}

                  <span className="ml-auto opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity">
                    <BookOpen className="w-3 h-3 inline" />
                  </span>
                </div>

                {/* 단어 표기 */}
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-black text-base tracking-wide ${
                      isLatest ? 'text-amber-400' : 'text-slate-100'
                    }`}
                  >
                    {item.word}
                  </span>
                  {item.hanja && (
                    <span className="text-[11px] font-serif text-slate-500">
                      ({item.hanja})
                    </span>
                  )}
                </div>

                {/* 요약 뜻 */}
                <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[130px] mt-0.5">
                  {item.definition}
                </p>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
