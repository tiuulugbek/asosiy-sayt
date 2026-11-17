'use client';

/**
 * Onlayn eshitish testi.
 *
 * Oqim: kirish → tayyorgarlik → chap quloq (4 ta ton) → oʻng quloq (4 ta ton) → natija.
 * Har bir tonda foydalanuvchi surgichni yoki + / − tugmalarini ishlatib, tovushni zoʻrgʻa eshitadigan
 * darajaga keltiradi. Ton sof sinus, uzuq-uzuq, faqat tekshirilayotgan quloqqa beriladi
 * (lib/hearing-test/tone-player.ts). Natija tashxis emas: uch xulosadan biri koʻrsatiladi
 * (lib/hearing-test/interpret.ts). Hech qanday maʼlumot serverga yuborilmaydi.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, FileText, Headphones, Minus, Play, Plus, User, Volume2, VolumeX } from 'lucide-react';
import { getLocaleFromDOM } from '@/lib/locale-client';
import { TonePlayer, type Ear } from '@/lib/hearing-test/tone-player';
import { MAX_STEP, MIN_STEP, TEST_FREQUENCIES, levelForStep } from '@/lib/hearing-test/levels';
import { summarizeTest, type Conclusion, type EarResult, type TestSummary } from '@/lib/hearing-test/interpret';
import { EarArt, EarBackground, EarIcon, EarWaveArt } from './hearing-test-art';
import { toneTestTexts, type Headline } from './tone-test-texts';

type Step = 'intro' | 'setup' | 'ready' | 'tone' | 'results';

const CHECK_LEVEL_DB = -35;
const TONE_PULSES = 7; // har bir pogʻonada ton taxminan 4 soniya eshitiladi
const EARS: Ear[] = ['left', 'right'];
const blankSteps = (): number[] => TEST_FREQUENCIES.map(() => MIN_STEP);
const blankFlags = (): boolean[] => TEST_FREQUENCIES.map(() => false);

const conclusionColor: Record<Conclusion, string> = {
  'no-signs': '#16A34A',
  'check-recommended': '#F07E22',
  'check-needed': '#DC2626',
};

function Title({ parts, className = '' }: { parts: Headline; className?: string }) {
  return (
    <h1 className={`text-3xl font-light leading-tight text-foreground md:text-5xl ${className}`}>
      {parts[0]}
      <span className="font-bold text-brand-primary">{parts[1]}</span>
      {parts[2]}
    </h1>
  );
}

/** Natija koʻrsatkichi: yarim doira, belgi oʻrtacha darajaga qarab chapdan oʻngga suriladi. */
function Gauge({ average, conclusion, ear, label }: { average: number; conclusion: Conclusion; ear: string; label: string }) {
  const fraction = Math.max(0.04, Math.min(0.96, average / 80));
  const angle = Math.PI - fraction * Math.PI;
  const radius = 84;
  const cx = 110;
  const cy = 104;
  const arc = (from: number, to: number) => {
    const a0 = Math.PI - from * Math.PI;
    const a1 = Math.PI - to * Math.PI;
    return `M ${cx + radius * Math.cos(a0)} ${cy - radius * Math.sin(a0)} A ${radius} ${radius} 0 0 1 ${cx + radius * Math.cos(a1)} ${cy - radius * Math.sin(a1)}`;
  };
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 124" className="w-56 max-w-full" aria-hidden="true">
        <path d={arc(0, 1)} fill="none" stroke="#E5E7EB" strokeWidth="14" strokeLinecap="round" />
        <path d={arc(0, fraction)} fill="none" stroke={conclusionColor[conclusion]} strokeOpacity="0.35" strokeWidth="14" strokeLinecap="round" />
        <circle
          cx={cx + radius * Math.cos(angle)}
          cy={cy - radius * Math.sin(angle)}
          r="11"
          fill={conclusionColor[conclusion]}
          stroke="#FFFFFF"
          strokeWidth="4"
        />
      </svg>
      <p className="-mt-12 text-sm text-muted-foreground">{ear}</p>
      <p className="mt-1 max-w-[12rem] text-center text-base font-semibold text-foreground">{label}</p>
    </div>
  );
}

