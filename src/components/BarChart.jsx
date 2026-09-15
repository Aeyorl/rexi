import { useMemo } from 'react';
import { generateBarData } from '../data/mockData';

export default function BarChart({ width = 700, height = 160, color = '#8fb339' }) {
  const data = useMemo(() => generateBarData(30), []);
  
  const max = Math.max(...data);
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
