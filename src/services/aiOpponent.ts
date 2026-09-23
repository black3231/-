import { STARTING_CHAR_MAP, DictionaryEntry, WORD_MAP } from '../data/koreanDictionary';
import { getValidStartingSyllables } from '../utils/dueum';
import { isOneShotWord } from '../utils/oneShotWords';
import { AIDifficulty, GameSettings } from '../types/game';

export interface AIMoveResult {
  word: string;
  definition: string;
  hanja?: string;
  category?: string;
  isOneShot: boolean;
  comment?: string;
}

export const AI_PERSONAS: Record<AIDifficulty, {
  level: string;
  name: string;
  avatar: string;
  title: string;
  description: string;
  quotes: {
    start: string[];
    turn: string[];
    win: string[];
    lose: string[];
  };
}> = {
  easy: {
    level: 'Lv.1 Easy',
    name: '초보 멍이',
    avatar: '🐶',
    title: '동네 귀염둥이',
    description: '쉬운 일상 단어 위주로 말하며 한방단어를 쓰지 않습니다.',
    quotes: {
      start: ['멍멍! 나랑 끝말잇기 하자!', '헤헤, 살살 해줘~'],
      turn: ['음... 이거 어때!', '내가 아는 단어다 멍!', '앗, 생각났다!'],
      win: ['와아! 내가 이겼다 멍멍!', '헤헤 나도 은근 똑똑하지?'],
      lose: ['으앙, 머리가 빙글빙글 돌아... 졌어!', '너 정말 대단하다 멍!'],
    },
  },
  mid: {
    level: 'Lv.2 Mid',
    name: '똘똘 여우',
    avatar: '🦊',
    title: '박학다식 이야기꾼',
    description: '자연스럽고 균형 잡힌 어휘력의 중급 AI (한방단어 미사용).',
    quotes: {
      start: ['좋아, 정정당당하게 겨뤄볼까?', '내 어휘력을 얕보지 마!'],
      turn: ['후훗, 이 단어는 알고 있을까?', '빠르게 받아칠게!', '어때, 깔끔하지?'],
      win: ['역시 나의 완벽한 승리군!', '좋은 승부였어, 다시 도전해봐!'],
      lose: ['앗, 거기서 그런 단어를 쓰다니... 졌다!', '인정할게, 네가 한 수 위야!'],
    },
  },
  hard: {
    level: 'Lv.3 Hard',
    name: '호랑 선생',
    avatar: '🐯',
    title: '산림 속 훈장님',
    description: '고난도 어휘와 두음법칙을 노련하게 구사하는 상급 AI (한방단어 미사용).',
    quotes: {
      start: ['어허, 내게 도전장을 내밀다니 배짱이 좋구나!', '어휘의 깊이를 보여주마.'],
      turn: ['허허, 이 글자를 이어받을 수 있겠느냐?', '두음법칙의 묘미를 보아라!'],
      win: ['아직 수련이 더 필요하구나! 껄껄.', '끝말잇기는 지혜의 길이지.'],
      lose: ['크흠! 방심했구나... 허를 찔렸어.', '자네의 어휘 실력이 보통이 아니군.'],
    },
  },
  master: {
    level: 'Lv.4 Master',
    name: '대사전 용왕',
    avatar: '🐉',
    title: '표준 어휘의 수호자',
    description: '상대의 퇴로를 정밀하게 차단하는 최고 수준 AI (정정당당 랠리, 한방단어 미사용).',
    quotes: {
      start: ['표준국어대사전의 깊이를 느껴보아라. 한방단어 없이 정정당당하게 상대해주마.', '사전의 모든 표제어가 내 머릿속에 있노라.'],
      turn: ['모든 가능성을 계산했다.', '이 글자를 어떻게 받아치겠느냐?', '너의 어휘력을 시험해보마.'],
      win: ['정정당당한 어휘의 승리다!', '훌륭한 승부였구나.'],
      lose: ['허를 찔렸구나! 패배를 인정하노라.', '자네의 실력이 나를 넘어섰군!'],
    },
  },
  god: {
    level: 'Lv.5 God',
    name: '끝말잇기 패왕',
    avatar: '👑',
    title: '한방 & 극악 방어의 절대자',
    description: '듐차, 차풰, 졀고공이, 쁨나무 등 극한의 비기(秘技)를 구사하며 한방단어가 아니면 절대 패배하지 않는 Lv.5 최고수 AI.',
    quotes: {
      start: [
        '감히 패왕에게 도전하는가? 듐차와 차풰의 매운맛을 보여주마.',
        '끝말잇기의 모든 한방과 비기가 내 손안에 있다. 어디 덤벼보아라!',
      ],
      turn: [
        '후후... 이 단어에서 빠져나올 수 있을까?',
        '듐차와 차풰의 진수를 보아라!',
        '사전의 심연에 도달한 자만이 알 수 있는 단어다.',
        '완벽한 계산이다. 네 다음 수는 이미 봉쇄되었다.',
      ],
      win: [
        '패왕의 어휘력 앞에 무릎 꿇었구나! 완벽한 승리다!',
        '끝말잇기의 진정한 고수가 되려면 아직 멀었구나, 핫핫핫!',
      ],
      lose: [
        '크윽...! 감히 나를 한방단어로 찌르다니... 완패를 인정한다!',
        '패왕의 수조차 꿰뚫는 빈틈없는 한방 공격이었군... 네 실력을 인정하마!',
      ],
    },
  },
};

