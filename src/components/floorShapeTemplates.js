// Common warehouse layout templates.
//
// Instead of forcing users to draw a shape dot-by-dot every time, each
// template computes a starter set of filled cells for a given (rows, cols)
// grid. The user can still fine-tune the result in FloorShapeEditor
// afterwards — this just removes the "blank grid, click every dot" cold
// start for the shapes people draw most often.
//
// A cell is represented as { row, col }, matching what FloorShapeEditor's
// getCells()/clear() already work with.

function fullGrid(rows, cols) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) cells.push({ row: r, col: c });
  }
  return cells;
}

export const FLOOR_SHAPE_TEMPLATES = [
  {
    id: "blank",
    label: "Blank canvas",
    description: "Start empty and draw the shape by hand.",
    getCells: () => [],
  },
  {
    id: "rectangle",
    label: "Full rectangle",
    description: "Fills the entire grid. The most common layout.",
    getCells: (rows, cols) => fullGrid(rows, cols),
  },
  {
    id: "l-shape",
    label: "L-shape",
    description: "Rectangle with one corner cut out.",
    getCells: (rows, cols) => {
      const cutRows = Math.max(1, Math.floor(rows / 2));
      const cutCols = Math.max(1, Math.floor(cols / 2));
      return fullGrid(rows, cols).filter(
        ({ row, col }) => !(row < cutRows && col >= cols - cutCols),
      );
    },
  },
  {
    id: "u-shape",
    label: "U-shape",
    description: "Two wings connected along the bottom, open at the top.",
    getCells: (rows, cols) => {
      const notchRows = Math.max(1, Math.floor(rows / 2));
      const notchStart = Math.floor(cols / 3);
      const notchEnd = cols - Math.floor(cols / 3);
      return fullGrid(rows, cols).filter(
        ({ row, col }) =>
          !(row < notchRows && col >= notchStart && col < notchEnd),
      );
    },
  },
  {
    id: "t-shape",
    label: "T-shape",
    description: "A wide top bar over a narrow stem.",
    getCells: (rows, cols) => {
      const barRows = Math.max(1, Math.ceil(rows / 3));
      const stemWidth = Math.max(1, Math.floor(cols / 3));
      const stemStart = Math.floor((cols - stemWidth) / 2);
      return fullGrid(rows, cols).filter(
        ({ row, col }) =>
          row < barRows || (col >= stemStart && col < stemStart + stemWidth),
      );
    },
  },
];
