/**
 * Eshitish boʻsagʻasini topish tartibi (audiometriyadagi Hughson–Westlake usulining soddalashgan koʻrinishi).
 *
 * Qoida: ton eshitilsa, daraja 10 dB pasaytiriladi; eshitilmasa, 5 dB koʻtariladi.
 * Boʻsagʻa — koʻtarilish paytida ton kamida ikki marta (va urinishlarning kamida yarmida) eshitilgan eng past daraja.
 *
 * Darajalar dBFS da (0 dBFS — qurilma bera oladigan eng baland tovush). Bu modul faqat hisob-kitob:
 * tovush chiqarmaydi va brauzerga bogʻliq emas, shuning uchun alohida sinab koʻriladi.
 */

/** Tekshiriladigan chastotalar, audiometriyadagi tartibda: avval 1000 Gs, oxirida past chastota. */
export const TEST_FREQUENCIES = [1000, 2000, 4000, 500] as const;
export type TestFrequency = (typeof TEST_FREQUENCIES)[number];

export const LEVEL_MIN = -90; // eng past daraja (bundan pastda qurilma shovqini ustun keladi)
export const LEVEL_MAX = -10; // eng baland daraja (xavfsizlik chegarasi)
export const LEVEL_START = -40; // birinchi ton: aniq eshitiladigan, lekin baland emas
const STEP_DOWN = 10;
const STEP_UP = 5;
const FAST_STEP_DOWN = 20; // boshida boʻsagʻaga tezroq yaqinlashish uchun
const FAST_STEP_UP = 10;
const MAX_PRESENTATIONS = 22;

export type ProcedureOutcome =
  | 'threshold' // boʻsagʻa topildi
  | 'floor' // eng past darajada ham eshitildi
  | 'not-heard' // eng baland darajada ham eshitilmadi
  | 'unstable'; // javoblar bir-biriga zid, taxminiy qiymat olindi

export interface ProcedureState {
  level: number;
  /** descend: boshida tez pasayish; ascend: boshida eshitilmagani uchun koʻtarilish; bracket: asosiy qidiruv. */
  phase: 'descend' | 'ascend' | 'bracket';
  /** Hozirgi ton koʻtarilishdan keyin berilyaptimi (faqat shunday javoblar hisobga olinadi). */
  ascending: boolean;
  hits: Record<number, number>;
  tries: Record<number, number>;
  presentations: number;
  done: boolean;
  threshold: number | null;
  outcome: ProcedureOutcome | null;
}

export function createProcedure(): ProcedureState {
  return {
    level: LEVEL_START,
    phase: 'descend',
    ascending: false,
    hits: {},
    tries: {},
    presentations: 0,
    done: false,
    threshold: null,
    outcome: null,
  };
}

function finish(state: ProcedureState, threshold: number | null, outcome: ProcedureOutcome): ProcedureState {
  return { ...state, done: true, threshold, outcome };
}

/** Javoblar zid boʻlganda: koʻtarilishda kamida bir marta eshitilgan va urinishlarning yarmida tasdiqlangan eng past daraja. */
function bestGuess(state: ProcedureState): number | null {
  const levels = Object.keys(state.tries)
    .map(Number)
    .sort((a, b) => a - b);
  for (const level of levels) {
    const hits = state.hits[level] || 0;
    if (hits >= 1 && hits * 2 >= state.tries[level]) return level;
  }
  return null;
}

/**
 * Bitta ton berilgandan keyingi holat.
 * @param heard foydalanuvchi shu tonni eshitganini bildirdimi
 */
export function advance(prev: ProcedureState, heard: boolean): ProcedureState {
  if (prev.done) return prev;
  const state: ProcedureState = {
    ...prev,
    hits: { ...prev.hits },
    tries: { ...prev.tries },
    presentations: prev.presentations + 1,
  };
  const level = state.level;

  // Koʻtarilishdagi (yoki eng past darajadagi) javoblar hisobga olinadi.
  const counted = state.ascending || level === LEVEL_MIN;
  if (counted) {
    state.tries[level] = (state.tries[level] || 0) + 1;
    if (heard) state.hits[level] = (state.hits[level] || 0) + 1;
    const hits = state.hits[level] || 0;
    if (hits >= 2 && hits * 2 >= state.tries[level]) {
      return finish(state, level, level === LEVEL_MIN ? 'floor' : 'threshold');
    }
  }

  if (state.presentations >= MAX_PRESENTATIONS) {
    const guess = bestGuess(state);
    return guess === null ? finish(state, null, 'not-heard') : finish(state, guess, 'unstable');
  }

  if (heard) {
    if (state.phase === 'ascend') state.phase = 'bracket';
    const step = state.phase === 'descend' ? FAST_STEP_DOWN : STEP_DOWN;
    state.level = Math.max(LEVEL_MIN, level - step);
    state.ascending = false;
    return state;
  }

  // Eshitilmadi.
  if (state.phase === 'descend') {
    // Birinchi tonning oʻzi eshitilmagan boʻlsa, tezroq koʻtarilamiz; aks holda asosiy qidiruvga oʻtamiz.
    state.phase = state.presentations === 1 ? 'ascend' : 'bracket';
  }
  const step = state.phase === 'ascend' ? FAST_STEP_UP : STEP_UP;
  if (level >= LEVEL_MAX) {
    // Eng baland darajada ikki marta eshitilmasa, shu chastota "eshitilmadi" deb yoziladi.
    const misses = (state.tries[level] || 0) - (state.hits[level] || 0);
    if (misses >= 2) return finish(state, null, 'not-heard');
    state.ascending = true;
    return state;
  }
  state.level = Math.min(LEVEL_MAX, level + step);
  state.ascending = true;
  return state;
}
