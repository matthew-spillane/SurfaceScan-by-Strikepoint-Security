import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const RISK_COLORS = {
  low: '#3fb950',
  medium: '#d29922',
  high: '#db6d28',
  critical: '#f85149',
};

const RISK_PRIORITY = { low: 0, medium: 1, high: 2, critical: 3 };

// Common city centroids for geocoding (lat, lng)
const CITY_COORDS = {
  'new york': [40.7, -74.0], 'los angeles': [34.1, -118.2], 'chicago': [41.9, -87.6],
  'houston': [29.8, -95.4], 'phoenix': [33.4, -112.1], 'philadelphia': [40.0, -75.2],
  'san antonio': [29.4, -98.5], 'san diego': [32.7, -117.2], 'dallas': [32.8, -96.8],
  'san jose': [37.3, -121.9], 'austin': [30.3, -97.7], 'seattle': [47.6, -122.3],
  'denver': [39.7, -105.0], 'boston': [42.4, -71.1], 'nashville': [36.2, -86.8],
  'detroit': [42.3, -83.0], 'portland': [45.5, -122.7], 'las vegas': [36.2, -115.1],
  'atlanta': [33.7, -84.4], 'miami': [25.8, -80.2], 'san francisco': [37.8, -122.4],
  'washington': [38.9, -77.0], 'london': [51.5, -0.1], 'paris': [48.9, 2.3],
  'berlin': [52.5, 13.4], 'tokyo': [35.7, 139.7], 'beijing': [39.9, 116.4],
  'shanghai': [31.2, 121.5], 'mumbai': [19.1, 72.9], 'delhi': [28.6, 77.2],
  'bangalore': [13.0, 77.6], 'sydney': [-33.9, 151.2], 'melbourne': [-37.8, 145.0],
  'toronto': [43.7, -79.4], 'vancouver': [49.3, -123.1], 'montreal': [45.5, -73.6],
  'mexico city': [19.4, -99.1], 'são paulo': [-23.6, -46.6], 'sao paulo': [-23.6, -46.6],
  'rio de janeiro': [-22.9, -43.2], 'buenos aires': [-34.6, -58.4],
  'amsterdam': [52.4, 4.9], 'dublin': [53.3, -6.3], 'frankfurt': [50.1, 8.7],
  'zurich': [47.4, 8.5], 'stockholm': [59.3, 18.1], 'oslo': [59.9, 10.8],
  'helsinki': [60.2, 24.9], 'copenhagen': [55.7, 12.6], 'vienna': [48.2, 16.4],
  'warsaw': [52.2, 21.0], 'prague': [50.1, 14.4], 'brussels': [50.8, 4.4],
  'madrid': [40.4, -3.7], 'barcelona': [41.4, 2.2], 'lisbon': [38.7, -9.1],
  'rome': [41.9, 12.5], 'milan': [45.5, 9.2], 'moscow': [55.8, 37.6],
  'istanbul': [41.0, 29.0], 'cairo': [30.0, 31.2], 'lagos': [6.5, 3.4],
  'nairobi': [-1.3, 36.8], 'cape town': [-33.9, 18.4], 'johannesburg': [-26.2, 28.0],
  'dubai': [25.2, 55.3], 'singapore': [1.4, 103.8], 'hong kong': [22.3, 114.2],
  'seoul': [37.6, 127.0], 'taipei': [25.0, 121.5], 'bangkok': [13.8, 100.5],
  'jakarta': [-6.2, 106.8], 'manila': [14.6, 121.0], 'kuala lumpur': [3.1, 101.7],
  'hanoi': [21.0, 105.9], 'auckland': [-36.8, 174.8], 'lima': [-12.0, -77.0],
  'bogota': [4.7, -74.1], 'santiago': [-33.4, -70.6], 'ashburn': [39.0, -77.5],
  'boardman': [45.8, -119.7], 'council bluffs': [41.3, -95.9], 'the dalles': [45.6, -121.2],
  'quincy': [47.2, -119.9], 'pryor': [36.3, -95.3], 'lenoir': [35.9, -81.5],
  'richmond': [37.5, -77.4], 'columbus': [40.0, -83.0], 'reston': [38.9, -77.3],
  'chandler': [33.3, -111.8], 'des moines': [41.6, -93.6], 'hillsboro': [45.5, -122.9],
  'santa clara': [37.4, -121.9], 'redmond': [47.7, -122.1], 'cheyenne': [41.1, -104.8],
  'marseille': [43.3, 5.4], 'lyon': [45.8, 4.8],
  'munich': [48.1, 11.6], 'hamburg': [53.6, 10.0], 'pune': [18.5, 73.9],
  'hyderabad': [17.4, 78.5], 'chennai': [13.1, 80.3], 'kolkata': [22.6, 88.4],
  'osaka': [34.7, 135.5], 'shenzhen': [22.5, 114.1], 'guangzhou': [23.1, 113.3],
};

