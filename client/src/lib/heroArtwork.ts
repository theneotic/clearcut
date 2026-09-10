const person = `
  <g stroke="#17201f" stroke-width="3" stroke-linejoin="round">
    <path fill="#17201f" d="M40 310c8-82 36-124 88-136 52 12 80 54 88 136Z"/>
    <path fill="#ef745e" d="M79 183c-4-30 7-67 49-75 42 8 53 45 49 75-11 23-29 36-49 36s-38-13-49-36Z"/>
    <path fill="#17201f" d="M75 143c7-43 28-62 55-62 32 0 51 22 54 66-15-11-25-25-30-43-19 23-47 35-79 39Z"/>
    <path fill="none" d="M108 164c8 5 17 5 25 0"/>
  </g>`;

const grid = `<pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#f4f1e8"/><rect width="14" height="14" fill="#d8ded7"/><rect x="14" y="14" width="14" height="14" fill="#d8ded7"/></pattern>`;

function imageData(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const HERO_BEFORE_ARTWORK = imageData(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 330" role="img" aria-label="Portrait on a blue studio background">
    <defs><linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1768a7"/><stop offset="1" stop-color="#62b7d1"/></linearGradient></defs>
    <rect width="240" height="330" fill="url(#blue)"/>
    <circle cx="180" cy="55" r="72" fill="#8ed4e1" opacity=".32"/>
    ${person}
  </svg>`);

export const HERO_AFTER_ARTWORK = imageData(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 330" role="img" aria-label="Portrait cutout on a transparency grid">
    <defs>${grid}</defs>
    <rect width="240" height="330" fill="url(#grid)"/>
    ${person}
  </svg>`);
