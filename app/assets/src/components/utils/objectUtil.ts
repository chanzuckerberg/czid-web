import { camelCase, isArray, isEqual, isObject, transform } from "lodash/fp";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const _transform = transform.convert({
  cap: false,
});

const iteratee =
  (baseObj: object) => (result: unknown, value: object, key: string) => {
    if (!isEqual(value, baseObj[key])) {
      const valueIsObject = isObject(value) && isObject(baseObj[key]);
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2571
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

/*
 * Given a map with string keys and string values
 * allow lookup in either direction
 * get: key --> value
 * revGet: value --> key
 * There cannot be duplicate values in the map
 */
export class TwoWayKeyStringMap {
  map: { [key: string]: string };
  reverseMap: { [key: string]: string };

  constructor(map: { [key: string]: string }) {
    this.map = map;
    this.reverseMap = {};
    for (const key in map) {
      const value = map[key];
      if (Object.prototype.hasOwnProperty.call(this.reverseMap, value)) {
        throw new Error(`Duplicate value, ${value}, in TwoWayMap`);
      }
      this.reverseMap[value] = key;
    }
  }
  get(key) {
    return this.map[key];
  }
  revGet(key) {
    return this.reverseMap[key];
  }
}

/*
 * Given a map with string keys and string[] values
 * allow lookups in either direction
 * get: key --> value[]
 * revGet: value --> key
 * A given value can only appear in one of the value lists
 */
export class TwoWayKeyListMap {
  map: { [key: string]: string[] };
  reverseMap: { [key: string]: string };

  constructor(map: { [key: string]: string[] }) {
    this.map = map;
    this.reverseMap = {};
    for (const key in map) {
      const values = map[key];
      for (const value of values) {
        if (Object.prototype.hasOwnProperty.call(this.reverseMap, value)) {
          throw new Error(
            `Duplicate value, ${value}, in TwoWayKeyListMap. Is this value in multiple lists?`,
          );
        }
        this.reverseMap[value] = key;
      }
    }
  }
  get(key) {
    return this.map[key];
  }
  revGet(key) {
    return this.reverseMap[key];
  }
}
