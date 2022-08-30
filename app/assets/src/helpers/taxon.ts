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
    pathogenTag: string;
    genus_taxid: string;
  }[],
) => {
  // Map genus taxids to the number of species with pathogen tags contained within.
  const generaContainingTags = {};
  for (const taxInfo of taxInfoArray) {
    if (taxInfo.tax_level === 1 && taxInfo.pathogenTag) {
      generaContainingTags[taxInfo.genus_taxid] =
        generaContainingTags[taxInfo.genus_taxid] || {};
      generaContainingTags[taxInfo.genus_taxid][taxInfo.pathogenTag] =
        (generaContainingTags[taxInfo.genus_taxid][taxInfo.pathogenTag] || 0) +
        1;
    }
  }
  return generaContainingTags;
};

export const getGeneraPathogenCounts = (speciesCounts: {
  [key: string]: { pathogenTag: string; genus_tax_id: string };
}) => {
  const genusPathogenCnt = {};
  Object.values(speciesCounts).forEach(speciesInfo => {
    if (speciesInfo.pathogenTag) {
      genusPathogenCnt[speciesInfo.genus_tax_id] =
        genusPathogenCnt[speciesInfo.genus_tax_id] || {};

      const genusTaxid = speciesInfo.genus_tax_id;
      const tag = speciesInfo.pathogenTag;
      genusPathogenCnt[genusTaxid][tag] =
        (genusPathogenCnt[genusTaxid][tag] || 0) + 1;
    }
  });
  return genusPathogenCnt;
};
