// Декоративный пейзаж Кыргызстана: хребты Ала-Тоо, озеро, ели и юрты.
// Цвета задаются CSS-переменными --land-* (см. index.css).

// Юрта (боз үй): центр основания в (x, y).
function Yurt({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-42 0v-24C-34-44-18-52 0-52s34 8 42 28V0Z" fill="var(--land-yurt)" />
      <path d="M-42-24C-34-44-18-52 0-52s34 8 42 28" fill="none" stroke="var(--land-trim)" strokeWidth="2" />
      <ellipse cx="0" cy="-52" rx="9" ry="3.5" fill="var(--land-trim)" />
      <path d="M-42-24h84v7h-84Z" fill="var(--land-trim)" />
      <path d="m-40-18 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5 4 4" fill="none" stroke="var(--land-yurt)" strokeWidth="1.5" />
      <path d="M-10 0v-15a10 8 0 0 1 20 0V0Z" fill="var(--land-trim)" />
    </g>
  );
}

// Тянь-шаньская ель: узкая и высокая.
function Fir({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="m0-56 9 17H4l9 15H7l10 16H3v8h-6v-8h-14l10-16h-6l9-15h-5Z"
      fill="var(--land-fir)"
    />
  );
}

const FIRS: [number, number, number][] = [
  [60, 292, 0.9], [84, 298, 1.15], [112, 294, 0.75], [300, 290, 0.8], [322, 296, 1],
  [560, 296, 0.7], [580, 302, 0.95], [930, 292, 0.85], [954, 298, 1.1], [978, 293, 0.7],
  [1290, 290, 0.8], [1314, 298, 1.2], [1344, 294, 0.9],
];

export function Landscape({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      className={`pointer-events-none w-full ${className}`}
    >
      {/* Дальний хребет со снежными вершинами */}
      <path d="M0 220 190 90l95 70L440 30l175 150 115-80 190 125 175-165 140 125 80-50 125 90v105H0Z" fill="var(--land-far)" />
      <path d="m440 30-56 48 29-8 23 19 25-21 33 10ZM190 90l-43 29 22-4 17 14 18-15 24 8ZM1095 60l-49 46 28-9 20 17 24-18 25 9Z" fill="var(--land-snow)" />
      {/* Средний хребет */}
      <path d="M0 262 160 170l150 75 190-115 210 135 170-85 190 90 180-110 190 90v70H0Z" fill="var(--land-mid)" />
      {/* Берег и озеро Ысык-Көл */}
      <path d="M0 272c240-26 460 14 720-2s500-26 720-6v56H0Z" fill="var(--land-ground)" />
      <path d="M330 302c90-13 190-16 290-4-90 14-200 15-290 4Z" fill="var(--land-lake)" />
      <path d="M390 299h70m50 5h60" stroke="var(--land-snow)" strokeWidth="2" strokeLinecap="round" />
      {FIRS.map(([x, y, scale]) => (
        <Fir key={x} x={x} y={y} scale={scale} />
      ))}
      <Yurt x={790} y={300} />
      <Yurt x={865} y={306} scale={0.7} />
      <Yurt x={1170} y={298} scale={0.9} />
      <Yurt x={205} y={300} scale={0.75} />
    </svg>
  );
}
