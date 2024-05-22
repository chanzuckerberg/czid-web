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
