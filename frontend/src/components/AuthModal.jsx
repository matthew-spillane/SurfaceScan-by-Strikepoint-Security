import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  )
}

export default function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(null)
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

  const handleOAuth = async (provider) => {
    setError(null)
    setOauthLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    } catch (err) {
      setError(err.message)
      setOauthLoading(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm relative p-8"
        style={{
          background: '#0d1117',
          border: '1px solid #30363d',
          boxShadow: '0 0 0 1px #21262d, 0 32px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 font-mono text-xs"
          style={{ color: '#484f58', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>

        {/* Logo */}
        <div className="mb-7">
          <span className="font-mono font-bold" style={{ color: '#f97316', fontSize: '15px', letterSpacing: '0.12em' }}>
            STRIKEPOINT
          </span>
          <p className="font-mono mt-0.5" style={{ color: '#484f58', fontSize: '10px', letterSpacing: '0.15em' }}>
            SURFACESCAN PLATFORM
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex mb-6" style={{ borderBottom: '1px solid #21262d' }}>
          {[['login', 'Sign In'], ['signup', 'Create Account']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className="font-mono flex-1 pb-2 text-xs tracking-widest uppercase"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: mode === m ? '2px solid #f97316' : '2px solid transparent',
                marginBottom: '-1px',
                color: mode === m ? '#e6edf3' : '#484f58',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="font-mono block text-xs mb-1" style={{ color: '#484f58', letterSpacing: '0.1em' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="font-mono w-full px-3 py-2 text-sm outline-none"
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                color: '#e6edf3',
              }}
              placeholder="analyst@company.com"
            />
          </div>

          <div>
            <label className="font-mono block text-xs mb-1" style={{ color: '#484f58', letterSpacing: '0.1em' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="font-mono w-full px-3 py-2 text-sm outline-none"
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                color: '#e6edf3',
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-mono text-xs px-3 py-2" style={{ background: 'rgba(248,81,73,0.08)', color: '#f85149', border: '1px solid rgba(248,81,73,0.25)' }}>
              {error}
            </p>
          )}
          {success && (
            <p className="font-mono text-xs px-3 py-2" style={{ background: 'rgba(63,185,80,0.08)', color: '#3fb950', border: '1px solid rgba(63,185,80,0.25)' }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="font-mono w-full py-2 text-xs tracking-widest uppercase mt-1"
            style={{
              background: '#f97316',
              color: '#fff',
              border: 'none',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            {loading ? 'PLEASE WAIT…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* OAuth divider */}
        <div className="flex items-center gap-3 my-5">
          <div style={{ flex: 1, height: '1px', background: '#21262d' }} />
          <span className="font-mono text-xs" style={{ color: '#484f58', letterSpacing: '0.1em' }}>
            OR CONTINUE WITH
          </span>
          <div style={{ flex: 1, height: '1px', background: '#21262d' }} />
        </div>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
            className="font-mono flex items-center justify-center gap-3 w-full py-2 text-xs tracking-widest uppercase"
            style={{
              background: '#0d1117',
              border: '1px solid #30363d',
              color: oauthLoading === 'google' ? '#484f58' : '#8b949e',
              cursor: oauthLoading ? 'not-allowed' : 'pointer',
              opacity: oauthLoading && oauthLoading !== 'google' ? 0.5 : 1,
            }}
          >
            <GoogleIcon />
            {oauthLoading === 'google' ? 'REDIRECTING…' : 'CONTINUE WITH GOOGLE'}
          </button>

          <button
            onClick={() => handleOAuth('azure')}
            disabled={!!oauthLoading}
            className="font-mono flex items-center justify-center gap-3 w-full py-2 text-xs tracking-widest uppercase"
            style={{
              background: '#0d1117',
              border: '1px solid #30363d',
              color: oauthLoading === 'azure' ? '#484f58' : '#8b949e',
              cursor: oauthLoading ? 'not-allowed' : 'pointer',
              opacity: oauthLoading && oauthLoading !== 'azure' ? 0.5 : 1,
            }}
          >
            <MicrosoftIcon />
            {oauthLoading === 'azure' ? 'REDIRECTING…' : 'CONTINUE WITH MICROSOFT'}
          </button>
        </div>
      </div>
    </div>
  )
}
