import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// CRC32 table for valid PNG chunk encoding
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function sdRoundedRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r;
  const qy = Math.abs(py - cy) - hh + r;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    r
  );
}

function sdCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r;
}

function blendPixel(buf, idx, r, g, b, alpha) {
  if (alpha <= 0) return;
  const a = Math.min(1, alpha);
  const inv = 1 - a;
  buf[idx] = Math.round(r * a + buf[idx] * inv);
  buf[idx + 1] = Math.round(g * a + buf[idx + 1] * inv);
  buf[idx + 2] = Math.round(b * a + buf[idx + 2] * inv);
  buf[idx + 3] = 255;
}

function renderIcon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  // Maskable icons scale artwork down into the central 72% safe zone (14% padding each side)
  const scale = maskable ? 0.72 : 0.92;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Full-bleed obsidian slate background (#0C0E12)
      rgba[idx] = 12;
      rgba[idx + 1] = 14;
      rgba[idx + 2] = 18;
      rgba[idx + 3] = 255;

      // Normalized coordinates [-1, 1] with safe-zone scaling
      const nx = ((x + 0.5) / size - 0.5) * 2;
      const ny = ((y + 0.5) / size - 0.5) * 2;

      // Subtle outer border ring (only on standard icons)
      if (!maskable) {
        const outerDist = sdRoundedRect(nx, ny, 0, 0, 0.92, 0.92, 0.36);
        const rimAlpha = Math.max(0, 1 - Math.abs(outerDist) * size * 0.16);
        if (Math.abs(outerDist) < 0.015) {
          blendPixel(rgba, idx, 42, 49, 64, rimAlpha * 0.9);
        }
      }

      const sx = nx / scale;
      const sy = ny / scale;
      const aa = 2.0 / (size * scale);

      // Gamepad silhouette composed of rounded body + left/right grips
      const body = sdRoundedRect(sx, sy, 0, -0.02, 0.56, 0.25, 0.19);
      const leftGrip = sdRoundedRect(
        (sx + 0.45) * Math.cos(0.24) - (sy - 0.16) * Math.sin(0.24),
        (sx + 0.45) * Math.sin(0.24) + (sy - 0.16) * Math.cos(0.24),
        0,
        0,
        0.16,
        0.29,
        0.15
      );
      const rightGrip = sdRoundedRect(
        (sx - 0.45) * Math.cos(-0.24) - (sy - 0.16) * Math.sin(-0.24),
        (sx - 0.45) * Math.sin(-0.24) + (sy - 0.16) * Math.cos(-0.24),
        0,
        0,
        0.16,
        0.29,
        0.15
      );
      const padDist = Math.min(body, leftGrip, rightGrip);

      // Signal Orange outline (#F97316) & charcoal fill (#181C24)
      if (padDist < aa * 2) {
        const fillCov = Math.max(0, Math.min(1, (-padDist) / aa + 0.5));
        blendPixel(rgba, idx, 24, 28, 36, fillCov);
      }
      const strokeBand = Math.abs(padDist) - 0.028;
      if (strokeBand < aa) {
        const strokeCov = Math.max(0, Math.min(1, (-strokeBand) / aa + 0.5));
        blendPixel(rgba, idx, 249, 115, 22, strokeCov);
      }

      // D-Pad (crisp white)
      const dpadV = sdRoundedRect(sx, sy, -0.34, -0.01, 0.042, 0.135, 0.02);
      const dpadH = sdRoundedRect(sx, sy, -0.34, -0.01, 0.135, 0.042, 0.02);
      const dpad = Math.min(dpadV, dpadH);
      if (dpad < aa) {
        blendPixel(rgba, idx, 244, 246, 249, Math.max(0, Math.min(1, (-dpad) / aa + 0.5)));
      }

      // ABXY cluster (top orange, others white)
      const btnTop = sdCircle(sx, sy, 0.34, -0.11, 0.052);
      if (btnTop < aa) {
        blendPixel(rgba, idx, 249, 115, 22, Math.max(0, Math.min(1, (-btnTop) / aa + 0.5)));
      }
      const btnOther = Math.min(
        sdCircle(sx, sy, 0.45, 0.0, 0.052),
        sdCircle(sx, sy, 0.34, 0.11, 0.052),
        sdCircle(sx, sy, 0.23, 0.0, 0.052)
      );
      if (btnOther < aa) {
        blendPixel(rgba, idx, 244, 246, 249, Math.max(0, Math.min(1, (-btnOther) / aa + 0.5)));
      }

      // Center LED light bar (#F97316)
      const bar = sdRoundedRect(sx, sy, 0, -0.01, 0.11, 0.028, 0.028);
      if (bar < aa) {
        blendPixel(rgba, idx, 249, 115, 22, Math.max(0, Math.min(1, (-bar) / aa + 0.5)));
      }
    }
  }

  return encodePng(size, size, rgba);
}

const targets = [
  { name: 'pwa-192x192.png', size: 192, maskable: false },
  { name: 'pwa-512x512.png', size: 512, maskable: false },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const t of targets) {
  const outPath = path.join(PUBLIC_DIR, t.name);
  fs.writeFileSync(outPath, renderIcon(t.size, t.maskable));
  console.log(`Generated ${t.name} (${t.size}x${t.size})`);
}
