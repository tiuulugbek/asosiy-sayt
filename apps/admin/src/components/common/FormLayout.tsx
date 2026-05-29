import type { ReactNode } from 'react';

interface FormLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

/** 8+4 ustunli forma layout (mobile da stack) */
export default function FormLayout({ left, right }: FormLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">{left}</div>
      <div className="lg:col-span-4">{right}</div>
    </div>
  );
}

/** O'ng sidebar "Nashr" kartasi */
export function PublishCard({
  title = 'Nashr',
  children,
  footer,
}: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="admin-content-card sticky top-20 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
      {footer && <div className="mt-6 space-y-2 border-t border-[var(--admin-border)] pt-4">{footer}</div>}
    </div>
  );
}
