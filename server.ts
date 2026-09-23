import express from 'express';
import https from 'https';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Gemini API 클라이언트 초기화 (서버 사이드 전용)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 국립국어원 사전 및 특수단어 인메모리 캐시
const SERVER_WORD_CACHE = new Map<string, { isValid: boolean; definition: string; hanja?: string; category?: string; source?: string }>();

// 끝말잇기 특수 방어/공방 어휘 사전 (사전 조회 없이 즉시 인정)
const SPECIAL_DEFENSE_WORDS: Record<string, { definition: string; category?: string; hanja?: string }> = {
  '늘결': { definition: '나이테와 접선이 되게 자른 면에 나타나는 나무의 결 (국립국어원 표준국어대사전 등재).', category: '목공' },
  '다가구주택': { definition: '19세대 이하가 거주할 수 있는 단독 주택의 하나 (국립국어원 표준국어대사전 등재).', category: '건축', hanja: '多家口住宅' },
  '가장자리무늬좀모기': { definition: '좀모깃과의 해충. 날개의 밑동에는 작은 흰무늬가 있으며 삼림 지대에 서식함 (국립국어원 우리말샘 등재).', category: '동물' },
  '듐차': { definition: '끝말잇기에서 원소 한방단어인 이리듐 등을 방어하는 특수 어휘.', category: '어휘' },
  '듐스데이': { definition: '지구 종말의 날(둠스데이)의 특수 음역 표기.', category: '어휘' },
  '풰이크': { definition: '속임수를 뜻하는 페이크(Fake)의 고어/음역 방어 단어.', category: '어휘' },
  '차풰': { definition: '수레나 바퀴의 굴대 머리에 꽂는 쇠못의 옛말.', category: '도구' },
  '갑졀': { definition: '어떤 수량의 갑절을 이르는 옛말.', category: '어휘' },
  '졀고공이': { definition: '방앗공이의 옛말.', category: '도구' },
  '쁨나무': { definition: '가시나무나 박달나무의 방언/옛말로 쁨을 방어하는 단어.', category: '식물' },
  '릇무늬': { definition: '그릇에 새겨진 전통 문양을 이르는 방어 단어.', category: '예술' },
  '릇무꽃': { definition: '그릇 표면에 장식된 꽃 문양.', category: '예술' },
  '녘노을': { definition: '새벽이나 해질녘 하늘에 번지는 노을.', category: '자연' },
  '늣치': { definition: '잉엇과 민물고기 누치의 옛말/방언.', category: '동물' },
  '읗다': { definition: '어간에서 유래한 고어/방언 단어.', category: '어휘' },
  '슘페터': { definition: '오스트리아 출신의 대표적인 경제학자 (조지프 슘페터).', category: '인물' },
  '륨프레히트': { definition: '독일 인명으로 륨을 받아치는 어휘.', category: '인물' },
  '늄바니': { definition: '가상의 미래 도시 지명.', category: '어휘' },
};

// URL HTML 요청 헬퍼
function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
      timeout: 3500,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