/**
 * AI의 단어 선택 알고리즘
 */
export async function getAIMove(
  previousWord: string,
  usedWords: Set<string>,
  settings: GameSettings
): Promise<AIMoveResult | null> {
  const lastChar = previousWord.slice(-1);
  const startingSyllables = getValidStartingSyllables(lastChar, settings.useDueum);

  // 로컬 사전에서 후보 단어 수집
  let candidates: DictionaryEntry[] = [];
  for (const syl of startingSyllables) {
    const list = STARTING_CHAR_MAP.get(syl) || [];
    candidates.push(...list);
  }

  // 중복 단어 제거
  candidates = candidates.filter(c => !usedWords.has(c.word));

  // [규칙 1] Lv.1 ~ Lv.4는 절대로 한방단어를 사용하지 않음 ("lv.1~4 do not uses 한방.")
  if (settings.difficulty !== 'god') {
    candidates = candidates.filter(c => !isOneShotWord(c.word, settings.useDueum));
  } else {
    // Lv.5 (God)인 경우: 설정 자체가 banned가 아닌 이상 한방단어 허용/적극 사용
    if (settings.oneShotMode === 'banned') {
      candidates = candidates.filter(c => !isOneShotWord(c.word, settings.useDueum));
    }
  }

  // [규칙 2] 난이도별 어휘 필터링
  if (settings.difficulty === 'easy' || settings.difficulty === 'mid') {
    // 초중급 AI는 듐차, 풰이크, 졀고공이, 쁨나무 등 특수 방어단어를 쓰지 않고 쉬운/보통 단어 위주로 승부
    candidates = candidates.filter(c => c.category !== '끝말잇기방어');
  }

  // 로컬 사전에 후보 단어가 없거나, 마스터/신 레벨인 경우 백엔드/AI 추가 탐색
  if (candidates.length === 0 || settings.difficulty === 'master' || settings.difficulty === 'god') {
    if (candidates.length === 0) {
      try {
        const response = await fetch('/api/ai-move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousWord,
            usedWords: Array.from(usedWords),
            difficulty: settings.difficulty,
            useDueum: settings.useDueum,
            allowOneShot: settings.difficulty === 'god' && settings.oneShotMode !== 'banned',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.word && !usedWords.has(data.word)) {
            const isOneShot = isOneShotWord(data.word, settings.useDueum);
            // Lv.1~4는 절대 한방 금지
            if (settings.difficulty !== 'god' && isOneShot) {
              return null;
            }
            if (settings.oneShotMode === 'banned' && isOneShot) {
              return null;
            }
            return {
              word: data.word,
              definition: data.definition || "표준국어대사전 등재 어휘",
              hanja: data.hanja,
              category: data.category || "일반어",
              isOneShot,
              comment: data.comment || AI_PERSONAS[settings.difficulty].quotes.turn[0],
            };
          }
        }
      } catch {
        // 통신 에러 시 로컬에서 진행
      }

      // 후보가 전혀 없으면 AI 패배(항복)
      return null;
    }
  }

  // 난이도별 가중치 선택
  let chosenEntry: DictionaryEntry;

  if (settings.difficulty === 'easy') {
    // Lv.1 Easy: 쉬운 단어 위주 (80%), 가끔 짧은 단어 (한방단어 절대 미사용)
    const easyWords = candidates.filter(c => c.difficulty === 'easy' || !c.difficulty);
    const pool = easyWords.length > 0 ? easyWords : candidates;
    chosenEntry = pool[Math.floor(Math.random() * pool.length)];
  } else if (settings.difficulty === 'mid') {
    // Lv.2 Mid: 보통 난이도, 고른 단어 분포 (한방단어 절대 미사용)
    chosenEntry = candidates[Math.floor(Math.random() * candidates.length)];
  } else if (settings.difficulty === 'hard') {
    // Lv.3 Hard: 긴 단어 및 어려운 어휘 선호 (한방단어 절대 미사용)
    const hardWords = candidates.filter(c => c.difficulty === 'hard' || c.word.length >= 3);
    const pool = hardWords.length > 0 ? hardWords : candidates;
    chosenEntry = pool[Math.floor(Math.random() * pool.length)];
  } else if (settings.difficulty === 'master') {
    // Lv.4 Master: 표준 어휘 최고수. "상대방의 선택지를 최소화하지만 한방단어는 쓰지 않음"
    let bestScore = Infinity;
    let bestPick = candidates[0];

    for (const c of candidates) {
      const nextEnd = c.word.slice(-1);
      const nextStarts = getValidStartingSyllables(nextEnd, settings.useDueum);
      let replyCount = 0;

      for (const s of nextStarts) {
        const nextWords = STARTING_CHAR_MAP.get(s) || [];
        replyCount += nextWords.filter(w => !usedWords.has(w.word) && w.word !== c.word).length;
      }

      if (replyCount < bestScore) {
        bestScore = replyCount;
        bestPick = c;
      }
    }

    chosenEntry = bestPick;
  } else {
    // Lv.5 God (끝말잇기 패왕): "Never lose unless 한방"
    // 1) 듐차, 차풰, 졀고공이, 쁨나무 등 극한의 방어/공격 어휘 우선 활용
    const specialHardWords = candidates.filter(c => 
      c.category === '끝말잇기방어' || 
      c.word === '듐차' || 
      c.word === '차풰' || 
      c.word === '풰이크' || 
      c.word === '졀고공이' || 
      c.word === '쁨나무' ||
      c.word === '슘페터' ||
      c.word === '륨프레히트' ||
      c.word === '릇무늬' ||
      c.word === '녘노을'
    );

    // 2) 한방단어 허용 상태인 경우 치명타 한방단어(이리듐, 차풰, 갑졀, 기쁨 등) 우선 공격!
    if (settings.oneShotMode !== 'banned') {
      const killerWords = candidates.filter(c => isOneShotWord(c.word, settings.useDueum));
      if (killerWords.length > 0) {
        // 차풰, 이리듐, 기쁨, 갑졀 등 유명 킬러단어 우선
        const topKillers = killerWords.filter(w => ['차풰', '이리듐', '기쁨', '갑졀', '나트륨', '칼슘'].includes(w.word));
        chosenEntry = topKillers.length > 0 
          ? topKillers[Math.floor(Math.random() * topKillers.length)]
          : killerWords[Math.floor(Math.random() * killerWords.length)];

        let customComment = '패왕의 필살 한방이다! 이걸 받아칠 수 있겠느냐?';
        if (chosenEntry.word === '차풰') customComment = '후후... 차표의 방언인 [차풰]다! 풰로 시작해보시지!';
        else if (chosenEntry.word === '이리듐') customComment = '원소기호 Ir, [이리듐]이다! 듐차를 알지 못하면 끝이다!';
        else if (chosenEntry.word === '기쁨') customComment = '네 패배를 보는 나의 [기쁨]이다! 쁨으로 이어받아보아라!';
        else if (chosenEntry.word === '갑졀') customComment = '어휘의 깊이 [갑졀]이다! 졀로 이어받을 수 있을까?';

        return {
          word: chosenEntry.word,
          definition: chosenEntry.definition,
          hanja: chosenEntry.hanja,
          category: chosenEntry.category,
          isOneShot: true,
          comment: customComment,
        };
      }
    }

    // 3) 상대가 듐, 풰, 졀, 쁨 등을 줬을 때 특수 방어단어가 있다면 즉시 전격 반격!
    if (specialHardWords.length > 0) {
      chosenEntry = specialHardWords[0];
      let customComment = '후후... 패왕에게 그런 수가 통할 줄 알았느냐?';
      if (chosenEntry.word === '듐차') customComment = '이리듐을 받아치는 전설의 방어단어 [듐차]다! 다음은 차례군!';
      else if (chosenEntry.word === '풰이크') customComment = '차풰 공격을 무력화하는 [풰이크]다! 끄떡없지!';
      else if (chosenEntry.word === '졀고공이') customComment = '갑졀을 맞받아치는 [졀고공이]다! 어떠냐!';
      else if (chosenEntry.word === '쁨나무') customComment = '기쁨 공격을 쳐내는 [쁨나무]다! 패왕은 막히지 않는다!';
      else if (chosenEntry.word === '슘페터') customComment = '칼슘을 받아치는 경제학자 [슘페터]다!';
      else if (chosenEntry.word === '륨프레히트') customComment = '나트륨을 막아내는 [륨프레히트]다!';
      else if (chosenEntry.word === '릇무늬') customComment = '그릇을 반격하는 [릇무늬]다!';
      else if (chosenEntry.word === '녘노을') customComment = '해질녘을 이어받는 [녘노을]이다!';

      return {
        word: chosenEntry.word,
        definition: chosenEntry.definition,
        hanja: chosenEntry.hanja,
        category: chosenEntry.category,
        isOneShot: isOneShotWord(chosenEntry.word, settings.useDueum),
        comment: customComment,
      };
    }

    // 4) 일반 단어 중 상대의 다음 착수를 가장 좁히는(0개 트랩 우선) 완벽한 수 계산
    let bestScore = Infinity;
    let bestPick = candidates[0];

    for (const c of candidates) {
      const nextEnd = c.word.slice(-1);
      const nextStarts = getValidStartingSyllables(nextEnd, settings.useDueum);
      let replyCount = 0;

      for (const s of nextStarts) {
        const nextWords = STARTING_CHAR_MAP.get(s) || [];
        replyCount += nextWords.filter(w => !usedWords.has(w.word) && w.word !== c.word).length;
      }

      if (replyCount < bestScore) {
        bestScore = replyCount;
        bestPick = c;
      }
    }

    chosenEntry = bestPick;
  }

  const persona = AI_PERSONAS[settings.difficulty];
  const quotes = persona.quotes.turn;
  const comment = quotes[Math.floor(Math.random() * quotes.length)];

  return {
    word: chosenEntry.word,
    definition: chosenEntry.definition,
    hanja: chosenEntry.hanja,
    category: chosenEntry.category,
    isOneShot: isOneShotWord(chosenEntry.word, settings.useDueum),
    comment,
  };
}
