// Generates the PWA icons (violet rounded square with a white heart) as PNGs
// in public/icons/, without any image library. Run: npx tsx scripts/generate-icons.ts
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VIOLET = { r: 124, g: 58, b: 237 }; // violet-600 (#7c3aed)

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size: number, rgba: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Signed distance-ish coverage tests, evaluated with 4x4 supersampling.
function insideRoundedSquare(x: number, y: number, size: number, radius: number): boolean {
  const dx = Math.max(radius - x, x - (size - radius), 0);
  const dy = Math.max(radius - y, y - (size - radius), 0);
  return dx * dx + dy * dy <= radius * radius;
}

function insideHeart(x: number, y: number, size: number, scale: number): boolean {
  // Classic implicit heart: (x² + y² − 1)³ − x²·y³ ≤ 0, y pointing up.
  const hx = ((x - size / 2) / (size * scale)) * 2.6;
  const hy = (-(y - size / 2 - size * 0.04) / (size * scale)) * 2.6;
  const a = hx * hx + hy * hy - 1;
  return a * a * a - hx * hx * hy * hy * hy <= 0;
}

function renderIcon(size: number, maskable: boolean): Buffer {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = size * 0.22;
  const heartScale = maskable ? 0.62 : 0.78; // maskable keeps the heart inside the 80% safe zone
  const samples = 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bgHits = 0;
      let heartHits = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          const inBg = maskable || insideRoundedSquare(px, py, size, radius);
          if (!inBg) continue;
          bgHits++;
          if (insideHeart(px, py, size, heartScale)) heartHits++;
        }
      }
      const total = samples * samples;
      const alpha = bgHits / total;
      const heart = bgHits > 0 ? heartHits / bgHits : 0;
      const offset = (y * size + x) * 4;
      rgba[offset] = Math.round(VIOLET.r + (255 - VIOLET.r) * heart);
      rgba[offset + 1] = Math.round(VIOLET.g + (255 - VIOLET.g) * heart);
      rgba[offset + 2] = Math.round(VIOLET.b + (255 - VIOLET.b) * heart);
      rgba[offset + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, rgba);
}

const outDir = join(process.cwd(), "public", "icons");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "icon-192.png"), renderIcon(192, false));
writeFileSync(join(outDir, "icon-512.png"), renderIcon(512, false));
writeFileSync(join(outDir, "icon-maskable-512.png"), renderIcon(512, true));
console.log("Icons written to public/icons/");
