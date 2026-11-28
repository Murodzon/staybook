// Декоративный пейзаж (горы и озеро) в SVG: не нужны внешние картинки.
export function Mountains() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full sm:h-80"
    >
      <path d="M0 235 190 105l95 70L440 45l175 150 115-80 190 125 175-165 140 125 80-50 125 90v80H0Z" fill="#fff" opacity="0.1" />
      <path d="m440 45-52 44 28-7 22 18 24-20 30 8Zm655 30-47 44 27-9 20 17 23-18 24 8Z" fill="#fff" opacity="0.55" />
      <path d="M0 270 160 180l150 75 190-115 210 135 170-85 190 90 180-110 190 90v60H0Z" fill="#07302f" opacity="0.55" />
      <path d="M0 285c240-28 460 18 720 0s500-30 720-4v39H0Z" fill="#07302f" />
    </svg>
  );
}
