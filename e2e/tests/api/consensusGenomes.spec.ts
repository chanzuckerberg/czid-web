import { APIRequestContext, expect, test } from "@playwright/test";
import { sampleSize } from "lodash/fp";
import { GRAPHQL_FED_ENDPOINT } from "./shared";
/**
 * This test suite is designed to compare sequencing reads & nested objects from Rails and NextGen
 * It does so by:
 * 1. Getting a list of consensus genome producing workflow run ids from NextGen
 * 2. Getting the corresponding workflow run ids from Rails
 * 3. Making a request to both Rails and NextGen to get the sequencing reads
 * 4. Comparing the responses and asserting the metrics, taxons, accessions, and sample are the same.
 */

const NUMBER_OF_WORKFLOW_RUNS_TO_TEST = 100;
// Request contexts are reused by all tests in the file
let apiContextToReadFromRails: APIRequestContext;
let apiContextToReadFromNextGen: APIRequestContext;
test.beforeAll("Setup GraphQL clients", async ({ playwright }) => {
  apiContextToReadFromRails = await playwright.request.newContext({
    baseURL: process.env.BASEURL,
    extraHTTPHeaders: {
      "x-graphql-yoga-csrf": "graphql-yoga-csrf-prevention",
      "Content-Type": "application/json",
    },
  });

  apiContextToReadFromNextGen = await playwright.request.newContext({
    baseURL: process.env.BASEURL,
    extraHTTPHeaders: {
      "x-should-read-from-nextgen": "true",
      "x-graphql-yoga-csrf": "graphql-yoga-csrf-prevention",
      "Content-Type": "application/json",
    },
  });
});

const makeRequestToRailsGQL = async (query: string) => {
  return apiContextToReadFromRails
    .post(GRAPHQL_FED_ENDPOINT, {
      data: {
        query,
      },
    })
    .then(response => response.json());
};

const makeRequestToNextGenGQL = async (query: string) => {
  return apiContextToReadFromNextGen
    .post(GRAPHQL_FED_ENDPOINT, {
      data: {
        query,
      },
      headers: {
        Authorization: `Bearer ${enrichedToken}`,
      },
    })
    .then(response => response.json());
};

let enrichedToken: string;
test.beforeAll("Get an enriched token", async () => {
  // Get an identity token from Rails - it stores it as a cookie named czid_services_token
  const identityResponse = await apiContextToReadFromRails
    .get("/identify")
    .then(response => response.json());
  const identityToken = identityResponse?.token_value;

  // Make a request to Rails /enrich_token and pass the identity token as Authorization: Bearer header
  const enrichTokenResponse = await apiContextToReadFromRails
    .get("/enrich_token", {
      headers: {
        Authorization: `Bearer ${identityToken}`,
      },
    })
    .then(response => response.json());
  enrichedToken = enrichTokenResponse?.token;
});

const nextGenIdToRailsIdMap: { [key: string]: number } = {};
const railsIdToNextGenIdMap: { [key: number]: string } = {};
test.beforeAll(
  "Get consensus genome workflow run ids from NextGen",
  async () => {
    const consensusGenomeProducingRunIdsResponse =
      await makeRequestToNextGenGQL(`
      query GetConsensusGenomeProducingRunIds {
        consensusGenomes {
          producingRunId
        }
      }
    `);
    const consensusGenomeProducingRunIds = sampleSize(
      NUMBER_OF_WORKFLOW_RUNS_TO_TEST,
      consensusGenomeProducingRunIdsResponse.data.consensusGenomes.map(
        ({ producingRunId }) => `"${producingRunId}"`,
      ),
    );
    const GetNextGenAndRailsWorkflowRunIds = `
      query GetNextGenAndRailsWorkflowRunIds {
        workflowRuns(
          where: {id: {_in: [${consensusGenomeProducingRunIds}]}}
        ) {
          id
          railsWorkflowRunId
        }
      }
    `;

    const nextGenAndRailsIds = await makeRequestToNextGenGQL(
      GetNextGenAndRailsWorkflowRunIds,
    );
    const workflowRuns = nextGenAndRailsIds.data.workflowRuns;

    workflowRuns.forEach(
      (workflowRun: { id: string; railsWorkflowRunId: number }) => {
        if (workflowRun.railsWorkflowRunId) {
          nextGenIdToRailsIdMap[workflowRun.id] =
            workflowRun.railsWorkflowRunId;
          railsIdToNextGenIdMap[workflowRun.railsWorkflowRunId] =
            workflowRun.id;
        }
      },
    );

    return nextGenIdToRailsIdMap;
  },
);

