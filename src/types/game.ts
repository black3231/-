export type Player = 'user' | 'ai' | 'player1' | 'player2';

export type GameMode = 'vs_ai' | 'vs_friend' | 'practice';

export type OneShotMode = 'banned' | 'allowed' | 'warning';

export type AIDifficulty = 'easy' | 'mid' | 'hard' | 'master' | 'god';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'game_over';

export interface GameSettings {
  timeLimit: number; // 초 단위 (10초 기본)
  useDueum: boolean; // 두음법칙 허용 여부 (기본 true)
  oneShotMode: OneShotMode; // 한방단어 설정 ('banned' | 'allowed' | 'warning')
  difficulty: AIDifficulty; // AI 난이도
  soundEnabled: boolean; // 사운드 효과음
}

export interface WordHistoryItem {
  id: string;
  word: string;
  player: Player;
  playerName: string;
  definition: string;
  category?: string;
  hanja?: string;
  dueumApplied?: boolean;
  isOneShot?: boolean;
  timestamp: number;
}

export interface GameOverReason {
  winner: Player | 'draw';
  loser: Player | null;
  winnerName: string;
  loserName: string;
  type: 'timeout' | 'no_words_left' | 'one_shot_kill' | 'concede' | 'invalid_word';
  message: string;
}

export interface WordCheckResult {
  isValid: boolean;
  reason?: string;
  definition?: string;
  hanja?: string;
  category?: string;
  isOneShot?: boolean;
  dueumApplied?: boolean;
}
