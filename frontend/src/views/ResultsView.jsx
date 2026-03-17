import { useState, useEffect, useCallback } from 'react';
import { getScan } from '../api/client';
import TopBar from '../components/TopBar';
import MetricsStrip from '../components/MetricsStrip';
import AssetNavigator from '../components/AssetNavigator';
import NetworkGraph from '../components/NetworkGraph';
import AssetDetail from '../components/AssetDetail';
import ScanConsole from '../components/ScanConsole';
import DataTables from '../components/DataTables';

export default function ResultsView({ scanId, domain, onBack }) {
  const [scan, setScan] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const poll = useCallback(async () => {
    try {
      const data = await getScan(scanId);
      setScan(data);
      return data.status;
    } catch {
      return 'failed';
    }
  }, [scanId]);

  useEffect(() => {
    let active = true;
    let timer;

    async function loop() {
      const status = await poll();
      if (active && status === 'running') {
        timer = setTimeout(loop, 2000);
      }
    }
    loop();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [poll]);

  function handleNodeClick(nodeId) {
    setSelectedNode(nodeId);
    if (!scan) return;
    // Find matching asset by subdomain or IP
    const asset = scan.assets.find(
      (a) => `sub:${a.subdomain}` === nodeId || `ip:${a.ip}` === nodeId
    );
    setSelectedAsset(asset || null);
  }

  function handleAssetClick(asset) {
    setSelectedAsset(asset);
    setSelectedNode(`sub:${asset.subdomain}`);
  }

  const isRunning = !scan || scan.status === 'running';
  const showConsole = isRunning;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0d1117' }}>
      <TopBar scan={scan} domain={domain} onBack={onBack} />
      <MetricsStrip summary={scan?.summary} />

      {/* Main three-column layout */}
      <div className="flex h-[45vh] shrink-0">
        {/* Left — Asset Navigator */}
        <div className="shrink-0 overflow-hidden flex flex-col"
          style={{ width: '20%', borderRight: '1px solid #30363d' }}>
          <AssetNavigator
            assets={scan?.assets || []}
            selectedAsset={selectedAsset}
            onSelect={handleAssetClick}
          />
        </div>

        {/* Center — Graph or Console */}
        <div className="flex-1 min-w-0 relative overflow-hidden"
          style={{ background: '#0d1117' }}>
          {showConsole && (
            <ScanConsole
              log={scan?.log || []}
              done={scan?.status === 'complete'}
            />
          )}
          {!showConsole && scan && (
            <NetworkGraph
              graph={scan.graph}
              selectedNode={selectedNode}
              onNodeClick={handleNodeClick}
            />
          )}
        </div>

        {/* Right — Asset Detail */}
        <div className="shrink-0 overflow-y-auto"
          style={{ width: '25%', borderLeft: '1px solid #30363d' }}>
          <AssetDetail asset={selectedAsset} summary={scan?.summary} />
        </div>
      </div>

      {/* Bottom — Data Tables */}
      <DataTables assets={scan?.assets || []} />
    </div>
  );
}
