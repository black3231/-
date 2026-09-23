import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Lightbulb, AlertCircle, Zap, Flame, ShieldAlert, ArrowRight, Trophy, RotateCcw, BookOpen, FastForward } from 'lucide-react';
import { Player, GameSettings, WordHistoryItem, GameMode, GameOverReason, GameStatus } from '../types/game';
import { getValidStartingSyllables, getDueumTransform } from '../utils/dueum';
import { isOneShotWord, isOneShotSyllable } from '../utils/oneShotWords';
import { AI_PERSONAS } from '../services/aiOpponent';
import { STARTING_CHAR_MAP } from '../data/koreanDictionary';

interface GameBoardProps {
  currentWordItem: WordHistoryItem | null;
  currentTurn: Player;
  currentTurnName: string;
  gameMode: GameMode;
  settings: GameSettings;
  isAiThinking: boolean;
  isPaused: boolean;
  onResume: () => void;
  aiSpeech: string | null;
  errorMessage: string | null;
  onSubmitWord: (word: string) => void;
  usedWords: Set<string>;
  disabled: boolean;
  gameStatus?: GameStatus;
  gameOverReason?: GameOverReason | null;
  onStartNewGame?: () => void;
  onOpenGameOverModal?: () => void;
  onOpenDictionary?: () => void;
  isPassUnlocked?: boolean;
  onPassWord?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  currentWordItem,
  currentTurn,
  currentTurnName,
  gameMode,
  settings,
  isAiThinking,
  isPaused,
  onResume,
  aiSpeech,
  errorMessage,
  onSubmitWord,
  usedWords,
  disabled,
  gameStatus = 'playing',
  gameOverReason = null,
  onStartNewGame,
  onOpenGameOverModal,
  onOpenDictionary,
  isPassUnlocked = false,
  onPassWord,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [hintWord, setHintWord] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUserTurn = currentTurn === 'user' || currentTurn === 'player1' || currentTurn === 'player2';
  const persona = AI_PERSONAS[settings.difficulty];

  // 포커스 자동 맞춤
  useEffect(() => {
    if (isUserTurn && !disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isUserTurn, disabled, currentWordItem]);

  // 입력값 초기화 및 힌트 리셋
  useEffect(() => {
    setInputValue('');
    setHintWord(null);
  }, [currentWordItem]);

  const lastChar = currentWordItem ? currentWordItem.word.slice(-1) : null;
  const dueumTransformed = lastChar && settings.useDueum ? getDueumTransform(lastChar) : null;
  const validStarts = lastChar ? getValidStartingSyllables(lastChar, settings.useDueum) : [];
  const isLastCharOneShot = lastChar ? isOneShotSyllable(lastChar, settings.useDueum) : false;

  // 실시간 입력 검증 피드백
  const firstChar = inputValue.trim()[0];
  const startsMatch = !lastChar || (firstChar && validStarts.includes(firstChar));
  const isInputTooShort = inputValue.trim().length === 1;
  const isInputDuplicate = usedWords.has(inputValue.trim());
  const isInputOneShot = isOneShotWord(inputValue.trim(), settings.useDueum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled || !isUserTurn) return;
    onSubmitWord(inputValue.trim());
  };

