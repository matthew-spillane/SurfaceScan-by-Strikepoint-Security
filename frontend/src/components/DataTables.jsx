import { useState, useMemo } from 'react';
import AssetsTable from './AssetsTable';
import PortsTable from './PortsTable';
import TechnologiesTable from './TechnologiesTable';
import CertificatesTable from './CertificatesTable';

const TABS = ['ASSETS', 'PORTS', 'TECHNOLOGIES', 'CERTIFICATES'];

export default function DataTables({ assets }) {
  const [activeTab, setActiveTab] = useState('ASSETS');

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ background: '#0d1117' }}>
      {/* Tab bar */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid #21262d', background: '#161b22' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="font-mono text-xs tracking-widest uppercase px-5 py-2.5 cursor-pointer"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #58a6ff' : '2px solid transparent',
              color: activeTab === tab ? '#e6edf3' : '#484f58',
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Table content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'ASSETS' && <AssetsTable assets={assets} />}
        {activeTab === 'PORTS' && <PortsTable assets={assets} />}
        {activeTab === 'TECHNOLOGIES' && <TechnologiesTable assets={assets} />}
        {activeTab === 'CERTIFICATES' && <CertificatesTable assets={assets} />}
      </div>
    </div>
  );
}
