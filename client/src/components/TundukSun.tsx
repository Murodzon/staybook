// Солнце с түндүком (верхним кругом юрты) — образ с флага Кыргызстана.
const RAYS = Array.from({ length: 40 }, (_, i) => i * 9);

export function TundukSun({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="-100 -100 200 200" className={`pointer-events-none ${className}`}>
      <g fill="var(--color-sun)">
        {RAYS.map((angle) => (
          <path key={angle} transform={`rotate(${angle})`} d="M-4-63C-5-76-1-84 6-96 3-83 6-74 3-63Z" />
        ))}
        <circle r="58" />
      </g>
      <g fill="none" stroke="var(--color-brand-900)" strokeWidth="4.5" strokeLinecap="round">
        <circle r="38" />
        <circle r="31" strokeWidth="2" />
        {[45, -45].map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <path d="M-29-11Q0-2 29-11M-31 0H31M-29 11Q0 2 29 11" />
          </g>
        ))}
      </g>
    </svg>
  );
}