const railsSequencingReadsMap = {};
const nextGenSequencingReadsMap = {};
test.beforeAll("fetch data from Rails and NextGen", async () => {
  const cgFragment = `
    edges {
      node {
        accession {
          accessionName
          accessionId
        }
        metrics {
          coverageDepth
          gcPercent
          nActg
          nMissing
          nAmbiguous
          percentGenomeCalled
          percentIdentity
          refSnps
          totalReads
          referenceGenomeLength
        }
        taxon {
          name
        }
        producingRunId
      }
    }
  `;

  const sequencingReadFragment = `
    medakaModel
    protocol
    sample {
      name
      railsSampleId
    }
  `;

  const railsWorkflowRunIds = `[${Object.keys(railsIdToNextGenIdMap).join(
    ",",
  )}]`;
  const railsWorkflowRunIdsInStrings = `["${Object.keys(
    railsIdToNextGenIdMap,
  ).join('","')}"]`;
  const sequencingReadsFromRailsResponse = await makeRequestToRailsGQL(`
    query MyQuery {
      fedSequencingReads(
        input: {todoRemove: {workflowRunIds: ${railsWorkflowRunIds}}, consensusGenomesInput: {where: {producingRunId: {_in: ${railsWorkflowRunIdsInStrings}}}}}
      ) {
        consensusGenomes {
          ${cgFragment}
        }
        ${sequencingReadFragment}
      }
    }
  `);

  // Create a map of the consensus genomes from Rails, where the key is the producingRunId and the value is a flat object with the consensus genome and the sequencing read
  const railsSequencingReads =
    sequencingReadsFromRailsResponse.data.fedSequencingReads;
  for (const sequencingRead of railsSequencingReads) {
    for (const edge of sequencingRead.consensusGenomes.edges) {
      railsSequencingReadsMap[edge.node.producingRunId] = {
        ...edge.node,
        sequencingRead: {
          medakaModel: sequencingRead.medakaModel,
          protocol: sequencingRead.protocol,
          sample: sequencingRead.sample,
        },
      };
    }
  }

  const nextGenIds = `["${Object.keys(nextGenIdToRailsIdMap).join('", "')}"]`;
  const responseFromNextGen = await makeRequestToNextGenGQL(`
    query MyQuery {
      sequencingReads(where: {consensusGenomes: {producingRunId: {_in: ${nextGenIds}}}}) {
        consensusGenomes(where: {producingRunId: {_in: ${nextGenIds}}}) {
          ${cgFragment}
        }
        ${sequencingReadFragment}
      }
    }
  `);

  // Create a map of the consensus genomes from NextGen, where the key is the producingRunId and the value the consensus genome
  const nextGenSequencingReads = responseFromNextGen.data.sequencingReads;
  for (const sequencingRead of nextGenSequencingReads) {
    for (const edge of sequencingRead.consensusGenomes.edges) {
      nextGenSequencingReadsMap[edge.node.producingRunId] = {
        ...edge.node,
        sequencingRead: {
          medakaModel: sequencingRead.medakaModel,
          protocol: sequencingRead.protocol,
          sample: sequencingRead.sample,
        },
      };
    }
  }
});

test.describe("Validate consensus genomes between Rails & Nextgen are equivelant", () => {
  test(`metrics, accession, sequencingRead, and sample should be the same`, async () => {
    // Iterate through the consensus genomes ids, look them up in the maps, and assert that they are the same
    Object.entries(nextGenIdToRailsIdMap).forEach(
      async ([nextGenWorkflowRunId, railsWorkflowRunId]) => {
        if (
          railsWorkflowRunId in railsSequencingReadsMap &&
          nextGenWorkflowRunId in nextGenSequencingReadsMap
        ) {
          const railsCg = railsSequencingReadsMap[railsWorkflowRunId];
          const nextGenCg = nextGenSequencingReadsMap[nextGenWorkflowRunId];

          const testStepName = `Rails ID: ${railsWorkflowRunId}, NextGen ID: ${nextGenWorkflowRunId}`;
          await test.step(
            testStepName,
            () => {
              if (railsCg.metrics.coverageDepth === null) {
                // The s3 file for the Rails coverage viz metrics has expired, so don't compare this metric
                delete railsCg.metrics.coverageDepth;
                delete nextGenCg.metrics.coverageDepth;
              }
              // Compare the data of the two consensus genomes
              expect
                .soft(
                  railsCg.metrics,
                  `metrics sould be equal for ${testStepName}`,
                )
                .toEqual(nextGenCg.metrics);
              expect
                .soft(
                  railsCg.accession,
                  `accession should be equal for ${testStepName}`,
                )
                .toEqual(nextGenCg.accession);
              expect
                .soft(
                  railsCg.sequencingRead,
                  `sequencingRead should be equal for ${testStepName}`,
                )
                .toEqual(nextGenCg.sequencingRead);

              const knownMismatchesFromRailsToNextGen = {
                // Rails taxon name : NextGen taxon name
                "Betacoronavirus 1 (species)": "Betacoronavirus 1",
                "Betacoronavirus (genus)": "Betacoronavirus",
                "Bat Hp-betacoronavirus Zhejiang2013 (species)":
                  "Bat Hp-betacoronavirus Zhejiang2013",
                "Chikungunya virus (species)": "Chikungunya virus",
                "Human respirovirus 3 (species)": "Human respirovirus 3",
                "Torque teno virus (species)": "Torque teno virus",
                "Alphapapillomavirus (genus)": "Alphapapillomavirus",
                "Severe acute respiratory syndrome-related coronavirus (species)":
                  "Severe acute respiratory syndrome-related coronavirus",
              };

              const isAKnownMismatch =
                knownMismatchesFromRailsToNextGen[railsCg?.taxon?.name] ===
                  nextGenCg?.taxon?.name &&
                nextGenCg?.taxon?.name !== null &&
                railsCg?.taxon?.name !== null;
              if (!isAKnownMismatch) {
                expect
                  .soft(
                    railsCg.taxon,
                    `taxon should be equal for ${testStepName}`,
                  )
                  .toEqual(nextGenCg.taxon);
              }
            },
            { box: true },
          );
        }
      },
    );
  });
});
