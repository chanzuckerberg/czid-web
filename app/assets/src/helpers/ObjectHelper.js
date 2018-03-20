/**
 * @class ObjectHelper
*/
class ObjectHelper {
  static shallowEquals(a, b) {
    for(var key in a) {
      if(!(key in b) || a[key] !== b[key]) {
          return false;
      }
    }
    for(key in b) {
      if(!(key in a) || a[key] !== b[key]) {
          return false;
      }
    }

    return true;
  }
}

export default ObjectHelper;
