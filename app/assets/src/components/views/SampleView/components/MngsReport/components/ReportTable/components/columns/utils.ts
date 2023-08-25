import { getOr, orderBy, reduce } from "lodash/fp";
import { TAX_LEVEL_GENUS } from "~/components/views/SampleView/utils";
import { Taxon } from "~/interface/shared";

export function getCountTypeValuesFromDataRow({
  rowData,
  field,
  defaultValue,
  countTypes = ["nt", "nr"],
}: {
  rowData: Taxon;
  field: string;
  defaultValue: number | string;
  countTypes?: string[];
}): (number | string)[] {
  return reduce(
    (result, countType) => {
      result.push(getOr(defaultValue, [countType, field], rowData));
      return result;
    },
    [],
    countTypes,
  );
}

export const nestedSortFunction = ({
  data,
  path,
  sortDirection,
  nullValue,
  limits,
}: {
  data?: Taxon[];
  path: string[];
  sortDirection?: "asc" | "desc";
  nullValue?: string | number;
  limits?: number[] | string[];
}) => {
  // Uses lodash's orderBy function.
  // It uses a triple sorting key that enables nested sorting of genus and species, while guaranteeing that
  // genus is always on top of its children species
  return orderBy(
    [
      // 1st value: value defined by path for the genus (guarantees all genus together)
      // note: a species row has a field .genus that points to their genus
      rowData =>
        rowData.genus
          ? getOr(nullValue, [TAX_LEVEL_GENUS].concat(path), rowData)
          : getOr(nullValue, path, rowData),
      // 2nd value: the genus tax id
      // this value guarantees that we keep species within their genus, even if the first value is duplicated
      // e.g. if two genus have 2 reads they would be together on top and they species after them,
      // adding tax id guarantees all the species are below their respective genus
      rowData => (rowData.genus ? rowData.genus.taxId : rowData.taxId),
      // 3rd value: value defined by path for the species if species row;
      // using the limit value for genus based on direction guarantees that genus are always on top of their species.
      // e.g.
      //   genus A with tax id of 1001 has 2 reads and has species A1 with 1 read, and A2 with 1 read
      //   genus B with tax id of 1002 has 2 reads and has species B1 with 2 reads
      // without tax id, the ascending order would be A: [2, -], B: [2, -], A1: [2, 1], A2 [2, 1] B1: [2, 2]
      // with tax id, the ascending order would be A: [2, 1001, -], A1: [2, 1001, 1], A2: [2, 1001, 1], B: [2, 1002, -], B1: [2, 1002, 2]
      rowData =>
        rowData.genus
          ? getOr(nullValue, path, rowData)
          : sortDirection === "asc"
          ? limits[0]
          : limits[1],
    ],
    [sortDirection, sortDirection, sortDirection],
    data,
  );
};

export const nestedNtNrSortFunction = ({
  dbType,
  data,
  path,
  sortDirection,
  nullValue,
  limits,
}) => {
  return nestedSortFunction({
    path: [dbType].concat(path),
    data,
    sortDirection,
    nullValue,
    limits,
  });
};
