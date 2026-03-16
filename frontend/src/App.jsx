import { useState } from 'react';
import SearchView from './views/SearchView';
import ResultsView from './views/ResultsView';

export default function App() {
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
      <ResultsView scanId={scanId} domain={domain} onBack={handleBack} />
    );
  }

  return <SearchView onScanStarted={handleScanStarted} />;
}
