import { set as _set } from "lodash/fp";
/**
 * @class ObjectHelper
 */
class ObjectHelper {
  static shallowEquals(a, b) {
    for (var key in a) {
      if (!(key in b) || a[key] !== b[key]) {
        return false;
      }
    }
    for (key in b) {
      if (!(key in a) || a[key] !== b[key]) {
        return false;
      }
    }

    return true;
  }
  static sortByKey(arr, key) {
    return arr.sort((a, b) => {
      const aVal = a[key].toLowerCase(),
        bVal = b[key].toLowerCase();
      return aVal > bVal ? 1 : bVal > aVal ? -1 : 0;
    });
  }
  static deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  // Sets the value at path of object, and returns new object.
  static set(obj, path, value) {
    return _set(path, value, obj);
  }
}

export default ObjectHelper;
