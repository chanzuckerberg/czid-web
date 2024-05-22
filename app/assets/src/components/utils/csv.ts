import {
  at,
  find,
  flatten,
  forEach,
  get,
  getOr,
  has,
  head,
  isEmpty,
  isNumber,
  isString,
  map,
  snakeCase,
  tail,
} from "lodash/fp";
import Papa from "papaparse";
import { CATEGORIES } from "~/components/ui/labels/PathogenLabel";
import {
  getWorkflowTypeFromLabel,
  WorkflowType,
} from "~/components/utils/workflows";
import { countActiveFilters } from "~/components/views/SampleView/components/AmrView/components/AmrFiltersContainer/utils";
import { AmrResult } from "~/components/views/SampleView/components/AmrView/components/AmrSampleReport/types";
import {
  ColumnSection,
  SECTION_TO_COLUMN_IDS,
} from "~/components/views/SampleView/components/AmrView/constants";
import {
  BACKGROUND_FIELDS,
  getAppliedFilters,
  hasAppliedFilters,
  TAXON_COUNT_TYPE_METRICS,
  TAXON_GENERAL_FIELDS,
} from "~/components/views/SampleView/utils";
import { ThresholdFilterData } from "~/interface/dropdown";
import { FilterSelections } from "~/interface/sampleView";
import { Entries } from "~/interface/shared";
import {
  FiltersType,
  FilterType,
  TypeFilterType,
} from "../views/SampleView/components/AmrView/components/AmrFiltersContainer/types";
import { logError } from "./logUtil";
import { IdMap } from "./objectUtil";

// Assumes that the CSV has headers.
export const parseCSVBlob = (blob: string) => {
  const csvData = Papa.parse(blob, {
    skipEmptyLines: true,
  }).data;

  return {
    headers: head(csvData),
    rows: tail(csvData),
  };
};

const escapeFormulae = (datum: string) => {
  // Defend against injection attacks, because Excel and LibreOffice will automatically parse =, +, -, or @ such cells as formulae.
  // Formulae Injection Attacks: https://www.contextis.com/en/blog/comma-separated-vulnerabilities

  // Replace only replaces the first occurence. To replace all +, -, =, @, we use the global g flag for RegExp.
  return datum.replace(/^[=+\-@]/g, "");
};

export const sanitizeCSVRow = (row: string[]) => {
  if (!isEmpty(row)) {
    return row.map(val => {
      if (isNumber(val)) {
        return val;
      } else if (isString(val)) {
        return escapeFormulae(val);
      } else {
        return "";
      }
    });
  } else {
    logError({
      message: "CSV Util: Empty row provided into sanitizeCSVRow()",
    });
  }
};

// "headers" (Array containing 1 comma delimited string) are the csv table headers and looks like:
//     ["taxId,taxLevel,genus_tax_id,name,common_name,categ…_mean_mass_normalized,nr.bg_stdev_mass_normalized"]
// "rows" (Array containing N Arrays each of which contains 1 comma delimited string) are the csv table rows and looks like:
//     [
//        ["694002,"genus",694002,"Betacoronavirus","","viruse…187294,99.9763,4399.69,0.00284868,"-","-","-","-""],
//        ["694009,"species",694002,"Severe acute respiratory …98.5,187350,1,187294,100,4399.7,0,"-","-","-","-""],
//     ]
export const createCSVObjectURL = (headers: string[], rows: string[][]) => {
  const csvData = [headers].concat(rows);
  const dataString = csvData.join("\n");
  const dataBlob = new Blob([dataString], { type: "text/csv" });
  return URL.createObjectURL(dataBlob);
};

