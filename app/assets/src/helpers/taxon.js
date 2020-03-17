import StringHelper from "./StringHelper";

export const getTaxonName = (scientificName, commonName, nameType) => {
  return nameType.toLowerCase() !== "common name" ||
    !commonName ||
    commonName.trim() === ""
    ? scientificName
    : StringHelper.capitalizeFirstLetter(commonName);
};

export const getGeneraContainingTags = taxInfoArray => {
  // Map genus taxids to the number of species with pathogen tags contained within.
  let generaContainingTags = {};
  for (let taxInfo of taxInfoArray) {
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

export const getGeneraPathogenCounts = speciesCounts => {
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
