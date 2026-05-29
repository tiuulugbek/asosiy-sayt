import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = "Ma'lumot topilmadi" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
        <Inbox className="text-slate-400" size={32} />
      </div>
      <p className="text-sm text-[var(--admin-text-muted)]">{message}</p>
    </div>
  );
}
