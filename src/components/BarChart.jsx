// Bar chart over real values supplied by the caller (e.g. distributed reward
// totals per day from the chain index). Renders nothing when empty.
export default function BarChart({ values = [], width = 700, height = 160, color = '#8fb339' }) {
  const data = values.map(v => Number(v) || 0);
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const barWidth = width / data.length;
  const gap = 2;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((val, i) => {
        const barH = (val / max) * (height - 10);
        const x = i * barWidth + gap / 2;
        const y = height - barH;
        const isLast = i === data.length - 1;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth - gap}
            height={barH}
            fill={isLast ? '#c8e055' : color}
            rx="2"
            opacity={isLast ? 1 : 0.75}
          />
        );
      })}
    </svg>
  );
}