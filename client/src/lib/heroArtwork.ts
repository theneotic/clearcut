const person = `
  <g stroke="#0f172a" stroke-width="2" stroke-linejoin="round">
    <path fill="#1e293b" d="M40 310c8-82 36-124 88-136 52 12 80 54 88 136Z"/>
    <path fill="#38bdf8" d="M79 183c-4-30 7-67 49-75 42 8 53 45 49 75-11 23-29 36-49 36s-38-13-49-36Z"/>
    <path fill="#0f172a" d="M75 143c7-43 28-62 55-62 32 0 51 22 54 66-15-11-25-25-30-43-19 23-47 35-79 39Z"/>
    <path fill="none" stroke="#090d16" stroke-width="2" d="M108 164c8 5 17 5 25 0"/>
  </g>`;

const grid = `<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#090d16"/><rect width="10" height="10" fill="#141c2e"/><rect x="10" y="10" width="10" height="10" fill="#141c2e"/></pattern>`;

function imageData(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const HERO_BEFORE_ARTWORK = imageData(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 330" role="img" aria-label="Original portrait with studio backdrop">
    <defs>
      <linearGradient id="studio-bg" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#1e293b"/>
        <stop offset="1" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="240" height="330" fill="url(#studio-bg)"/>
    <circle cx="180" cy="65" r="70" fill="#38bdf8" opacity=".15"/>
    ${person}
  </svg>`);

export const HERO_AFTER_ARTWORK = imageData(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 330" role="img" aria-label="Portrait cutout on a transparency grid">
    <defs>${grid}</defs>
    <rect width="240" height="330" fill="url(#grid)"/>
    ${person}
  </svg>`);

