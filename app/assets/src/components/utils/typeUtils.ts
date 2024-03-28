/** Removes null and undefined while casting to NonNullable<>. */
export function isNotNullish<T>(item: T): item is NonNullable<T> {
  return item != null;
}

/** Util for making TS guarantee that a switch statement covers all possibilities. */
export function checkExhaustive(switchCase: never): void {
  throw new Error(
    `Exhaustive switch check should never read here for value ${switchCase}`,
  );
}
