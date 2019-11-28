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
    if (taxInfo.tax_level == 1 && taxInfo.pathogenTag) {
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
  let generaPathogenCounts = {};
  for (let speciesInfo of Object.values(speciesCounts)) {
    if (speciesInfo.pathogenTag) {
      generaPathogenCounts[speciesInfo.genus_tax_id] =
        generaPathogenCounts[speciesInfo.genus_tax_id] || {};

      generaPathogenCounts[speciesInfo.genus_tax_id][speciesInfo.pathogenTag] =
        (generaPathogenCounts[speciesInfo.genus_tax_id][
          speciesInfo.pathogenTag
        ] || 0) + 1;
    }
  }
  return generaPathogenCounts;
};
