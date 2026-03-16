const TILES = [
  { key: 'total_subdomains', label: 'SUBDOMAINS FOUND', color: '#58a6ff' },
  { key: 'unique_ips', label: 'UNIQUE IPs', color: '#58a6ff' },
  { key: 'unique_asns', label: 'UNIQUE ASNs', color: '#58a6ff' },
  { key: 'total_open_ports', label: 'OPEN PORTS DETECTED', color: '#d29922' },
  { key: 'ssl_issues', label: 'SSL ISSUES', color: '#f85149' },
  { key: 'high_risk_assets', label: 'HIGH RISK ASSETS', color: '#f85149' },
];

export default function MetricsStrip({ summary }) {
  return (
    <div className="grid shrink-0"
      style={{
        gridTemplateColumns: 'repeat(6, 1fr)',
        borderBottom: '1px solid #30363d',
        background: '#161b22',
      }}>
      {TILES.map((tile, i) => (
        <div key={tile.key} className="px-4 py-3"
          style={{
            borderRight: i < 5 ? '1px solid #21262d' : 'none',
          }}>
          <div className="font-mono text-2xl font-bold"
            style={{ color: tile.color }}>
            {summary?.[tile.key] ?? '--'}
          </div>
          <div className="text-xs tracking-widest uppercase mt-1"
            style={{ color: '#484f58', letterSpacing: '0.1em' }}>
            {tile.label}
          </div>
        </div>
      ))}
    </div>
  );
}
