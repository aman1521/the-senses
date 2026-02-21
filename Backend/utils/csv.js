export function toCSV(rows){
  if(!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
  const lines = [headers.join(','), ...rows.map(r => headers.map(h=>escape(r[h])).join(','))];
  return lines.join('\n');
}
