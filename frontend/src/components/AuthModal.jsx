import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        onClose()
      } else {
        await signUp(email, password)
        setSuccess('Account created — check your email to confirm.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-lg p-8 relative"
        style={{
          background: '#161b22',
          border: '1px solid #30363d',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sm"
          style={{ color: '#8b949e' }}
        >
          ✕
        </button>

        {/* Logo / title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: '#f97316', fontSize: '18px', fontWeight: 700, letterSpacing: '0.05em' }}>
              STRIKEPOINT
            </span>
          </div>
          <p style={{ color: '#8b949e', fontSize: '12px', letterSpacing: '0.1em' }}>
            SURFACESCAN PLATFORM
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex mb-6" style={{ borderBottom: '1px solid #30363d' }}>
          {['login', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className="flex-1 pb-2 text-xs uppercase tracking-widest transition-colors"
              style={{
                color: mode === m ? '#e6edf3' : '#8b949e',
                borderBottom: mode === m ? '2px solid #f97316' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: '#8b949e', letterSpacing: '0.08em' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                color: '#e6edf3',
              }}
              placeholder="analyst@company.com"
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#8b949e', letterSpacing: '0.08em' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                color: '#e6edf3',
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded" style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(248,81,73,0.3)' }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs px-3 py-2 rounded" style={{ background: 'rgba(63,185,80,0.1)', color: '#3fb950', border: '1px solid rgba(63,185,80,0.3)' }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded text-sm font-semibold tracking-widest uppercase transition-opacity"
            style={{
              background: '#f97316',
              color: '#fff',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
