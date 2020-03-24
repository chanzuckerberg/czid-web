import { Matrix, inverse } from "ml-matrix";

export const inverseTransformDOMCoordinates = (transformedElement, x, y) => {
  const cssMatrixString = window
    .getComputedStyle(transformedElement)
    .getPropertyValue("transform");
  const [a, b, c, d] = cssMatrixString
    .replace(/(matrix\()|(\))+/gi, "")
    .split(", ")
    .map(str => parseFloat(str))
    .slice(0, 4);

  if (a === 1 && b === 0 && c === 0 && d === 1) {
    return { x: x, y: y };
  }

  const scalingMatrix = new Matrix([[a, c], [b, d]]);
  const invScalingMatrix = inverse(scalingMatrix);

  const coordinates = Matrix.columnVector([x, y]);
  const scaledCoordinates = invScalingMatrix.mmul(coordinates);

  return { x: scaledCoordinates.get(0, 0), y: scaledCoordinates.get(1, 0) };
};
