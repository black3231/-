import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  Sparkles,
  Zap,
  Flame,
  LogOut,
  ArrowRight,
  Filter,
  ExternalLink,
  Layers,
  GraduationCap,
  Globe2,
} from 'lucide-react';
import {
  WORD_MAP,
  KOREAN_DICTIONARY,
  STARTING_CHAR_MAP,
  DictionaryEntry,
} from '../data/koreanDictionary';
import { isOneShotWord, getOneShotDescription } from '../utils/oneShotWords';
import { getDueumTransform, getValidStartingSyllables } from '../utils/dueum';
import { WordHistoryItem } from '../types/game';

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHistoryItem?: WordHistoryItem | null;
  history?: WordHistoryItem[];
}

type DictTab = 'start_char' | 'categories' | 'meaning_finder';

const CATEGORY_TABS = [
  { id: 'all', label: '전체' },
  { id: '역사', label: '역사' },
  { id: '정치', label: '정치' },
  { id: '법률', label: '법률' },
  { id: '경제', label: '경제' },
  { id: '사회', label: '사회' },
  { id: '철학', label: '철학' },
  { id: '과학', label: '과학' },
  { id: '끝말잇기방어', label: '끝말잇기방어' },
];

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  isOpen,
  onClose,
  selectedHistoryItem,
  history = [],
}) => {
  const [activeTab, setActiveTab] = useState<DictTab>(
    selectedHistoryItem ? 'meaning_finder' : 'start_char'
  );

  // Tab 1: 시작 글자 검색 상태
  const [startCharInput, setStartCharInput] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'normal' | 'oneshot'>('all');
  const [includeDueum, setIncludeDueum] = useState(true);
  const [onlineWords, setOnlineWords] = useState<DictionaryEntry[]>([]);
  const [isSearchingPrefixOnline, setIsSearchingPrefixOnline] = useState(false);

  // Tab 2: 카테고리/전문용어 브라우저 상태
  const [selectedCategory, setSelectedCategory] = useState<string>('역사');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Tab 3: 단어 뜻 검색 상태
  const [meaningWordInput, setMeaningWordInput] = useState(
    selectedHistoryItem ? selectedHistoryItem.word : ''
  );
  const [meaningResult, setMeaningResult] = useState<DictionaryEntry | null>(
    selectedHistoryItem
      ? {
          word: selectedHistoryItem.word,
          definition: selectedHistoryItem.definition,
          hanja: selectedHistoryItem.hanja,
          category: selectedHistoryItem.category,
        }
      : null
  );
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [meaningError, setMeaningError] = useState<string | null>(null);

  // 시작 글자로 단어 목록 검색 (로컬 사전)
  const matchedWords = useMemo(() => {
    const trimmed = startCharInput.trim();
    if (!trimmed) return [];

    const firstChar = trimmed[0];
    const targets = includeDueum
      ? getValidStartingSyllables(firstChar, true)
      : [firstChar];

    let results: DictionaryEntry[] = [];
    for (const char of targets) {
      const list = STARTING_CHAR_MAP.get(char) || [];
      results.push(...list);
    }

    // 접두사 필터링 (예: 2글자 이상 입력 시 접두어로 검색)
    if (trimmed.length > 1) {
      results = results.filter(item => item.word.startsWith(trimmed));
    }

    // 한방단어 필터
    if (filterType === 'normal') {
      results = results.filter(item => !isOneShotWord(item.word, true));
    } else if (filterType === 'oneshot') {
      results = results.filter(item => isOneShotWord(item.word, true));
    }

    // 온라인에서 가져온 단어들 합치기 (중복 제거)
    const localWords = new Set(results.map(r => r.word));
    const extraOnline = onlineWords.filter(w => !localWords.has(w.word));

    return [...results, ...extraOnline];
  }, [startCharInput, includeDueum, filterType, onlineWords]);

  // 카테고리별 단어 필터링
  const categoryWords = useMemo(() => {
    let list = KOREAN_DICTIONARY;
    if (selectedCategory !== 'all') {
      list = list.filter(item => item.category === selectedCategory);
    }
    const q = categorySearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        item =>
          item.word.toLowerCase().includes(q) ||
          (item.definition && item.definition.toLowerCase().includes(q)) ||
          (item.hanja && item.hanja.includes(q))
      );
    }
    return list;
  }, [selectedCategory, categorySearchQuery]);

  if (!isOpen) return null;

  // 온라인 국립국어원 접두사 검색
  const handleFetchOnlinePrefix = async () => {
    const prefix = startCharInput.trim();
    if (!prefix) return;

    setIsSearchingPrefixOnline(true);
    try {
      const res = await fetch('/api/search-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, count: 30 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.words && Array.isArray(data.words)) {
          setOnlineWords(data.words);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingPrefixOnline(false);
    }
  };

  // 단어 뜻 검색 실행
  const handleSearchMeaning = async (wordToSearch: string) => {
    const clean = wordToSearch.trim();
    if (!clean) return;

    setMeaningError(null);

    // 1. 로컬 사전 검색
    if (WORD_MAP.has(clean)) {
      setMeaningResult(WORD_MAP.get(clean)!);
      return;
    }

    // 2. 서버 온라인 국어대사전 검색
    setIsSearchingOnline(true);
    try {
      const response = await fetch('/api/check-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: clean }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isValid) {
          setMeaningResult({
            word: clean,
            definition: data.definition || '표준국어대사전 등재 어휘',
            hanja: data.hanja,
            category: data.category || '국어대사전',
          });
          setIsSearchingOnline(false);
          return;
        }
      }
      setMeaningError(`'${clean}'(은)는 국립국어원 표준국어대사전에 등재되지 않은 단어입니다.`);
      setMeaningResult(null);
    } catch {
      setMeaningError(`'${clean}' 사전 조회 중 오류가 발생했습니다.`);
      setMeaningResult(null);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // 단어 클릭 시 뜻풀이 탭으로 이동
  const handleInspectWord = (word: string) => {
    setMeaningWordInput(word);
    handleSearchMeaning(word);
    setActiveTab('meaning_finder');
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* 헤더 & 나가기(Exit) 버튼 */}
        <div className="flex items-center justify-between p-5 px-6 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">국어대사전 어휘·전문용어 센터</h2>
                <a
                  href="https://stdict.korean.go.kr/main/main.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="국립국어원 표준국어대사전 공식 사이트 열기"
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all"
                >
                  <span>국립국어원 연동</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <p className="text-xs text-slate-400">
                표준국어대사전 전수 표제어 및 역사·정치·경제·법률·철학 전문용어 지원
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors"
              title="사전 닫고 게임으로 나가기"
            >
              <LogOut className="w-4 h-4 text-amber-400" />
              <span>나가기</span>
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('start_char')}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'start_char'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>1. 글자로 시작하는 단어 찾기</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>2. 역사·정치 등 전문분야 어휘</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('meaning_finder')}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'meaning_finder'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>3. 단어 뜻풀이 검색</span>
          </button>
        </div>

        {/* 탭 1: 글자로 시작하는 단어 찾기 */}
        {activeTab === 'start_char' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* 검색 입력창 */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={startCharInput}
                  onChange={e => {
                    setStartCharInput(e.target.value);
                    setOnlineWords([]);
                  }}
                  placeholder="시작할 글자 또는 접두어를 입력하세요 (예: 삼, 정, 훈, 늘, 다, 듐)"
                  className="w-full bg-slate-850 text-slate-100 placeholder-slate-500 text-sm font-semibold py-3 pl-4 pr-10 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none"
                  maxLength={6}
                />
                {startCharInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartCharInput('');
                      setOnlineWords([]);
                    }}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 두음법칙 포함 토글 */}
              <label className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-850 px-3 py-3 rounded-xl border border-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDueum}
                  onChange={e => setIncludeDueum(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>두음법칙 포함</span>
              </label>
            </div>

            {/* 필터 칩 & 인기 글자 */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">필터:</span>
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterType === 'all'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  전체 ({matchedWords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('normal')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterType === 'normal'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  일반 단어
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('oneshot')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterType === 'oneshot'
                      ? 'bg-rose-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  한방 단어
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>추천 글자:</span>
                {['삼', '정', '훈', '임', '민', '늘', '다', '가'].map(char => (
                  <button
                    type="button"
                    key={char}
                    onClick={() => {
                      setStartCharInput(char);
                      setOnlineWords([]);
                    }}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

            {/* 단어 결과 목록 그리드 */}
            {matchedWords.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {matchedWords.map((item, idx) => {
                    const isOneShot = isOneShotWord(item.word, true);
                    return (
                      <button
                        type="button"
                        key={`${item.word}-${idx}`}
                        onClick={() => handleInspectWord(item.word)}
                        className="group p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/60 text-left transition-all flex flex-col justify-between cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
                              {item.word}
                            </span>
                            {item.hanja && (
                              <span className="text-[10px] text-slate-500 font-serif">
                                ({item.hanja})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[10px]">
                            {item.category && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-750 text-slate-300">
                                {item.category}
                              </span>
                            )}
                            {isOneShot ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                                한방
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                안전
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {item.definition}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* 국립국어원 전체 검색 확장 버튼 */}
                {startCharInput.trim() && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      disabled={isSearchingPrefixOnline}
                      onClick={handleFetchOnlinePrefix}
                      className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                    >
                      <Globe2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {isSearchingPrefixOnline
                          ? '국립국어원 공식 사전에서 검색 중...'
                          : `국립국어원 우리말샘 전체에서 '${startCharInput}'(으)로 시작하는 단어 더 찾기 (100만 표제어)`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs space-y-3">
                {startCharInput ? (
                  <div>
                    <p className="text-slate-400 mb-3">
                      로컬 사전에서 &apos;{startCharInput}&apos;(으)로 시작하는 등록 단어를 찾지 못했습니다.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={isSearchingPrefixOnline}
                        onClick={handleFetchOnlinePrefix}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-colors inline-flex items-center gap-1.5"
                      >
                        <Globe2 className="w-4 h-4" />
                        <span>국립국어원 전체 사전에서 단어 탐색하기</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>시작할 한글 글자나 접두어를 입력하면 국어사전 단어 목록이 표시됩니다.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 탭 2: 역사·정치 등 전문분야 어휘 (Categories browser) */}
        {activeTab === 'categories' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* 카테고리 필터 탭 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CATEGORY_TABS.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 카테고리 내 빠른 검색 */}
            <div className="relative">
              <input
                type="text"
                value={categorySearchQuery}
                onChange={e => setCategorySearchQuery(e.target.value)}
                placeholder="전문용어 단어명, 한자, 뜻 검색..."
                className="w-full bg-slate-850 text-slate-100 placeholder-slate-500 text-xs font-semibold py-2.5 pl-9 pr-4 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>

            {/* 결과 단어 목록 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {categoryWords.map((item, idx) => (
                <button
                  type="button"
                  key={`cat-${item.word}-${idx}`}
                  onClick={() => handleInspectWord(item.word)}
                  className="group p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/60 text-left transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
                        {item.word}
                      </span>
                      {item.hanja && (
                        <span className="text-[10px] text-slate-500 font-serif">
                          ({item.hanja})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-750 text-amber-300 font-semibold">
                      {item.category || '전문용어'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.definition}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 탭 3: 단어 뜻 검색 (Meaning finder) */}
        {activeTab === 'meaning_finder' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            {/* 단어 입력창 */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSearchMeaning(meaningWordInput);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={meaningWordInput}
                onChange={e => setMeaningWordInput(e.target.value)}
                placeholder="뜻을 찾고 싶은 국어 명사나 역사·정치 전문용어를 입력하세요 (예: 조선왕조실록, 삼권분립, 훈민정음)"
                className="w-full bg-slate-850 text-slate-100 placeholder-slate-500 text-sm font-semibold py-3 pl-4 pr-24 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!meaningWordInput.trim() || isSearchingOnline}
                className="absolute right-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                <span>검색</span>
              </button>
            </form>

            {/* 추천 전문용어 칩 */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">추천 검색어:</span>
              {[
                '조선왕조실록',
                '삼권분립',
                '훈민정음',
                '민주주의',
                '임진왜란',
                '시장경제',
                '헌법재판소',
                '팔만대장경',
                '대통령제',
                '늘결',
                '다가구주택',
              ].map(term => (
                <button
                  type="button"
                  key={term}
                  onClick={() => {
                    setMeaningWordInput(term);
                    handleSearchMeaning(term);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* 로딩 표시 */}
            {isSearchingOnline && (
              <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
                <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                <span>국립국어원 표준국어대사전 및 우리말샘에서 단어 뜻을 실시간으로 확인하고 있습니다...</span>
              </div>
            )}

            {/* 에러 메시지 */}
            {meaningError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {meaningError}
              </div>
            )}

            {/* 상세 뜻풀이 카드 */}
            {meaningResult && (
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-700/80 shadow-lg space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400">
                      {meaningResult.word}
                    </span>
                    {meaningResult.hanja && (
                      <span className="font-serif text-slate-400 text-sm">
                        ({meaningResult.hanja})
                      </span>
                    )}
                    {meaningResult.category && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold">
                        {meaningResult.category}
                      </span>
                    )}
                  </div>

                  {/* 단어 특성 태그 */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {isOneShotWord(meaningResult.word, true) && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        한방단어
                      </span>
                    )}
                    {getDueumTransform(meaningResult.word.slice(-1)) && (
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        두음 전환 가능
                      </span>
                    )}
                  </div>
                </div>

                {/* 사전 뜻 본문 */}
                <div className="border-t border-slate-800 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      사전 뜻풀이
                    </h4>
                    <a
                      href={`https://stdict.korean.go.kr/search/searchResult.do?searchKeyword=${encodeURIComponent(
                        meaningResult.word
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                    >
                      <span>국립국어원 공식 대사전에서 직접 보기</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {meaningResult.definition}
                  </p>
                </div>

                {/* 한방단어 판별 분석 */}
                {isOneShotWord(meaningResult.word, true) && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    <strong className="block mb-0.5 font-bold">한방단어 분석:</strong>
                    {getOneShotDescription(meaningResult.word)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 푸터 & 나가기(Exit) 버튼 */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <a
            href="https://stdict.korean.go.kr/main/main.do"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <span>국립국어원 표준국어대사전 공식 웹사이트</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>사전 나가기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
