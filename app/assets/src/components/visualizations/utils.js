// Data passed into this function should be an array of objects in the form:
// [
//  ...
//  { dataKey1: value1, dataKey2: value2, total: value1 + value2 },
//  { dataKey1: value2, dataKey2: value3, total: value3 + value4 },
//  ...
// ]
export const normalizeData = (data, keys) => {
  return data.map(d => {
    var normD = Object.assign({}, d);
    keys.forEach(key => {
      normD[key] = (d[key] / d["total"]) * 100;
    });
    normD["total"] = 100;
    return normD;
  });
};
