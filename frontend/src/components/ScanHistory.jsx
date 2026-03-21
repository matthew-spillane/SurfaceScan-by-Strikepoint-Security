import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getScanHistory } from '../api/client'

const RISK_COLORS = {
  Critical: '#f85149',
  High: '#db6d28',
  Medium: '#d29922',
  Low: '#3fb950',
}

function fmt(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ScanHistory({ onLoadScan }) {
  const { session } = useAuth()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) return
    setLoading(true)
    getScanHistory(session.access_token)
      .then(setScans)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [session])

  if (!session) {
    return (
      <p className="font-mono text-xs text-center mt-8" style={{ color: '#484f58' }}>
        Sign in to view scan history
      </p>
    )
  }

  if (loading) {
    return (
      <p className="font-mono text-xs text-center mt-8" style={{ color: '#484f58' }}>
        Loading history…
      </p>
    )
  }

  if (error) {
    return (
      <p className="font-mono text-xs text-center mt-8" style={{ color: '#f85149' }}>
        {error}
      </p>
    )
  }

  if (scans.length === 0) {
    return (
      <p className="font-mono text-xs text-center mt-8" style={{ color: '#484f58' }}>
        No scans yet — run your first scan above
      </p>
    )
  }

  return (
    <div className="w-full mt-6" style={{ maxWidth: '680px' }}>
      <p className="font-mono text-xs mb-3 tracking-widest uppercase" style={{ color: '#484f58' }}>
        Recent Scans
      </p>
      <div className="flex flex-col gap-2">
        {scans.map((s) => (
          <div
            key={s.id}
            onClick={() => onLoadScan && onLoadScan(s)}
            className="flex items-center justify-between px-4 py-3 rounded cursor-pointer transition-colors"
            style={{ background: '#161b22', border: '1px solid #30363d' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#484f58')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#30363d')}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm" style={{ color: '#e6edf3' }}>
                {s.domain}
              </span>
              <span className="font-mono text-xs" style={{ color: '#484f58' }}>
                {fmt(s.created_at)}
                {s.scan_duration_ms ? ` · ${(s.scan_duration_ms / 1000).toFixed(1)}s` : ''}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {s.subdomain_count > 0 && (
                <span className="font-mono text-xs" style={{ color: '#8b949e' }}>
                  {s.subdomain_count} hosts
                </span>
              )}
              {s.cve_count > 0 && (
                <span className="font-mono text-xs" style={{ color: '#f85149' }}>
                  {s.cve_count} CVEs
                </span>
              )}
              {s.risk_label && (
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded-sm"
                  style={{
                    color: RISK_COLORS[s.risk_label] ?? '#8b949e',
                    background: `${RISK_COLORS[s.risk_label] ?? '#8b949e'}18`,
                    border: `1px solid ${RISK_COLORS[s.risk_label] ?? '#8b949e'}40`,
                  }}
                >
                  {s.risk_label.toUpperCase()}
                </span>
              )}
              <span
                className="font-mono text-xs"
                style={{ color: s.status === 'complete' ? '#3fb950' : '#484f58' }}
              >
                {s.status?.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
