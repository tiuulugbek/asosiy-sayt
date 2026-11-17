'use client';

/**
 * Onlayn eshitish testi: audiometriyadagi kabi sof tonlar bilan.
 *
 * Har bir quloq alohida tekshiriladi. Har bir chastotada ton uzuq-uzuq beriladi; eshitilsa daraja
 * 10 dB pasayadi, eshitilmasa 5 dB koʻtariladi (lib/hearing-test/threshold-procedure.ts).
 * Natija tashxis emas: uch xil xulosadan biri koʻrsatiladi (lib/hearing-test/interpret.ts).
 * Hech qanday maʼlumot serverga yuborilmaydi.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getLocaleFromDOM } from '@/lib/locale-client';
import { TonePlayer, type Ear } from '@/lib/hearing-test/tone-player';
import {
  TEST_FREQUENCIES,
  advance,
  createProcedure,
  type ProcedureState,
} from '@/lib/hearing-test/threshold-procedure';
import {
  summarizeTest,
  type Conclusion,
  type EarResult,
  type TestSummary,
} from '@/lib/hearing-test/interpret';
import { toneTestTexts } from './tone-test-texts';

type Step = 'intro' | 'setup' | 'check' | 'instructions' | 'test' | 'next-ear' | 'results';
type CheckAnswer = 'left' | 'right' | 'both' | 'none';

const EAR_ORDER: Ear[] = ['right', 'left'];
const CHECK_LEVEL_DB = -35;
const MIN_GAP_MS = 900;
const MAX_GAP_MS = 2500;
const RESPONSE_AFTER_TONE_MS = 900; // ton tugagandan keyin ham javob qabul qilinadigan vaqt
const EARLY_PRESS_MS = 120; // ton boshlanishidan shuncha oldinroq bosilgan javob hisobga olinmaydi

const emptyEar = (): EarResult => ({ frequencies: [], falseAlarms: 0 });

const conclusionStyle: Record<Conclusion, string> = {
  'no-signs': 'text-green-700',
  'check-recommended': 'text-brand-primary',
  'check-needed': 'text-red-700',
};

export default function ToneTest() {
  const [locale, setLocale] = useState<'uz' | 'ru'>('uz');
  const [step, setStep] = useState<Step>('intro');
  const [checkEar, setCheckEar] = useState<Ear>('left');
  const [checkPlayed, setCheckPlayed] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [checkCanSkip, setCheckCanSkip] = useState(false);
  const [earIndex, setEarIndex] = useState(0);
  const [frequencyIndex, setFrequencyIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [summary, setSummary] = useState<TestSummary | null>(null);

  const t = toneTestTexts[locale];

  const sectionRef = useRef<HTMLElement | null>(null);
  const firstRender = useRef(true);
  const playerRef = useRef<TonePlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const run = useRef({
    procedure: createProcedure() as ProcedureState,
    earIndex: 0,
    frequencyIndex: 0,
    windowOpen: false,
    windowStart: 0,
    active: false,
    results: { left: emptyEar(), right: emptyEar() } as Record<Ear, EarResult>,
  });

  const getPlayer = useCallback(() => {
    if (!playerRef.current) playerRef.current = new TonePlayer();
    return playerRef.current;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setLocale(getLocaleFromDOM() === 'ru' ? 'ru' : 'uz');
    return () => {
      clearTimer();
      playerRef.current?.close();
      playerRef.current = null;
    };
  }, [clearTimer]);

  // Har bir yangi qadamda sahifa test boshiga qaytadi (yuqoridagi yopishqoq menyu ostida qolmasligi uchun).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    sectionRef.current?.scrollIntoView({ block: 'start' });
  }, [step, checkEar]);

  // ---- Test jarayoni -------------------------------------------------------

  const finishTest = useCallback(() => {
    const state = run.current;
    state.active = false;
    clearTimer();
    getPlayer().stop();
    setSummary(summarizeTest(state.results.left, state.results.right));
    setStep('results');
  }, [clearTimer, getPlayer]);

  const closeWindowRef = useRef<(heard: boolean) => void>(() => undefined);

  const present = useCallback(() => {
    const state = run.current;
    if (!state.active) return;
    const duration = getPlayer().play({
      frequency: TEST_FREQUENCIES[state.frequencyIndex],
      levelDb: state.procedure.level,
      ear: EAR_ORDER[state.earIndex],
    });
    state.windowOpen = true;
    state.windowStart = performance.now();
    timerRef.current = setTimeout(() => closeWindowRef.current(false), duration + RESPONSE_AFTER_TONE_MS);
  }, [getPlayer]);

  const scheduleNext = useCallback(
    (extraDelay = 0) => {
      clearTimer();
      const gap = MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS) + extraDelay;
      timerRef.current = setTimeout(present, gap);
    },
    [clearTimer, present],
  );

  const closeWindow = useCallback(
    (heard: boolean) => {
      const state = run.current;
      if (!state.active || !state.windowOpen) return;
      state.windowOpen = false;
      clearTimer();
      state.procedure = advance(state.procedure, heard);

      if (!state.procedure.done) {
        scheduleNext();
        return;
      }

      const ear = EAR_ORDER[state.earIndex];
      state.results[ear].frequencies.push({
        frequency: TEST_FREQUENCIES[state.frequencyIndex],
        threshold: state.procedure.threshold,
        outcome: state.procedure.outcome || 'unstable',
      });

      if (state.frequencyIndex < TEST_FREQUENCIES.length - 1) {
        state.frequencyIndex += 1;
        state.procedure = createProcedure();
        setFrequencyIndex(state.frequencyIndex);
        scheduleNext(600);
      } else if (state.earIndex < EAR_ORDER.length - 1) {
        state.active = false;
        state.earIndex += 1;
        state.frequencyIndex = 0;
        state.procedure = createProcedure();
        setEarIndex(state.earIndex);
        setFrequencyIndex(0);
        setStep('next-ear');
      } else {
        finishTest();
      }
    },
    [clearTimer, finishTest, scheduleNext],
  );
  closeWindowRef.current = closeWindow;

  const startEar = useCallback(async () => {
    await getPlayer().unlock();
    run.current.active = true;
    run.current.windowOpen = false;
    setPaused(false);
    setStep('test');
    scheduleNext(400);
  }, [getPlayer, scheduleNext]);

  const startTest = useCallback(async () => {
    run.current = {
      procedure: createProcedure(),
      earIndex: 0,
      frequencyIndex: 0,
      windowOpen: false,
      windowStart: 0,
      active: false,
      results: { left: emptyEar(), right: emptyEar() },
    };
    setEarIndex(0);
    setFrequencyIndex(0);
    setSummary(null);
    await startEar();
  }, [startEar]);

  const handleHeard = useCallback(() => {
    const state = run.current;
    if (!state.active) return;
    setPressed(true);
    setTimeout(() => setPressed(false), 150);

    if (state.windowOpen && performance.now() - state.windowStart >= EARLY_PRESS_MS) {
      getPlayer().stop();
      closeWindow(true);
      return;
    }
    // Ton yoʻq paytda bosildi: hisobga olinadi va keyingi ton biroz kechiktiriladi.
    state.results[EAR_ORDER[state.earIndex]].falseAlarms += 1;
    if (!state.windowOpen) scheduleNext(400);
  }, [closeWindow, getPlayer, scheduleNext]);

  const pauseTest = useCallback(() => {
    const state = run.current;
    if (!state.active) return;
    state.active = false;
    state.windowOpen = false;
    clearTimer();
    getPlayer().stop();
    setPaused(true);
  }, [clearTimer, getPlayer]);

  const resumeTest = useCallback(async () => {
    await getPlayer().unlock();
    run.current.active = true;
    setPaused(false);
    scheduleNext(400);
  }, [getPlayer, scheduleNext]);

  // Boʻsh joy (probel) tugmasi bilan javob berish; sahifa yashirilsa, test toʻxtab turadi.
  useEffect(() => {
    if (step !== 'test') return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        handleHeard();
      }
    };
    const onVisibility = () => {
      if (document.hidden) pauseTest();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [step, handleHeard, pauseTest]);

  // ---- Naushnikni tekshirish -----------------------------------------------

  const playCheckTone = async () => {
    const player = getPlayer();
    await player.unlock();
    player.play({ frequency: 1000, levelDb: CHECK_LEVEL_DB, ear: checkEar, pulses: 3 });
    setCheckPlayed(true);
  };

  const goToNextCheck = () => {
    setCheckMessage(null);
    setCheckCanSkip(false);
    setCheckPlayed(false);
    if (checkEar === 'left') {
      setCheckEar('right');
    } else {
      setStep('instructions');
    }
  };

  const answerCheck = (answer: CheckAnswer) => {
    getPlayer().stop();
    if (answer === checkEar) {
      goToNextCheck();
      return;
    }
    setCheckPlayed(false);
    setCheckCanSkip(answer === 'none');
    if (answer === 'both') setCheckMessage(t.check.bothMessage);
    else if (answer === 'none') setCheckMessage(t.check.noneMessage);
    else setCheckMessage(t.check.swapped);
  };

  const openCheck = () => {
    setCheckEar('left');
    setCheckPlayed(false);
    setCheckMessage(null);
    setCheckCanSkip(false);
    setStep('check');
  };

  // ---- Koʻrinish ------------------------------------------------------------

  const primaryButton =
    'inline-flex w-full items-center justify-center rounded-lg bg-brand-primary px-6 py-3 text-base font-semibold text-white transition hover:opacity-90 sm:w-auto';
  const secondaryButton =
    'inline-flex w-full items-center justify-center rounded-lg border-2 border-brand-primary px-6 py-3 text-base font-semibold text-brand-primary transition hover:bg-brand-primary/5 sm:w-auto';
  const choiceButton =
    'rounded-lg border-2 border-border bg-white px-4 py-3 text-base font-medium text-foreground transition hover:border-brand-primary';
  const backLink = 'mt-6 text-sm text-muted-foreground underline-offset-2 hover:underline';

  const currentEar = EAR_ORDER[earIndex];
  const totalTones = EAR_ORDER.length * TEST_FREQUENCIES.length;
  const doneTones = earIndex * TEST_FREQUENCIES.length + frequencyIndex;

  return (
    <section ref={sectionRef} className="mx-auto max-w-2xl scroll-mt-32 px-4 py-10 md:px-6 md:py-16">
      {step === 'intro' && (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.intro.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-foreground/90">{t.intro.lead}</p>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-base text-foreground/90">
            {t.intro.points.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-primary" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{t.intro.disclaimer}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.intro.privacy}</p>
          <div className="mt-8">
            <button type="button" className={primaryButton} onClick={() => setStep('setup')}>
              {t.intro.start}
            </button>
          </div>
        </div>
      )}

      {step === 'setup' && (
        <div>
          <h1 className="text-center text-2xl font-bold text-foreground md:text-3xl">{t.setup.title}</h1>
          <ol className="mt-6 space-y-4">
            {t.setup.steps.map((text, index) => (
              <li key={text} className="flex gap-4 rounded-lg border border-border p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-base leading-relaxed text-foreground/90">{text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">{t.setup.note}</p>
          <div className="mt-8 text-center">
            <button type="button" className={primaryButton} onClick={openCheck}>
              {t.setup.next}
            </button>
            <div>
              <button type="button" className={backLink} onClick={() => setStep('intro')}>
                {t.back}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'check' && (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.check.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{checkEar === 'left' ? '1 / 2' : '2 / 2'}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t.check.comfort}</p>
          <div className="mt-6">
            <button type="button" className={checkPlayed ? secondaryButton : primaryButton} onClick={playCheckTone}>
              {checkPlayed ? t.check.replay : t.check.play}
            </button>
          </div>
          {checkMessage && (
            <p className="mx-auto mt-6 max-w-md rounded-lg bg-brand-primary/10 p-4 text-left text-sm leading-relaxed text-foreground" role="status">
              {checkMessage}
            </p>
          )}
          {checkPlayed && (
            <div className="mt-8">
              <p className="text-base font-semibold text-foreground">{t.check.question}</p>
              <div className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-3">
                <button type="button" className={choiceButton} onClick={() => answerCheck('left')}>
                  {t.check.left}
                </button>
                <button type="button" className={choiceButton} onClick={() => answerCheck('right')}>
                  {t.check.right}
                </button>
                <button type="button" className={choiceButton} onClick={() => answerCheck('both')}>
                  {t.check.both}
                </button>
                <button type="button" className={choiceButton} onClick={() => answerCheck('none')}>
                  {t.check.none}
                </button>
              </div>
            </div>
          )}
          {checkCanSkip && (
            <div className="mt-6">
              <button type="button" className="text-sm font-medium text-brand-primary hover:underline" onClick={goToNextCheck}>
                {t.check.skipEar}
              </button>
            </div>
          )}
          <div>
            <button type="button" className={backLink} onClick={() => setStep('setup')}>
              {t.back}
            </button>
          </div>
        </div>
      )}

      {step === 'instructions' && (
        <div>
          <h1 className="text-center text-2xl font-bold text-foreground md:text-3xl">{t.instructions.title}</h1>
          <ul className="mt-6 space-y-3 text-base leading-relaxed text-foreground/90">
            {t.instructions.points.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-primary" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <button type="button" className={primaryButton} onClick={startTest}>
              {t.instructions.start}
            </button>
          </div>
        </div>
      )}

      {step === 'next-ear' && (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.test.nextEarTitle[currentEar]}</h1>
          <p className="mt-4 text-base leading-relaxed text-foreground/90">{t.test.nextEarText}</p>
          <div className="mt-8">
            <button type="button" className={primaryButton} onClick={startEar}>
              {t.test.continue}
            </button>
          </div>
        </div>
      )}

      {step === 'test' && (
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">{t.test.ear[currentEar]}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.test.tone} {doneTones + 1} {t.test.of} {totalTones}
          </p>
          <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full bg-brand-primary transition-all"
              style={{ width: `${Math.round((doneTones / totalTones) * 100)}%` }}
            />
          </div>

          {paused ? (
            <div className="mt-12">
              <p className="text-lg font-semibold text-foreground">{t.test.paused}</p>
              <div className="mt-6">
                <button type="button" className={primaryButton} onClick={resumeTest}>
                  {t.test.resume}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-12">
                <button
                  type="button"
                  onClick={handleHeard}
                  className={`mx-auto flex h-44 w-44 select-none items-center justify-center rounded-full text-xl font-bold text-white shadow-lg transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/40 ${
                    pressed ? 'scale-95 bg-brand-accent' : 'bg-brand-primary'
                  }`}
                >
                  {t.test.heard}
                </button>
              </div>
              <p className="mx-auto mt-8 max-w-sm text-sm leading-relaxed text-muted-foreground">{t.test.hint}</p>
              <button type="button" className={backLink} onClick={pauseTest}>
                {t.test.pause}
              </button>
            </>
          )}
        </div>
      )}

      {step === 'results' && summary && (
        <div className="text-center">
          <h1 className={`text-2xl font-bold md:text-3xl ${conclusionStyle[summary.conclusion]}`}>
            {t.results.titles[summary.conclusion]}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-foreground/90">{t.results.bodies[summary.conclusion]}</p>

          <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
            {(['right', 'left'] as Ear[]).map((ear) => (
              <div key={ear} className="rounded-lg border border-border p-4">
                <p className="text-sm font-semibold text-foreground">{t.test.ear[ear]}</p>
                <p className={`mt-1 text-sm ${conclusionStyle[summary[ear].conclusion]}`}>
                  {t.results.earLabels[summary[ear].conclusion]}
                </p>
              </div>
            ))}
          </div>

          {summary.asymmetry && (
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-foreground/90">{t.results.asymmetry}</p>
          )}
          {summary.lowReliability && (
            <p className="mx-auto mt-4 max-w-md rounded-lg bg-brand-primary/10 p-4 text-sm leading-relaxed text-foreground" role="status">
              {t.results.lowReliability}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="tel:1385" className={primaryButton}>
              {t.results.call}
            </a>
            <Link href="/branches" className={secondaryButton}>
              {t.results.branches}
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.results.or}{' '}
            <a href="tel:+998712021441" className="font-semibold text-foreground hover:underline">
              71 202 14 41
            </a>
          </p>

          <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">{t.results.disclaimer}</p>
          <p className="mt-2 text-sm font-medium text-foreground">{t.results.volumeReminder}</p>
          <button type="button" className={backLink} onClick={() => setStep('intro')}>
            {t.results.restart}
          </button>
        </div>
      )}
    </section>
  );
}
