import React from 'react';
import { Sparkles, Settings, BookOpen, HelpCircle, Volume2, VolumeX, RotateCcw, Trophy, Play, Pause, Square, ExternalLink, Sun, Moon } from 'lucide-react';
import { GameMode, GameSettings, GameStatus } from '../types/game';
import { AI_PERSONAS } from '../services/aiOpponent';

interface NavbarProps {
  gameMode: GameMode;
  onSelectGameMode: (mode: GameMode) => void;
  settings: GameSettings;
  gameStatus: GameStatus;
  onTogglePlayPause: () => void;
  onStopGame: () => void;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onOpenDictionary: () => void;
  onOpenStats: () => void;
  onRestartGame: () => void;
  streakCount: number;
  onLogoClick?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  gameMode,
  onSelectGameMode,
  settings,
  gameStatus,
  onTogglePlayPause,
  onStopGame,
  onToggleSound,
  onOpenSettings,
  onOpenRules,
  onOpenDictionary,
  onOpenStats,
  onRestartGame,
  streakCount,
  onLogoClick,
  theme = 'dark',
  onToggleTheme,
}) => {
  const currentPersona = AI_PERSONAS[settings.difficulty];

  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* 로고 & 타이틀 */}
        <div className="flex items-center gap-3">
          <div
            onClick={onLogoClick}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 shadow-lg shadow-orange-500/20 text-white font-black text-2xl select-none cursor-pointer active:scale-90 transition-transform"
            title="끝말잇기 AI"
          >
            J
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
                끝말잇기 <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">AI</span>
              </h1>
              <a
                href="https://stdict.korean.go.kr/main/main.do"
                target="_blank"
                rel="noopener noreferrer"
                title="국립국어원 표준국어대사전 공식 웹사이트 열기"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer"
              >
                <span>표준국어대사전</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>{currentPersona.level}</span>
              <span className="text-slate-600">•</span>
              <span>두음법칙 {settings.useDueum ? 'ON' : 'OFF'}</span>
              <span className="text-slate-600">•</span>
              <span>한방단어 {settings.oneShotMode === 'banned' ? '금지' : settings.oneShotMode === 'allowed' ? '허용' : '경고'}</span>
              <span className="text-slate-600">•</span>
              <span>{settings.timeLimit > 0 ? `${settings.timeLimit}초` : '무제한'}</span>
            </p>
          </div>
        </div>

        {/* 모드 선택 바 */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
          <button
            onClick={() => onSelectGameMode('vs_ai')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              gameMode === 'vs_ai'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>{currentPersona.avatar}</span>
            <span>AI 대전</span>
          </button>
          <button
            onClick={() => onSelectGameMode('vs_friend')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              gameMode === 'vs_friend'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>👥</span>
            <span>2인 대전</span>
          </button>
          <button
            onClick={() => onSelectGameMode('practice')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              gameMode === 'practice'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>🎯</span>
            <span>혼자 연습</span>
          </button>
        </div>

        {/* 게임 제어 및 유틸리티 액션 버튼군 */}
        <div className="flex items-center gap-1.5">
          {/* 게임 시작 / 일시정지 / 재개 버튼 (Start / Stop) */}
          <button
            onClick={onTogglePlayPause}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-md ${
              gameStatus === 'playing'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400'
            }`}
            title={gameStatus === 'playing' ? '게임 일시정지 (타이머 정지)' : '게임 시작 / 재개'}
          >
            {gameStatus === 'playing' ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>일시정지</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{gameStatus === 'paused' ? '게임 재개' : '게임 시작'}</span>
              </>
            )}
          </button>

          {/* 게임 중단 버튼 */}
          {gameStatus === 'playing' && (
            <button
              onClick={onStopGame}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/80 transition-colors"
              title="게임 중단"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 연승 배지 */}
          {streakCount > 0 && (
            <button
              onClick={onOpenStats}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/20 transition-colors"
              title="연승 기록"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{streakCount}연승</span>
            </button>
          )}

          {/* 사전 검색 모달 */}
          <button
            onClick={onOpenDictionary}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/70 transition-colors"
            title="국어사전 단어 검색 (시작 글자 / 단어 뜻)"
            aria-label="국어사전"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* 규칙 설명 */}
          <button
            onClick={onOpenRules}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/70 transition-colors"
            title="규칙 설명 (두음법칙, 한방단어)"
            aria-label="규칙 안내"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* 사운드 토글 */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-colors ${
              settings.soundEnabled
                ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-800/50 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={settings.soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            aria-label="효과음 토글"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* 라이트 / 다크 모드 토글 */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
              theme === 'light'
                ? 'bg-amber-100 text-amber-600 border-amber-300 hover:bg-amber-200'
                : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
            }`}
            title={theme === 'light' ? '다크 모드로 전환 (현재 라이트 모드)' : '라이트 모드로 전환 (현재 다크 모드)'}
            aria-label="화면 모드 변경"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* 게임 설정 모달 */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/70 transition-colors"
            title="게임 설정 (난이도, 시간, 두음법칙, 한방단어)"
            aria-label="게임 설정"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* 새로 시작 버튼 */}
          <button
            onClick={onRestartGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:border-red-500/40 text-slate-300 hover:text-red-400 border border-slate-700 text-xs font-semibold transition-all"
            title="새 판 시작하기"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">새로고침</span>
          </button>
        </div>
      </div>
    </header>
  );
};
