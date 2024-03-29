import { APIRequestContext, expect, test } from "@playwright/test";
import { sampleSize } from "lodash/fp";
import { GRAPHQL_FED_ENDPOINT } from "./shared";
/**
 * This test suite is designed to compare the consensus genomes from Rails and NextGen
 * It does so by:
 * 1. Getting a list of consensus genome producing workflow run ids from NextGen
 * 2. Getting the corresponding workflow run ids from Rails
 * 3. Making a request to both Rails and NextGen to get the consensus genomes
 * 4. Comparing the responses and asserting the metrics & accessions are the same.
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

const railsConsensusGenomesMap = {};
const nextGenConsensusGenomesMap = {};
test.beforeAll("fetch data from Rails and NextGen", async () => {
  const fragment = `
    producingRunId
    sequencingRead {
      sample {
        name
      }
      medakaModel
      protocol
      technology
    }
    metrics {
      coverageDepth
      refSnps
      totalReads
      percentIdentity
      percentGenomeCalled
      nMissing
      nAmbiguous
      nActg
    }
    accession {
      accessionId
      accessionName
    }
    taxon {
      name
    }
  `;

  const consensusGenomesFromRailsResponse = await makeRequestToRailsGQL(`
    query MyQuery {
      fedConsensusGenomes(
        input: {
          todoRemove: {
            workflow: "consensus-genome",
            workflowRunIds: [${Object.keys(railsIdToNextGenIdMap).join(", ")}]
          }
        }
      ) {
        ${fragment}
      }
    }
  `);

  // Create a map of the consensus genomes from Rails, where the key is the producingRunId and the value the consensus genome
  const railsConsensusGenomes =
    consensusGenomesFromRailsResponse.data.fedConsensusGenomes;
  for (const consensusGenome of railsConsensusGenomes) {
    railsConsensusGenomesMap[consensusGenome.producingRunId] = consensusGenome;
  }

  const responseFromNextGen = await makeRequestToNextGenGQL(`
      query MyQuery {
        consensusGenomes(
          where: {producingRunId: {_in: ["${Object.keys(
            nextGenIdToRailsIdMap,
          ).join('", "')}"]}}
        ) {
          ${fragment}
        }
      }
    `);

  // Create a map of the consensus genomes from NextGen, where the key is the producingRunId and the value the consensus genome
  const nextGenConsensusGenomes = responseFromNextGen.data.consensusGenomes;
  for (const consensusGenome of nextGenConsensusGenomes) {
    if (nextGenIdToRailsIdMap[consensusGenome.producingRunId]) {
      nextGenConsensusGenomesMap[consensusGenome.producingRunId] =
        consensusGenome;
    }
  }
});

test.describe("Validate consensus genomes between Rails & Nextgen are equivelant", () => {
  test(`metrics, accession, sequencingRead, and sample should be the same`, async () => {
    // Iterate through the consensus genomes ids, look them up in the maps, and assert that they are the same
    Object.entries(nextGenIdToRailsIdMap).forEach(
      ([nextGenWorkflowRunId, railsWorkflowRunId]) => {
        if (
          railsWorkflowRunId in railsConsensusGenomesMap &&
          nextGenWorkflowRunId in nextGenConsensusGenomesMap
        ) {
          const railsCg = railsConsensusGenomesMap[railsWorkflowRunId];
          const nextGenCg = nextGenConsensusGenomesMap[nextGenWorkflowRunId];

          test.step(`Rails ID: ${railsWorkflowRunId}, NextGen ID: ${nextGenWorkflowRunId}`, () => {
            if (railsCg.metrics.coverageDepth === null) {
              // The s3 file for the Rails coverage viz metrics has expired, so don't compare this metric
              delete railsCg.metrics.coverageDepth;
              delete nextGenCg.metrics.coverageDepth;
            }
            // Compare the data of the two consensus genomes
            expect(railsCg.metrics).toEqual(nextGenCg.metrics);
            expect(railsCg.accession).toEqual(nextGenCg.accession);
            expect(railsCg.sequencingRead).toEqual(nextGenCg.sequencingRead);

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
              expect(railsCg.taxon).toEqual(nextGenCg.taxon);
            }
          });
        }
      },
    );
  });
});
