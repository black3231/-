import React from 'react';
import { Clock, AlertTriangle, Flag, Pause, Play } from 'lucide-react';
import { Player } from '../types/game';

interface TimerBarProps {
  timeLeft: number;
  timeLimit: number;
  currentTurn: Player;
  currentTurnName: string;
  isAiThinking: boolean;
  isPaused: boolean;
  onTogglePlayPause: () => void;
  onConcede: () => void;
  disabled: boolean;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  timeLeft,
  timeLimit,
  currentTurn,
  currentTurnName,
  isAiThinking,
  isPaused,
  onTogglePlayPause,
  onConcede,
  disabled,
}) => {
  if (timeLimit <= 0) {
    return (
      <div className="w-full bg-slate-850 rounded-2xl border border-slate-700/60 p-3 px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-semibold text-slate-300">
            현재 차례: <span className="text-amber-400 font-bold">{currentTurnName}</span>
          </span>
        </div>
        <span className="text-xs text-slate-400">무제한 모드</span>
      </div>
    );
  }

  const percentage = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const isUrgent = timeLeft <= 3 && timeLeft > 0 && !isPaused;

  // 색상 테마: 여유(청록/에메랄드) -> 보통(호박/오렌지) -> 위험(강렬한 붉은색)
  let barColor = 'from-emerald-500 to-teal-400';
  let textColor = 'text-emerald-400';
  let borderColor = 'border-emerald-500/30';

  if (isPaused) {
    barColor = 'from-slate-600 to-slate-500';
    textColor = 'text-amber-400';
    borderColor = 'border-amber-500/40';
  } else if (percentage <= 60 && percentage > 30) {
    barColor = 'from-amber-500 to-orange-400';
    textColor = 'text-amber-400';
    borderColor = 'border-amber-500/30';
  } else if (percentage <= 30) {
    barColor = 'from-red-600 via-rose-500 to-red-400';
    textColor = 'text-red-400';
    borderColor = 'border-red-500/50';
  }

  return (
    <div
      className={`w-full bg-slate-900/90 rounded-2xl border ${borderColor} p-3.5 px-4 shadow-xl transition-all duration-300 ${
        isUrgent ? 'animate-pulse ring-2 ring-red-500/30' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        {/* 차례 안내 및 상태 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-2.5 w-2.5 rounded-full ${
                isPaused
                  ? 'bg-amber-400'
                  : currentTurn === 'ai'
                  ? 'bg-indigo-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-medium text-slate-400">
              차례:{' '}
              <strong className="text-slate-100 font-bold text-sm ml-1">
                {currentTurnName}
              </strong>
            </span>
          </div>

          {isPaused ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
              <Pause className="w-3 h-3 fill-current" />
              일시정지 중
            </span>
          ) : isAiThinking ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold animate-pulse">
              생각 중...
            </span>
          ) : isUrgent ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-bold">
              <AlertTriangle className="w-3 h-3" />
              시간 임박!
            </span>
          ) : null}
        </div>

        {/* 타이머 숫자 및 일시정지/항복 버튼 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 일시정지 / 재개 버튼 */}
          <button
            onClick={onTogglePlayPause}
            className={`p-1.5 px-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
              isPaused
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={isPaused ? '게임 재개' : '게임 일시정지'}
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span className="text-[11px]">재개</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span className="text-[11px]">일시정지</span>
              </>
            )}
          </button>

          {/* 타이머 숫자 */}
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className={`w-4 h-4 ${textColor}`} />
            <span className={`text-lg font-black tracking-tight ${textColor}`}>
              {timeLeft}
              <span className="text-xs font-medium ml-0.5 opacity-80">초</span>
            </span>
          </div>

          {/* 답 없음 / 항복 버튼 */}
          {!disabled && !isPaused && (currentTurn === 'user' || currentTurn === 'player1' || currentTurn === 'player2') && (
            <button
              onClick={onConcede}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-all flex items-center gap-1 font-semibold"
              title="사전에 이을 단어가 없거나 생각나지 않을 때 패배를 인정합니다"
            >
              <Flag className="w-3 h-3" />
              <span className="hidden sm:inline">답 없음 (항복)</span>
              <span className="sm:hidden">항복</span>
            </button>
          )}
        </div>
      </div>

      {/* 프로그레스 바 게이지 */}
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-300 ease-linear shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
