const GRID_PITCH = 16;
const DOT_SIZE = 2;

const GRID_TILE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${GRID_PITCH}' height='${GRID_PITCH}'><rect x='${(GRID_PITCH - DOT_SIZE) / 2}' y='${(GRID_PITCH - DOT_SIZE) / 2}' width='${DOT_SIZE}' height='${DOT_SIZE}' fill='white' fill-opacity='0.07'/></svg>`;
const GRID_BACKGROUND_IMAGE = `url("data:image/svg+xml,${encodeURIComponent(GRID_TILE_SVG)}")`;

/** Static dot-grid ambience for the sign-up right panel — a single tiled CSS background, no DOM nodes per dot. */
export function DotGridBackground({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ backgroundImage: GRID_BACKGROUND_IMAGE, backgroundSize: `${GRID_PITCH}px ${GRID_PITCH}px` }}
      aria-hidden
    />
  );
}
