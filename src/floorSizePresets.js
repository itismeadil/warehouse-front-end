// Three fixed canvas sizes a floor can be drawn on. The person never sees the
// numbers — they just tap a small/medium/large square. Internally that maps
// to how many dots wide/tall the drawing canvas is.
export const FLOOR_SIZE_PRESETS = [
  { id: "small", rows: 30, cols: 30, previewPx: 16 },
  { id: "medium", rows: 60, cols: 60, previewPx: 24 },
  { id: "large", rows: 100, cols: 100, previewPx: 32 },
];
