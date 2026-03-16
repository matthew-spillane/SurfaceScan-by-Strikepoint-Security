import { useState, useMemo } from 'react';
import { getRiskColor } from '../utils/riskColors';

const TH = 'text-xs tracking-widest uppercase text-left px-3 py-2 font-normal';
const TD = 'font-mono text-xs px-3 py-1.5';

export default function AssetsTable({ assets }) {
  const [sortKey, setSortKey] = useState('risk_score');
  const [sortDir, setSortDir] = useState('desc');

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = useMemo(() => {
    return [...assets].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [assets, sortKey, sortDir]);

  const headers = [
    { key: 'subdomain', label: 'SUBDOMAIN' },
    { key: 'ip', label: 'IP' },
    { key: 'asn', label: 'ASN' },
    { key: 'country', label: 'COUNTRY' },
    { key: 'ports', label: 'PORTS' },
    { key: 'technologies', label: 'TECHNOLOGIES' },
    { key: 'risk_score', label: 'RISK' },
  ];

  return (
    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #21262d' }}>
          {headers.map(h => (
            <th key={h.key} className={TH}
              style={{ color: '#484f58', cursor: 'pointer' }}
              onClick={() => toggleSort(h.key)}>
              {h.label} {sortKey === h.key ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((a) => (
          <tr key={a.subdomain}
            style={{ borderBottom: '1px solid #161b22' }}
            className="hover:bg-[#161b22]">
            <td className={TD} style={{ color: '#e6edf3' }}>{a.subdomain}</td>
            <td className={TD} style={{ color: '#8b949e' }}>{a.ip || '--'}</td>
            <td className={TD} style={{ color: '#8b949e' }}>{a.asn || '--'}</td>
            <td className={TD} style={{ color: '#8b949e' }}>{a.country || '--'}</td>
            <td className={TD} style={{ color: '#58a6ff' }}>
              {a.ports?.length > 0 ? a.ports.join(', ') : '--'}
            </td>
            <td className={TD} style={{ color: '#d29922' }}>
              {a.technologies?.length > 0 ? a.technologies.join(', ') : '--'}
            </td>
            <td className={TD}>
              <span className="font-mono px-1.5 py-0.5 rounded-sm uppercase"
                style={{
                  color: getRiskColor(a.risk_level),
                  background: `${getRiskColor(a.risk_level)}15`,
                  fontSize: '10px',
                }}>
                {a.risk_score} {a.risk_level}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
