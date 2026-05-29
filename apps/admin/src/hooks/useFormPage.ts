import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';

export function useFormPage(backPath: string, onSave: () => Promise<void>) {
  const navigate = useNavigate();

  const handleCancel = useCallback(() => {
    Modal.confirm({
      title: "O'zgarishlar saqlanmaydi",
      content: 'Chiqishni xohlaysizmi?',
      okText: 'Ha, chiqish',
      cancelText: 'Qolish',
      onOk: () => navigate(backPath),
    });
  }, [backPath, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave().catch(() => undefined);
      }
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSave, handleCancel]);

  return { handleCancel, navigate };
}