  // 힌트 찾기
  const handleGetHint = () => {
    if (!lastChar) return;
    for (const start of validStarts) {
      const candidates = STARTING_CHAR_MAP.get(start) || [];
      const unused = candidates.filter(c => !usedWords.has(c.word));
      if (unused.length > 0) {
        // 한방단어 금지면 한방단어 제외
        const filtered = settings.oneShotMode === 'banned'
          ? unused.filter(c => !isOneShotWord(c.word, settings.useDueum))
          : unused;

        if (filtered.length > 0) {
          const pick = filtered[Math.floor(Math.random() * filtered.length)];
          setHintWord(pick.word);
          setInputValue(pick.word);
          return;
        }
      }
    }
    setHintWord('사전에 이을 단어가 없습니다!');
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* AI 대전 시 AI 페르소나 및 말풍선 */}
      {gameMode === 'vs_ai' && (
        <div className="flex items-start gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-shrink-0">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-600/40 to-slate-800 border border-indigo-500/30 flex items-center justify-center text-3xl shadow-inner">
              {persona.avatar}
            </div>
            {isAiThinking && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-slate-200">{persona.name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-medium">
                {persona.title}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold ml-auto">
                난이도: {persona.level}
              </span>
            </div>

            {/* 말풍선 */}
            <div className="relative bg-slate-800/90 text-slate-300 text-xs px-3.5 py-2.5 rounded-xl rounded-tl-none border border-slate-700/70 inline-block max-w-full">
              {isAiThinking ? (
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <span className="inline-block animate-bounce">🤔</span>
                  단어를 고민하는 중...
                </span>
              ) : aiSpeech ? (
                <span>&ldquo;{aiSpeech}&rdquo;</span>
              ) : (
                <span>&ldquo;{persona.quotes.start[0]}&rdquo;</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 현재 단어 및 이어받을 음절 대형 히어로 카드 */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-850 to-slate-900 rounded-3xl border border-slate-700/80 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {currentWordItem ? (
          <div className="flex flex-col items-center justify-center text-center">
            {/* 최근 단어 플레이어 배지 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-400">
                <strong className="text-slate-200">{currentWordItem.playerName}</strong>의 단어:
              </span>
              {currentWordItem.isOneShot && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold animate-pulse">
                  <Flame className="w-3.5 h-3.5" />
                  한방단어 공격!
                </span>
              )}
            </div>

            {/* 대형 음절 블록 디스플레이 */}
            <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap my-2">
              {currentWordItem.word.split('').map((char, idx) => {
                const isLast = idx === currentWordItem.word.length - 1;
                return (
                  <div
                    key={idx}
                    className={`w-16 h-18 md:w-20 md:h-22 rounded-2xl flex flex-col items-center justify-center font-black text-3xl md:text-4xl shadow-lg border transition-all ${
                      isLast
                        ? 'bg-gradient-to-b from-amber-500 to-orange-600 text-slate-950 border-amber-400 shadow-amber-500/30 scale-105 ring-4 ring-amber-500/20'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                  >
                    <span>{char}</span>
                    {isLast && (
                      <span className="text-[10px] font-bold tracking-tighter opacity-80 mt-1">
                        끝 글자
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 사전 뜻풀이 미리보기 */}
            <p className="mt-4 text-xs md:text-sm text-slate-300 max-w-lg bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
              <span className="font-semibold text-amber-400 mr-1.5">
                [{currentWordItem.word}
                {currentWordItem.hanja ? ` / ${currentWordItem.hanja}` : ''}]
              </span>
              {currentWordItem.definition}
            </p>

            {/* 이어받을 첫 글자 가이드 */}
            <div className="mt-6 pt-5 border-t border-slate-800 w-full flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                다음 시작할 첫 글자:
              </span>

              <div className="flex items-center gap-2.5 flex-wrap justify-center">
                {/* 기본 끝 글자 */}
                <span className="inline-flex items-center justify-center min-w-12 h-12 px-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-2xl shadow-md">
                  {lastChar}
                </span>

                {/* 두음법칙 적용 변환 글자 */}
                {dueumTransformed && (
                  <>
                    <span className="text-slate-500 font-bold text-sm">또는</span>
                    <span className="inline-flex items-center gap-1.5 px-3 h-12 rounded-xl bg-sky-500/20 border border-sky-500/50 text-sky-300 font-black text-2xl shadow-md">
                      <Zap className="w-4 h-4 text-sky-400" />
                      <span>{dueumTransformed}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-200 ml-1">
                        두음법칙
                      </span>
                    </span>
                  </>
                )}
              </div>

              {/* 한방단어 경고 배너 */}
              {isLastCharOneShot && (
                <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>
                    &apos;{lastChar}&apos;(은)는 사전에 이을 수 있는 단어가 없는 한방 음절입니다!
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 게임 시작 전 첫 단어 입력 안내 */
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-3 text-amber-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              끝말잇기를 시작할 첫 단어를 입력하세요!
            </h2>
            <p className="text-xs text-slate-400 max-w-md mb-4">
              표준국어대사전에 등재된 2글자 이상의 한글 명사면 무엇이든 가능합니다.
              예) <strong>가계</strong>, <strong>기차</strong>, <strong>하늘</strong>, <strong>사과</strong>
            </p>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {['가계', '하늘', '고양이', '사과', '자전거', '도서관'].map(suggest => (
                <button
                  key={suggest}
                  onClick={() => setInputValue(suggest)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 text-xs font-semibold transition-colors"
                >
                  {suggest}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 게임 종료 / 대기 안내 배너 */}
      {(gameStatus === 'game_over' || gameStatus === 'idle') && (
        <div className="w-full p-4 md:p-5 rounded-2xl bg-gradient-to-r from-slate-850 to-slate-900 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{gameOverReason ? `${gameOverReason.winnerName} 승리!` : '새로운 게임 준비'}</span>
                {gameOverReason && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                    {gameOverReason.type === 'timeout'
                      ? '시간 초과'
                      : gameOverReason.type === 'one_shot_kill'
                      ? '한방 단어'
                      : gameOverReason.type === 'concede'
                      ? '기권'
                      : '단어 없음'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {gameOverReason?.message || '새 게임 시작 버튼을 누르면 언제든지 새로운 끝말잇기 랠리를 시작할 수 있습니다.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {onOpenGameOverModal && gameOverReason && (
              <button
                type="button"
                onClick={onOpenGameOverModal}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors whitespace-nowrap"
                title="종료 결과창 다시 열기"
              >
                결과창 다시보기
              </button>
            )}
            {onOpenDictionary && (
              <button
                type="button"
                onClick={onOpenDictionary}
                className="hidden sm:flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors whitespace-nowrap"
                title="국어사전에서 단어 복기 및 검색"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>사전 열기</span>
              </button>
            )}
            {onStartNewGame && (
              <button
                type="button"
                onClick={onStartNewGame}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>새 게임 시작</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 일시정지 알림 배너 */}
      {isPaused && (
        <div className="w-full p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span>
              게임이 일시정지되었습니다 (설정/사전 사용 또는 사용자 일시정지).
            </span>
          </div>
          <button
            type="button"
            onClick={onResume}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1 shadow-md"
          >
            <span>게임 재개</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 에러 메시지 알림 배너 */}
      {errorMessage && !isPaused && (
        <div className="w-full p-3.5 px-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2.5 animate-shake shadow-md">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 단어 입력 폼 */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={disabled || !isUserTurn || isPaused}
              placeholder={
                gameStatus === 'game_over' || gameStatus === 'idle'
                  ? "게임이 대기 상태입니다. 위의 '새 게임 시작' 버튼을 눌러주세요."
                  : isPaused
                  ? "게임이 일시정지 상태입니다. '게임 재개'를 눌러주세요."
                  : !isUserTurn
                  ? `${currentTurnName}의 입력을 기다리는 중...`
                  : lastChar
                  ? `'${lastChar}'${dueumTransformed ? ` 또는 '${dueumTransformed}'` : ''}(으)로 시작하는 단어 입력`
                  : '시작할 단어를 입력하세요 (예: 가계)'
              }
              className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 text-lg md:text-xl font-bold py-4 pl-5 pr-28 rounded-2xl border-2 border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              maxLength={20}
            />

            <button
              type="submit"
              disabled={disabled || !isUserTurn || isPaused || !inputValue.trim()}
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm flex items-center gap-1.5 shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>입력</span>
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* 히든 치트키: wonni32 활성화 시 나타나는 패스(스킵) 버튼 */}
          {isPassUnlocked && (
            <button
              type="button"
              onClick={onPassWord}
              disabled={disabled || !isUserTurn || isPaused}
              className="px-4 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-black text-sm flex items-center gap-1.5 shadow-lg shadow-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap border border-purple-400/40 cursor-pointer"
              title="현재 단어를 스킵하고 다음 플레이어에게 턴을 넘깁니다 (Pass)"
            >
              <FastForward className="w-4 h-4" />
              <span>패스 (Pass)</span>
            </button>
          )}
        </div>

        {/* 실시간 입력 보조 및 힌트 행 */}
        <div className="flex items-center justify-between px-2 text-xs">
          {/* 실시간 유효성 인디케이터 */}
          <div className="flex items-center gap-2">
            {inputValue.trim().length > 0 && (
              <>
                {startsMatch ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    ✓ 시작 음절 일치
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-semibold">
                    ✗ &apos;{validStarts.join("' 또는 '")}&apos; 필요
                  </span>
                )}

                {isInputTooShort && (
                  <span className="text-amber-400">• 2글자 이상 필요</span>
                )}

                {isInputDuplicate && (
                  <span className="text-rose-400 font-semibold">• 이미 사용된 단어</span>
                )}

                {isInputOneShot && (
                  <span className="text-orange-400 font-semibold">• 한방단어 감지됨</span>
                )}
              </>
            )}
          </div>

          {/* 힌트 버튼 */}
          {isUserTurn && lastChar && !disabled && (
            <button
              type="button"
              onClick={handleGetHint}
              className="text-slate-400 hover:text-amber-400 flex items-center gap-1 font-semibold transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>힌트 보기</span>
            </button>
          )}
        </div>

        {/* 힌트 표시 배너 */}
        {hintWord && (
          <div className="p-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>추천 단어 힌트: <strong>{hintWord}</strong></span>
            </span>
            <button
              type="button"
              onClick={() => setInputValue(hintWord)}
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold"
            >
              자동 채우기
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
