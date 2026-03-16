import { useState, useMemo } from 'react';
import { getRiskColor } from '../utils/riskColors';

export default function AssetNavigator({ assets, selectedAsset, onSelect }) {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter) return assets;
    const q = filter.toLowerCase();
    return assets.filter(
      (a) =>
        a.subdomain.toLowerCase().includes(q) ||
        a.ip.includes(q)
    );
  }, [assets, filter]);

  return (
    <div className="flex flex-col h-full">
      {/* Filter input */}
      <div className="p-2 shrink-0" style={{ borderBottom: '1px solid #21262d' }}>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter assets..."
          spellCheck={false}
          className="w-full font-mono text-xs py-1.5 px-2 rounded-sm outline-none"
          style={{
            background: '#0d1117',
            color: '#e6edf3',
            border: '1px solid #21262d',
          }}
        />
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((asset) => {
          const isSelected =
            selectedAsset?.subdomain === asset.subdomain;
          return (
            <div
              key={asset.subdomain}
              onClick={() => onSelect(asset)}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer"
              style={{
                background: isSelected ? '#161b22' : 'transparent',
                borderLeft: isSelected
                  ? '2px solid #f85149'
                  : '2px solid transparent',
              }}>
              {/* Risk dot */}
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: getRiskColor(asset.risk_level) }}
              />
              {/* Subdomain */}
              <span
                className="font-mono text-xs truncate flex-1"
                style={{ color: '#e6edf3' }}>
                {asset.subdomain}
              </span>
              {/* IP */}
              <span
                className="font-mono text-xs shrink-0"
                style={{ color: '#484f58' }}>
                {asset.ip || '--'}
              </span>
              {/* Risk badge */}
              <span
                className="font-mono text-xs px-1.5 py-0.5 rounded-sm shrink-0 uppercase"
                style={{
                  color: getRiskColor(asset.risk_level),
                  background: `${getRiskColor(asset.risk_level)}15`,
                  fontSize: '10px',
                }}>
                {asset.risk_level}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-xs p-4 text-center" style={{ color: '#484f58' }}>
            {assets.length === 0 ? 'Discovering assets...' : 'No matches'}
          </div>
        )}
      </div>
    </div>
  );
}
