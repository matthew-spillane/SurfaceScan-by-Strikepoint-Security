import { useState, useEffect } from 'react';
import { formatTimestamp, formatDuration } from '../utils/formatters';

export default function TopBar({ scan, domain, onBack }) {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    if (!scan || scan.status !== 'running') return;
    const iv = setInterval(() => {
      setElapsed(formatDuration(scan.started_at));
    }, 1000);
    return () => clearInterval(iv);
  }, [scan]);

  // Final elapsed time for completed scans
  useEffect(() => {
    if (scan?.status === 'complete' && scan.started_at && scan.completed_at) {
      const start = new Date(scan.started_at).getTime();
      const end = new Date(scan.completed_at).getTime();
      const sec = Math.floor((end - start) / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      setElapsed(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
  }, [scan?.status, scan?.started_at, scan?.completed_at]);

  const isRunning = !scan || scan.status === 'running';
  const totalAssets = scan?.summary?.total_subdomains || 0;

  return (
    <div className="flex items-center justify-between px-4 shrink-0"
      style={{
        height: '48px',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
      }}>
      {/* Left side */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onBack}
          className="flex items-center gap-2 cursor-pointer"
          style={{ background: 'none', border: 'none', padding: 0 }}>
          <div className="w-7 h-7 flex items-center justify-center rounded-sm"
            style={{ background: '#0d1117', border: '1px solid #30363d' }}>
            <span className="font-mono text-sm font-bold" style={{ color: '#58a6ff' }}>S</span>
          </div>
          <span className="font-mono text-xs tracking-widest uppercase"
            style={{ color: '#e6edf3' }}>
            SURFACESCAN
          </span>
        </button>
        <span style={{ color: '#30363d' }}>|</span>
        <span className="font-mono text-sm truncate" style={{ color: '#58a6ff' }}>
          {domain}
        </span>
        {totalAssets > 0 && (
          <>
            <span style={{ color: '#30363d' }}>|</span>
            <span className="font-mono text-xs" style={{ color: '#8b949e' }}>
              {totalAssets} assets
            </span>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 shrink-0">
        <span className="font-mono text-xs" style={{ color: '#8b949e' }}>
          {elapsed}
        </span>
        <span className="font-mono text-xs tracking-widest uppercase px-2 py-0.5 rounded-sm"
          style={{
            background: isRunning ? 'rgba(88, 166, 255, 0.1)' : 'rgba(63, 185, 80, 0.1)',
            color: isRunning ? '#58a6ff' : '#3fb950',
            border: `1px solid ${isRunning ? 'rgba(88, 166, 255, 0.2)' : 'rgba(63, 185, 80, 0.2)'}`,
          }}>
          {isRunning ? 'SCANNING' : 'COMPLETE'}
        </span>
        <span className="font-mono text-xs" style={{ color: '#484f58' }}>
          {formatTimestamp(scan?.started_at)}
        </span>
      </div>
    </div>
  );
}
