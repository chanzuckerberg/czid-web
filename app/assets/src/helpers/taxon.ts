import StringHelper from "./StringHelper";

export const getTaxonName = (
  scientificName: string,
  commonName: string,
  nameType: string,
): string => {
  return nameType.toLowerCase() !== "common name" ||
    !commonName ||
    commonName.trim() === ""
    ? scientificName
    : StringHelper.capitalizeFirstLetter(commonName);
};

// $TSFixMe - this function does not seem to be used anywhere
export const getGeneraContainingTags = (
  taxInfoArray: {
    tax_level: number;
    pathogenFlag: string;
    genus_taxid: string;
  }[],
) => {
  // Map genus taxids to the number of species with pathogen tags contained within.
  const generaContainingTags = {};
  for (const taxInfo of taxInfoArray) {
    if (taxInfo.tax_level === 1 && taxInfo.pathogenFlag) {
      generaContainingTags[taxInfo.genus_taxid] =
        generaContainingTags[taxInfo.genus_taxid] || {};
      generaContainingTags[taxInfo.genus_taxid][taxInfo.pathogenFlag] =
        (generaContainingTags[taxInfo.genus_taxid][taxInfo.pathogenFlag] || 0) +
        1;
    }
  }
  return generaContainingTags;
};

export const getGeneraPathogenCounts = (speciesCounts: {
  [key: string]: { pathogenFlag: string; genus_tax_id: string };
}) => {
  const genusPathogenCnt: { [id: string]: { [tag: string]: number } } = {};
  Object.values(speciesCounts).forEach(speciesInfo => {
    if (speciesInfo.pathogenFlag) {
      genusPathogenCnt[speciesInfo.genus_tax_id] =
        genusPathogenCnt[speciesInfo.genus_tax_id] || {};

      const genusTaxid = speciesInfo.genus_tax_id;
      const tag = speciesInfo.pathogenFlag;
      genusPathogenCnt[genusTaxid][tag] =
        (genusPathogenCnt[genusTaxid][tag] || 0) + 1;
    }
  });
  return genusPathogenCnt;
};

export const getAllGeneraPathogenCounts = (speciesCounts: {
  [key: string]: { pathogenFlags: string[]; genus_tax_id: string };
}) => {
  const genusPathogenCnt: { [id: string]: { [tag: string]: number } } = {};
  Object.values(speciesCounts).forEach(speciesInfo => {
    (speciesInfo.pathogenFlags || []).forEach(pathogenFlag => {
      genusPathogenCnt[speciesInfo.genus_tax_id] =
        genusPathogenCnt[speciesInfo.genus_tax_id] || {};

      const genusTaxid = speciesInfo.genus_tax_id;
      const tag = pathogenFlag;
      genusPathogenCnt[genusTaxid][tag] =
        (genusPathogenCnt[genusTaxid][tag] || 0) + 1;
    });
  });
  return genusPathogenCnt;
};
