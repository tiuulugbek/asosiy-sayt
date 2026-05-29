import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  loading?: boolean;
  action?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, count, loading, action, actions }: PageHeaderProps) {
  const headerActions = actions ?? action;
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{description}</p>}
        {count != null && !loading && (
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{count} ta element topildi</p>
        )}
      </div>
      {headerActions && <div className="flex shrink-0 flex-wrap gap-2">{headerActions}</div>}
    </div>
  );
}