export default function ToneTest() {
  const [locale, setLocale] = useState<'uz' | 'ru'>('uz');
  const [step, setStep] = useState<Step>('intro');
  const [earIndex, setEarIndex] = useState(0);
  const [frequencyIndex, setFrequencyIndex] = useState(0);
  const [values, setValues] = useState<Record<Ear, number[]>>({ left: blankSteps(), right: blankSteps() });
  const [notHeard, setNotHeard] = useState<Record<Ear, boolean[]>>({ left: blankFlags(), right: blankFlags() });
  const [needMove, setNeedMove] = useState(false);
  const [checking, setChecking] = useState<Ear | null>(null);
  const [summary, setSummary] = useState<TestSummary | null>(null);

  const t = toneTestTexts[locale];
  const ear = EARS[earIndex];
  const frequency = TEST_FREQUENCIES[frequencyIndex];
  const value = values[ear][frequencyIndex];

  const sectionRef = useRef<HTMLElement | null>(null);
  const firstRender = useRef(true);
  const playerRef = useRef<TonePlayer | null>(null);
  const checkTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const getPlayer = useCallback(() => {
    if (!playerRef.current) playerRef.current = new TonePlayer();
    return playerRef.current;
  }, []);

  const stopCheck = useCallback(() => {
    checkTimers.current.forEach(clearTimeout);
    checkTimers.current = [];
    setChecking(null);
  }, []);

  useEffect(() => {
    setLocale(getLocaleFromDOM() === 'ru' ? 'ru' : 'uz');
    return () => {
      checkTimers.current.forEach(clearTimeout);
      playerRef.current?.close();
      playerRef.current = null;
    };
  }, []);

  // Har bir yangi ekranda sahifa test boshiga qaytadi va oldingi tovush toʻxtaydi.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    playerRef.current?.stop();
    sectionRef.current?.scrollIntoView({ block: 'start' });
  }, [step, earIndex, frequencyIndex]);

  // ---- Tovush ---------------------------------------------------------------

  const playStep = useCallback(
    async (stepValue: number, toneEar: Ear, toneFrequency: number) => {
      const player = getPlayer();
      const level = levelForStep(stepValue);
      if (level === null) {
        player.stop();
        return;
      }
      await player.unlock();
      player.play({ frequency: toneFrequency, levelDb: level, ear: toneEar, pulses: TONE_PULSES, pulseMs: 350, gapMs: 250 });
    },
    [getPlayer],
  );

  const changeValue = (next: number) => {
    const clamped = Math.max(MIN_STEP, Math.min(MAX_STEP, next));
    setNeedMove(false);
    setValues((prev) => ({ ...prev, [ear]: prev[ear].map((v, i) => (i === frequencyIndex ? clamped : v)) }));
    setNotHeard((prev) => ({ ...prev, [ear]: prev[ear].map((v, i) => (i === frequencyIndex ? false : v)) }));
    void playStep(clamped, ear, frequency);
  };

  const runHeadphoneCheck = async () => {
    stopCheck();
    const player = getPlayer();
    await player.unlock();
    const play = (side: Ear) => {
      setChecking(side);
      player.play({ frequency: 1000, levelDb: CHECK_LEVEL_DB, ear: side, pulses: 3, pulseMs: 400, gapMs: 200 });
    };
    play('left');
    checkTimers.current = [setTimeout(() => play('right'), 2400), setTimeout(() => setChecking(null), 4600)];
  };

  // ---- Qadamlar -------------------------------------------------------------

  const finish = (flags: Record<Ear, boolean[]>) => {
    const toResult = (side: Ear): EarResult => ({
      frequencies: TEST_FREQUENCIES.map((f, i) => ({
        frequency: f,
        threshold: flags[side][i] ? null : levelForStep(values[side][i]),
      })),
    });
    setSummary(summarizeTest(toResult('left'), toResult('right')));
    setStep('results');
  };

  const advanceTone = (flags: Record<Ear, boolean[]>) => {
    setNeedMove(false);
    if (frequencyIndex < TEST_FREQUENCIES.length - 1) {
      setFrequencyIndex(frequencyIndex + 1);
    } else if (earIndex < EARS.length - 1) {
      setEarIndex(earIndex + 1);
      setFrequencyIndex(0);
      setStep('ready');
    } else {
      finish(flags);
    }
  };

  const next = () => {
    stopCheck();
    if (step === 'intro') setStep('setup');
    else if (step === 'setup') {
      setEarIndex(0);
      setFrequencyIndex(0);
      setStep('ready');
    } else if (step === 'ready') setStep('tone');
    else if (step === 'tone') {
      if (value === MIN_STEP) {
        setNeedMove(true);
        return;
      }
      advanceTone(notHeard);
    }
  };

  const markNotHeard = () => {
    const flags = { ...notHeard, [ear]: notHeard[ear].map((v, i) => (i === frequencyIndex ? true : v)) };
    setNotHeard(flags);
    advanceTone(flags);
  };

  const back = () => {
    stopCheck();
    setNeedMove(false);
    if (step === 'setup') setStep('intro');
    else if (step === 'ready') {
      if (earIndex === 0) setStep('setup');
      else {
        setEarIndex(earIndex - 1);
        setFrequencyIndex(TEST_FREQUENCIES.length - 1);
        setStep('tone');
      }
    } else if (step === 'tone') {
      if (frequencyIndex > 0) setFrequencyIndex(frequencyIndex - 1);
      else setStep('ready');
    }
  };

  const restart = () => {
    setValues({ left: blankSteps(), right: blankSteps() });
    setNotHeard({ left: blankFlags(), right: blankFlags() });
    setSummary(null);
    setEarIndex(0);
    setFrequencyIndex(0);
    setStep('intro');
  };

  // ---- Koʻrinish ------------------------------------------------------------

  const stage = step === 'intro' || step === 'setup' ? 0 : step === 'results' ? 3 : earIndex + 1;
  const stages = [
    { label: t.stages.intro, icon: <User className="h-5 w-5" /> },
    { label: t.stages.left, icon: <EarIcon className="h-5 w-5" /> },
    { label: t.stages.right, icon: <EarIcon className="h-5 w-5 -scale-x-100" /> },
    { label: t.stages.results, icon: <FileText className="h-5 w-5" /> },
  ];

  const primaryButton =
    'inline-flex items-center justify-center rounded-full bg-brand-primary px-8 py-3 text-base font-semibold text-white transition hover:opacity-90';
  const secondaryButton =
    'inline-flex items-center justify-center rounded-full border border-foreground/30 bg-white px-8 py-3 text-base font-medium text-foreground transition hover:border-foreground/60';
  const roundButton =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white transition hover:opacity-90 disabled:opacity-30';

  const setupIcons = [
    <VolumeX key="quiet" className="h-9 w-9" strokeWidth={1.5} />,
    <Volume2 key="volume" className="h-9 w-9" strokeWidth={1.5} />,
    <Headphones key="headphones" className="h-9 w-9" strokeWidth={1.5} />,
  ];
  const sliderPercent = ((value - MIN_STEP) / (MAX_STEP - MIN_STEP)) * 100;

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-5xl scroll-mt-32 overflow-hidden bg-gradient-to-br from-[#F6F5FB] to-white px-5 pb-10 pt-8 md:my-8 md:rounded-3xl md:px-12 md:pb-12 md:pt-10"
    >
      {(step === 'intro' || step === 'ready') && (
        <EarBackground className="pointer-events-none absolute -right-10 top-10 hidden h-[34rem] text-brand-accent/[0.06] md:block" />
      )}

      {/* Bosqichlar */}
      <ol className="relative flex items-start">
        {stages.map((item, index) => (
          <li key={item.label} className="flex items-start">
            <div className="flex w-16 flex-col items-center md:w-24">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  index < stage
                    ? 'border-brand-accent bg-brand-accent text-white'
                    : index === stage
                      ? 'border-brand-primary bg-white text-brand-primary'
                      : 'border-foreground/20 bg-white text-foreground/30'
                }`}
              >
                {index < stage ? <Check className="h-5 w-5" /> : item.icon}
              </span>
              <span className={`mt-2 text-center text-[11px] font-semibold md:text-xs ${index === stage ? 'text-foreground' : 'text-foreground/40'}`}>
                {item.label}
              </span>
            </div>
            {index < stages.length - 1 && (
              <span className={`mt-5 h-0.5 w-4 md:w-12 ${index < stage ? 'bg-brand-accent' : 'bg-foreground/15'}`} aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>

      <div className="relative mt-10 min-h-[22rem] md:mt-16">
        {step === 'intro' && (
          <div className="max-w-2xl">
            <Title parts={t.intro.title} />
            <p className="mt-6 text-base leading-relaxed text-foreground/80 md:text-lg">{t.intro.disclaimer}</p>
            <p className="mt-4 text-base leading-relaxed text-foreground/80 md:text-lg">{t.intro.privacy}</p>
          </div>
        )}

        {step === 'setup' && (
          <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
            <Title parts={t.setup.title} className="md:text-4xl" />
            <div>
              <ol className="space-y-6">
                {t.setup.items.map((item, index) => (
                  <li key={item.title} className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-foreground">{item.title}</p>
                      <p className="text-base text-foreground/70">{item.text}</p>
                      {index === 1 && <p className="mt-1 text-sm text-muted-foreground">{t.setup.iphone}</p>}
                      {index === 2 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={runHeadphoneCheck}
                            className="inline-flex items-center gap-2 rounded-full border border-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent transition hover:bg-brand-accent/5"
                          >
                            <Play className="h-4 w-4" fill="currentColor" />
                            {t.setup.check}
                          </button>
                          <div className="mt-3 flex gap-2" aria-live="polite">
                            {EARS.map((side) => (
                              <span
                                key={side}
                                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                  checking === side ? 'bg-brand-primary text-white' : 'bg-foreground/5 text-foreground/50'
                                }`}
                              >
                                {t.tone.ear[side]}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{t.setup.checkHint}</p>
                        </div>
                      )}
                    </div>
                    <span className="hidden text-brand-accent sm:block">{setupIcons[index]}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm text-muted-foreground">{t.setup.note}</p>
            </div>
          </div>
        )}

        {step === 'ready' && (
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-16 md:pl-12 md:pt-8">
            <div>
              <p className="text-base text-foreground/70">{t.ready[ear].kicker}</p>
              <Title parts={t.ready[ear].title} className="mt-2 max-w-md" />
            </div>
            {ear === 'left' ? (
              <EarWaveArt className="h-36 w-auto self-center md:h-44" />
            ) : (
              <EarArt className="h-36 w-auto -scale-x-100 self-center md:h-44" />
            )}
          </div>
        )}

        {step === 'tone' && (
          <div className="text-center">
            <Title parts={t.tone.title} className="mx-auto max-w-3xl md:text-4xl" />
            <p className="mx-auto mt-4 max-w-xl text-base text-foreground/70">{t.tone.subtitle}</p>

            <p className="mt-10 text-base font-semibold text-foreground">
              {t.tone.ear[ear]} · {frequency} {t.tone.hz}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({frequencyIndex + 1}/{TEST_FREQUENCIES.length})
              </span>
            </p>

            <div className="mx-auto mt-5 flex max-w-2xl items-center gap-3 md:gap-5">
              <button type="button" className={roundButton} onClick={() => changeValue(value - 1)} disabled={value <= MIN_STEP} aria-label={t.tone.quieter}>
                <Minus className="h-6 w-6" />
              </button>
              <div className="relative h-12 flex-1">
                <div className="absolute inset-x-5 top-1/2 h-2 -translate-y-1/2 rounded-full bg-foreground/10" />
                <div className="absolute inset-x-5 top-1/2 -translate-y-1/2">
                  <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${sliderPercent}%` }} />
                </div>
                <div className="absolute inset-x-5 top-1/2">
                  <div
                    className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-brand-primary bg-white text-sm font-bold text-foreground shadow"
                    style={{ left: `${sliderPercent}%` }}
                  >
                    {value}
                  </div>
                </div>
                <input
                  type="range"
                  min={MIN_STEP}
                  max={MAX_STEP}
                  step={1}
                  value={value}
                  onChange={(event) => changeValue(Number(event.target.value))}
                  aria-label={t.tone.slider}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <button type="button" className={roundButton} onClick={() => changeValue(value + 1)} disabled={value >= MAX_STEP} aria-label={t.tone.louder}>
                <Plus className="h-6 w-6" />
              </button>
            </div>

            <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">{t.tone.hint}</p>
            <div className="mt-3 min-h-[2.5rem]">
              {value > MIN_STEP && (
                <button
                  type="button"
                  onClick={() => void playStep(value, ear, frequency)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline"
                >
                  <Play className="h-4 w-4" fill="currentColor" />
                  {t.tone.replay}
                </button>
              )}
              {needMove && (
                <p className="mx-auto max-w-md rounded-lg bg-brand-primary/10 px-4 py-2 text-sm text-foreground" role="status">
                  {t.tone.needMove}
                </p>
              )}
            </div>
            {value === MAX_STEP && (
              <button type="button" onClick={markNotHeard} className="mt-2 text-sm font-medium text-foreground/70 underline underline-offset-2 hover:text-foreground">
                {t.tone.notHeard}
              </button>
            )}
          </div>
        )}

        {step === 'results' && summary && (
          <div className="text-center">
            <Title parts={t.results.titles[summary.conclusion]} className="mx-auto max-w-3xl md:text-4xl" />
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/80">{t.results.bodies[summary.conclusion]}</p>

            <div className="mx-auto mt-8 grid max-w-xl gap-8 sm:grid-cols-2">
              {EARS.map((side) => (
                <Gauge
                  key={side}
                  average={summary[side].average}
                  conclusion={summary[side].conclusion}
                  ear={t.tone.ear[side]}
                  label={t.results.earLabels[summary[side].conclusion]}
                />
              ))}
            </div>
            {summary.asymmetry && <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-foreground/80">{t.results.asymmetry}</p>}

            <div className="mx-auto mt-10 grid max-w-3xl overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-foreground/10 md:grid-cols-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://a.acoustic.uz/uploads/maqola-keksalar-moslama-korsatish.webp"
                alt=""
                className="h-48 w-full object-cover md:h-full"
                loading="lazy"
              />
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground">{t.results.cardTitle}</h2>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{t.results.cardText}</p>
                <div className="mt-5 flex flex-col gap-3">
                  <a href="tel:1385" className={primaryButton}>
                    {t.results.call}
                  </a>
                  <Link href="/branches" className={secondaryButton}>
                    {t.results.branches}
                  </Link>
                </div>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {t.results.or}{' '}
                  <a href="tel:+998712021441" className="font-semibold text-foreground hover:underline">
                    71 202 14 41
                  </a>
                </p>
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">{t.results.disclaimer}</p>
            <p className="mt-2 text-sm font-medium text-foreground">{t.results.volumeReminder}</p>
            <button type="button" onClick={restart} className="mt-6 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
              {t.results.restart}
            </button>
          </div>
        )}
      </div>

      {step !== 'results' && (
        <div className="relative mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {step !== 'intro' && (
            <button type="button" className={secondaryButton} onClick={back}>
              {t.back}
            </button>
          )}
          <button type="button" className={primaryButton} onClick={next}>
            {t.next}
          </button>
        </div>
      )}
    </section>
  );
}
