export default class ArrayUtils {
  static equal(array1, array2) {
    if (array1 === array2) return true;
    // Feature: if one of them is not an array return false.
    // Make sure you send arrays for comparison
    if (!Array.isArray(array1) || !Array.isArray(array2)) return false;

    if (array1.length !== array2.length) {
      return false;
    }
    // one-level comparison: will only compare object references
    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        return false;
      }
    }
    return true;
  }

  // Use binary search to find the closest neighbors to a value in a sorted array.
  static findClosestNeighbors(sortedArray, value) {
    if (sortedArray.length === 0) {
      return [];
    }

    if (sortedArray.length === 1) {
      return [sortedArray[0], sortedArray[0]];
    }

    let low = 0;
    let high = sortedArray.length - 1;

    // Stop once low and high are consecutive.
    while (low + 1 < high) {
      const curIndex = Math.round((low + high) / 2);

      if (sortedArray[curIndex] <= value) {
        low = curIndex;
      } else {
        high = curIndex;
      }
    }

    // value must be between arr[low] and arr[high].
    // UNLESS value < min(sortedArray) or value > max(sortedArray)
    if (value < sortedArray[low]) {
      return [sortedArray[low]];
    }
    if (value > sortedArray[high]) {
      return [sortedArray[high]];
    }

    return [sortedArray[low], sortedArray[high]];
  }
}
