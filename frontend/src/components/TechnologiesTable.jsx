import { useMemo } from 'react';

const TH = 'text-xs tracking-widest uppercase text-left px-3 py-2 font-normal';
const TD = 'font-mono text-xs px-3 py-1.5';

export default function TechnologiesTable({ assets }) {
  const techData = useMemo(() => {
    const map = {};
    for (const a of assets) {
      for (const tech of (a.technologies || [])) {
        if (!map[tech]) {
          map[tech] = { name: tech, count: 0, hosts: [] };
        }
        map[tech].count++;
        if (map[tech].hosts.length < 5) {
          map[tech].hosts.push(a.subdomain);
        }
      }
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [assets]);

  return (
    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #21262d' }}>
          <th className={TH} style={{ color: '#484f58' }}>TECHNOLOGY</th>
          <th className={TH} style={{ color: '#484f58' }}>ASSETS USING</th>
          <th className={TH} style={{ color: '#484f58' }}>SAMPLE HOSTS</th>
        </tr>
      </thead>
      <tbody>
        {techData.map((t) => (
          <tr key={t.name} style={{ borderBottom: '1px solid #161b22' }}>
            <td className={TD} style={{ color: '#d29922' }}>{t.name}</td>
            <td className={TD} style={{ color: '#e6edf3' }}>{t.count}</td>
            <td className={TD} style={{ color: '#8b949e' }}>{t.hosts.join(', ')}</td>
          </tr>
        ))}
        {techData.length === 0 && (
          <tr>
            <td colSpan={3} className={TD} style={{ color: '#484f58', textAlign: 'center' }}>
              No technology data available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
