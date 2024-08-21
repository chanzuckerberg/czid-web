import { PageObject } from "./page-object";
const LIMIT = 100000;

export class Graphqlfed extends PageObject {

  public async projectSamplesByTaxon(project: any, taxon: any) {
    const response = await this.page.context().request.post(
      `${process.env.BASEURL}/graphqlfed`, {
        data: {
          "query": `query MyQuery($taxonName: [String], $limit: Int) {
            fedSequencingReads(
              input: {limit: $limit, where: {taxon: {name: {_in: $taxonName}}}}
            ) {
              id
              sample {
                collection {
                  name
                }
                name
              }
              taxon {
                name
              }
            }
          }`,
          "variables": {"taxonName": taxon.title, "limit": LIMIT},
        },
      },
    );
    const responseJson = await response.json();
    let filteredSequencingReads = responseJson.data.fedSequencingReads.filter(
      r =>
        r.sample.collection.name === project.name,
      );
    filteredSequencingReads = responseJson.data.fedSequencingReads.filter(
      r =>
        r.taxon && (r.taxon.name.includes(taxon.title)),
      );
    return filteredSequencingReads.map((r) => r.sample.name);
  }

  public async projectSamplesByCollectionLocation(project: any, collectionLocation: string) {
    const response = await this.page.context().request.post(
      `${process.env.BASEURL}/graphqlfed`, {
        data: {
          "query": `query MyQuery($collectionLocation: [String], $limit: Int) {
            fedSequencingReads(
              input: {limit: $limit, where: {sample: {collectionLocation: {_in: $collectionLocation}}}}
            ) {
              sample {
                name
                collectionLocation
                collection {
                  name
                }
              }
              taxon {
                name
              }
            }
          }`,
          "variables": {"collectionLocation": collectionLocation, "limit": LIMIT} },
      },
    );
    const responseJson = await response.json();
    const filteredSequencingReads = responseJson.data.fedSequencingReads.filter(
      r =>
        (r.sample.collection.name === project.name)
        &&
        (r.sample.collectionLocation === collectionLocation),
      );
    return filteredSequencingReads.map((r) => r.sample.name);
  }

  public async projectSamplesByHostOrganism(project: any, hostOrganism: string) {
    const response = await this.page.context().request.post(
      `${process.env.BASEURL}/graphqlfed`, {
        data: {
          "query": `query MyQuery($hostOrganism: [String], $limit: Int) {
            fedSequencingReads(
              input: {limit: $limit, where: {sample: {hostOrganism: {name: {_in: $hostOrganism}}}}}
            ) {
              sample {
                name
                collectionLocation
                collection {
                  name
                  public
                }
                hostOrganism {
                  name
                }
              }
              taxon {
                name
              }
            }
          }`,
          "variables": {"hostOrganism": hostOrganism, "limit": LIMIT} },
      },
    );
    const responseJson = await response.json();
    const filteredSequencingReads = responseJson.data.fedSequencingReads.filter(
      r =>
        (r.sample.collection.name === project.name)
        &&
        (r.sample.hostOrganism.name === hostOrganism),
      );
    return filteredSequencingReads.map((r) => r.sample.name);
  }

  public async projectSamplesSampleType(project: any, sampleTissueType: string) {
    const response = await this.page.context().request.post(
      `${process.env.BASEURL}/graphqlfed`, {
        data: {
          "query": `query MyQuery($sampleType: [String], $limit: Int) {
            fedSequencingReads(
              input: {where: {sample: {sampleType: {_in: $sampleType}}}, limit: $limit}
            ) {
              taxon {
                name
              }
              sample {
                name
                collectionLocation
                collection {
                  name
                  public
                }
                sampleType
              }
            }
          }`,
          "variables": {"sampleType": sampleTissueType, "limit": LIMIT},
        },
      },
    );
    const responseJson = await response.json();
    const filteredSequencingReads = responseJson.data.fedSequencingReads.filter(
      r =>
        (r.sample.collection.name === project.name)
        &&
        (r.sample.sampleType === sampleTissueType),
      );
    return filteredSequencingReads.map((r) => r.sample.name);
  }
}