// Country centroid fallback
const COUNTRY_COORDS = {
  'united states': [39.8, -98.6], 'us': [39.8, -98.6], 'usa': [39.8, -98.6],
  'united kingdom': [54.0, -2.0], 'uk': [54.0, -2.0], 'gb': [54.0, -2.0],
  'canada': [56.1, -106.3], 'ca': [56.1, -106.3],
  'germany': [51.2, 10.5], 'de': [51.2, 10.5],
  'france': [46.2, 2.2], 'fr': [46.2, 2.2],
  'japan': [36.2, 138.3], 'jp': [36.2, 138.3],
  'china': [35.9, 104.2], 'cn': [35.9, 104.2],
  'india': [20.6, 79.0], 'in': [20.6, 79.0],
  'australia': [-25.3, 133.8], 'au': [-25.3, 133.8],
  'brazil': [-14.2, -51.9], 'br': [-14.2, -51.9],
  'mexico': [23.6, -102.6], 'mx': [23.6, -102.6],
  'russia': [61.5, 105.3], 'ru': [61.5, 105.3],
  'south korea': [35.9, 128.0], 'kr': [35.9, 128.0],
  'netherlands': [52.1, 5.3], 'nl': [52.1, 5.3],
  'sweden': [60.1, 18.6], 'se': [60.1, 18.6],
  'norway': [60.5, 8.5], 'no': [60.5, 8.5],
  'finland': [61.9, 25.7], 'fi': [61.9, 25.7],
  'denmark': [56.3, 9.5], 'dk': [56.3, 9.5],
  'switzerland': [46.8, 8.2], 'ch': [46.8, 8.2],
  'ireland': [53.1, -8.2], 'ie': [53.1, -8.2],
  'singapore': [1.4, 103.8], 'sg': [1.4, 103.8],
  'south africa': [-30.6, 22.9], 'za': [-30.6, 22.9],
  'italy': [41.9, 12.6], 'it': [41.9, 12.6],
  'spain': [40.5, -3.7], 'es': [40.5, -3.7],
  'poland': [51.9, 19.1], 'pl': [51.9, 19.1],
  'turkey': [39.0, 35.2], 'tr': [39.0, 35.2],
  'argentina': [-38.4, -63.6], 'ar': [-38.4, -63.6],
  'colombia': [4.6, -74.3], 'co': [4.6, -74.3],
  'egypt': [26.8, 30.8], 'eg': [26.8, 30.8],
  'nigeria': [9.1, 8.7], 'ng': [9.1, 8.7],
  'kenya': [0.0, 38.0], 'ke': [0.0, 38.0],
  'uae': [23.4, 53.8], 'ae': [23.4, 53.8],
  'thailand': [15.9, 100.9], 'th': [15.9, 100.9],
  'indonesia': [-0.8, 113.9], 'id': [-0.8, 113.9],
  'philippines': [12.9, 121.8], 'ph': [12.9, 121.8],
  'malaysia': [4.2, 101.9], 'my': [4.2, 101.9],
  'vietnam': [14.1, 108.3], 'vn': [14.1, 108.3],
  'taiwan': [23.7, 121.0], 'tw': [23.7, 121.0],
  'portugal': [39.4, -8.2], 'pt': [39.4, -8.2],
  'austria': [47.5, 14.6], 'at': [47.5, 14.6],
  'belgium': [50.5, 4.5], 'be': [50.5, 4.5],
  'czech republic': [49.8, 15.5], 'cz': [49.8, 15.5],
  'romania': [45.9, 24.9], 'ro': [45.9, 24.9],
  'israel': [31.0, 34.9], 'il': [31.0, 34.9],
  'new zealand': [-40.9, 174.9], 'nz': [-40.9, 174.9],
  'chile': [-35.7, -71.5], 'cl': [-35.7, -71.5],
  'peru': [-9.2, -75.0], 'pe': [-9.2, -75.0],
  'hong kong': [22.3, 114.2], 'hk': [22.3, 114.2],
};

function geocode(asset) {
  const city = (asset.city || '').toLowerCase().trim();
  const country = (asset.country || '').toLowerCase().trim();
  const code = (asset.country_code || '').toLowerCase().trim();

  if (city && CITY_COORDS[city]) return CITY_COORDS[city];
  if (country && COUNTRY_COORDS[country]) return COUNTRY_COORDS[country];
  if (code && COUNTRY_COORDS[code]) return COUNTRY_COORDS[code];
  return null;
}

function groupAssets(assets) {
  const groups = {};
  for (const asset of assets) {
    const coords = geocode(asset);
    if (!coords) continue;
    const key = `${Math.round(coords[0] * 10) / 10},${Math.round(coords[1] * 10) / 10}`;
    if (!groups[key]) {
      groups[key] = {
        lat: Math.round(coords[0] * 10) / 10,
        lng: Math.round(coords[1] * 10) / 10,
        assets: [],
        country: asset.country || 'Unknown',
        city: asset.city || 'Unknown',
      };
    }
    groups[key].assets.push(asset);
  }
  return Object.values(groups);
}

