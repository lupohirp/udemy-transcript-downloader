/**
 * Minimal Zero-Dependency ZIP Writer
 * Creates standard PKZip archives in pure JavaScript
 */

// CRC-32 Table
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(bytes) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

class SimpleZip {
  constructor() {
    this.files = [];
  }

  /**
   * Adds a file to the ZIP archive
   * @param {string} name - Relative file path (e.g. "01 - Intro.txt")
   * @param {string|Uint8Array} content - File content as string or bytes
   */
  addFile(name, content) {
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(name.replace(/\\/g, '/'));
    const dataBytes = typeof content === 'string' ? encoder.encode(content) : content;
    const dataCrc = crc32(dataBytes);

    this.files.push({
      nameBytes,
      dataBytes,
      crc: dataCrc,
      size: dataBytes.length
    });
  }

  /**
   * Builds and returns the Uint8Array representing the ZIP file
   * @returns {Uint8Array}
   */
  build() {
    let totalSize = 0;
    for (const f of this.files) {
      // Local header (30) + name + data
      totalSize += 30 + f.nameBytes.length + f.size;
      // Central dir entry (46) + name
      totalSize += 46 + f.nameBytes.length;
    }
    // EOCD (22)
    totalSize += 22;

    const out = new Uint8Array(totalSize);
    const view = new DataView(out.buffer);
    let offset = 0;

    const centralEntries = [];

    // Write local file headers and data
    for (const f of this.files) {
      const localHeaderOffset = offset;
      centralEntries.push({ f, localHeaderOffset });

      // Local file header signature = 0x04034b50
      view.setUint32(offset, 0x04034b50, true);
      view.setUint16(offset + 4, 20, true); // Version needed: 2.0
      view.setUint16(offset + 6, 0x0800, true); // UTF-8 filename flag
      view.setUint16(offset + 8, 0, true); // Compression: STORE (0)
      view.setUint16(offset + 10, 0, true); // Mod time
      view.setUint16(offset + 12, 0, true); // Mod date
      view.setUint32(offset + 14, f.crc, true); // CRC32
      view.setUint32(offset + 18, f.size, true); // Compressed size
      view.setUint32(offset + 22, f.size, true); // Uncompressed size
      view.setUint16(offset + 26, f.nameBytes.length, true); // File name len
      view.setUint16(offset + 28, 0, true); // Extra len

      offset += 30;
      out.set(f.nameBytes, offset);
      offset += f.nameBytes.length;

      out.set(f.dataBytes, offset);
      offset += f.size;
    }

    const centralDirStart = offset;

    // Write central directory
    for (const entry of centralEntries) {
      const f = entry.f;

      // Central dir signature = 0x02014b50
      view.setUint32(offset, 0x02014b50, true);
      view.setUint16(offset + 4, 20, true); // Version made by
      view.setUint16(offset + 6, 20, true); // Version needed
      view.setUint16(offset + 8, 0x0800, true); // UTF-8 filename flag
      view.setUint16(offset + 10, 0, true); // Compression: STORE (0)
      view.setUint16(offset + 12, 0, true); // Mod time
      view.setUint16(offset + 14, 0, true); // Mod date
      view.setUint32(offset + 16, f.crc, true); // CRC32
      view.setUint32(offset + 20, f.size, true); // Compressed size
      view.setUint32(offset + 24, f.size, true); // Uncompressed size
      view.setUint16(offset + 28, f.nameBytes.length, true); // Name len
      view.setUint16(offset + 30, 0, true); // Extra len
      view.setUint16(offset + 32, 0, true); // Comment len
      view.setUint16(offset + 34, 0, true); // Disk start
      view.setUint16(offset + 36, 0, true); // Internal attr
      view.setUint32(offset + 38, 0, true); // External attr
      view.setUint32(offset + 42, entry.localHeaderOffset, true); // Offset

      offset += 46;
      out.set(f.nameBytes, offset);
      offset += f.nameBytes.length;
    }

    const centralDirSize = offset - centralDirStart;

    // End of central directory record (EOCD)
    view.setUint32(offset, 0x06054b50, true); // EOCD signature
    view.setUint16(offset + 4, 0, true); // Disk num
    view.setUint16(offset + 6, 0, true); // Start disk
    view.setUint16(offset + 8, this.files.length, true); // Entries on this disk
    view.setUint16(offset + 10, this.files.length, true); // Total entries
    view.setUint32(offset + 12, centralDirSize, true); // Central dir size
    view.setUint32(offset + 16, centralDirStart, true); // Central dir offset
    view.setUint16(offset + 20, 0, true); // Comment len

    return out;
  }
}

// Export for Node, ES Modules, and Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleZip };
} else if (typeof window !== 'undefined') {
  window.SimpleZip = SimpleZip;
} else if (typeof self !== 'undefined') {
  self.SimpleZip = SimpleZip;
}
