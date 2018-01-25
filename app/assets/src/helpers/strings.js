/**
  @function numberWithCommas
  @param {Number} x
  @return {String} comma separated numbers
*/
function numberWithCommas(x) {
  if (!x) {
    return x;
  }
  x = x.toString();
  const pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x)) {
    x = x.replace(pattern, '$1,$2');
  }
  return x;
}

export default numberWithCommas;
