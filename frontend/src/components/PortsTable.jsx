import { useMemo } from 'react';

const TH = 'text-xs tracking-widest uppercase text-left px-3 py-2 font-normal';
const TD = 'font-mono text-xs px-3 py-1.5';

const PORT_SERVICES = {
  21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
  80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 445: 'SMB',
  465: 'SMTPS', 587: 'Submission', 993: 'IMAPS', 995: 'POP3S',
  1433: 'MSSQL', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL',
  5900: 'VNC', 6379: 'Redis', 8080: 'HTTP-Alt', 8443: 'HTTPS-Alt',
  9200: 'Elasticsearch', 27017: 'MongoDB',
};

const RISKY_PORTS = new Set([21, 23, 445, 3389, 5900, 27017, 6379, 9200]);

export default function PortsTable({ assets }) {
  const portData = useMemo(() => {
    const map = {};
    for (const a of assets) {
      for (const port of (a.ports || [])) {
        if (!map[port]) {
          map[port] = { port, service: PORT_SERVICES[port] || `port-${port}`, count: 0, hosts: [] };
        }
        map[port].count++;
        if (map[port].hosts.length < 5) {
          map[port].hosts.push(a.subdomain);
        }
      }
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [assets]);

  return (
    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #21262d' }}>
          <th className={TH} style={{ color: '#484f58' }}>PORT</th>
          <th className={TH} style={{ color: '#484f58' }}>SERVICE</th>
          <th className={TH} style={{ color: '#484f58' }}>ASSETS EXPOSED</th>
          <th className={TH} style={{ color: '#484f58' }}>RISK</th>
          <th className={TH} style={{ color: '#484f58' }}>SAMPLE HOSTS</th>
        </tr>
      </thead>
      <tbody>
        {portData.map((p) => (
          <tr key={p.port} style={{ borderBottom: '1px solid #161b22' }}>
            <td className={TD} style={{ color: '#58a6ff' }}>{p.port}</td>
            <td className={TD} style={{ color: '#e6edf3' }}>{p.service}</td>
            <td className={TD} style={{ color: '#e6edf3' }}>{p.count}</td>
            <td className={TD}>
              {RISKY_PORTS.has(p.port) ? (
                <span style={{ color: '#f85149' }}>HIGH</span>
              ) : (
                <span style={{ color: '#3fb950' }}>NORMAL</span>
              )}
            </td>
            <td className={TD} style={{ color: '#8b949e' }}>
              {p.hosts.join(', ')}
            </td>
          </tr>
        ))}
        {portData.length === 0 && (
          <tr>
            <td colSpan={5} className={TD} style={{ color: '#484f58', textAlign: 'center' }}>
              No port data available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