export const createCSVRowForAppliedFilters = (
  appliedFilters: Omit<
    FilterSelections,
    "nameType" | "metricShortReads" | "metricLongReads" | "background"
  >,
  backgrounds,
  selectedOptions,
) => {
  const filterRow = [];
  if (selectedOptions.background) {
    const selectedBackgroundName = find(
      { id: selectedOptions.background },
      backgrounds,
    ).name;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    filterRow.push(`\nBackground:, "${selectedBackgroundName}"`);
  }

  let numberOfFilters = 0;
  const entries = Object.entries(appliedFilters) as Entries<FilterSelections>;
  for (const [optionName, optionVal] of entries) {
    if (!optionVal) continue;
    switch (optionName) {
      case "categories": {
        const categoryFilters = [];

        if (has("categories", optionVal)) {
          const categories = get("categories", optionVal);
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          categoryFilters.push(categories);
          numberOfFilters += categories.length;
        }

        if (has("subcategories", optionVal)) {
          const subcategories = [];
          for (const [subcategoryName, subcategoryVal] of Object.entries(
            get("subcategories", optionVal),
          )) {
            if (!isEmpty(subcategoryVal)) {
              subcategories.push(
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
                `${subcategoryName} - ${subcategoryVal.join()}`,
              );
            }
          }
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          categoryFilters.push(subcategories);
          numberOfFilters += subcategories.length;
        }

        const flattenedCategoryFilters = flatten(categoryFilters).join();
        if (!isEmpty(flattenedCategoryFilters)) {
          // Explicitly add commas to create blank cells for formatting purposes
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          filterRow.push(`Categories:, ${flattenedCategoryFilters}`);
        }

        break;
      }
      case "taxa": {
        optionVal.forEach((taxon: $TSFixMe) => {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          filterRow.push(`Taxon Name:, ${get("name", taxon)}`);
          numberOfFilters += 1;
        });
        break;
      }
      case "thresholdsShortReads":
      case "thresholdsLongReads": {
        const thresholdFilters = optionVal.reduce(
          (result: $TSFixMe, threshold: $TSFixMe) => {
            result.push(
              `${threshold["metricDisplay"]} ${threshold["operator"]} ${threshold["value"]}`,
            );
            return result;
          },
          [],
        );

        if (!isEmpty(thresholdFilters)) {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          filterRow.push(`Thresholds:, ${thresholdFilters.join()}`);
          numberOfFilters += thresholdFilters.length;
        }
        break;
      }
      case "readSpecificity": {
        const readSpecificityOptions = {
          0: "All",
          1: "Specific Only",
        };

        filterRow.push(
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          `Read Specificity:, "${readSpecificityOptions[optionVal]}"`,
        );
        numberOfFilters += 1;
        break;
      }
      case "flags": {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        filterRow.push(`Pathogen Flags:, ${optionVal.join(",")}`);
        numberOfFilters += 1;
        break;
      }
      default:
        logError({
          message:
            "SampleView: Invalid filter passed to createCSVRowForSelectedOptions()",
          details: { optionName, optionVal },
        });
        break;
    }
  }

  // Insert filter statement after Background if background is selected
  filterRow.splice(
    selectedOptions.background ? 1 : 0,
    0,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    `${numberOfFilters} Filter${numberOfFilters > 1 ? "s" : ""} Applied:`,
  );

  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
  return [sanitizeCSVRow(filterRow).join()];
};

const _addPathogenFlagColumns = datum => {
  // get the genus count of pathogens out of datum.pathogens
  const { [CATEGORIES.knownPathogen.code]: known_pathogen } =
    datum.pathogens || {};

  datum.known_pathogen = known_pathogen || 0;

  datum.filteredSpecies.forEach(species => {
    species.known_pathogen = (species.pathogenFlags || []).includes(
      CATEGORIES.knownPathogen.code,
    )
      ? 1
      : 0;
  });
};

// The order of these column headers is important for the CSV as this is the order that the columns will appear.
const AMR_CSV_COLUMN_HEADERS = map(snakeCase, [
  ...SECTION_TO_COLUMN_IDS.get(ColumnSection.GENE_INFO),
  ...SECTION_TO_COLUMN_IDS.get(ColumnSection.CONTIGS),
  ...SECTION_TO_COLUMN_IDS.get(ColumnSection.READS),
]);

export const computeAmrReportTableValuesForCSV = ({
  activeFilters,
  displayedRows,
}: {
  activeFilters: FiltersType | null;
  displayedRows: IdMap<AmrResult>;
}) => {
  const csvRows = [];
  const csvHeaders = AMR_CSV_COLUMN_HEADERS;

  forEach((row: AmrResult) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line - running into a lodash type error with `at`
    csvRows.push(sanitizeCSVRow(at(csvHeaders, row)).join());
  }, Object.values(displayedRows));

  const activeFiltersRow = generateCSVRowForActiveFilters(activeFilters);
  const csvHeaderRow = csvHeaders.join();
  return [[[activeFiltersRow, csvHeaderRow].join("\n")], csvRows];
};