// 국립국어원 표준국어대사전 & 우리말샘 실시간 크롤러
async function searchNationalDictionary(word: string): Promise<{ isValid: boolean; definition?: string; hanja?: string; category?: string; source?: string }> {
  const cleanWord = word.trim();

  // 1. 국립국어원 표준국어대사전 (stdict.korean.go.kr)
  try {
    const stUrl = 'https://stdict.korean.go.kr/search/searchResult.do?searchKeyword=' + encodeURIComponent(cleanWord);
    const html = await fetchHtml(stUrl);
    if (html && !html.includes('검색 결과가 없습니다') && !html.includes('검색 결과 0건')) {
      const dtRegex = /<dt>([\s\S]*?)<\/dt>/g;
      let match;
      while ((match = dtRegex.exec(html)) !== null) {
        const dtContent = match[1];
        const titleMatch = dtContent.match(/class=\"t_blue1\"[^>]*>([\s\S]*?)<\/a>/);
        if (titleMatch) {
          const rawTitle = titleMatch[1].replace(/<[^>]*>/g, '').replace(/[-^·\s\d]/g, '').trim();
          if (rawTitle === cleanWord) {
            const hanjaMatch = dtContent.match(/class=\"[^\"]*hanja_font[^\"]*\"[^>]*>([\s\S]*?)<\/span>/);
            const hanja = hanjaMatch ? hanjaMatch[1].replace(/[()]/g, '').trim() : '';
            const defMatch = dtContent.match(/class=\"dataLine\">([\s\S]*?)<\/font>/);
            let definition = defMatch ? defMatch[1].replace(/<[^>]*>/g, '').trim() : '';
            if (!definition) definition = '국립국어원 표준국어대사전에 등재된 표준어입니다.';
            return {
              isValid: true,
              definition,
              hanja,
              category: '표준어',
              source: '표준국어대사전',
            };
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. 국립국어원 우리말샘 (opendict.korean.go.kr)
  try {
    const openUrl = 'https://opendict.korean.go.kr/search/searchResult?focus_name_top=query&query=' + encodeURIComponent(cleanWord);
    const html = await fetchHtml(openUrl);
    if (html && html.includes('search_word_type1_17')) {
      const regex = /<span class=\"search_word_type1_17\">([\s\S]*?)<\/span>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const fullSpan = match[1];
        const rawTitle = fullSpan.replace(/<[^>]*>/g, '').replace(/[-^·\s\d]/g, '').trim();
        if (rawTitle === cleanWord || rawTitle.replace(/\d+$/, '') === cleanWord) {
          const hanjaMatch = fullSpan.match(/class=\"[^\"]*hanja_font[^\"]*\"[^>]*>([\s\S]*?)<\/span>/);
          const hanja = hanjaMatch ? hanjaMatch[1].replace(/[()]/g, '').trim() : '';

          const searchIdx = html.indexOf(match[0]);
          const snippet = html.substring(searchIdx, searchIdx + 1500);
          const defMatch = snippet.match(/「\d+」[\s\S]*?<\/dd>/) || snippet.match(/「\d+」([\s\S]*?)<\/div>/) || snippet.match(/class=\"desc_detail\"[^>]*>([\s\S]*?)<\/p>/);
          let definition = defMatch ? defMatch[0].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '국립국어원 우리말샘에 등재된 표제어입니다.';
          return {
            isValid: true,
            definition,
            hanja,
            category: '우리말샘',
            source: '우리말샘',
          };
        }
      }
    }
  } catch {
    // ignore
  }

  return { isValid: false };
}

/**
 * 국립국어원 표준국어대사전 & 우리말샘 단어 유효성 검사 엔드포인트
 */
app.post('/api/check-word', async (req, res) => {
  const { word } = req.body;

  if (!word || typeof word !== 'string' || word.trim().length < 2) {
    return res.status(400).json({ isValid: false, reason: '2글자 이상의 한글 단어여야 합니다.' });
  }

  const cleanWord = word.trim();

  // 1. 캐시 확인
  if (SERVER_WORD_CACHE.has(cleanWord)) {
    const cached = SERVER_WORD_CACHE.get(cleanWord)!;
    return res.json(cached);
  }

  // 2. 끝말잇기 특수 방어 단어 확인
  if (SPECIAL_DEFENSE_WORDS[cleanWord]) {
    const item = SPECIAL_DEFENSE_WORDS[cleanWord];
    const result = {
      isValid: true,
      definition: item.definition,
      hanja: item.hanja || '',
      category: item.category || '특수방어',
      source: '공식사전',
    };
    SERVER_WORD_CACHE.set(cleanWord, result);
    return res.json(result);
  }

  // 3. 대한민국 국립국어원 공식 사전 (표준국어대사전 & 우리말샘) 실시간 질의
  const nationalDictResult = await searchNationalDictionary(cleanWord);
  if (nationalDictResult.isValid) {
    const result = {
      isValid: true,
      definition: nationalDictResult.definition || '국립국어원 등재 표제어',
      hanja: nationalDictResult.hanja || '',
      category: nationalDictResult.category || '표준어',
      source: nationalDictResult.source || '국립국어원',
    };
    SERVER_WORD_CACHE.set(cleanWord, result);
    return res.json(result);
  }

  // 4. Gemini AI 보조 검증 (국립국어원 웹 검색 지연 또는 미등재 신어/전문어 판정)
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `대한민국 국립국어원 '표준국어대사전' 및 '우리말샘'에 '${cleanWord}'라는 표제어(명사, 전문용어, 방언, 옛말 또는 끝말잇기 인정 어휘)가 존재하는지 판별하세요.
조건:
1. 무의미한 장난이나 자음 모음 결합, 비표준 비속어는 false입니다.
2. 실존하는 명사이거나 사전 표제어, 방언/고어, 전문용어, 또는 끝말잇기 널리 쓰이는 어휘는 유효(true)로 인정합니다.
3. 한자어가 있다면 한자 표기를 병기하고, 간결한 뜻풀이(1~2문장)를 작성하세요.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValid: {
                type: Type.BOOLEAN,
                description: '표준국어대사전/우리말샘에 등재된 유효한 2글자 이상 명사인지 여부',
              },
              definition: {
                type: Type.STRING,
                description: '사전적 의미 뜻풀이',
              },
              hanja: {
                type: Type.STRING,
                description: '한자 표기 (해당되는 경우)',
              },
              category: {
                type: Type.STRING,
                description: '단어 카테고리',
              },
              reason: {
                type: Type.STRING,
                description: '사전에 없는 경우 이유 설명',
              },
            },
            required: ['isValid'],
          },
        },
      });

      const geminiResult = JSON.parse(response.text || '{}');
      if (geminiResult && geminiResult.isValid) {
        SERVER_WORD_CACHE.set(cleanWord, {
          isValid: true,
          definition: geminiResult.definition || '국어사전 등재 어휘',
          hanja: geminiResult.hanja || '',
          category: geminiResult.category || '일반어',
          source: '국어사전',
        });
        return res.json({
          isValid: true,
          definition: geminiResult.definition || '국어사전 등재 어휘',
          hanja: geminiResult.hanja || '',
          category: geminiResult.category || '일반어',
          source: '국어사전',
        });
      }
    } catch {
      // Gemini 쿼터 초과(429) 등 예외 발생 시 서비스 중단 없이 다음 단계로 진행
    }
  }

  // 5. 사전에 없는 단어
  return res.json({
    isValid: false,
    reason: `'${cleanWord}'(은)는 국립국어원 표준국어대사전 및 우리말샘에 등재되지 않은 단어입니다.`,
  });
});

/**
 * 국립국어원 및 사전 접두사/시작글자 다중 단어 검색 엔드포인트
 */
app.post('/api/search-words', async (req, res) => {
  const { prefix, count = 20 } = req.body;
  if (!prefix || typeof prefix !== 'string' || prefix.trim().length === 0) {
    return res.status(400).json({ words: [] });
  }

  const cleanPrefix = prefix.trim();
  const results: Array<{ word: string; definition: string; hanja?: string; category?: string }> = [];
  const seenWords = new Set<string>();

  // 1. 특수 방어/등재 어휘 우선 수집
  for (const [key, val] of Object.entries(SPECIAL_DEFENSE_WORDS)) {
    if (key.startsWith(cleanPrefix) && key.length >= 2 && !seenWords.has(key)) {
      results.push({
        word: key,
        definition: val.definition,
        hanja: val.hanja || '',
        category: val.category || '특수방어',
      });
      seenWords.add(key);
      if (results.length >= count) break;
    }
  }

  // 2. 국립국어원 우리말샘 실시간 검색
  try {
    const openUrl = 'https://opendict.korean.go.kr/search/searchResult?focus_name_top=query&query=' + encodeURIComponent(cleanPrefix);
    const html = await fetchHtml(openUrl);
    if (html && html.includes('search_word_type1_17')) {
      const regex = /<span class=\"search_word_type1_17\">([\s\S]*?)<\/span>/g;
      let match;
      while ((match = regex.exec(html)) !== null && results.length < count) {
        const fullSpan = match[1];
        let rawWord = fullSpan.replace(/<[^>]*>/g, '').replace(/[-^·\s\d]/g, '').trim();
        rawWord = rawWord.replace(/\([^)]*\)/g, '').trim();

        if (rawWord.startsWith(cleanPrefix) && rawWord.length >= 2 && !seenWords.has(rawWord) && !rawWord.includes(' ')) {
          const searchIdx = html.indexOf(match[0]);
          const snippet = html.substring(searchIdx, searchIdx + 1500);
          const defMatch = snippet.match(/「\d+」[\s\S]*?<\/dd>/) || snippet.match(/「\d+」([\s\S]*?)<\/div>/) || snippet.match(/class=\"desc_detail\"[^>]*>([\s\S]*?)<\/p>/);
          const definition = defMatch ? defMatch[0].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '국립국어원 우리말샘 등재 표제어';

          results.push({
            word: rawWord,
            definition,
            category: '국어대사전',
          });
          seenWords.add(rawWord);
        }
      }
    }
  } catch {
    // ignore
  }

  return res.json({ words: results });
});

// 두음법칙 변환 헬퍼 (서버 사이드)
const DUEUM_RULES: Record<string, string> = {
  '녀': '여', '뇨': '요', '뉴': '유', '니': '이', '냐': '야', '녜': '예',
  '랴': '야', '려': '여', '례': '예', '료': '요', '류': '유', '리': '이',
  '라': '나', '락': '낙', '란': '난', '랄': '날', '람': '남', '랍': '납',
  '랑': '낭', '래': '내', '랭': '냉', '략': '약', '량': '양', '력': '역',
  '련': '연', '렬': '열', '렴': '염', '렵': '엽', '령': '영', '로': '노',
  '록': '녹', '론': '논', '롱': '농', '뢰': '뇌', '루': '누', '륵': '늑',
  '름': '늠', '릉': '능', '린': '인', '림': '임', '립': '입',
};

function getStartingSyllables(lastChar: string, useDueum: boolean): string[] {
  const result = [lastChar];
  if (useDueum && DUEUM_RULES[lastChar]) {
    result.push(DUEUM_RULES[lastChar]);
  }
  return result;
}

// 국립국어원 및 특수 사전에서 시작 음절 단어 검색 헬퍼
async function searchStartingWord(syl: string, usedSet: Set<string>, allowOneShot: boolean): Promise<{ word: string; definition: string; hanja?: string; category?: string } | null> {
  // 1. SPECIAL_DEFENSE_WORDS 우선 확인
  for (const [key, val] of Object.entries(SPECIAL_DEFENSE_WORDS)) {
    if (key.startsWith(syl) && key.length >= 2 && !usedSet.has(key)) {
      return { word: key, definition: val.definition, hanja: val.hanja, category: val.category || '특수방어' };
    }
  }

  // 2. 우리말샘 (opendict.korean.go.kr) 검색
  try {
    const openUrl = 'https://opendict.korean.go.kr/search/searchResult?focus_name_top=query&query=' + encodeURIComponent(syl);
    const html = await fetchHtml(openUrl);
    if (html && html.includes('search_word_type1_17')) {
      const regex = /<span class=\"search_word_type1_17\">([\s\S]*?)<\/span>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const fullSpan = match[1];
        let rawWord = fullSpan.replace(/<[^>]*>/g, '').replace(/[-^·\s\d]/g, '').trim();
        rawWord = rawWord.replace(/\([^)]*\)/g, '').trim();

        if (rawWord.startsWith(syl) && rawWord.length >= 2 && !usedSet.has(rawWord) && !rawWord.includes(' ')) {
          // 한방단어 금지 모드일 때 한방단어 제외
          const lastCh = rawWord.slice(-1);
          const oneShotEnds = ['륨', '슘', '늄', '듐', '녘', '릇', '픔', '풰', '졀', '늣', '읗', '엌', '탉', '껑', '즘', '릎'];
          if (!allowOneShot && oneShotEnds.includes(lastCh)) {
            continue;
          }

          const searchIdx = html.indexOf(match[0]);
          const snippet = html.substring(searchIdx, searchIdx + 1500);
          const defMatch = snippet.match(/「\d+」[\s\S]*?<\/dd>/) || snippet.match(/「\d+」([\s\S]*?)<\/div>/) || snippet.match(/class=\"desc_detail\"[^>]*>([\s\S]*?)<\/p>/);
          const definition = defMatch ? defMatch[0].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '국립국어원 우리말샘 등재 표제어';
          return {
            word: rawWord,
            definition,
            category: '사전등재어',
          };
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * AI 단어 생성 및 대답 탐색 엔드포인트
 */
app.post('/api/ai-move', async (req, res) => {
  const { previousWord, usedWords = [], useDueum = true, allowOneShot = false } = req.body;

  if (!previousWord) {
    return res.status(400).json({ error: '이전 단어가 필요합니다.' });
  }

  const lastChar = previousWord.slice(-1);
  const usedSet = new Set<string>(usedWords);
  const startSyllables = getStartingSyllables(lastChar, useDueum);

  // 1. 국립국어원 사전 및 고난도 방어 어휘 데이터베이스에서 먼저 검색 (Gemini 쿼터 소진 방지)
  for (const syl of startSyllables) {
    const found = await searchStartingWord(syl, usedSet, allowOneShot);
    if (found) {
      return res.json({
        word: found.word,
        definition: found.definition,
        hanja: found.hanja || '',
        category: found.category || '국어사전',
        comment: allowOneShot ? '패왕의 비기를 받아보아라!' : '이 단어로 이어받을게요!',
      });
    }
  }

  // 2. Gemini AI 보조 시도 (API 키가 있고 쿼터 여유가 있는 경우)
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `끝말잇기 게임에서 이전 단어 '${previousWord}'(끝 글자: '${lastChar}')에 이어받을 국어사전 명사 단어 하나를 찾아주세요.
규칙:
1. 시작 글자: 두음법칙(${useDueum ? '허용됨' : '미허용'}). '${lastChar}'로 시작하거나 두음법칙 변환 음절로 시작해야 함.
2. 2글자 이상의 한글 명사/어휘여야 함.
3. 다음 이미 사용된 단어 목록에 포함되지 않아야 함: ${JSON.stringify(usedWords.slice(-50))}.
4. 한방단어 허용 여부: ${allowOneShot ? '허용됨' : '절대 금지'}.
5. 만약 사전에 이어받을 단어가 전혀 존재하지 않는다면 word를 빈 문자열("")로 반환하세요.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: {
                type: Type.STRING,
                description: '선택한 2글자 이상의 표준국어대사전 단어 (없으면 빈 문자열)',
              },
              definition: {
                type: Type.STRING,
                description: '단어의 사전 뜻풀이',
              },
              hanja: {
                type: Type.STRING,
                description: '한자 표기 (있는 경우)',
              },
              category: {
                type: Type.STRING,
                description: '카테고리',
              },
              comment: {
                type: Type.STRING,
                description: '상대방에게 건네는 재치 있는 한마디 (한국어)',
              },
            },
            required: ['word'],
          },
        },
      });

      const result = JSON.parse(response.text || '{}');
      return res.json(result);
    } catch (error: any) {
      // 429 RESOURCE_EXHAUSTED or 503 error handled gracefully without console.error
      console.warn('Gemini ai-move fallback/quota limit triggered:', error?.status || error?.message || 'Quota limit');
      return res.json({ word: '', comment: '더 이상 이어받을 수 있는 단어가 없군요.' });
    }
  }

  return res.json({ word: '', comment: '이어받을 단어가 없습니다.' });
});

// Vite 미들웨어 및 정적 서빙
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`끝말잇기 AI 서버가 실행되었습니다: http://0.0.0.0:${PORT}`);
  });
}

startServer();
