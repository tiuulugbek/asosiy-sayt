/**
 * Test tovushlari: chastotalar va surgich pogʻonalari.
 *
 * Foydalanuvchi har bir chastotada surgichni tovushni "zoʻrgʻa eshitadigan" joygacha suradi.
 * Pogʻona 1 — jimlik. Qolgan pogʻonalar dBFS dagi darajalar (0 dBFS — qurilma bera oladigan eng baland tovush):
 * past darajalarda qadam 5 dB, yuqorida 10 dB.
 */
export const TEST_FREQUENCIES = [500, 1000, 2000, 4000] as const;
export type TestFrequency = (typeof TEST_FREQUENCIES)[number];

export const MIN_STEP = 1;
export const MAX_STEP = 12;

/** Pogʻona → daraja (dBFS). 1-pogʻona jim, shuning uchun null. */
export const STEP_LEVELS: ReadonlyArray<number | null> = [
  null, // 0 ishlatilmaydi
  null, // 1: jimlik
  -80,
  -75,
  -70,
  -65,
  -60,
  -55,
  -45,
  -40,
  -35,
  -25,
  -15,
];

/** Eng baland daraja (dBFS). */
export const LEVEL_MAX = -15;

export function levelForStep(step: number): number | null {
  return STEP_LEVELS[Math.max(MIN_STEP, Math.min(MAX_STEP, Math.round(step)))];
}
