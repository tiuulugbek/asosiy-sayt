'use client';

import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface FloatingCTAProps {
  label: string;
  targetId?: string;
}

export default function FloatingCTA({ label, targetId = 'order-form' }: FloatingCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const formEl = document.getElementById(targetId);
      const formTop = formEl?.getBoundingClientRect().top ?? Infinity;
      setVisible(scrollY > 400 && formTop > 200);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetId]);

  const scrollToForm = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ animationDuration: '300ms' }}
    >
      <button
        onClick={scrollToForm}
        className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-emerald-700 hover:shadow-2xl active:scale-95"
        aria-label={label}
      >
        {label}
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
