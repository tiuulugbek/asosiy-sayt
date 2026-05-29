import type { DoctorResponse } from '@/lib/api';

export function filterAndSortDoctors(
  doctors: DoctorResponse[],
  _locale: 'uz' | 'ru',
  options: {
    branchId?: string;
    query?: string;
  },
): DoctorResponse[] {
  const { branchId, query } = options;
  const q = (query || '').trim().toLowerCase();

  const list = doctors.filter((d) => {
    if (branchId) {
      const ids = d.branchIds ?? [];
      if (ids.length === 0) return false;
      if (!ids.includes(branchId)) return false;
    }
    if (!q) return true;
    const hay = [
      d.name_uz,
      d.name_ru,
      d.position_uz,
      d.position_ru,
      d.experience_uz,
      d.experience_ru,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });

  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
