import { PageObject } from "./page-object";
const LIMIT = 100000;

export class Graphqlfed extends PageObject {
  public async projectSamplesByTaxon(project: any, taxon: any) {
    const response = await this.page
      .context()
      .request.post(`${process.env.BASEURL}/graphqlfed`, {
        data: {
          query: `query MyQuery($taxonName: [String], $limit: Int) {
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
          variables: { taxonName: taxon.title, limit: LIMIT },
        },
      });
    const responseJson = await response.json();
    let filteredSequencingReads = responseJson.data.fedSequencingReads.filter(
      r => r.sample.collection.name === project.name,
    );
    filteredSequencingReads = responseJson.data.fedSequencingReads.filter(
      r => r.taxon && r.taxon.name.includes(taxon.title),
    );
    return filteredSequencingReads.map(r => r.sample.name);
  }

  public async projectSamplesByCollectionLocation(
    project: any,
    collectionLocation: string,
  ) {
    const response = await this.page
      .context()
      .request.post(`${process.env.BASEURL}/graphqlfed`, {
        data: {
          query: `query MyQuery($collectionLocation: [String], $limit: Int) {
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
          variables: { collectionLocation: collectionLocation, limit: LIMIT },
        },
      });
    const responseJson = await response.json();
    const filteredSequencingReads = responseJson.data.fedSequencingReads.filter(
      r =>
        r.sample.collection.name === project.name &&
        r.sample.collectionLocation === collectionLocation,
    );
    return filteredSequencingReads.map(r => r.sample.name);
  }

  public async projectSamplesByHostOrganism(
    project: any,
    hostOrganism: string,
  ) {
    const response = await this.page
      .context()
      .request.post(`${process.env.BASEURL}/graphqlfed`, {
        data: {
          query: `query MyQuery($hostOrganism: [String], $limit: Int) {
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
          variables: { hostOrganism: hostOrganism, limit: LIMIT },
        },
      });
    const responseJson = await response.json();
    const filteredSequencingReads = responseJson.data.fedSequencingReads.filter(
      r =>
        r.sample.collection.name === project.name &&
        r.sample.hostOrganism.name === hostOrganism,
    );
    return filteredSequencingReads.map(r => r.sample.name);
  }

  public async projectSamplesSampleType(
    project: any,
    sampleTissueType: string,
  ) {
    const response = await this.page
      .context()
      .request.post(`${process.env.BASEURL}/graphqlfed`, {
        data: {
          query: `query MyQuery($sampleType: [String], $limit: Int) {
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
          variables: { sampleType: sampleTissueType, limit: LIMIT },
        },
      });
    const responseJson = await response.json();
    const filteredSequencingReads = responseJson.data.fedSequencingReads.filter(
      r =>
        r.sample.collection.name === project.name &&
        r.sample.sampleType === sampleTissueType,
    );
    return filteredSequencingReads.map(r => r.sample.name);
  }

  public async sampleViewSampleQuery(sampleId: string) {
    const response = await this.page
      .context()
      .request.post(`${process.env.BASEURL}/graphqlfed`, {
        data: {
          query: `query SampleViewSampleQuery(
            $railsSampleId: String
              $snapshotLinkId: String
              ) {
                SampleForReport(railsSampleId: $railsSampleId, snapshotLinkId: $snapshotLinkId) {
                  id
                  created_at
                  default_background_id
                  default_pipeline_run_id
                  editable
                  host_genome_id
                  initial_workflow
                  name
                  pipeline_runs {
                    adjusted_remaining_reads
                    alignment_config_name
                    assembled
                    created_at
                    id
                    pipeline_version
                    run_finalized
                    total_ercc_reads
                    wdl_version
                  }
                  project {
                    id
                    name
                    pinned_alignment_config
                  }
                  project_id
                  railsSampleId
                  status
                  updated_at
                  upload_error
                  user_id
                  workflow_runs {
                    deprecated
                    executed_at
                    id
                    input_error {
                      label
                      message
                    }
                    inputs {
                      accession_id
                      accession_name
                      creation_source
                      ref_fasta
                      taxon_id
                      taxon_name
                      technology
                      card_version
                      wildcard_version
                    }
                    parsed_cached_results {
                      quality_metrics {
                        total_reads
                        total_ercc_reads
                        adjusted_remaining_reads
                        percent_remaining
                        qc_percent
                        compression_ratio
                        insert_size_mean
                        insert_size_standard_deviation
                      }
                    }
                    run_finalized
                    status
                    wdl_version
                    workflow
                  }
                }
              }`,
          variables: { railsSampleId: sampleId, snapshotLinkId: "" },
        },
      });
    const responseJson = await response.json();
    return responseJson.data.SampleForReport;
  }
}
