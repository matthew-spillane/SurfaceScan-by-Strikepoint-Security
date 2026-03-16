import { getRiskColor } from '../utils/riskColors';

function Section({ title, children }) {
  return (
    <div className="mb-3">
      <div className="text-xs tracking-widest uppercase mb-1.5 px-4"
        style={{ color: '#484f58', letterSpacing: '0.1em' }}>
        {title}
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

function Tag({ children, color = '#8b949e' }) {
  return (
    <span className="font-mono text-xs px-1.5 py-0.5 rounded-sm mr-1 mb-1 inline-block"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

export default function AssetDetail({ asset, summary }) {
  if (!asset) {
    return (
      <div className="p-4">
        <div className="text-xs tracking-widest uppercase mb-4"
          style={{ color: '#484f58' }}>
          SCAN SUMMARY
        </div>
        {summary ? (
          <div className="space-y-2 font-mono text-xs" style={{ color: '#8b949e' }}>
            <div>Subdomains: <span style={{ color: '#e6edf3' }}>{summary.total_subdomains}</span></div>
            <div>Unique IPs: <span style={{ color: '#e6edf3' }}>{summary.unique_ips}</span></div>
            <div>ASNs: <span style={{ color: '#e6edf3' }}>{summary.unique_asns}</span></div>
            <div>Open Ports: <span style={{ color: '#e6edf3' }}>{summary.total_open_ports}</span></div>
            <div>SSL Issues: <span style={{ color: '#f85149' }}>{summary.ssl_issues}</span></div>
            <div>High Risk: <span style={{ color: '#f85149' }}>{summary.high_risk_assets}</span></div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#484f58' }}>
            Select an asset to view details
          </p>
        )}
      </div>
    );
  }

  const riskColor = getRiskColor(asset.risk_level);

  return (
    <div className="py-3 text-xs" style={{ color: '#e6edf3' }}>
      {/* Header */}
      <div className="px-4 mb-3 pb-3" style={{ borderBottom: '1px solid #21262d' }}>
        <div className="font-mono text-sm font-bold truncate" style={{ color: '#58a6ff' }}>
          {asset.subdomain}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono" style={{ color: '#8b949e' }}>{asset.ip || '--'}</span>
          <span className="font-mono px-1.5 py-0.5 rounded-sm uppercase"
            style={{ color: riskColor, background: `${riskColor}15`, fontSize: '10px' }}>
            {asset.risk_level} ({asset.risk_score})
          </span>
        </div>
      </div>

      {/* Network */}
      <Section title="NETWORK">
        <div className="font-mono space-y-1" style={{ color: '#8b949e' }}>
          <div>ASN: <span style={{ color: '#e6edf3' }}>{asset.asn || '--'}</span></div>
          <div>ORG: <span style={{ color: '#e6edf3' }}>{asset.org || '--'}</span></div>
          <div>ISP: <span style={{ color: '#e6edf3' }}>{asset.isp || '--'}</span></div>
          <div>Location: <span style={{ color: '#e6edf3' }}>
            {[asset.city, asset.country].filter(Boolean).join(', ') || '--'}
          </span></div>
        </div>
      </Section>

      {/* Ports */}
      {asset.ports && asset.ports.length > 0 && (
        <Section title="OPEN PORTS">
          <div className="flex flex-wrap">
            {asset.ports.map((port) => (
              <Tag key={port} color={
                [21, 23, 3389, 445].includes(port) ? '#f85149' : '#58a6ff'
              }>
                {port}{asset.services?.[port] ? `/${asset.services[port]}` : ''}
              </Tag>
            ))}
          </div>
        </Section>
      )}

      {/* CVEs */}
      {asset.cves && asset.cves.length > 0 && (
        <Section title="CVEs">
          <div className="flex flex-wrap">
            {asset.cves.map((cve) => (
              <Tag key={cve} color="#f85149">{cve}</Tag>
            ))}
          </div>
        </Section>
      )}

      {/* Technologies */}
      {asset.technologies && asset.technologies.length > 0 && (
        <Section title="TECHNOLOGIES">
          <div className="flex flex-wrap">
            {asset.technologies.map((tech) => (
              <Tag key={tech} color="#d29922">{tech}</Tag>
            ))}
          </div>
        </Section>
      )}

      {/* SSL */}
      {asset.ssl && (
        <Section title="SSL CERTIFICATE">
          <div className="font-mono space-y-1" style={{ color: '#8b949e' }}>
            <div>Issuer: <span style={{ color: '#e6edf3' }}>{asset.ssl.issuer}</span></div>
            <div>Subject: <span style={{ color: '#e6edf3' }}>{asset.ssl.subject}</span></div>
            <div>Expires: <span style={{
              color: asset.ssl.expired ? '#f85149'
                : asset.ssl.days_remaining <= 30 ? '#d29922'
                : '#3fb950'
            }}>
              {asset.ssl.expires || '--'} ({asset.ssl.days_remaining}d)
            </span></div>
            <div>Valid: <span style={{
              color: asset.ssl.valid ? '#3fb950' : '#f85149'
            }}>
              {asset.ssl.valid ? 'YES' : 'NO'}
            </span></div>
          </div>
        </Section>
      )}

      {/* MX Records */}
      {asset.mx_records && asset.mx_records.length > 0 && (
        <Section title="MX RECORDS">
          <div className="font-mono space-y-1">
            {asset.mx_records.map((mx, i) => (
              <div key={i} style={{ color: '#8b949e' }}>
                <span style={{ color: '#58a6ff' }}>{mx.priority}</span>{' '}
                <span style={{ color: '#e6edf3' }}>{mx.exchange}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tags */}
      {asset.tags && asset.tags.length > 0 && (
        <Section title="TAGS">
          <div className="flex flex-wrap">
            {asset.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
