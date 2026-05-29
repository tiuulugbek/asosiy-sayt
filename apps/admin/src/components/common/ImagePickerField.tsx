import { useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined, PictureOutlined } from '@ant-design/icons';
import MediaLibraryModal from '../MediaLibraryModal';
import { normalizeImageUrl } from '../../utils/image';
import type { MediaDto } from '../../lib/api';

interface ImagePickerFieldProps {
  value?: string | null;
  previewUrl?: string | null;
  onChange?: (mediaId: string | undefined, url?: string) => void;
  hint?: string;
  aspectClass?: string;
}

export default function ImagePickerField({
  value,
  previewUrl,
  onChange,
  hint,
  aspectClass = 'aspect-[4/3]',
}: ImagePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(previewUrl ?? null);

  const displayUrl = previewUrl ?? localPreview;

  const handleSelect = (media: MediaDto) => {
    const url = normalizeImageUrl(media.url);
    setLocalPreview(url);
    onChange?.(media.id, url);
    setOpen(false);
  };

  const handleRemove = () => {
    setLocalPreview(null);
    onChange?.(undefined, undefined);
  };

  return (
    <div>
      <div className={`relative inline-block w-[120px] overflow-hidden rounded-lg border border-[var(--admin-border)] bg-slate-50 ${aspectClass}`}>
        {displayUrl ? (
          <>
            <img src={displayUrl} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-600"
              aria-label="Olib tashlash"
            >
              <CloseOutlined style={{ fontSize: 12 }} />
            </button>
          </>
        ) : (
          <div className="flex h-full min-h-[80px] flex-col items-center justify-center text-[var(--admin-text-muted)]">
            <PictureOutlined className="text-xl" />
          </div>
        )}
      </div>
      <Button type="default" size="small" className="mt-2" onClick={() => setOpen(true)}>
        Rasmni tanlash
      </Button>
      {hint && <p className="mt-1 text-xs text-[var(--admin-text-muted)]">{hint}</p>}
      {value && !displayUrl && (
        <p className="mt-1 text-xs text-[var(--admin-text-muted)]">Media tanlangan (ID: {value.slice(0, 8)}…)</p>
      )}
      <MediaLibraryModal
        open={open}
        onCancel={() => setOpen(false)}
        onSelect={handleSelect}
        fileType="image"
        selectedMediaIds={value ? [value] : []}
      />
    </div>
  );
}
