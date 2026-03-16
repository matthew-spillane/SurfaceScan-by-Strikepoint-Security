const API_BASE = import.meta.env.VITE_API_URL || '';

export async function startScan(domain) {
  const res = await fetch(`${API_BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Scan failed' }));
    throw new Error(err.detail || 'Scan failed');
  }
  return res.json();
}

export async function getScan(scanId) {
  const res = await fetch(`${API_BASE}/api/scan/${scanId}`);
  if (!res.ok) throw new Error('Failed to fetch scan');
  return res.json();
}

export async function getScanGraph(scanId) {
  const res = await fetch(`${API_BASE}/api/scan/${scanId}/graph`);
  if (!res.ok) throw new Error('Failed to fetch graph');
  return res.json();
}
