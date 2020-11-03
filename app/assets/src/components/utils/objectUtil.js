import { transform, isEqual, isObject } from "lodash/fp";

const _transform = transform.convert({
  cap: false,
});

const iteratee = baseObj => (result, value, key) => {
  if (!isEqual(value, baseObj[key])) {
    const valueIsObject = isObject(value) && isObject(baseObj[key]);
    result[key] = valueIsObject === true ? diff(value, baseObj[key]) : value;
  }
};

// Given two objects, return the differences between the two in a new object.
// See: https://gist.github.com/Yimiprod/7ee176597fef230d1451
//
// i.e.
//      obj1 = {
//        b: 2,
//        c: ['2', '1'],
//        d: { baz: 1, bat: 2 },
//        e: 1
//      }
//
//      obj2 = {
//        a: 1,
//        b: 2,
//        c: ['1', '2'],
//        d: { baz: 1, bat: 2 }
//      }
//
//      diff(obj1, obj2) => { a: 1, c: ["1", "2"] }

export const diff = (targetObj, baseObj) => {
  return _transform(iteratee(baseObj), null, targetObj);
};
