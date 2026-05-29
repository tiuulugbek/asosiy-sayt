import type { LeadDto } from './api';

export function exportLeadsToCsv(leads: LeadDto[], filename = 'leads-export.csv') {
  const headers = ['ID', 'Ism', 'Telefon', 'Email', 'Manba', 'Holat', 'Sana', 'Xabar'];
  const rows = leads.map((l) => [
    l.id,
    l.name,
    l.phone,
    l.email ?? '',
    l.source ?? '',
    l.status ?? '',
    l.createdAt,
    (l.message ?? '').replace(/\n/g, ' '),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
