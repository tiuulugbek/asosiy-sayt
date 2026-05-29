import type { ReactNode } from 'react';
import { Button } from 'antd';
import { RotateCcw } from 'lucide-react';

interface FilterPanelProps {
  children: ReactNode;
  onClear?: () => void;
}

export default function FilterPanel({ children, onClear }: FilterPanelProps) {
  return (
    <div className="admin-content-card mb-4 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        {children}
        {onClear && (
          <Button icon={<RotateCcw size={14} />} onClick={onClear}>
            Tozalash
          </Button>
        )}
      </div>
    </div>
  );
}
