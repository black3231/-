import React from 'react';
import { X, Trophy, Award, Flame, RotateCcw } from 'lucide-react';

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  longestChain: number;
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  onResetStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats,
}) => {
  if (!isOpen) return null;

  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">나의 끝말잇기 전적</h2>
              <p className="text-xs text-slate-400">승률 및 연승 기록 통계</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors"
            title="전적창 닫고 게임으로 복귀"
          >
            <X className="w-4 h-4 text-amber-400" />
            <span>나가기</span>
          </button>
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">총 대전 판수</span>
            <span className="text-2xl font-black text-white">{stats.totalGames}판</span>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">승률</span>
            <span className="text-2xl font-black text-amber-400">{winRate}%</span>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">승 / 패</span>
            <span className="text-2xl font-black text-emerald-400">
              {stats.wins}승 <span className="text-slate-500 font-normal text-base">/</span>{' '}
              <span className="text-rose-400">{stats.losses}패</span>
            </span>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">최장 단어 체인</span>
            <span className="text-2xl font-black text-sky-400">{stats.longestChain}단어</span>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">현재 연승</span>
            <span className="text-2xl font-black text-orange-400 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-orange-500 inline" />
              {stats.currentStreak}연승
            </span>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block mb-1">최고 연승 기록</span>
            <span className="text-2xl font-black text-amber-300 flex items-center justify-center gap-1">
              <Award className="w-5 h-5 text-amber-400 inline" />
              {stats.bestStreak}연승
            </span>
          </div>
        </div>

        {/* 초기화 및 닫기 */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <button
            onClick={onResetStats}
            className="text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기록 초기화</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
          >
            전적 나가기
          </button>
        </div>
      </div>
    </div>
  );
};
