import ThresholdMap from "../../utils/ThresholdMap";

export const computeThresholdedTaxons = (candidateTaxons, activeThresholds) => {
  let resultTaxons = [];
  let genusTaxon = {};
  let matchedTaxons = [];
  for (let i = 0; i < candidateTaxons.length; i++) {
    const taxon = candidateTaxons[i];
    if (taxon.genus_taxid == taxon.tax_id) {
      // genus
      if (matchedTaxons.length > 0) {
        resultTaxons.push(genusTaxon);
        resultTaxons = resultTaxons.concat(matchedTaxons);
      } else if (
        ThresholdMap.taxonPassThresholdFilter(genusTaxon, activeThresholds)
      ) {
        resultTaxons.push(genusTaxon);
      }
      genusTaxon = taxon;
      matchedTaxons = [];
    } else {
      // species
      if (ThresholdMap.taxonPassThresholdFilter(taxon, activeThresholds)) {
        matchedTaxons.push(taxon);
      }
    }
  }

  if (matchedTaxons.length > 0) {
    resultTaxons.push(genusTaxon);
    resultTaxons = resultTaxons.concat(matchedTaxons);
  } else if (
    ThresholdMap.taxonPassThresholdFilter(genusTaxon, activeThresholds)
  ) {
    resultTaxons.push(genusTaxon);
  }

  return resultTaxons;
};

export const isTaxonIncluded = (
  taxon,
  includedCategories,
  includedSubcategoryColumns,
  excludedSubcategoryColumns
) => {
  // returns if taxon is in either the included categories / subcategories AND
  // the taxon is not in an excluded subcategory
  return (
    (includedCategories.indexOf(taxon.category_name) >= 0 ||
      includedSubcategoryColumns.some(column => {
        return taxon[column] == 1;
      })) &&
    !excludedSubcategoryColumns.some(column => {
      return taxon[column] == 1;
    })
  );
};

export const getTaxonSortComparator = (
  primarySortParams,
  secondarySortParams,
  genusMap
) => {
  const [ptype, pmetric] = primarySortParams;
  const [stype, smetric] = secondarySortParams;

  return (a, b) => {
    const genusA = genusMap[a.genus_taxid];
    const genusB = genusMap[b.genus_taxid];

    const genusAPrimaryVal = parseFloat(genusA[ptype][pmetric]);
    const genusASecondaryVal = parseFloat(genusA[stype][smetric]);
    const aPrimaryVal = parseFloat(a[ptype][pmetric]);
    const aSecondaryVal = parseFloat(a[stype][smetric]);

    const genusBPrimaryVal = parseFloat(genusB[ptype][pmetric]);
    const genusBSecondaryVal = parseFloat(genusB[stype][smetric]);
    const bPrimaryVal = parseFloat(b[ptype][pmetric]);
    const bSecondaryVal = parseFloat(b[stype][smetric]);

    // compared at genus level descending and then species level descending
    if (a.genus_taxid == b.genus_taxid) {
      // same genus
      if (a.tax_level > b.tax_level) {
        return -1;
      } else if (a.tax_level < b.tax_level) {
        return 1;
      }
      if (aPrimaryVal > bPrimaryVal) {
        return -1;
      } else if (aPrimaryVal < bPrimaryVal) {
        return 1;
      }
      if (aSecondaryVal > bSecondaryVal) {
        return -1;
      } else if (aSecondaryVal < bSecondaryVal) {
        return 1;
      }
      return 0;
    }

    if (genusAPrimaryVal > genusBPrimaryVal) {
      return -1;
    } else if (genusAPrimaryVal < genusBPrimaryVal) {
      return 1;
    }

    if (genusASecondaryVal > genusBSecondaryVal) {
      return -1;
    } else if (genusASecondaryVal < genusBSecondaryVal) {
      return 1;
    }

    if (a.genus_taxid < b.genus_taxid) {
      return -1;
    } else if (a.genus_taxid > b.genus_taxid) {
      return 1;
    }
  };
};

export const getCategoryAdjective = category => {
  const categoryLowercase = category.toLowerCase();
  switch (categoryLowercase) {
    case "bacteria":
      return "bacterial";
    case "archaea":
      return "archaeal";
    case "eukaryota":
      return "eukaryotic";
    case "viruses":
      return "viral";
    case "viroids":
      return "viroidal";
    case "uncategorized":
      return "uncategorized";
    default:
      return categoryLowercase;
  }
};
