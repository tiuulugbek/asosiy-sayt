/**
 * Onlayn test chizmalari (Acoustic uchun chizilgan, oddiy chiziqli uslubda).
 *
 * Yakuniy chizmalar: content/hearing-test/CHIZMALAR-TOPSHIRIQ.md. Asl SVG fayllar
 * apps/frontend/public/hearing-test/ papkasida; bu yerda ular inline qilingan, shunda
 * belgilar currentColor bilan sahifa rangini oladi va qoʻshimcha soʻrov ketmaydi.
 * Shakllar oʻsha fayllardagi bilan bir xil boʻlishi kerak.
 * Ranglar: asosiy chiziq — brand-accent (#3F3091), urgʻu — brand-primary (#F07E22).
 */
interface ArtProps {
  className?: string;
}

const PURPLE = '#3F3091';
const ORANGE = '#F07E22';

// Chap quloq, yon tomondan (viewBox 0 0 320 360). Oʻng quloq uchun koʻzgu aksi ishlatiladi.
const EAR_OUTER =
  'M120 214 C92 162 100 76 168 52 C238 28 290 92 274 156 C266 192 242 210 232 238 C222 270 220 304 190 318 C160 332 128 318 124 290';
const EAR_INNER =
  'M156 196 C138 150 160 106 204 110 C238 114 246 152 226 174 C212 190 196 192 194 214 C193 230 180 240 166 234';
const EAR_INNER_SIMPLE = 'M158 196 C142 150 166 110 206 114 C238 118 244 156 222 176';

// Kichik belgi uchun shu quloq 48x48 ga kichraytirilgan (public/hearing-test/belgi-quloq.svg).
const ICON_OUTER =
  'M19 28.2C15.5 21.8 16.5 11 25 8C33.8 5 40.2 13 38.2 21C37.2 25.5 34.2 27.8 33 31.2C31.8 35.2 31.5 39.5 27.8 41.2C24 43 20 41.2 19.5 37.8';
const ICON_INNER = 'M23.8 26C21.8 20.2 24.8 15.2 29.8 15.8C33.8 16.2 34.5 21 31.8 23.5';

const SOUND_WAVES = 'M70 86 Q140 196 70 306 M150 111 Q204 196 150 281 M220 134 Q260 196 220 258 M282 155 Q308 196 282 237';
const SPEAKER = 'M16 38 H30 L50 20 V76 L30 58 H16 Z';

/** Bosqichlar qatoridagi kichik quloq belgisi (rangi currentColor). */
export function EarIcon({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_OUTER} />
      <path d={ICON_INNER} />
    </svg>
  );
}

/** Quloq chizmasi (oʻng quloq ekrani uchun koʻzgu aksi ishlatiladi). */
export function EarArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 360" className={className} fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={EAR_OUTER} stroke={PURPLE} />
      <path d={EAR_INNER} stroke={ORANGE} />
    </svg>
  );
}

/** Quloq va unga kelayotgan tovush toʻlqinlari. */
export function EarWaveArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 640 360" className={className} fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={SOUND_WAVES} stroke={ORANGE} />
      <g transform="translate(300 0)" stroke={PURPLE}>
        <path d={EAR_OUTER} />
        <path d={EAR_INNER} />
      </g>
    </svg>
  );
}

/** Fon uchun katta, xira quloq chizmasi (rangi currentColor). */
export function EarBackground({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 360" className={className} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={EAR_OUTER} />
      <path d={EAR_INNER_SIMPLE} />
    </svg>
  );
}

/** "Tinch joy" belgisi: ustiga qiya chiziq tortilgan karnay. */
export function QuietPlaceIcon({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={`${SPEAKER} M62 38 C68 44 68 52 62 58`} stroke={PURPLE} />
      <path d="M14 14 L82 82" stroke={ORANGE} />
    </svg>
  );
}

/** "Ovozni eng yuqoriga qoʻying" belgisi: karnay va uchta toʻlqin. */
export function VolumeIcon({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={SPEAKER} stroke={PURPLE} />
      <path d="M60 40 C64 44 64 52 60 56 M68 32 C76 40 76 56 68 64 M76 24 C88 36 88 60 76 72" stroke={ORANGE} />
    </svg>
  );
}

/** Naushnik belgisi. */
export function HeadphonesIcon({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 56 V48 C18 24 32 12 48 12 C64 12 78 24 78 48 V56" stroke={PURPLE} />
      <rect x="12" y="52" width="18" height="30" rx="8" stroke={PURPLE} />
      <rect x="66" y="52" width="18" height="30" rx="8" stroke={PURPLE} />
      <path d="M21 62 V72 M75 62 V72" stroke={ORANGE} />
    </svg>
  );
}
