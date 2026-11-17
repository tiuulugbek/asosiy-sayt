/**
 * Onlayn test chizmalari (Acoustic uchun chizilgan, oddiy chiziqli uslubda).
 *
 * Hozircha vaqtinchalik variantlar. Yakuniy chizmalar tayyor boʻlgach, shu fayldagi
 * komponentlar ichidagi <path> lar almashtiriladi; ularni ishlatadigan joylar oʻzgarmaydi.
 * Ranglar: asosiy chiziq — brand-accent (#3F3091), urgʻu — brand-primary (#F07E22).
 */
interface ArtProps {
  className?: string;
}

const EAR_OUTER =
  'M58 150c-22 0-34-18-34-34 0-18 12-24 12-40C36 40 56 14 86 14c28 0 46 22 46 48 0 20-12 30-22 40-9 9-12 16-14 28-2 12-16 20-38 20z';
const EAR_INNER = 'M64 78c-4-20 10-36 26-36 14 0 24 11 24 24 0 12-8 18-16 24-7 5-10 10-11 18';

/** Bosqichlar qatoridagi kichik quloq belgisi. */
export function EarIcon({ className }: ArtProps) {
  return (
    <svg viewBox="12 4 132 156" className={className} fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={EAR_OUTER} />
      <path d={EAR_INNER} />
    </svg>
  );
}

/** Quloq chizmasi (oʻng quloq ekrani uchun koʻzgu aksi ishlatiladi). */
export function EarArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 160 164" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={EAR_OUTER} stroke="#3F3091" strokeWidth="5" />
      <path d={EAR_INNER} stroke="#F07E22" strokeWidth="5" />
    </svg>
  );
}

/** Quloq va unga kelayotgan tovush toʻlqinlari. */
export function EarWaveArt({ className }: ArtProps) {
  const bars = [10, 22, 40, 62, 34, 54, 26, 44, 16];
  return (
    <svg viewBox="0 0 330 164" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {bars.map((height, index) => (
        <line key={index} x1={14 + index * 16} x2={14 + index * 16} y1={82 - height / 2} y2={82 + height / 2} stroke="#F07E22" strokeWidth="6" />
      ))}
      <g transform="translate(170 0)">
        <path d={EAR_OUTER} stroke="#3F3091" strokeWidth="5" />
        <path d={EAR_INNER} stroke="#3F3091" strokeWidth="5" />
      </g>
    </svg>
  );
}

/** Fon uchun katta, xira quloq chizmasi. */
export function EarBackground({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 160 164" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={EAR_OUTER} />
      <path d={EAR_INNER} />
    </svg>
  );
}
