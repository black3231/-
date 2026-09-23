import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Frown, RotateCcw, Clock, Flame, Flag, AlertCircle, LogOut, X } from 'lucide-react';
import { GameOverReason, WordHistoryItem } from '../types/game';

interface GameOverModalProps {
  isOpen: boolean;
  reason: GameOverReason | null;
  history: WordHistoryItem[];
  onRestart: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  reason,
  history,
  onRestart,
  onClose,
}) => {
  const isUserWinner = Boolean(reason && (reason.winner === 'user' || reason.winner === 'player1'));

  useEffect(() => {
    if (isOpen && reason && isUserWinner) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen, reason, isUserWinner]);

  if (!isOpen || !reason) return null;

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-center p-6 md:p-8">
        {/* 우상단 닫기/나가기 버튼 */}
        <button
          type="button"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="결과창 나가기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 승패 아이콘 */}
        <div className="mx-auto mb-4 flex items-center justify-center">
          {isUserWinner ? (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 border-2 border-amber-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 shadow-xl">
              <Frown className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* 승자 타이틀 */}
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">
          {isUserWinner ? (
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {reason.winnerName} 승리!
            </span>
          ) : (
            <span className="text-slate-300">
              {reason.winnerName} 승리!
            </span>
          )}
        </h2>

        <p className="text-sm font-semibold text-slate-400 mb-6">
          {isUserWinner ? '축하합니다! 뛰어난 어휘력으로 승리하셨습니다.' : '아쉽습니다! 다음 판에 다시 도전해보세요.'}
        </p>

        {/* 승패 상세 원인 카드 */}
        <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 text-left mb-6 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            {reason.type === 'timeout' && <Clock className="w-4 h-4" />}
            {reason.type === 'one_shot_kill' && <Flame className="w-4 h-4 text-rose-400" />}
            {reason.type === 'no_words_left' && <AlertCircle className="w-4 h-4" />}
            {reason.type === 'concede' && <Flag className="w-4 h-4" />}
            <span>종료 사유</span>
          </div>
          <p className="text-slate-200 text-xs leading-relaxed">
            {reason.message}
          </p>
        </div>

        {/* 게임 통계 요약 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">연결된 단어 수</span>
            <span className="text-xl font-black text-white">{history.length}단어</span>
          </div>
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">마지막 단어</span>
            <span className="text-xl font-black text-amber-400">
              {history.length > 0 ? history[history.length - 1].word : '-'}
            </span>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
            title="결과창을 닫고 대기 화면으로 나가기"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>나가기</span>
          </button>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onRestart();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all"
            title="새로운 끝말잇기 게임 시작하기"
          >
            <RotateCcw className="w-4 h-4" />
            <span>새 게임 시작</span>
          </button>
        </div>
      </div>
    </div>
  );
};
