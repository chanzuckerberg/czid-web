/**
  @function numberWithCommas
  @param {Number} x
  @return {String} comma separated numbers
*/
export function numberWithCommas(x) {
  if (!x) {
    return x;
  }
  x = x.toString();
  const pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x)) {
    x = x.replace(pattern, "$1,$2");
  }
  return x;
}

/**
 * @param  {String}
 * @return {String}
 *
 * > humanize('taxon_tree')
 * "Taxon Tree"
 */
export function humanize(key) {
  return key
    .split("_")
    .map(str => str.charAt(0).toUpperCase() + str.slice(1))
    .join(" ");
}
