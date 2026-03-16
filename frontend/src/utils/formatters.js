export function formatTimestamp(isoString) {
  if (!isoString) return '--';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDuration(startIso) {
  if (!startIso) return '00:00';
  const start = new Date(startIso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - start) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
