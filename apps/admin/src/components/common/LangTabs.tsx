import { useState, type ReactNode } from 'react';

export type LangCode = 'uz' | 'ru' | 'en';

interface LangTabsProps {
  languages?: LangCode[];
  children: (lang: LangCode) => ReactNode;
  defaultLang?: LangCode;
}

const labels: Record<LangCode, string> = {
  uz: 'UZ',
  ru: 'RU',
  en: 'EN',
};

export default function LangTabs({
  languages = ['uz', 'ru'],
  children,
  defaultLang = 'uz',
}: LangTabsProps) {
  const [active, setActive] = useState<LangCode>(defaultLang);

  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-1">
        {languages.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActive(lang)}
            className={[
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              active === lang
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]',
            ].join(' ')}
          >
            {labels[lang]}
          </button>
        ))}
      </div>
      <div key={active}>{children(active)}</div>
    </div>
  );
}
