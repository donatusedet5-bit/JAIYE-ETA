// Renders the Jaiye "Tick j" app icon to the PNG sizes the PWA needs. Run: node scripts/icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const MARK = '<circle cx="64" cy="18" r="10.5" fill="#fff"/><path d="M64 40V80L36 58" stroke="#fff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
const BG = '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6A97FF"/><stop offset=".55" stop-color="#2F6BFF"/><stop offset="1" stop-color="#1E46D6"/></linearGradient><radialGradient id="h" cx=".25" cy=".1" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';

// scale = how much of the tile the mark fills; rounded = corner radius (0 for maskable / Apple, which round it themselves)
const icon = (scale, rounded) => {
  const s = 1024 * scale / 100, o = (1024 - 1024 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${BG}<rect width="1024" height="1024" rx="${rounded ? 230 : 0}" fill="url(#g)"/><rect width="1024" height="1024" rx="${rounded ? 230 : 0}" fill="url(#h)"/><g transform="translate(${o} ${o}) scale(${s})">${MARK}</g></svg>`;
};

const out = 'public/icons/';
mkdirSync(out, { recursive: true });
await sharp(Buffer.from(icon(0.64, true))).resize(192).png().toFile(out + 'icon-192.png');
await sharp(Buffer.from(icon(0.64, true))).resize(512).png().toFile(out + 'icon-512.png');
await sharp(Buffer.from(icon(0.5, false))).resize(512).png().toFile(out + 'icon-512-maskable.png');
await sharp(Buffer.from(icon(0.58, false))).resize(180).png().toFile(out + 'apple-touch-icon.png');
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">${BG.replace('id="g"', 'id="b"')}<rect width="1200" height="630" fill="url(#b)"/><g transform="translate(84 110) scale(2.4)">${MARK}</g><text x="96" y="470" font-family="Helvetica, Arial, sans-serif" font-size="96" font-weight="700" fill="#fff" letter-spacing="-4">Enjoy life.</text><text x="96" y="570" font-family="Helvetica, Arial, sans-serif" font-size="96" font-weight="700" fill="#fff" fill-opacity=".7" letter-spacing="-4">Jaiye keeps track.</text></svg>`;
await sharp(Buffer.from(og)).png().toFile(out + 'og.png');
console.log('icons done');
