import React from 'react';
import { X, Settings, Clock, Zap, Flame, Cpu, Volume2, LogOut } from 'lucide-react';
import { GameSettings, AIDifficulty, OneShotMode } from '../types/game';
import { AI_PERSONAS } from '../services/aiOpponent';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 px-6 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">게임 규칙 및 환경 설정</h2>
              <p className="text-xs text-slate-400">제한시간, 두음법칙, 한방단어, AI 난이도 설정</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors"
            title="설정 닫고 게임으로 복귀"
          >
            <LogOut className="w-4 h-4 text-amber-400" />
            <span>나가기</span>
          </button>
        </div>

        {/* 설정 본문 (스크롤) */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* 1. AI 난이도 선택 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>AI 레벨 난이도 (5단계: Lv.1 초보 ~ Lv.5 패왕)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(['easy', 'mid', 'hard', 'master', 'god'] as AIDifficulty[]).map(diff => {
                const persona = AI_PERSONAS[diff];
                const isSelected = settings.difficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => onUpdateSettings({ difficulty: diff })}
                    className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all ${
                      isSelected
                        ? diff === 'god'
                          ? 'bg-gradient-to-br from-amber-600/30 to-rose-600/30 border-amber-400 text-white ring-2 ring-amber-500/50 shadow-lg shadow-amber-950/40'
                          : 'bg-indigo-600/30 border-indigo-400 text-white ring-2 ring-indigo-500/40 shadow-md'
                        : 'bg-slate-850 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-3xl">{persona.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-white">
                          {persona.level}
                        </span>
                        {diff === 'god' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                            패왕 (한방 외 무적)
                          </span>
                        )}
                        {diff === 'master' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                            정통 랠리
                          </span>
                        )}
                        {(diff === 'easy' || diff === 'mid' || diff === 'hard') && (
                          <span className="text-[9px] text-slate-500">
                            한방 미사용
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-amber-400 block">
                        {persona.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {persona.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 턴 제한시간 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>턴 제한시간 (기본 10초)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '5초 (속전)', value: 5 },
                { label: '10초 (표준)', value: 10 },
                { label: '15초 (여유)', value: 15 },
                { label: '무제한', value: 0 },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSettings({ timeLimit: opt.value })}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                    settings.timeLimit === opt.value
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 두음법칙 설정 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-sky-400" />
              <span>두음법칙 적용 여부</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ useDueum: true })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.useDueum
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 ring-1 ring-sky-500/30'
                    : 'bg-slate-850 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold text-xs block text-white mb-0.5">
                  허용 (표준 규칙)
                </span>
                <span className="text-[11px] text-slate-400">
                  력➔역, 녀➔여, 로➔노 등 한글 맞춤법 두음 적용
                </span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ useDueum: false })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !settings.useDueum
                    ? 'bg-slate-700 text-white border-slate-500'
                    : 'bg-slate-850 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold text-xs block text-white mb-0.5">
                  엄격 (미적용)
                </span>
                <span className="text-[11px] text-slate-400">
                  끝 글자 그대로만 이어받기 허용
                </span>
              </button>
            </div>
          </div>

          {/* 4. 한방단어 설정 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>한방단어 옵션</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  mode: 'banned' as OneShotMode,
                  title: '한방 금지',
                  desc: '륨, 늄 등 금지',
                  color: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
                },
                {
                  mode: 'warning' as OneShotMode,
                  title: '공격 경고',
                  desc: '경고 표시 후 허용',
                  color: 'border-amber-500 bg-amber-500/20 text-amber-300',
                },
                {
                  mode: 'allowed' as OneShotMode,
                  title: '한방 허용',
                  desc: '서든데스 승부',
                  color: 'border-rose-500 bg-rose-500/20 text-rose-300',
                },
              ].map(item => (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => onUpdateSettings({ oneShotMode: item.mode })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    settings.oneShotMode === item.mode
                      ? `${item.color} ring-1 ring-current`
                      : 'bg-slate-850 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs block text-white mb-0.5">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. 효과음 */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>효과음 사운드</span>
            </span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                settings.soundEnabled
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {settings.soundEnabled ? '켜짐 (ON)' : '꺼짐 (OFF)'}
            </button>
          </div>
        </div>

        {/* 푸터 & 나가기 버튼 */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            설정 변경 시 다음 턴부터 즉시 적용됩니다
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>설정 나가기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
