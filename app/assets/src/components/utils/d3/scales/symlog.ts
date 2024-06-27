import d3 from "d3";
import compound from "./compound";

function intersection(r1: $TSFixMe, r2: $TSFixMe) {
  const reverse = r1[0] > r1[1];
  if (reverse) r1 = r1.slice().reverse();

  const min = r1[0] < r2[0] ? r1 : r2;
  const max = min === r1 ? r2 : r1;
  if (min[1] < max[0]) return null;

  let section = [max[0], min[1] < max[1] ? min[1] : max[1]];
  if (section[0] === section[1]) return null;

  if (reverse) section = section.slice().reverse();
  return section;
}

function rescale(range: $TSFixMe, domain: $TSFixMe) {
  const logScale = d3.scale.log();
  const parts: { domain: $TSFixMe[]; type: $TSFixMe; extent: $TSFixMe }[] = [];

  // Negative log scale
  let d = intersection(domain, [Number.NEGATIVE_INFINITY, -1]);
  if (d) {
    parts.push({
      domain: d,
      type: d3.scale.log,
      extent: logScale(Math.abs(d[1] - d[0]) + 1) - logScale(1),
    });
  }

  // Linear scale
  d = intersection(domain, [-1, 1]);
  if (d) {
    parts.push({
      domain: d,
      type: d3.scale.linear,
      extent: Math.abs(d[1] - d[0]) * (logScale(2) - logScale(1)),
    });
  }

  // Positive log scale
  d = intersection(domain, [1, Number.POSITIVE_INFINITY]);
  if (d) {
    parts.push({
      domain: d,
      type: d3.scale.log,
      extent: logScale(Math.abs(d[1] - d[0]) + 1) - logScale(1),
    });
  }

  // Create the scales
  const scales = [];
  const rangeSize = range[1] - range[0];
  const rangeExtent = parts.reduce(function (acc, part) {
    return part.extent + acc;
  }, 0);
  let rangeStart = range[0];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.extent > 0) {
      const ratio = part.extent / rangeExtent;
      const next =
        i === parts.length - 1 ? range[1] : rangeStart + ratio * rangeSize;
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      scales.push(part.type().domain(part.domain).range([rangeStart, next]));
      rangeStart = next;
    }
  }

  return scales;
}

export default function symlog() {
  const scale = compound(d3.scale.linear());
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
  const compoundRange = scale.range;
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
  const compoundDomain = scale.domain;

  // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
  scale.domain = function (_: $TSFixMe) {
    return arguments.length
      ? // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
        scale.scales(rescale(scale.range(), _))
      : compoundDomain();
  };

  // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
  scale.range = function (_: $TSFixMe) {
    return arguments.length
      ? // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
        scale.scales(rescale(_, scale.domain()))
      : compoundRange();
  };

  return scale;
}
