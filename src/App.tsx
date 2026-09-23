/**
 * 대한민국 표준국어대사전 & 두음법칙 & 한방단어 설정 지원 끝말잇기 AI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TimerBar } from './components/TimerBar';
import { GameBoard } from './components/GameBoard';
import { WordChainVisualizer } from './components/WordChainVisualizer';
import { RulesModal } from './components/RulesModal';
import { SettingsModal } from './components/SettingsModal';
import { DictionaryModal } from './components/DictionaryModal';
import { GameOverModal } from './components/GameOverModal';
import { StatsModal, GameStats } from './components/StatsModal';
import { SecretModal } from './components/SecretModal';
import {
  GameMode,
  GameSettings,
  GameStatus,
  Player,
  WordHistoryItem,
  GameOverReason,
} from './types/game';
import { validateWord } from './services/dictionaryService';
import { getAIMove, AI_PERSONAS } from './services/aiOpponent';
import { sounds } from './utils/soundEffects';
import { STARTING_CHAR_MAP } from './data/koreanDictionary';

const DEFAULT_SETTINGS: GameSettings = {
  timeLimit: 10, // 규칙: 10초 제한시간 기본
  useDueum: true, // 규칙: 두음법칙 허용
  oneShotMode: 'banned', // 규칙: 한방단어 옵션 ('banned' | 'allowed' | 'warning')
  difficulty: 'mid', // Lv.1 easy, Lv.2 mid, Lv.3 hard, Lv.4 master
  soundEnabled: true,
};

const INITIAL_STATS: GameStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  currentStreak: 0,
  bestStreak: 0,
  longestChain: 0,
};

export default function App() {
  // 환경 설정
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('word_chain_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // backward compatibility for old 'normal' difficulty
        if (parsed.difficulty === 'normal') parsed.difficulty = 'mid';
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 전적 통계
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('word_chain_stats');
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });

  // 게임 상태
  const [gameMode, setGameMode] = useState<GameMode>('vs_ai');
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [currentTurn, setCurrentTurn] = useState<Player>('user');
  const [history, setHistory] = useState<WordHistoryItem[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timeLimit);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiSpeech, setAiSpeech] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gameOverReason, setGameOverReason] = useState<GameOverReason | null>(null);

  // 모달 상태
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [selectedWordItem, setSelectedWordItem] = useState<WordHistoryItem | null>(null);

  // 시크릿 치트키 기능 상태 (로고 10회 클릭 시 팝업 및 wonni32 입력 시 패스 버튼 활성화)
  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isPassUnlocked, setIsPassUnlocked] = useState(false);
  const wasPausedBySecretRef = useRef(false);

  // 라이트 모드 / 다크 모드 테마 상태 (로컬 스토리지 유지)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('kkutu_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  // 테마 동기화 (HTML 루트 클래스 및 로컬 스토리지)
  useEffect(() => {
    try {
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
      localStorage.setItem('kkutu_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 모달을 열었을 때 자동으로 일시정지되었는지 여부 추적
  const wasPausedByModalRef = useRef(false);

  // 사운드 동기화
  useEffect(() => {
    sounds.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // 로컬 스토리지 동기화
  useEffect(() => {
    localStorage.setItem('word_chain_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('word_chain_stats', JSON.stringify(stats));
  }, [stats]);

  // 플레이어 이름 헬퍼
  const getPlayerName = useCallback((player: Player): string => {
    if (player === 'user') return '나';
    if (player === 'ai') return AI_PERSONAS[settings.difficulty].name;
    if (player === 'player1') return '1P (선공)';
    if (player === 'player2') return '2P (후공)';
    return '플레이어';
  }, [settings.difficulty]);

  // 사용된 단어 집합
  const usedWords = new Set<string>(history.map(item => item.word));
  const latestWordItem = history.length > 0 ? history[history.length - 1] : null;

  // 게임 종료 핸들러
  const handleGameOver = useCallback((reason: GameOverReason) => {
    setGameStatus('game_over');
    setGameOverReason(reason);
    setIsGameOverOpen(true);

    const isUserWin = reason.winner === 'user' || reason.winner === 'player1';

    if (isUserWin) {
      sounds.playVictory();
    } else {
      sounds.playDefeat();
    }

    // 통계 업데이트
    setStats(prev => {
      const newTotal = prev.totalGames + 1;
      const newWins = isUserWin ? prev.wins + 1 : prev.wins;
      const newLosses = isUserWin ? prev.losses : prev.losses + 1;
      const newCurrentStreak = isUserWin ? prev.currentStreak + 1 : 0;
      const newBestStreak = Math.max(prev.bestStreak, newCurrentStreak);
      const newLongest = Math.max(prev.longestChain, history.length);

      return {
        totalGames: newTotal,
        wins: newWins,
        losses: newLosses,
        currentStreak: newCurrentStreak,
        bestStreak: newBestStreak,
        longestChain: newLongest,
      };
    });
  }, [history.length]);

  // 10초 타이머 카운트다운 루프
  useEffect(() => {
    // paused, idle, game_over 상태에서는 타이머 멈춤
    if (gameStatus !== 'playing' || settings.timeLimit <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);

          // 시간 초과! (예: b:(답없음 in 10sec) => A win)
          const loser = currentTurn;
          let winner: Player;

          if (gameMode === 'vs_ai') {
            winner = loser === 'user' ? 'ai' : 'user';
          } else if (gameMode === 'vs_friend') {
            winner = loser === 'player1' ? 'player2' : 'player1';
          } else {
            winner = 'user';
          }

          const loserName = getPlayerName(loser);
          const winnerName = getPlayerName(winner);

          handleGameOver({
            winner,
            loser,
            winnerName,
            loserName,
            type: 'timeout',
            message: `${loserName}의 ${settings.timeLimit}초 제한시간이 초과되었습니다! ${winnerName}의 승리입니다!`,
          });

          return 0;
        }

        // 마지막 3초 경고 째깍음
        if (prev <= 4) {
          sounds.playTick(prev <= 2);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, currentTurn, gameMode, settings.timeLimit, getPlayerName, handleGameOver]);

  // 새 판 시작
  const startNewGame = useCallback(() => {
    setHistory([]);
    setErrorMessage(null);
    setGameOverReason(null);
    setIsGameOverOpen(false);
    setIsAiThinking(false);
    setTimeLeft(settings.timeLimit);
    setAiSpeech(AI_PERSONAS[settings.difficulty].quotes.start[0]);

    if (gameMode === 'vs_friend') {
      setCurrentTurn('player1');
    } else {
      setCurrentTurn('user');
    }

    setGameStatus('playing');
  }, [gameMode, settings.timeLimit, settings.difficulty]);

  // 게임 시작 / 일시정지 토글 핸들러
  const handleTogglePlayPause = () => {
    if (gameStatus === 'playing') {
      setGameStatus('paused');
    } else if (gameStatus === 'paused') {
      setGameStatus('playing');
    } else {
      startNewGame();
    }
  };

  // 게임 중단 핸들러
  const handleStopGame = () => {
    setGameStatus('idle');
  };

  // 기능 모달 열기 시 게임 일시정지 (설정, 사전, 규칙, 전적 등)
  const openModalWithPause = (openModalFn: () => void) => {
    if (gameStatus === 'playing') {
      setGameStatus('paused');
      wasPausedByModalRef.current = true;
    }
    openModalFn();
  };

  // 모달 닫기 시 자동 재개
  const closeModalWithResume = (closeModalFn: () => void) => {
    closeModalFn();
    if (wasPausedByModalRef.current) {
      wasPausedByModalRef.current = false;
      setGameStatus('playing');
    }
  };

  // 로고 10회 클릭 핸들러 (모든 이벤트 일시정지 후 시크릿 모달 오픈)
  const handleLogoClick = () => {
    setLogoClickCount(prev => {
      const next = prev + 1;
      if (next >= 10) {
        if (gameStatus === 'playing') {
          wasPausedBySecretRef.current = true;
          setGameStatus('paused');
        } else {
          wasPausedBySecretRef.current = false;
        }
        setIsSecretOpen(true);
        return 0;
      }
      return next;
    });
  };

  // 시크릿 입력 제출 및 wonni32 검증 핸들러
  const handleSecretClose = (enteredValue: string) => {
    setIsSecretOpen(false);
    const clean = enteredValue.trim().toLowerCase();
    if (clean === 'wonni32') {
      setIsPassUnlocked(true);
      sounds.playSuccess();
    }

    // 게임 재개
    if (wasPausedBySecretRef.current) {
      setGameStatus('playing');
      wasPausedBySecretRef.current = false;
    }
  };

  // 패스(턴 넘기기) 핸들러: 현재 단어를 스킵하고 다음 플레이어에게 턴을 넘김
  const handlePassWord = () => {
    if (gameStatus !== 'playing') return;
    setErrorMessage(null);
    sounds.playSuccess();
    setTimeLeft(settings.timeLimit);

    if (gameMode === 'vs_ai') {
      setCurrentTurn('ai');
    } else if (gameMode === 'vs_friend') {
      setCurrentTurn(prev => (prev === 'player1' ? 'player2' : 'player1'));
    }
  };

  // 첫 마운트 시 게임 시작
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // AI 턴 진행 로직
  useEffect(() => {
    if (gameStatus !== 'playing' || currentTurn !== 'ai' || gameMode !== 'vs_ai') return;
    if (!latestWordItem) return;

    setIsAiThinking(true);
    setErrorMessage(null);

    // AI 고민 시간 연출
    const thinkTime =
      settings.difficulty === 'easy'
        ? 1800
        : settings.difficulty === 'mid'
        ? 1400
        : settings.difficulty === 'hard'
        ? 1100
        : settings.difficulty === 'master'
        ? 800
        : 500; // Lv.5 God: 초신속 절대 계산

    const timer = setTimeout(async () => {
      const move = await getAIMove(latestWordItem.word, usedWords, settings);

      setIsAiThinking(false);

      if (!move) {
        // AI가 사전에 이을 단어를 찾지 못함 -> 답 없음/단어 존재x -> 사용자 승리!
        const winnerName = getPlayerName('user');
        const loserName = getPlayerName('ai');

        handleGameOver({
          winner: 'user',
          loser: 'ai',
          winnerName,
          loserName,
          type: 'no_words_left',
          message: `'${latestWordItem.word.slice(-1)}'(으)로 이어받을 수 있는 표준국어대사전 단어가 존재하지 않아 AI가 패배를 인정했습니다! ${winnerName}님의 완승!`,
        });
        return;
      }

      // AI 단어 등록
      const aiWordItem: WordHistoryItem = {
        id: `word-${Date.now()}-${Math.random()}`,
        word: move.word,
        player: 'ai',
        playerName: getPlayerName('ai'),
        definition: move.definition,
        category: move.category,
        hanja: move.hanja,
        isOneShot: move.isOneShot,
        dueumApplied: !move.word.startsWith(latestWordItem.word.slice(-1)),
        timestamp: Date.now(),
      };

      setAiSpeech(move.comment || null);

      if (move.isOneShot) {
        sounds.playOneShot();
      } else {
        sounds.playSuccess();
      }

      setHistory(prev => [...prev, aiWordItem]);
      setCurrentTurn('user');
      setTimeLeft(settings.timeLimit);
    }, thinkTime);

    return () => clearTimeout(timer);
  }, [
    gameStatus,
    currentTurn,
    gameMode,
    latestWordItem,
    settings,
    usedWords,
    getPlayerName,
    handleGameOver,
  ]);

  // 단어 제출 처리 (유저 및 2인 대전)
  const handleSubmitWord = async (word: string) => {
    setErrorMessage(null);

    const prevWord = latestWordItem ? latestWordItem.word : null;

    // 단어 검증 (표준국어대사전 + 두음법칙 + 한방단어)
    const check = await validateWord(word, prevWord, usedWords, {
      useDueum: settings.useDueum,
      oneShotMode: settings.oneShotMode,
    });

    if (!check.isValid) {
      sounds.playError();
      setErrorMessage(check.reason || '유효하지 않은 단어입니다.');
      return;
    }

    // 효과음 재생
    if (check.isOneShot) {
      sounds.playOneShot();
    } else {
      sounds.playSuccess();
    }

    const playerName = getPlayerName(currentTurn);
    const isDueumUsed = prevWord ? !word.startsWith(prevWord.slice(-1)) : false;

    const newHistoryItem: WordHistoryItem = {
      id: `word-${Date.now()}-${Math.random()}`,
      word,
      player: currentTurn,
      playerName,
      definition: check.definition || '표준국어대사전 등재 어휘',
      category: check.category,
      hanja: check.hanja,
      isOneShot: check.isOneShot,
      dueumApplied: isDueumUsed,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, newHistoryItem]);

    // 한방단어 허용 모드에서 사용자가 치명적 한방단어를 구사한 경우 즉시 승리 여부 판별
    if (check.isOneShot && settings.oneShotMode === 'allowed') {
      const lastChar = word.slice(-1);
      const possibleAnswers = (STARTING_CHAR_MAP.get(lastChar) || []).filter(
        c => !usedWords.has(c.word) && c.word !== word
      );

      if (possibleAnswers.length === 0) {
        // 뒤를 이을 단어가 전혀 없는 치명적 한방단어 성공!
        const winner = currentTurn;
        let loser: Player;
        if (gameMode === 'vs_ai') loser = 'ai';
        else if (gameMode === 'vs_friend') loser = currentTurn === 'player1' ? 'player2' : 'player1';
        else loser = 'ai';

        handleGameOver({
          winner,
          loser,
          winnerName: playerName,
          loserName: getPlayerName(loser),
          type: 'one_shot_kill',
          message: `'${word}'(은)는 뒤를 이을 수 있는 단어가 없는 치명적인 한방단어입니다! ${playerName}님의 즉시 승리!`,
        });
        return;
      }
    }

    // 다음 턴으로 전환
    if (gameMode === 'vs_ai') {
      setCurrentTurn('ai');
    } else if (gameMode === 'vs_friend') {
      setCurrentTurn(prev => (prev === 'player1' ? 'player2' : 'player1'));
    } else {
      setCurrentTurn('user');
    }

    setTimeLeft(settings.timeLimit);
  };

  // 항복 / 패배 인정 처리 (사전에 답이 없거나 생각나지 않을 때)
  const handleConcede = () => {
    const loser = currentTurn;
    let winner: Player;

    if (gameMode === 'vs_ai') {
      winner = loser === 'user' ? 'ai' : 'user';
    } else if (gameMode === 'vs_friend') {
      winner = loser === 'player1' ? 'player2' : 'player1';
    } else {
      winner = 'user';
    }

    const loserName = getPlayerName(loser);
    const winnerName = getPlayerName(winner);

    handleGameOver({
      winner,
      loser,
      winnerName,
      loserName,
      type: 'concede',
      message: `${loserName}님이 사전에 이을 수 있는 단어가 없어 패배를 인정했습니다. ${winnerName}님의 승리!`,
    });
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-white pb-12 transition-colors duration-200 ${
        theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* 상단 네비게이션 헤더 */}
      <Navbar
        gameMode={gameMode}
        onSelectGameMode={mode => {
          setGameMode(mode);
          startNewGame();
        }}
        settings={settings}
        gameStatus={gameStatus}
        onTogglePlayPause={handleTogglePlayPause}
        onStopGame={handleStopGame}
        onToggleSound={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
        onOpenSettings={() => openModalWithPause(() => setIsSettingsOpen(true))}
        onOpenRules={() => openModalWithPause(() => setIsRulesOpen(true))}
        onOpenDictionary={() =>
          openModalWithPause(() => {
            setSelectedWordItem(null);
            setIsDictionaryOpen(true);
          })
        }
        onOpenStats={() => openModalWithPause(() => setIsStatsOpen(true))}
        onRestartGame={startNewGame}
        streakCount={stats.currentStreak}
        onLogoClick={handleLogoClick}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 메인 게임 경기장 */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {/* 10초 카운트다운 타이머 바 */}
        <TimerBar
          timeLeft={timeLeft}
          timeLimit={settings.timeLimit}
          currentTurn={currentTurn}
          currentTurnName={getPlayerName(currentTurn)}
          isAiThinking={isAiThinking}
          isPaused={gameStatus === 'paused'}
          onTogglePlayPause={handleTogglePlayPause}
          onConcede={handleConcede}
          disabled={gameStatus !== 'playing' || isAiThinking}
        />

        {/* 메인 게임 보드 (현재 단어, 다음 시작 음절, 두음법칙, 입력 폼, 일시정지 상태) */}
        <GameBoard
          currentWordItem={latestWordItem}
          currentTurn={currentTurn}
          currentTurnName={getPlayerName(currentTurn)}
          gameMode={gameMode}
          settings={settings}
          isAiThinking={isAiThinking}
          isPaused={gameStatus === 'paused'}
          onResume={() => setGameStatus('playing')}
          aiSpeech={aiSpeech}
          errorMessage={errorMessage}
          onSubmitWord={handleSubmitWord}
          usedWords={usedWords}
          disabled={gameStatus !== 'playing' || isAiThinking}
          gameStatus={gameStatus}
          gameOverReason={gameOverReason}
          onStartNewGame={startNewGame}
          onOpenGameOverModal={() => setIsGameOverOpen(true)}
          onOpenDictionary={() => openModalWithPause(() => setIsDictionaryOpen(true))}
          isPassUnlocked={isPassUnlocked}
          onPassWord={handlePassWord}
        />

        {/* 단어 체인 연결 히스토리 바 */}
        <WordChainVisualizer
          history={history}
          onSelectWord={item => {
            setSelectedWordItem(item);
            openModalWithPause(() => setIsDictionaryOpen(true));
          }}
        />

        {/* 퀵 안내 배너 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">규칙 안내:</span>
            <span>2글자 이상 명사만 사용 가능</span>
            <span className="text-slate-600">•</span>
            <span>두음법칙({settings.useDueum ? '적용' : '해제'})</span>
            <span className="text-slate-600">•</span>
            <span>한방단어({settings.oneShotMode === 'banned' ? '금지' : '허용'})</span>
          </div>
          <button
            onClick={() => openModalWithPause(() => setIsRulesOpen(true))}
            className="text-amber-400 hover:underline font-semibold"
          >
            자세한 규칙 보기 &rarr;
          </button>
        </div>
      </main>

      {/* 모달 팝업 목록 (모두 나가기(Exit) 지원) */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => closeModalWithResume(() => setIsRulesOpen(false))}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => closeModalWithResume(() => setIsSettingsOpen(false))}
        settings={settings}
        onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
      />

      <DictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() =>
          closeModalWithResume(() => {
            setIsDictionaryOpen(false);
            setSelectedWordItem(null);
          })
        }
        selectedHistoryItem={selectedWordItem}
        history={history}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        reason={gameOverReason}
        history={history}
        onRestart={startNewGame}
        onClose={() => {
          setIsGameOverOpen(false);
          setGameStatus('idle');
        }}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => closeModalWithResume(() => setIsStatsOpen(false))}
        stats={stats}
        onResetStats={() => setStats(INITIAL_STATS)}
      />

      {/* 시크릿 기능 모달 */}
      <SecretModal
        isOpen={isSecretOpen}
        onClose={handleSecretClose}
      />
    </div>
  );
}
