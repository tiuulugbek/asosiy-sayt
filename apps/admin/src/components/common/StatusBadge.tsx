import { Tag } from 'antd';

const statusConfig: Record<string, { color: string; label: string }> = {
  published: { color: 'success', label: 'Chop etilgan' },
  draft: { color: 'warning', label: 'Draft' },
  archived: { color: 'default', label: 'Archived' },
  new: { color: 'processing', label: 'Yangi' },
  in_progress: { color: 'warning', label: "Ko'rildi" },
  completed: { color: 'success', label: 'Javob berildi' },
  cancelled: { color: 'error', label: 'Rad etildi' },
  pending: { color: 'warning', label: 'Kutilmoqda' },
  approved: { color: 'success', label: 'Tasdiqlangan' },
  rejected: { color: 'error', label: 'Rad etilgan' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? { color: 'default', label: status };
  return <Tag color={cfg.color}>{label ?? cfg.label}</Tag>;
}