function highestRisk(assets) {
  let max = 'low';
  for (const a of assets) {
    const level = a.risk_level || 'low';
    if ((RISK_PRIORITY[level] || 0) > (RISK_PRIORITY[max] || 0)) max = level;
  }
  return max;
}

let topojsonPromise = null;

function loadTopojson() {
  if (topojsonPromise) return topojsonPromise;
  topojsonPromise = new Promise((resolve, reject) => {
    if (window.topojson) { resolve(window.topojson); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
    script.onload = () => resolve(window.topojson);
    script.onerror = () => reject(new Error('Failed to load topojson'));
    document.head.appendChild(script);
  });
  return topojsonPromise;
}

export default function MapView({ assets }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const initializedRef = useRef(false);
  const [tooltip, setTooltip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!containerRef.current) return;
    initializedRef.current = true;

    const container = containerRef.current;

    async function init() {
      try {
        const [topojson, world] = await Promise.all([
          loadTopojson(),
          d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        ]);

        setLoading(false);

        const width = container.clientWidth || 900;
        const height = container.clientHeight || 500;

        const svg = d3.select(svgRef.current)
          .attr('width', width)
          .attr('height', height)
          .style('background', '#0d1117');

        const g = svg.append('g');

        const projection = d3.geoNaturalEarth1()
          .fitSize([width, height], topojson.feature(world, world.objects.countries));

        const path = d3.geoPath().projection(projection);
        const countries = topojson.feature(world, world.objects.countries);

        // Ocean
        g.append('path')
          .datum({ type: 'Sphere' })
          .attr('d', path)
          .attr('fill', '#0d1117');

        // Countries
        g.selectAll('.country')
          .data(countries.features)
          .join('path')
          .attr('class', 'country')
          .attr('d', path)
          .attr('fill', '#161b22')
          .attr('stroke', '#30363d')
          .attr('stroke-width', 0.5);

        // Bubbles
        const groups = groupAssets(assets || []);
        const radiusScale = d3.scaleSqrt()
          .domain([1, d3.max(groups, (d) => d.assets.length) || 1])
          .range([6, 40]);

        g.selectAll('.bubble')
          .data(groups)
          .join('circle')
          .attr('class', 'bubble')
          .attr('cx', (d) => projection([d.lng, d.lat])?.[0])
          .attr('cy', (d) => projection([d.lng, d.lat])?.[1])
          .attr('r', (d) => radiusScale(d.assets.length))
          .attr('fill', (d) => RISK_COLORS[highestRisk(d.assets)])
          .attr('opacity', 0.75)
          .attr('stroke', (d) => RISK_COLORS[highestRisk(d.assets)])
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 0.3)
          .style('cursor', 'pointer')
          .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 1).attr('stroke-opacity', 0.8);
            const subdomains = d.assets.map((a) => a.subdomain).slice(0, 10);
            setTooltip({
              x: event.clientX,
              y: event.clientY,
              country: d.country,
              city: d.city,
              count: d.assets.length,
              risk: highestRisk(d.assets),
              subdomains,
              hasMore: d.assets.length > 10,
            });
          })
          .on('mousemove', function (event) {
            setTooltip((prev) => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
          })
          .on('mouseout', function () {
            d3.select(this).attr('opacity', 0.75).attr('stroke-opacity', 0.3);
            setTooltip(null);
          });

        // Zoom
        const zoom = d3.zoom()
          .scaleExtent([1, 12])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          });

        svg.call(zoom);

        // Resize
        const observer = new ResizeObserver(() => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          svg.attr('width', w).attr('height', h);
        });
        observer.observe(container);
      } catch (err) {
        setLoading(false);
        setError(err.message);
      }
    }

    init();
  }, [assets]);

  if (!assets || assets.length === 0) {
    return (
      <div
        style={{ background: '#0d1117', color: '#484f58', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'monospace', fontSize: '13px' }}>
        No asset data available for map visualization
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#0d1117' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484f58', fontFamily: 'monospace', fontSize: '13px', zIndex: 10 }}>
          Loading map data…
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f85149', fontFamily: 'monospace', fontSize: '13px', zIndex: 10 }}>
          Map error: {error}
        </div>
      )}
      <svg ref={svgRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '6px',
            padding: '10px 14px',
            color: '#e6edf3',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.6',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: '320px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {tooltip.city !== 'Unknown' ? `${tooltip.city}, ` : ''}{tooltip.country}
          </div>
          <div style={{ color: '#8b949e', marginBottom: 4 }}>
            <span style={{ color: RISK_COLORS[tooltip.risk] }}>{tooltip.risk.toUpperCase()}</span>
            {' '}&middot;{' '}{tooltip.count} asset{tooltip.count !== 1 ? 's' : ''}
          </div>
          <div style={{ borderTop: '1px solid #21262d', paddingTop: 6, marginTop: 4 }}>
            {tooltip.subdomains.map((s) => (
              <div key={s} style={{ color: '#8b949e', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</div>
            ))}
            {tooltip.hasMore && <div style={{ color: '#484f58', fontSize: '11px' }}>…and more</div>}
          </div>
        </div>
      )}
    </div>
  );
}
