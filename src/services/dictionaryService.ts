import { KOREAN_DICTIONARY, WORD_MAP, WORD_SET } from '../data/koreanDictionary';
import { canChainWords, formatStartingRule } from '../utils/dueum';
import { isOneShotWord, getOneShotDescription } from '../utils/oneShotWords';
import { WordCheckResult } from '../types/game';

// 런타임에 동적으로 학습/확인된 추가 단어 캐시
const DYNAMIC_WORD_CACHE = new Map<string, { definition: string; hanja?: string; category?: string }>();

/**
 * 단어 유효성 검사 (규칙 + 표준국어대사전 검증)
 */
export async function validateWord(
  word: string,
  previousWord: string | null,
  usedWords: Set<string>,
  options: {
    useDueum: boolean;
    oneShotMode: 'banned' | 'allowed' | 'warning';
  }
): Promise<WordCheckResult> {
  const trimmed = word.trim();

  // 1. 글자 수 검사 (끝말잇기 표준: 2글자 이상)
  if (!trimmed || trimmed.length < 2) {
    return {
      isValid: false,
      reason: "단어는 두 글자 이상이어야 합니다.",
    };
  }

  // 2. 한글 완성형 검사 (자모 분리 및 특수문자/외래어 알파벳 차단)
  if (!/^[가-힣]+$/.test(trimmed)) {
    return {
      isValid: false,
      reason: "한글 완성형 단어만 입력할 수 있습니다.",
    };
  }

  // 3. 중복 단어 검사
  if (usedWords.has(trimmed)) {
    return {
      isValid: false,
      reason: `'${trimmed}'(은)는 이미 사용된 단어입니다.`,
    };
  }

  // 4. 끝말잇기 연결 규칙 검사 (두음법칙 포함)
  if (previousWord) {
    const isChainValid = canChainWords(previousWord, trimmed, options.useDueum);
    if (!isChainValid) {
      const lastChar = previousWord.slice(-1);
      const ruleText = formatStartingRule(lastChar, options.useDueum);
      return {
        isValid: false,
        reason: `'${previousWord}'의 끝 글자인 ${ruleText}(으)로 시작해야 합니다!`,
      };
    }
  }

  // 5. 한방단어 검사
  const isOneShot = isOneShotWord(trimmed, options.useDueum);
  if (isOneShot && options.oneShotMode === 'banned') {
    return {
      isValid: false,
      isOneShot: true,
      reason: getOneShotDescription(trimmed) + " (현재 규칙: 한방단어 금지)",
    };
  }

  // 6. 사전 존재 여부 확인
  // 6-1. 로컬 내장 사전 확인 (즉각 검증)
  if (WORD_MAP.has(trimmed)) {
    const entry = WORD_MAP.get(trimmed)!;
    return {
      isValid: true,
      definition: entry.definition,
      hanja: entry.hanja,
      category: entry.category,
      isOneShot,
    };
  }

  // 6-2. 동적 캐시 확인
  if (DYNAMIC_WORD_CACHE.has(trimmed)) {
    const cached = DYNAMIC_WORD_CACHE.get(trimmed)!;
    return {
      isValid: true,
      definition: cached.definition,
      hanja: cached.hanja,
      category: cached.category,
      isOneShot,
    };
  }

  // 6-3. 서버 표준국어대사전 Gemini API 검증 시도
  try {
    const response = await fetch('/api/check-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: trimmed,
        previousWord,
        useDueum: options.useDueum,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.isValid) {
        DYNAMIC_WORD_CACHE.set(trimmed, {
          definition: data.definition || "표준국어대사전 등재 명사",
          hanja: data.hanja,
          category: data.category || "일반어",
        });

        return {
          isValid: true,
          definition: data.definition || "표준국어대사전에 등재된 단어입니다.",
          hanja: data.hanja,
          category: data.category || "일반어",
          isOneShot,
        };
      } else {
        return {
          isValid: false,
          reason: data.reason || `'${trimmed}'(은)는 표준국어대사전에 등재된 표준 명사가 아닙니다.`,
        };
      }
    }
  } catch {
    // 백엔드 통신 실패 시 (오프라인 등): 로컬 사전 외 단어는 안내
  }

  return {
    isValid: false,
    reason: `'${trimmed}'(은)는 표준국어대사전에 없거나 등재되지 않은 단어입니다.`,
  };
}

/**
 * 사전에서 특정 단어 뜻 검색
 */
export function lookupWordDefinition(word: string): { definition: string; hanja?: string; category?: string } | null {
  if (WORD_MAP.has(word)) {
    const entry = WORD_MAP.get(word)!;
    return {
      definition: entry.definition,
      hanja: entry.hanja,
      category: entry.category,
    };
  }
  if (DYNAMIC_WORD_CACHE.has(word)) {
    return DYNAMIC_WORD_CACHE.get(word)!;
  }
  return null;
}
