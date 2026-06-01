// Генерирует PWA-иконки без внешних зависимостей (чистый PNG через zlib).
// Запуск: node scripts/make-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function hex(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

function makePng(size, path) {
  const bg = hex("#8B5CF6"); // accent
  const fg = [255, 255, 255]; // белый знак
  const cx = size / 2;
  const cy = size / 2;
  // три «пульсирующих» круга разного радиуса — мягкий ритм
  const ringR = size * 0.30;
  const ringW = size * 0.055;
  const dotR = size * 0.075;

  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter byte
    for (let x = 0; x < size; x++) {
      let col = bg;
      const d = Math.hypot(x - cx, y - cy);
      if (Math.abs(d - ringR) < ringW || d < dotR) col = fg;
      raw[p++] = col[0];
      raw[p++] = col[1];
      raw[p++] = col[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
  console.log("wrote", path, png.length, "bytes");
}

mkdirSync("public/icons", { recursive: true });
makePng(192, "public/icons/icon-192.png");
makePng(512, "public/icons/icon-512.png");
