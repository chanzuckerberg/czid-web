import fs from "fs";
export function createMetagenomicsMetadata(
  sampleName: string,
  hostOrganism?: string,
  sampleType?: string,
  collectionDate?: string,
  collectionLocation?: string,
  waterControl?: string,
  hostAge?: number,
  hostId?: string,
  rnaDnaInput?: number,
  hostGenusSpecies?: string,
  ctValue?: number,
) {
  return {
    "Sample Name": sampleName,
    "Host Organism": hostOrganism !== undefined ? hostOrganism : "Dog",
    "Sample Type": sampleType !== undefined ? sampleType : "Plasma",
    "Collection Date":
      collectionDate !== undefined ? collectionDate : "2022-10",
    "Collection Location":
      collectionLocation !== undefined ? collectionLocation : "New Mexico, USA",
    "Water Control": waterControl !== undefined ? waterControl : "No",
    "Host Age": hostAge !== undefined ? hostAge : 43,
    "Host ID": hostId !== undefined ? hostId : "jeNhTLicCl",
    "RNA/DNA Input (ng)": rnaDnaInput !== undefined ? rnaDnaInput : 97,
    "Host Genus Species":
      hostGenusSpecies !== undefined ? hostGenusSpecies : "Aedes aegypti",
    "Ct Value": ctValue !== undefined ? ctValue : 97,
  };
}

export function createAmrMetadata(
  sampleName: string,
  hostOrganism?: string,
  sampleType?: string,
  collectionDate?: string,
  collectionLocation?: string,
  waterControl?: string,
  hostAge?: number,
  hostId?: string,
  rnaDnaInput?: number,
  hostGenusSpecies?: string,
  ctValue?: number,
) {
  return {
    "Sample Name": sampleName,
    "Host Organism": hostOrganism !== undefined ? hostOrganism : "Dog",
    "Sample Type": sampleType !== undefined ? sampleType : "Plasma",
    "Collection Date":
      collectionDate !== undefined ? collectionDate : "2022-10",
    "Collection Location":
      collectionLocation !== undefined ? collectionLocation : "New Mexico, USA",
    "Water Control": waterControl !== undefined ? waterControl : "Yes",
    // "Host Age": hostAge !== undefined ? hostAge : 43,
    "Host ID": hostId !== undefined ? hostId : "jeNhTLicCl",
    // "RNA/DNA Input (ng)": rnaDnaInput !== undefined ? rnaDnaInput : 97,
    "Host Genus Species":
      hostGenusSpecies !== undefined ? hostGenusSpecies : "Aedes aegypti",
    "Ct Value": ctValue !== undefined ? ctValue : 97,
  };
}

/*
We read metadata CSV, update the sample name and write it back before uploading
*/
function getFileContent(
  srcPath: string,
  sampleName: string,
  callback: { (data: any): void; (arg0: any): void },
) {
  fs.readFile(srcPath, "utf8", function(err: any, data: any) {
    if (err) throw err;
    const updateString = String(data).replace("SAMPLE_NAME", sampleName);
    callback(updateString);
  });
}

export function updateMetadata(srcMetadataFile: string, sampleName: string) {
  const srcPath = `./fixtures/metadata/${srcMetadataFile}`;
  const randomNumber = Math.floor(Math.random() * 100) + 1;
  const savPath = `/tmp/${randomNumber}_${srcMetadataFile}`;
  getFileContent(srcPath, sampleName, function(data: any) {
    fs.writeFile(savPath, data, function(err: any) {
      if (err) throw err;
    });
  });
  return savPath;
}
