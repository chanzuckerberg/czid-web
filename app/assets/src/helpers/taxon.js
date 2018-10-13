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