// The active filters row is added to the end of the CSV which describes the filters that were applied to the report
// e.g. 2 Filters Applied: | Thresholds: | rPM (reads per million) >= 1 | Number of Contigs >= 1
const generateCSVRowForActiveFilters = (activeFilters: FiltersType | null) => {
  const numberOfFilters = activeFilters ? countActiveFilters(activeFilters) : 0;
  const filterStatement = `# ${numberOfFilters} Filter${
    numberOfFilters === 1 ? "" : "s"
  } Applied:`;
  const filterRow = [filterStatement];

  if (!activeFilters) return [sanitizeCSVRow(filterRow)?.join()];
  const values = Object.values(activeFilters);
  const thresholdFilters: string[] = [];
  let drugClassFilters = "";
  values.forEach((value: FilterType) => {
    if (value.type === TypeFilterType.THRESHOLD) {
      if (!value.params.thresholdFilters) return;
      value.params.thresholdFilters.forEach(
        (threshold: ThresholdFilterData) => {
          thresholdFilters.push(
            `${threshold["metricDisplay"]} ${threshold["operator"]} ${threshold["value"]}`,
          );
        },
      );
    } else if (value.type === TypeFilterType.MULTIPLE) {
      if (!value.params.multiSelected) return;
      drugClassFilters = value.params.multiSelected.join();
    }
  });

  if (!isEmpty(thresholdFilters)) {
    filterRow.push(`Thresholds:, ${thresholdFilters.join()}`);
  }

  if (drugClassFilters) {
    filterRow.push(`Drug Classes:, ${drugClassFilters}`);
  }

  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
  return [sanitizeCSVRow(filterRow).join()];
};

export const computeMngsReportTableValuesForCSV = (
  filteredReportData,
  selectedOptions,
  backgrounds,
  currentTab,
): [string[], string[][]] => {
  const workflow = getWorkflowTypeFromLabel(currentTab);
  const csvRows: string[][] = [];
  const csvHeaders = [
    ...TAXON_GENERAL_FIELDS,
    ...(workflow === WorkflowType.SHORT_READ_MNGS ? BACKGROUND_FIELDS : []),
    ...Array.from(TAXON_COUNT_TYPE_METRICS[workflow], metric => "nt." + metric),
    ...Array.from(TAXON_COUNT_TYPE_METRICS[workflow], metric => "nr." + metric),
  ];
  const pathogenFlagHeaders = ["known_pathogen"];
  csvHeaders.push(...pathogenFlagHeaders);

  filteredReportData.forEach((datum: $TSFixMe) => {
    _addPathogenFlagColumns(datum);
    const genusRow: $TSFixMe = [];
    csvHeaders.forEach(column => {
      let val = JSON.stringify(getOr("-", column, datum));
      val = val === "null" ? '"-"' : val;

      // If value contains a comma, add double quotes around it to preserve the comma and prevent the creation of a new column.
      genusRow.push(val.includes(",") ? `"${val}"` : val);
    });
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    csvRows.push([sanitizeCSVRow(genusRow).join()]);

    if (has("filteredSpecies", datum)) {
      datum["filteredSpecies"].forEach((speciesTaxon: $TSFixMe) => {
        const speciesRow: $TSFixMe = [];
        csvHeaders.forEach(column => {
          let val = JSON.stringify(getOr("-", column, speciesTaxon));
          val = val === "null" ? '"-"' : val;

          // If value contains a comma, add double quotes around it to preserve the comma and prevent the creation of a new column.
          speciesRow.push(val.includes(",") ? `"${val}"` : val);
        });
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        csvRows.push([sanitizeCSVRow(speciesRow).join()]);
      });
    }
  });

  if (hasAppliedFilters(currentTab, selectedOptions)) {
    csvRows.push(
      createCSVRowForAppliedFilters(
        getAppliedFilters(selectedOptions),
        backgrounds,
        selectedOptions,
      ),
    );
  }

  return [[csvHeaders.join()], csvRows];
};
