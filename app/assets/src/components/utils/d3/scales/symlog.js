import compound from "./compound";
import d3 from "d3";

function intersection(r1, r2) {
  let reverse = r1[0] > r1[1];
  if (reverse) r1 = r1.slice().reverse();

  let min = r1[0] < r2[0] ? r1 : r2;
  let max = min === r1 ? r2 : r1;
  if (min[1] < max[0]) return null;

  let section = [max[0], min[1] < max[1] ? min[1] : max[1]];
  if (section[0] === section[1]) return null;

  if (reverse) section = section.slice().reverse();
  return section;
}

function rescale(range, domain) {
  let logScale = d3.scale.log(),
    d,
    parts = [];

  // Negative log scale
  d = intersection(domain, [Number.NEGATIVE_INFINITY, -1]);
  if (d) {
    parts.push({
      domain: d,
      type: d3.scale.log,
      extent: logScale(Math.abs(d[1] - d[0]) + 1) - logScale(1)
    });
  }

  // Linear scale
  d = intersection(domain, [-1, 1]);
  if (d) {
    parts.push({
      domain: d,
      type: d3.scale.linear,
      extent: Math.abs(d[1] - d[0]) * (logScale(2) - logScale(1))
    });
  }

  // Positive log scale
  d = intersection(domain, [1, Number.POSITIVE_INFINITY]);
  if (d) {
    parts.push({
      domain: d,
      type: d3.scale.log,
      extent: logScale(Math.abs(d[1] - d[0]) + 1) - logScale(1)
    });
  }

  // Create the scales
  let scales = [];
  let rangeSize = range[1] - range[0];
  let rangeExtent = parts.reduce(function(acc, part) {
    return part.extent + acc;
  }, 0);
  let rangeStart = range[0];
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    if (part.extent > 0) {
      let ratio = part.extent / rangeExtent;
      let next =
        i === parts.length - 1 ? range[1] : rangeStart + ratio * rangeSize;
      scales.push(
        part
          .type()
          .domain(part.domain)
          .range([rangeStart, next])
      );
      rangeStart = next;
    }
  }

  return scales;
}

export default function symlog() {
  let scale = compound(d3.scale.linear()),
    compoundRange = scale.range,
    compoundDomain = scale.domain;

  scale.domain = function(_) {
    return arguments.length
      ? scale.scales(rescale(scale.range(), _))
      : compoundDomain();
  };

  scale.range = function(_) {
    return arguments.length
      ? scale.scales(rescale(_, scale.domain()))
      : compoundRange();
  };

  return scale;
}
