import { useEffect, useRef } from 'react';

const LEVEL_COLORS = {
  info: '#e6edf3',
  discovery: '#e6edf3',
  resolve: '#58a6ff',
  enrich: '#d29922',
  error: '#f85149',
  success: '#3fb950',
};

export default function ScanConsole({ log, done }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  return (
    <div className="h-full flex flex-col overflow-hidden"
      style={{ background: '#0d1117' }}>
      {/* Console header */}
      <div className="flex items-center gap-2 px-4 py-2 shrink-0"
        style={{ borderBottom: '1px solid #21262d' }}>
        <div className="w-2 h-2 rounded-full"
          style={{ background: done ? '#3fb950' : '#d29922' }} />
        <span className="font-mono text-xs tracking-widest uppercase"
          style={{ color: '#484f58' }}>
          SCAN OUTPUT
        </span>
      </div>

      {/* Log lines */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed"
        style={{ color: '#8b949e' }}>
        {log.map((line, i) => (
          <div key={i} className="flex gap-2">
            <span style={{ color: '#3fb950' }}>
              [{line.timestamp}]
            </span>
            <span style={{ color: LEVEL_COLORS[line.level] || '#e6edf3' }}>
              {line.message}
            </span>
          </div>
        ))}
        {!done && log.length > 0 && (
          <div className="flex gap-2 mt-1">
            <span style={{ color: '#3fb950' }}>
              [{'...'}]
            </span>
            <span className="animate-pulse" style={{ color: '#484f58' }}>
              Scanning...
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
