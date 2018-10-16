import StringHelper from "./StringHelper";

export const getTaxonName = (taxInfo, nameType) => {
  const scientificName = taxInfo["name"];
  const commonName = taxInfo["common_name"];

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
