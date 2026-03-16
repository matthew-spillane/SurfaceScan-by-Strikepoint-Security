import { useState } from 'react';
import { startScan } from '../api/client';

export default function SearchView({ onScanStarted }) {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const d = domain.trim();
    if (!d) return;
    setLoading(true);
    setError('');
    try {
      const res = await startScan(d);
      onScanStarted(res.scan_id, res.domain);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8"
      style={{ background: '#0d1117' }}>
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 flex items-center justify-center rounded-sm"
            style={{ background: '#161b22', border: '1px solid #30363d' }}>
            <span className="font-mono text-lg font-bold" style={{ color: '#58a6ff' }}>S</span>
          </div>
          <span className="font-mono text-sm tracking-widest uppercase"
            style={{ color: '#e6edf3' }}>
            SURFACESCAN
          </span>
        </div>
        <p className="text-xs tracking-widest uppercase mt-1"
          style={{ color: '#484f58' }}>
          STRIKEPOINT SECURITY
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="w-full" style={{ maxWidth: '680px' }}>
        <div className="flex items-center gap-0 rounded-sm overflow-hidden"
          style={{ border: '1px solid #30363d', background: '#0d1117' }}>
          <span className="font-mono text-sm pl-4 shrink-0 select-none"
            style={{ color: '#3fb950' }}>
            scan&gt;
          </span>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            spellCheck={false}
            autoFocus
            className="flex-1 font-mono text-base py-3 px-3 outline-none"
            style={{
              background: 'transparent',
              color: '#e6edf3',
              border: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !domain.trim()}
            className="font-mono text-xs tracking-widest uppercase px-6 py-3 shrink-0 cursor-pointer"
            style={{
              background: loading ? '#21262d' : '#161b22',
              color: loading ? '#484f58' : '#58a6ff',
              border: 'none',
              borderLeft: '1px solid #30363d',
            }}>
            {loading ? 'INITIATING...' : 'SCAN'}
          </button>
        </div>
        {error && (
          <p className="font-mono text-xs mt-2" style={{ color: '#f85149' }}>
            {error}
          </p>
        )}
      </form>

      {/* Hint text */}
      <p className="font-mono text-xs mt-6" style={{ color: '#484f58' }}>
        Enter a root domain to begin attack surface discovery
      </p>
    </div>
  );
}
