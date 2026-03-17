import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

const RISK_COLORS = {
  low: '#3fb950',
  medium: '#d29922',
  high: '#db6d28',
  critical: '#f85149',
};

const NODE_RADIUS = {
  domain: 18,
  subdomain: 8,
  ip: 5,
};

const NODE_COLOR = {
  domain: '#58a6ff',
  ip: '#8b949e',
};

export default function NetworkGraph({ graph, selectedNode, onNodeClick }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const simRef = useRef(null);
  const nodeSelRef = useRef(null);
  const onNodeClickRef = useRef(onNodeClick);
  const [tooltip, setTooltip] = useState(null);

  // Keep click callback ref current without triggering re-renders
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  // Build simulation — only when graph data changes
  useEffect(() => {
    if (!graph || !graph.nodes || graph.nodes.length === 0) return;
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Grid background pattern
    const defs = svg.append('defs');
    const pattern = defs.append('pattern')
      .attr('id', 'grid')
      .attr('width', 40)
      .attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('path')
      .attr('d', 'M 40 0 L 0 0 0 40')
      .attr('fill', 'none')
      .attr('stroke', '#161b22')
      .attr('stroke-width', 0.5);

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#grid)');

    // Create zoom group
    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Cap nodes for performance
    const maxNodes = 250;
    const nodes = graph.nodes.slice(0, maxNodes).map(n => ({ ...n }));
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = graph.edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({ ...e }));

    // Force simulation
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => NODE_RADIUS[d.type] + 4))
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    simRef.current = sim;

    // Edges
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', '#30363d')
      .attr('stroke-width', 0.5);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Store node selection for use in the selection-styling effect
    nodeSelRef.current = node;

    // Node circles
    node.append('circle')
      .attr('r', d => NODE_RADIUS[d.type])
      .attr('fill', d => {
        if (d.type === 'domain') return NODE_COLOR.domain;
        if (d.type === 'ip') return NODE_COLOR.ip;
        return RISK_COLORS[d.risk_level] || '#8b949e';
      })
      .attr('opacity', 0.9);

    // Labels for domain nodes
    node.filter(d => d.type === 'domain')
      .append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', NODE_RADIUS.domain + 14)
      .attr('fill', '#e6edf3')
      .attr('font-family', "'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace")
      .attr('font-size', '11px');

    // Click handler — only updates React state, no simulation changes
    node.on('click', (event, d) => {
      event.stopPropagation();
      onNodeClickRef.current(d.id);
    });

    // Tooltip handlers
    node.on('mouseenter', (event, d) => {
      const rect = container.getBoundingClientRect();
      setTooltip({
        x: event.clientX - rect.left + 12,
        y: event.clientY - rect.top - 8,
        node: d,
      });
    })
    .on('mousemove', (event, d) => {
      const rect = container.getBoundingClientRect();
      setTooltip({
        x: event.clientX - rect.left + 12,
        y: event.clientY - rect.top - 8,
        node: d,
      });
    })
    .on('mouseleave', () => setTooltip(null));

    // Deselect on background click
    svg.on('click', () => onNodeClickRef.current(null));

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Freeze simulation once it settles
    sim.on('end', () => {
      sim.stop();
    });

    return () => {
      sim.stop();
      nodeSelRef.current = null;
    };
  }, [graph]);

  // Update selection styling — no simulation involvement
  useEffect(() => {
    if (!nodeSelRef.current) return;
    nodeSelRef.current.select('circle')
      .attr('stroke', d => selectedNode === d.id ? '#ffffff' : 'none')
      .attr('stroke-width', d => selectedNode === d.id ? 2 : 0);
  }, [selectedNode]);

  return (
    <div ref={containerRef} className="w-full h-full relative"
      style={{ background: '#0d1117' }}>
      <svg ref={svgRef} className="w-full h-full" />
      {tooltip && (
        <div
          className="absolute pointer-events-none font-mono text-xs p-2 rounded-sm"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            background: '#161b22',
            border: '1px solid #30363d',
            color: '#e6edf3',
            zIndex: 50,
            maxWidth: '280px',
          }}>
          <div className="font-bold" style={{ color: '#58a6ff' }}>
            {tooltip.node.label}
          </div>
          <div style={{ color: '#8b949e' }}>
            {tooltip.node.type.toUpperCase()}
            {tooltip.node.metadata?.ports?.length > 0 && (
              <span> | Ports: {tooltip.node.metadata.ports.join(', ')}</span>
            )}
            {tooltip.node.metadata?.country && (
              <span> | {tooltip.node.metadata.country}</span>
            )}
            {tooltip.node.metadata?.org && (
              <span> | {tooltip.node.metadata.org}</span>
            )}
          </div>
          {tooltip.node.risk_score > 0 && (
            <div style={{ color: RISK_COLORS[tooltip.node.risk_level] }}>
              Risk: {tooltip.node.risk_score}/100 ({tooltip.node.risk_level})
            </div>
          )}
        </div>
      )}
    </div>
  );
}
