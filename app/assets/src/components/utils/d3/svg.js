// Creates a color matrix that can recolor a black icon via a filter. See:
// https://semisignal.com/using-fecolormatrix-to-dynamically-recolor-icons-part-1-single-color-icons/
function generateColorMatrix(rgb) {
  const rScaled = rgb[0] / 255.0;
  const gScaled = rgb[1] / 255.0;
  const bScaled = rgb[2] / 255.0;
  return `0 0 0 0 ${rScaled}
          0 0 0 0 ${gScaled}
          0 0 0 0 ${bScaled}
          0 0 0 1 0`;
}

// Convert hex string to rgb array
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export default function addSvgColorFilter(defs, id, color) {
  defs
    .append("filter")
    .attr("id", id)
    .append("feColorMatrix")
    .attr("color-interpolation-filters", "sRGB")
    .attr("type", "matrix")
    .attr("values", generateColorMatrix(hexToRgb(color)));
  return defs;
}
