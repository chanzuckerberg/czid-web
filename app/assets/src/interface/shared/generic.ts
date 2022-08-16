// this file has structural or display based shared types

export type BooleanNums = 0 | 1;

export type DateString = string;

export interface DropdownOption {
  text: string;
  value: string | number;
}

export interface NumberId {
  id: number;
}

export interface LabelVal {
  label: string;
  value: string;
}
export interface NameUrl {
  name: string;
  url: string;
}
