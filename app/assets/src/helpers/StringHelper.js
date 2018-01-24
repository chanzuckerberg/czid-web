class StringHelper {
  static baseName(str) {
     var base = new String(str).substring(str.lastIndexOf('/') + 1);
      if(base.lastIndexOf(".") != -1) {
        base = base.substring(0, base.lastIndexOf("."));
      }
     return base;
  }
}

export default StringHelper;
