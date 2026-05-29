'use client';

import { useState, useEffect } from 'react';

function getEndDate(): Date {
  const now = new Date();
  const end = new Date(now.getFullYear(), 2, 21, 23, 59, 59, 999); // 21-mart 23:59:59
  return now > end ? new Date(now.getFullYear() + 1, 2, 21, 23, 59, 59, 999) : end;
}

interface RamazonCountdownProps {
  locale: 'uz' | 'ru';
}

export default function RamazonCountdown({ locale }: RamazonCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      const now = new Date();
      const end = getEndDate();
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  const labels = locale === 'ru'
    ? { prefix: 'До окончания скидки:', suffix: 'осталось', days: 'дн', hours: 'ч', minutes: 'мин', seconds: 'сек', expired: 'Скидка завершена' }
    : { prefix: 'Chegirma tugashiga:', suffix: 'qoldi', days: 'kun', hours: 'soat', minutes: 'daq', seconds: 'son', expired: 'Chegirma tugadi' };

  const expired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (!mounted) {
    return (
      <p className="mt-3 text-lg font-medium text-emerald-50 md:text-xl">
        {locale === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}
      </p>
    );
  }

  if (expired) {
    return (
      <p className="mt-3 text-lg font-medium text-emerald-50 md:text-xl">
        {labels.expired}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <span className="text-lg font-bold text-white drop-shadow-sm md:text-xl">
        {labels.prefix}
      </span>
      <div className="flex gap-2">
        <div className="flex min-w-[3rem] flex-col items-center rounded-lg bg-white/20 px-3 py-2 backdrop-blur-sm">
          <span className="text-xl font-bold text-white md:text-2xl">{timeLeft.days}</span>
          <span className="text-xs font-medium text-emerald-100">{labels.days}</span>
        </div>
        <div className="flex min-w-[3rem] flex-col items-center rounded-lg bg-white/20 px-3 py-2 backdrop-blur-sm">
          <span className="text-xl font-bold text-white md:text-2xl">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-xs font-medium text-emerald-100">{labels.hours}</span>
        </div>
        <div className="flex min-w-[3rem] flex-col items-center rounded-lg bg-white/20 px-3 py-2 backdrop-blur-sm">
          <span className="text-xl font-bold text-white md:text-2xl">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-xs font-medium text-emerald-100">{labels.minutes}</span>
        </div>
        <div className="flex min-w-[3rem] flex-col items-center rounded-lg bg-white/20 px-3 py-2 backdrop-blur-sm">
          <span className="text-xl font-bold text-white md:text-2xl">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-xs font-medium text-emerald-100">{labels.seconds}</span>
        </div>
      </div>
      <span className="text-lg font-bold text-white drop-shadow-sm md:text-xl">
        {labels.suffix}
      </span>
    </div>
  );
}
