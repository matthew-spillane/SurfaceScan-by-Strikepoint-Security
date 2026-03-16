import { useMemo } from 'react';

const TH = 'text-xs tracking-widest uppercase text-left px-3 py-2 font-normal';
const TD = 'font-mono text-xs px-3 py-1.5';

export default function CertificatesTable({ assets }) {
  const certs = useMemo(() => {
    return assets
      .filter((a) => a.ssl)
      .map((a) => ({
        subdomain: a.subdomain,
        issuer: a.ssl.issuer,
        subject: a.ssl.subject,
        expires: a.ssl.expires,
        days_remaining: a.ssl.days_remaining,
        expired: a.ssl.expired,
        valid: a.ssl.valid,
      }))
      .sort((a, b) => a.days_remaining - b.days_remaining);
  }, [assets]);

  function expiryColor(cert) {
    if (cert.expired) return '#f85149';
    if (cert.days_remaining <= 30) return '#f85149';
    if (cert.days_remaining <= 90) return '#d29922';
    return '#3fb950';
  }

  return (
    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #21262d' }}>
          <th className={TH} style={{ color: '#484f58' }}>SUBDOMAIN</th>
          <th className={TH} style={{ color: '#484f58' }}>ISSUER</th>
          <th className={TH} style={{ color: '#484f58' }}>SUBJECT</th>
          <th className={TH} style={{ color: '#484f58' }}>EXPIRES</th>
          <th className={TH} style={{ color: '#484f58' }}>DAYS LEFT</th>
          <th className={TH} style={{ color: '#484f58' }}>STATUS</th>
        </tr>
      </thead>
      <tbody>
        {certs.map((c) => (
          <tr key={c.subdomain} style={{ borderBottom: '1px solid #161b22' }}>
            <td className={TD} style={{ color: '#e6edf3' }}>{c.subdomain}</td>
            <td className={TD} style={{ color: '#8b949e' }}>{c.issuer}</td>
            <td className={TD} style={{ color: '#8b949e' }}>{c.subject}</td>
            <td className={TD} style={{ color: expiryColor(c) }}>{c.expires || '--'}</td>
            <td className={TD} style={{ color: expiryColor(c) }}>{c.days_remaining}</td>
            <td className={TD}>
              {c.expired ? (
                <span style={{ color: '#f85149' }}>EXPIRED</span>
              ) : c.valid ? (
                <span style={{ color: '#3fb950' }}>VALID</span>
              ) : (
                <span style={{ color: '#d29922' }}>INVALID</span>
              )}
            </td>
          </tr>
        ))}
        {certs.length === 0 && (
          <tr>
            <td colSpan={6} className={TD} style={{ color: '#484f58', textAlign: 'center' }}>
              No certificate data available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
