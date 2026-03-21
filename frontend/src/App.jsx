import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import SearchView from './views/SearchView';
import ResultsView from './views/ResultsView';

function AuthHeader() {
  const { user, signOut, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (loading) return null;

  return (
    <>
      <div
        className="fixed top-0 right-0 flex items-center gap-3 px-4 py-2 z-40"
        style={{ background: 'transparent' }}
      >
        {user ? (
          <>
            <span className="font-mono text-xs" style={{ color: '#484f58' }}>
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="font-mono text-xs px-3 py-1 rounded-sm"
              style={{
                color: '#8b949e',
                border: '1px solid #30363d',
                background: '#161b22',
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="font-mono text-xs px-3 py-1 rounded-sm"
            style={{
              color: '#58a6ff',
              border: '1px solid #30363d',
              background: '#161b22',
            }}
          >
            Sign In
          </button>
        )}
      </div>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}

function AppInner() {
  const [scanId, setScanId] = useState(null);
  const [domain, setDomain] = useState('');

  function handleScanStarted(id, dom) {
    setScanId(id);
    setDomain(dom);
  }

  function handleBack() {
    setScanId(null);
    setDomain('');
  }

  if (scanId) {
    return (
      <>
        <AuthHeader />
        <ResultsView scanId={scanId} domain={domain} onBack={handleBack} />
      </>
    );
  }

  return (
    <>
      <AuthHeader />
      <SearchView onScanStarted={handleScanStarted} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
