// this file has structural or display based shared types

export type BooleanNums = 0 | 1;

export type DateString = string;

export interface DropdownOption {
  text: string;
  value: string | number;
}

export interface MustHaveId {
  id: number;
}

export interface NumberId {
  name: string;
  id: number;
}

export interface NameId extends NumberId {
  name: string;
}

export interface LabelVal {
  label: string;
  value: string;
}
export interface NameUrl {
  name: string;
  url: string;
}

export interface CSV {
  headers: string[];
  rows: string[][];
}

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type CreateMutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];
};
