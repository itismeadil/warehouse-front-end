// A floor's drawn shape is packed as 1 bit per dot and base64-encoded before
// it's sent to the backend, so a floor document stays small (~1.25KB even
// for a fully painted 100x100 floor) instead of storing one object per dot.

export function encodeShape(rows, cols, cells) {
  const activeSet =
    cells instanceof Set ? cells : new Set(cells.map((c) => `${c.row}-${c.col}`));

  const bytes = new Uint8Array(Math.ceil((rows * cols) / 8));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (activeSet.has(`${r}-${c}`)) {
        const bitIndex = r * cols + c;
        bytes[bitIndex >> 3] |= 1 << bitIndex % 8;
      }
    }
  }

  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function decodeShape(rows, cols, base64) {
  if (!base64) return [];

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bitIndex = r * cols + c;
      if (bytes[bitIndex >> 3] & (1 << bitIndex % 8)) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

// A part's location is always a filled rectangle (the picker guarantees
// this), so it's stored as 4 numbers. This expands it back into individual
// dots — only ever done client-side, only for rendering/click-detection.
export function expandArea(area) {
  if (!area) return [];
  const cells = [];
  for (let r = area.rowStart; r <= area.rowEnd; r++) {
    for (let c = area.colStart; c <= area.colEnd; c++) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}

export function areaSize(area) {
  if (!area) return 0;
  return (
    (area.rowEnd - area.rowStart + 1) * (area.colEnd - area.colStart + 1)
  );
}
