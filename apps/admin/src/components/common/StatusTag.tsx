import StatusBadge from './StatusBadge';

export type ContentStatus = 'published' | 'draft' | 'archived' | string;

interface StatusTagProps {
  status: ContentStatus;
  label?: string;
}

/** Published / Draft / Archived holatlari uchun rangli Tag */
export default function StatusTag({ status, label }: StatusTagProps) {
  return <StatusBadge status={status} label={label} />;
}
