/** Removes null and undefined while casting to NonNullable<>. */
export function isNotNullish<T>(item: T): item is NonNullable<T> {
  return item != null;
}
