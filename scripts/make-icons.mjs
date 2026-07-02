import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
fs.mkdirSync(dir, { recursive: true });

function png(size, r = 235, g = 0, b = 40) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * height * 4) + height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0;
    for (let x = 0; x < width; x++) {
      raw[offset++] = r; raw[offset++] = g; raw[offset++] = b; raw[offset++] = 255;
    }
  }
  const compressed = zlib.deflateSync(raw);
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); ihdr[4] = 73; ihdr[5] = 72; ihdr[6] = 68; ihdr[7] = 82;
  ihdr.writeUInt32BE(width, 8); ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8; ihdr[17] = 6; ihdr[18] = 0; ihdr[19] = 0; ihdr[20] = 0;
  const crc32 = buf => {
    let c = ~0;
    for (const byte of buf) { c ^= byte; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
    return ~c >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, crc]);
  };
  return Buffer.concat([signature, chunk('IHDR', ihdr.slice(8, 8 + 13)), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [192, 512]) {
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), png(size));
}
console.log('Icons created');
