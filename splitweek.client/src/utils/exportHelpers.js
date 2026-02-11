export function downloadCsv(data, filename) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function scheduleHistoryToCsv(changes) {
  const headers = ['Date', 'Requested By', 'Status', 'Reason', 'Created At', 'Responded At'];
  const rows = changes.map((c) => [
    c.createdAt,
    c.requestedByName,
    c.status,
    c.reason || '',
    c.createdAt,
    c.respondedAt || '',
  ]);

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  return csv;
}
