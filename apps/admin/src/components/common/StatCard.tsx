import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; up?: boolean };
}

export default function StatCard({ icon, title, value, subtitle, trend }: StatCardProps) {
  return (
    <div className="admin-content-card p-5 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E3A5F]">
          {icon}
        </span>
        {trend && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${trend.up !== false ? 'text-[#10B981]' : 'text-[#EF4444]'}`}
          >
            {trend.up !== false ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--admin-text-muted)]">{title}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--admin-text)]">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-[var(--admin-text-muted)]">{subtitle}</p>}
    </div>
  );
}
