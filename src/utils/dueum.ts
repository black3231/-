/**
 * 두음법칙 (Dueum Law) 엔진
 * 대한민국 국립국어원 표준 한글 맞춤법 (제10항, 제11항, 제12항) 기반
 */

// ㄹ -> ㄴ 또는 ㅇ 변환 맵
export const DUEUM_MAP: Record<string, string> = {
  // ㄴ 두음법칙 (ㄴ -> ㅇ)
  '냐': '야',
  '녀': '여',
  '녁': '역',
  '년': '연',
  '녈': '열',
  '념': '염',
  '녑': '엽',
  '녕': '영',
  '녜': '예',
  '뇨': '요',
  '뉴': '유',
  '뉵': '육',
  '뉸': '윤',
  '니': '이',
  '닉': '익',
  '닌': '인',
  '님': '임',
  '닙': '입',
  '닝': '잉',

  // ㄹ 두음법칙 1 (ㄹ -> ㅇ / 모음 ㅣ, ㅑ, ㅕ, ㅖ, ㅛ, ㅠ 계열)
  '랴': '야',
  '략': '약',
  '량': '양',
  '려': '여',
  '력': '역',
  '련': '연',
  '렬': '열',
  '렴': '염',
  '렵': '엽',
  '령': '영',
  '례': '예',
  '료': '요',
  '류': '유',
  '륙': '육',
  '륜': '윤',
  '률': '율',
  '륭': '융',
  '리': '이',
  '린': '인',
  '림': '임',
  '립': '입',
  '링': '잉',

  // ㄹ 두음법칙 2 (ㄹ -> ㄴ / 모음 ㅏ, ㅐ, ㅗ, ㅚ, ㅜ, ㅡ 계열)
  '라': '나',
  '락': '낙',
  '란': '난',
  '랄': '날',
  '람': '남',
  '랍': '납',
  '랑': '낭',
  '래': '내',
  '랭': '냉',
  '로': '노',
  '록': '녹',
  '론': '논',
  '롱': '농',
  '뢰': '뇌',
  '루': '누',
  '룩': '눅',
  '룬': '눈',
  '룰': '눌',
  '룸': '눔',
  '룻': '늣',
  '룽': '눙',
  '르': '느',
  '륵': '늑',
  '른': '는',
  '름': '늠',
  '릉': '능',
};

/**
 * 주어진 글자에 대한 두음법칙 적용 변환 글자를 반환 (없으면 null)
 */
export function getDueumTransform(char: string): string | null {
  if (!char || char.length !== 1) return null;
  return DUEUM_MAP[char] || null;
}

/**
 * 이전 단어의 마지막 음절에서 시작 가능한 모든 첫 음절 목록 반환
 * @param lastChar 이전 단어의 마지막 글자
 * @param useDueum 두음법칙 적용 여부 (기본 true)
 */
export function getValidStartingSyllables(lastChar: string, useDueum: boolean = true): string[] {
  if (!lastChar) return [];
  const results = [lastChar];
  
  if (useDueum) {
    const transformed = DUEUM_MAP[lastChar];
    if (transformed && !results.includes(transformed)) {
      results.push(transformed);
    }
  }

  return results;
}

/**
 * 새 단어가 이전 단어와 끝말잇기 규칙에 맞게 이어지는지 검증
 * @param prevWord 이전 단어
 * @param newWord 새 단어
 * @param useDueum 두음법칙 허용 여부
 */
export function canChainWords(prevWord: string, newWord: string, useDueum: boolean = true): boolean {
  if (!prevWord || !newWord) return false;
  const lastChar = prevWord.slice(-1);
  const firstChar = newWord[0];

  const allowedStarts = getValidStartingSyllables(lastChar, useDueum);
  return allowedStarts.includes(firstChar);
}

/**
 * 사용자 친화적인 안내 텍스트 생성
 * 예) "'력' 또는 두음법칙 '역'"
 */
export function formatStartingRule(lastChar: string, useDueum: boolean = true): string {
  if (!lastChar) return '';
  const transformed = useDueum ? DUEUM_MAP[lastChar] : null;
  if (transformed) {
    return `'${lastChar}' (두음법칙: '${transformed}')`;
  }
  return `'${lastChar}'`;
}
