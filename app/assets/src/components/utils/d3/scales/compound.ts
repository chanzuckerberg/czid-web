export default function compound(...args: $TSFixMe[]) {
  let scales = args;
  if (scales.length === 0) {
    return null;
  }

  function scale(x: $TSFixMe) {
    for (let i = 0; i < scales.length; i++) {
      const domain = scales[i].domain();
      if (
        Math.min.apply(null, domain) <= x &&
        x <= Math.max.apply(null, domain)
      ) {
        return scales[i](x);
      }
    }
    // Fallback to last scale
    return scales[scales.length - 1](x);
  }

  scale.domain = function () {
    if (arguments.length) {
      throw new Error("Setting a domain is not supported on compound scales");
    }
    const values = [].concat(
      ...scales.map(function (s: { domain: () => any }) {
        return s.domain();
      }),
    );
    let domain = [Math.min.apply(null, values), Math.max.apply(null, values)];
    if (values[0] > values[1]) domain = domain.slice().reverse();
    return domain;
  };

  scale.range = function () {
    if (arguments.length) {
      throw new Error("Setting a range is not supported on compound scales");
    }
    const values = [].concat(
      ...scales.map(function (s) {
        return s.range();
      }),
    );
    let range = [Math.min.apply(null, values), Math.max.apply(null, values)];
    if (values[0] > values[1]) range = range.slice().reverse();
    return range;
  };

  scale.copy = function () {
    // eslint-disable-next-line prefer-spread
    return compound.apply(
      null,
      scales.map(function (s) {
        return s.copy();
      }),
    );
  };

  scale.scales = function (_: $TSFixMe) {
    return arguments.length ? ((scales = _), scale) : scales;
  };

  return scale;
}
