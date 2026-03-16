export const RISK_COLORS = {
  low: '#3fb950',
  medium: '#d29922',
  high: '#db6d28',
  critical: '#f85149',
};

export function getRiskColor(level) {
  return RISK_COLORS[level] || '#8b949e';
}

export function getRiskBg(level) {
  const map = {
    low: 'rgba(63, 185, 80, 0.1)',
    medium: 'rgba(210, 153, 34, 0.1)',
    high: 'rgba(219, 109, 40, 0.1)',
    critical: 'rgba(248, 81, 73, 0.1)',
  };
  return map[level] || 'transparent';
}
