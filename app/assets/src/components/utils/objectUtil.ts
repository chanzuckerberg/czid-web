import { transform, isEqual, isObject, isArray, camelCase } from "lodash/fp";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const _transform = transform.convert({
  cap: false,
});

const iteratee = (baseObj: object) => (
  result: unknown,
  value: object,
  key: string,
) => {
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

export const diff = (targetObj: object, baseObj: object) => {
  return _transform(iteratee(baseObj), null, targetObj);
};

export interface IdMap<T> {
  [key: string]: T;
}

/**
 * Reduces an array of objects to a mapping between the keyString arg and the objects
 * that make up the array. Effective for quickly looking up objects by id, for example.
 */
export const reduceObjectArrayToLookupDict = <T extends Record<string, any>>(
  arr: T[],
  keyedOn: string,
): IdMap<T> => {
  const keyValuePairs = arr.map((obj: T) => {
    const id = obj[keyedOn];
    return [id, obj];
  });
  return Object.fromEntries(keyValuePairs);
};

/**
 * Accepts any object with arbitrary levels of nesting (the nested bits can be objs or arrays),
 * and returns essentially the same object with all the keys camelCased instead of snake_cased.
 * Useful for parsing backend responses.
 * We prefer lodash/fp and transform does not work as expected:
 * https://github.com/lodash/lodash/issues/4434
 * As a work around, this function avoids lodash/fp all together
 */
export const camelize = obj => {
  if (isObject(obj)) {
    const n = {};
    Object.keys(obj).forEach(k => {
      n[camelCase(k)] = camelize(obj[k]);
    });
    return n;
  } else if (isArray(obj)) {
    return obj.map(i => {
      return camelize(i);
    });
  }

  return obj;
};
