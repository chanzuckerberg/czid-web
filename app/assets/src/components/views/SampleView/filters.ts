import {
  all,
  every,
  flatten,
  get,
  isEmpty,
  isNil,
  map,
  snakeCase,
  some,
  sum,
  values,
} from "lodash/fp";
import { METRIC_DECIMAL_PLACES, TABS } from "./constants";

export const applyFilters = ({
  row,
  categories,
  subcategories,
  thresholds,
  readSpecificity,
  taxa,
  annotations,
  flags,
}: $TSFixMe) => {
  // When adding filters consider their order based on filter complexity (more complex later)
  // and effeciency (filters more likely to filter out more taxa earlier)
  return (
    filterTaxa({ row, taxa }) &&
    filterAnnotations({ row, annotations }) &&
    filterFlags({ row, flags }) &&
    filterCategories({ row, categories, subcategories }) &&
    filterReadSpecificity({ row, readSpecificity }) &&
    filterThresholds({ row, thresholds })
  );
};

const filterTaxa = ({ row, taxa }: $TSFixMe) => {
  // If there's no taxa to filter, then return true
  if (isEmpty(taxa)) return true;

  return some(
    taxon => row.taxId === taxon.id || row.genus_tax_id === taxon.id,
    taxa,
  );
};

const filterAnnotations = ({ row, annotations }: $TSFixMe) => {
  if (isEmpty(annotations)) return true;
  // When this component is converted to typescript, we can define a type for the
  // annotation filters and row data, and remove this comment
  // Use snake case on filter options and raw data for consistent comparisons
  // selected annotation options from filter are "Hit", "Not a hit", "Inconclusive"
  // annotations options from the source data are "hit", "not_a_hit", "inconclusive"
  const selectedAnnotationsInSnakeCase = map(a => snakeCase(a), annotations);
  return selectedAnnotationsInSnakeCase.includes(snakeCase(row.annotation));
};

const filterFlags = ({ row, flags }: $TSFixMe) => {
  if (isEmpty(flags)) return true;
  // check if any of the selected filter flags are found in the row's flags
  let rowFlags = [];
  if (row.taxLevel === "genus") rowFlags = Object.keys(row.pathogens || {});
  else if (row.taxLevel === "species") rowFlags = row.pathogenFlags || [];

  return flags.reduce((result, flag) => {
    return result || rowFlags.includes(flag);
  }, false);
};

const filterCategories = ({ row, categories, subcategories }: $TSFixMe) => {
  // no category have been chosen: all pass
  if (categories.size === 0 && subcategories.size === 0) {
    return true;
  }

  // at least one of taxon's subcategory was selected
  if (
    some(subcategory => subcategories.has(subcategory), row.subcategories || [])
  ) {
    return true;
  }

  // taxon's category was selected and its subcategories were not excluded
  const allSubcategoriesIncluded = all(
    subcategory => subcategories.has(subcategory),
    row.subcategories || [],
  );
  if (
    (categories.has(row.category) && allSubcategoriesIncluded) ||
    (categories.has("uncategorized") && row.category === null)
  ) {
    return true;
  }

  return false;
};

const filterReadSpecificity = ({ row, readSpecificity }: $TSFixMe) => {
  // for read specificity, species filtering is determined by their genus
  return (
    !readSpecificity ||
    (row.taxLevel === "genus" ? row.taxId > 0 : row.genus_tax_id > 0)
  );
};

const filterThresholds = ({ row, thresholds }: $TSFixMe) => {
  if (thresholds && thresholds.length) {
    const res = every(threshold => {
      const { metric, operator, value } = threshold;
      const parsedThresholdValue = parseFloat(value);
      const parsedValue = getTaxonMetricValue(row, metric);

      switch (operator) {
        case ">=":
          return parsedThresholdValue <= parsedValue;
        case "<=":
          return parsedThresholdValue >= parsedValue;
      }
      return true;
    }, thresholds);
    return res;
  }

  return true;
};

const getTaxonMetricValue = (row: $TSFixMe, metric: $TSFixMe) => {
  const parsedMetric = metric.split(":");
  const parsedValue = get(parsedMetric, row);
  return parsedValue;
};

export const adjustMetricPrecision = (species: $TSFixMe) => {
  Object.entries(species).forEach(([key, metricValue]) => {
    if (isNil(metricValue)) {
      // Do nothing
    } else if (key in METRIC_DECIMAL_PLACES) {
      species[key] = parseFloat(
        Number(metricValue).toFixed(METRIC_DECIMAL_PLACES[key]),
      );
    } else if (["nt", "nr", "merged_nt_nr"].includes(key)) {
      Object.entries(species[key]).forEach(([metricKey, metricValue]) => {
        if (metricKey in METRIC_DECIMAL_PLACES && metricValue) {
          species[key][metricKey] = parseFloat(
            Number(metricValue).toFixed(METRIC_DECIMAL_PLACES[metricKey]),
          );
        }
      });
    }
  });
  return species;
};

export const setDisplayName = ({ reportData, nameType }: $TSFixMe) => {
  const useScientific = nameType === "Scientific name";
  reportData.forEach((genus: $TSFixMe) => {
    genus.displayName = useScientific ? genus.name : genus.common_name;
    genus.species.forEach((species: $TSFixMe) => {
      species.displayName = useScientific ? species.name : species.common_name;
    });
  });
};

export const filterReportData = ({
  currentTab,
  reportData,
  filters: {
    categories,
    thresholdsReads,
    thresholdsBases,
    readSpecificity,
    taxa,
    annotations,
    flags,
  },
}: $TSFixMe) => {
  const categoriesSet = new Set(
    map(c => c.toLowerCase(), categories.categories || []),
  );
  const subcategoriesSet = new Set(
    map(sc => sc.toLowerCase(), flatten(values(categories.subcategories))),
  );

  const filteredData: $TSFixMe = [];
  reportData.forEach((genusRow: $TSFixMe) => {
    genusRow.passedFilters = applyFilters({
      row: genusRow,
      categories: categoriesSet,
      subcategories: subcategoriesSet,
      thresholds:
        currentTab === TABS.SHORT_READ_MNGS ? thresholdsReads : thresholdsBases,
      readSpecificity,
      taxa,
      annotations,
      flags,
    });

    genusRow.filteredSpecies = genusRow.species.filter((speciesRow: $TSFixMe) =>
      applyFilters({
        row: speciesRow,
        categories: categoriesSet,
        subcategories: subcategoriesSet,
        thresholds:
          currentTab === TABS.SHORT_READ_MNGS
            ? thresholdsReads
            : thresholdsBases,
        readSpecificity,
        taxa,
        annotations,
        flags,
      }),
    );
    if (genusRow.passedFilters || genusRow.filteredSpecies.length) {
      filteredData.push(genusRow);
    }
  });

  return filteredData;
};

export const countFilters = (currentTab, selectedOptions) => {
  const {
    categories,
    thresholdsReads,
    thresholdsBases,
    taxa,
    annotations,
  } = selectedOptions;

  const numThresholdsFilters =
    currentTab === TABS.SHORT_READ_MNGS
      ? thresholdsReads.length
      : thresholdsBases.length;

  let numFilters = taxa.length;
  numFilters += numThresholdsFilters;
  numFilters += annotations.length;
  numFilters += (categories.categories || []).length;
  numFilters += sum(map(v => v.length, values(categories.subcategories || {})));
  return numFilters;
};
