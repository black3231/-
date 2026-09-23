import React from 'react';
import { X, BookOpen, Zap, Flame, Clock, ShieldCheck, HelpCircle, Sparkles, ExternalLink } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 px-6 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">끝말잇기 공식 규칙 안내</h2>
              <p className="text-xs text-slate-400">대한민국 표준국어대사전 기반 끝말잇기 규정</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors"
            title="규칙 안내 닫고 게임으로 복귀"
          >
            <X className="w-4 h-4 text-amber-400" />
            <span>나가기</span>
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed">
          {/* 1. 두음법칙 규칙 */}
          <div className="bg-slate-850/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-sky-400 flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" />
              <span>1. 두음법칙 (Dueum Law) 적용</span>
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              한글 맞춤법 제10항~제12항에 따라 단어의 첫머리에 올 수 없는 자음(ㄴ, ㄹ)이 다른 소리로 변환되는 규칙입니다. 앞 단어의 끝 글자가 두음법칙 적용 대상이면, <strong>원래 음절</strong> 또는 <strong>변환된 음절</strong> 모두 시작 단어로 인정됩니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">ㄹ ➔ ㅇ 변환 (모음 ㅣ, ㅑ, ㅕ, ㅛ, ㅠ 계열)</span>
                <span className="text-slate-400 block">력 ➔ <strong>역</strong> (능력 ➔ 역사)</span>
                <span className="text-slate-400 block">리 ➔ <strong>이</strong> (유리 ➔ 이야기)</span>
                <span className="text-slate-400 block">료 ➔ <strong>요</strong> (음료 ➔ 요리)</span>
                <span className="text-slate-400 block">류 ➔ <strong>유</strong> (어류 ➔ 유치원)</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">ㄹ ➔ ㄴ 변환 (모음 ㅏ, ㅗ, ㅜ, ㅡ 계열)</span>
                <span className="text-slate-400 block">로 ➔ <strong>노</strong> (선로 ➔ 노래)</span>
                <span className="text-slate-400 block">락 ➔ <strong>낙</strong> (추락 ➔ 낙원)</span>
                <span className="text-slate-400 block">록 ➔ <strong>녹</strong> (기록 ➔ 녹차)</span>
                <span className="text-slate-400 block">름 ➔ <strong>늠</strong> (구름 ➔ 늠름)</span>
              </div>
            </div>
          </div>

          {/* 2. 한방단어 규칙 & 특수 공방 어휘 */}
          <div className="bg-slate-850/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4" />
              <span>2. 한방단어 (Killer Words) & 특수 공방 어휘</span>
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              끝 글자로 이어받을 수 있는 표준국어대사전 단어가 존재하지 않거나 극히 드문 킬러 단어(이리듐, 기쁨, 갑졀, 차풰 등)를 말합니다.
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <span className="font-bold text-emerald-400 flex-shrink-0">한방단어 금지 (권장):</span>
                <span>륨, 슘, 늄, 듐, 녘, 릇, 픔, 풰, 졀 등의 음절로 끝나는 한방단어 입력이 제한되어 긴장감 넘치는 핑퐁 랠리를 즐길 수 있습니다.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <span className="font-bold text-rose-400 flex-shrink-0">한방단어 허용 (서든데스):</span>
                <span>원소 기호나 특수 음절을 전략적으로 구사하여 상대를 한 번에 막다른 골목으로 몰아 승리할 수 있습니다.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-900/40 flex items-start gap-2">
                <span className="font-bold text-amber-400 flex-shrink-0">특수 방어 어휘:</span>
                <span>&apos;이리듐&apos; ➔ &apos;<strong>듐차</strong>&apos; ➔ &apos;<strong>차풰</strong>&apos; ➔ &apos;<strong>풰이크</strong>&apos;, &apos;갑졀&apos; ➔ &apos;<strong>졀고공이</strong>&apos;, &apos;기쁨&apos; ➔ &apos;<strong>쁨나무</strong>&apos; 등 전설적인 고수들의 방어 어휘가 탑재되어 있습니다.</span>
              </div>
            </div>
          </div>

          {/* 3. AI 5단계 난이도 안내 */}
          <div className="bg-slate-850/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-indigo-400 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>3. AI 대전 난이도 5단계 (Lv.1 ~ Lv.5)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block">🐶 Lv.1 Easy (초보 멍이)</span>
                <span className="text-slate-400">쉬운 일상 단어 위주. 한방단어 절대 사용 안 함.</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block">🦊 Lv.2 Mid (똘똘 여우)</span>
                <span className="text-slate-400">자연스럽고 균형 잡힌 어휘. 한방단어 절대 사용 안 함.</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block">🐯 Lv.3 Hard (호랑 선생)</span>
                <span className="text-slate-400">고난도 명사 및 두음법칙 구사. 한방단어 절대 사용 안 함.</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block">🐉 Lv.4 Master (대사전 용왕)</span>
                <span className="text-slate-400">정통 표준 어휘로 랠리 및 퇴로 차단. 한방단어는 자제함.</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 sm:col-span-2">
                <span className="font-bold text-amber-300 block">👑 Lv.5 God (끝말잇기 패왕)</span>
                <span className="text-slate-300">듐차, 차풰, 졀고공이, 쁨나무 등 상상을 초월하는 특수 방어/공격 어휘를 구사하며 한방단어가 아니면 절대 패배하지 않는 최고수 AI.</span>
              </div>
            </div>
          </div>

          {/* 3. 10초 타이머 & 승패 판정 */}
          <div className="bg-slate-850/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              <span>3. 10초 제한시간 & 승패 조건</span>
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
              <li>
                <strong>시간 초과:</strong> 각 턴마다 주어진 제한시간(기본 10초) 내에 유효한 단어를 입력하지 못하면 즉시 패배합니다.
              </li>
              <li>
                <strong>답 없음 (단어 고갈):</strong> 사전에 이어받을 수 있는 단어가 전혀 없거나 생각나지 않을 경우, &apos;답 없음(항복)&apos; 버튼을 눌러 승부를 마칠 수 있습니다.
              </li>
              <li>
                <strong>사전 등재 단어:</strong> 국립국어원 표준국어대사전에 등재된 2글자 이상의 명사만 인정됩니다 (신조어, 비속어, 인명, 지명 불가).
              </li>
              <li>
                <strong>중복 단어 금지:</strong> 이번 판에서 이미 사용된 단어는 다시 사용할 수 없습니다.
              </li>
            </ul>
          </div>
        </div>

        {/* 닫기/나가기 푸터 */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <a
            href="https://stdict.korean.go.kr/main/main.do"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <span>국립국어원 표준국어대사전 규정 열기</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            규칙 안내 나가기
          </button>
        </div>
      </div>
    </div>
  );
};
