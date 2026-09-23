/**
 * 끝말잇기 한방단어 (Killer Words) 판별 및 방어 유틸리티
 */

import { getValidStartingSyllables } from './dueum';

// 한국어 끝말잇기에서 대표적인 한방 음절 (뒤를 이을 수 있는 표준명사가 없거나 극히 드문 음절)
export const ONE_SHOT_SYLLABLES = new Set<string>([
  // 화학 원소 계열 (대표 한방)
  '듐', // 라듐, 바나듐, 로듐, 이리듐, 루비듐
  '뮴', // 카드뮴, 오스뮴, 페르뮴
  '륨', // 나트륨, 칼륨, 헬륨, 베릴륨, 탈륨 (두음적용 '윰'도 단어 없음)
  '슘', // 칼슘, 마그네슘, 세슘
  '늄', // 알루미늄, 플루토늄, 우라늄, 티타늄, 제라늄
  '븀', // 테르븀, 이테르븀, 니오븀
  '튬', // 리튬, 프로메튬
  '츔',
  '슘',
  '뮹',
  '큠',
  '퓸',

  // 고유어 및 특수 받침 한방
  '녘', // 새벽녘, 해질녘, 동녘, 서녘, 남녘, 북녘
  '릇', // 그릇, 질그릇, 밥그릇, 사기그릇, 놋그릇
  '픔', // 슬픔, 아픔
  '쁨', // 기쁨, 어여쁨, 눈기쁨, 미쁨
  '풰', // 차풰
  '졀', // 갑졀, 만졀
  '읗', // 히읗, 시읗, 치읓, 티읕, 피읖
  '탉', // 암탉, 수탉, 씨탉
  '긷', // 두레긷, 물긷
  '엌', // 부엌
  '껑', // 뚜껑, 솥뚜껑
  '즘', // 모더니즘, 리얼리즘, 파시즘, 프리즘
  '츰', // 웃츰, 뒷츰
  '읖', // 읊
  '늣', // 늣치
  '늅',
  '듸',
  '읏',
  '릎', // 무릎
  '떰', // 떰
  '빰', // 빰
  '붑',
  '늤',
  '늸',
  '쾃',
  '뫼', // 일부 외래어 제외 단어 극소수
]);

/**
 * 특정 음절이 한방 음절인지 판별
 * @param char 검사할 글자
 * @param useDueum 두음법칙 허용 여부
 */
export function isOneShotSyllable(char: string, useDueum: boolean = true): boolean {
  if (!char) return false;
  
  // 두음법칙 적용 시 변환된 음절들도 모두 검사
  const syllables = getValidStartingSyllables(char, useDueum);

  // 모든 시작 가능한 음절이 한방 목록에 포함되어 있거나 시작 불가인 경우
  return syllables.every(s => ONE_SHOT_SYLLABLES.has(s));
}

/**
 * 단어가 한방단어인지 판별
 * @param word 단어
 * @param useDueum 두음법칙 적용 여부
 */
export function isOneShotWord(word: string, useDueum: boolean = true): boolean {
  if (!word || word.length < 2) return false;
  const lastChar = word.slice(-1);
  return isOneShotSyllable(lastChar, useDueum);
}

/**
 * 한방단어 관련 설명 메시지 생성
 */
export function getOneShotDescription(word: string): string {
  const lastChar = word.slice(-1);
  return `'${lastChar}'(으)로 끝나는 단어는 국어사전에 이어받을 수 있는 단어가 없는 강력한 한방단어입니다!`;
}
