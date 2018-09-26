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
}
