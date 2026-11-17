/**
 * Test natijasini izohlash.
 *
 * MUHIM: uydagi naushnik va telefon kalibrlanmagan, shuning uchun bu yerdagi dB qiymatlari taxminiy.
 * Natija tashxis emas: u faqat "tekshirtirish kerakmi" degan savolga yoʻnalish beradi.
 */
import type { ProcedureOutcome, TestFrequency } from './threshold-procedure';
import { LEVEL_MAX, TEST_FREQUENCIES } from './threshold-procedure';

/**
 * Faraz: qurilma ovozi maksimal boʻlganda 0 dBFS taxminan shu bosimni beradi (dB SPL).
 * Qurilma va naushnikka qarab ±10–15 dB farq qilishi mumkin.
 * Filialda audiometr natijasi bilan solishtirib, shu qiymat aniqlashtiriladi.
 */
export const FULL_SCALE_DB_SPL = 100;

/** Audiometrik naushniklar uchun etalon boʻsagʻa bosimi (ISO 389-1, TDH-39), dB SPL. */
const REFERENCE_THRESHOLD_SPL: Record<TestFrequency, number> = {
  500: 11.5,
  1000: 7,
  2000: 9,
  4000: 9.5,
};

export interface FrequencyResult {
  frequency: TestFrequency;
  /** Boʻsagʻa, dBFS. null — eng baland darajada ham eshitilmadi. */
  threshold: number | null;
  outcome: ProcedureOutcome;
}

export interface EarResult {
  frequencies: FrequencyResult[];
  /** Ton berilmagan paytda bosilgan tugmalar soni. */
  falseAlarms: number;
}

export type Conclusion = 'no-signs' | 'check-recommended' | 'check-needed';

export interface EarSummary {
  conclusion: Conclusion;
  /** Toʻrt chastota boʻyicha oʻrtacha taxminiy eshitish darajasi (dB). */
  average: number;
}

export interface TestSummary {
  left: EarSummary;
  right: EarSummary;
  conclusion: Conclusion;
  /** Quloqlar orasida sezilarli farq bor. */
  asymmetry: boolean;
  /** Javoblar barqaror emas: natijaga ehtiyotkorlik bilan qarash kerak. */
  lowReliability: boolean;
}

const NO_SIGNS_MAX_AVERAGE = 30;
const CHECK_NEEDED_MIN_AVERAGE = 50;
const SINGLE_FREQUENCY_FLAG = 45;
const ASYMMETRY_DB = 20;
const NOT_HEARD_PENALTY_DB = 10;

/** dBFS dagi boʻsagʻani taxminiy eshitish darajasiga (dB) aylantiradi. */
export function estimateHearingLevel(frequency: TestFrequency, threshold: number | null): number {
  const level = threshold === null ? LEVEL_MAX + NOT_HEARD_PENALTY_DB : threshold;
  return Math.max(0, FULL_SCALE_DB_SPL + level - REFERENCE_THRESHOLD_SPL[frequency]);
}

const ORDER: Conclusion[] = ['no-signs', 'check-recommended', 'check-needed'];
const worst = (a: Conclusion, b: Conclusion): Conclusion => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b);

export function summarizeEar(ear: EarResult): EarSummary {
  const levels = TEST_FREQUENCIES.map((frequency) => {
    const result = ear.frequencies.find((f) => f.frequency === frequency);
    return estimateHearingLevel(frequency, result ? result.threshold : null);
  });
  const average = levels.reduce((sum, value) => sum + value, 0) / levels.length;
  const notHeard = ear.frequencies.some((f) => f.outcome === 'not-heard');

  let conclusion: Conclusion = 'no-signs';
  if (average > NO_SIGNS_MAX_AVERAGE || levels.some((value) => value > SINGLE_FREQUENCY_FLAG)) {
    conclusion = 'check-recommended';
  }
  if (average > CHECK_NEEDED_MIN_AVERAGE || notHeard) {
    conclusion = 'check-needed';
  }
  return { conclusion, average: Math.round(average) };
}

export function summarizeTest(left: EarResult, right: EarResult): TestSummary {
  const leftSummary = summarizeEar(left);
  const rightSummary = summarizeEar(right);
  const asymmetry = Math.abs(leftSummary.average - rightSummary.average) >= ASYMMETRY_DB;

  let conclusion = worst(leftSummary.conclusion, rightSummary.conclusion);
  if (asymmetry) conclusion = worst(conclusion, 'check-recommended');

  const unstable = [...left.frequencies, ...right.frequencies].filter((f) => f.outcome === 'unstable').length;
  const lowReliability = unstable >= 2 || left.falseAlarms + right.falseAlarms >= 6;

  return { left: leftSummary, right: rightSummary, conclusion, asymmetry, lowReliability };
}
