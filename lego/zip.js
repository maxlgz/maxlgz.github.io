// ================================================================
// zip.js — lecteur ZIP minimal, sans dépendance : répertoire central,
// entrées « stored » ou « deflate », décompression par le
// DecompressionStream natif du navigateur.
// ================================================================

export async function readZip(buffer) {
  const u8 = new Uint8Array(buffer);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  // fin de répertoire central (signature 0x06054b50), cherchée depuis la fin
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('archive ZIP illisible');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const entries = [];
  const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const usize = dv.getUint32(p + 24, true);
    const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    const offset = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + elen + clen;
    if (name.endsWith('/')) continue;
    entries.push({
      name, size: usize, method,
      data: async () => {
        // en-tête local : le nom et l'extra peuvent différer du répertoire
        const ln = dv.getUint16(offset + 26, true), le = dv.getUint16(offset + 28, true);
        const start = offset + 30 + ln + le;
        const raw = u8.subarray(start, start + csize);
        if (method === 0) return raw.slice().buffer;
        if (method !== 8) throw new Error(`méthode de compression ${method} non gérée (${name})`);
        if (typeof DecompressionStream === 'undefined') throw new Error('ce navigateur ne sait pas dézipper (DecompressionStream absent)');
        const ds = new DecompressionStream('deflate-raw');
        const out = new Response(new Blob([raw]).stream().pipeThrough(ds));
        return out.arrayBuffer();
      },
    });
  }
  return entries;
}
