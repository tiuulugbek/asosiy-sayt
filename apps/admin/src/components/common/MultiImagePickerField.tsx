import { useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import MediaLibraryModal from '../MediaLibraryModal';
import { normalizeImageUrl } from '../../utils/image';
import type { MediaDto } from '../../lib/api';

export interface GalleryItem {
  id: string;
  url?: string;
}

interface MultiImagePickerFieldProps {
  value?: GalleryItem[];
  onChange?: (items: GalleryItem[]) => void;
  max?: number;
}

export default function MultiImagePickerField({
  value = [],
  onChange,
  max = 8,
}: MultiImagePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (media: MediaDto) => {
    if (value.some((v) => v.id === media.id)) {
      setOpen(false);
      return;
    }
    if (value.length >= max) return;
    onChange?.([...value, { id: media.id, url: normalizeImageUrl(media.url) }]);
    setOpen(false);
  };

  const remove = (id: string) => onChange?.(value.filter((v) => v.id !== id));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <div key={item.id} className="relative h-20 w-[120px] overflow-hidden rounded-lg border border-[var(--admin-border)]">
            {item.url ? (
              <img src={item.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-50 text-xs text-gray-400">ID</div>
            )}
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white"
            >
              <CloseOutlined style={{ fontSize: 10 }} />
            </button>
          </div>
        ))}
        {value.length < max && (
          <Button type="dashed" className="h-20 w-[120px]" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Qo&apos;shish
          </Button>
        )}
      </div>
      <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
        {value.length}/{max} ta rasm
      </p>
      <MediaLibraryModal
        open={open}
        onCancel={() => setOpen(false)}
        onSelect={handleSelect}
        fileType="image"
        selectedMediaIds={value.map((v) => v.id)}
      />
    </div>
  );
}
