export default function numberWithCommas(x) {
	if (!x) {
		return x;
	}
  x = x.toString();
  var pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x))
      x = x.replace(pattern, "$1,$2");
  return x;
}
