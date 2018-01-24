/**
 * @class StringHelper
*/
class StringHelper {
  /**
   * @method baseName
   * @param {String} str
   * @desc accepts a path and returns the filename
   * @return {String} actual filename from the path
  */
  static baseName(str) {
    let base = `${str}`.substring(str.lastIndexOf('/') + 1);
    if (base.lastIndexOf('.') !== -1) {
      base = base.substring(0, base.lastIndexOf('.'));
    }
    return base;
  }
}

export default StringHelper;
