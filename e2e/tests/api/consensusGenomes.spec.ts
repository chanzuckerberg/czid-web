import { APIRequestContext, expect, test } from "@playwright/test";
import { isEmpty } from "lodash/fp";
import { splitArrayIntoChunks } from "./utils";

/**
 * This test suite is designed to compare sequencing reads & nested objects from Rails and NextGen
 * It does so by:
 * 1. Getting a list of consensus genome producing workflow run ids from NextGen
 * 2. Getting the corresponding workflow run ids from Rails
 * 3. Making a request to both Rails and NextGen to get the sequencing reads
 * 4. Comparing the responses and asserting the metrics, taxons, accessions, and sample are the same.
 */

const GRAPHQL_FED_ENDPOINT = "/graphqlfed";
const CHUNK_SIZE = 100;
const TEN_MILLION = 10_000_000;
const SIXTY_SECONDS = 60000;
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
    timeout: SIXTY_SECONDS,
  });

  apiContextToReadFromNextGen = await playwright.request.newContext({
    baseURL: process.env.BASEURL,
    extraHTTPHeaders: {
      "x-should-read-from-nextgen": "true",
      "x-graphql-yoga-csrf": "graphql-yoga-csrf-prevention",
      "Content-Type": "application/json",
    },
    timeout: SIXTY_SECONDS,
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
        consensusGenomes(limitOffset: {limit: ${TEN_MILLION}}) {
          producingRunId
        }
      }
    `);
    const consensusGenomeProducingRunIds =
      consensusGenomeProducingRunIdsResponse.data.consensusGenomes.map(
        ({ producingRunId }) => `"${producingRunId}"`,
      );

    const GetNextGenAndRailsWorkflowRunIds = `
      query GetNextGenAndRailsWorkflowRunIds {
        workflowRuns(
          limitOffset: {limit: ${TEN_MILLION}},
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

let railsSequencingReadsMap = {};
let nextGenSequencingReadsMap = {};

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

const fetchRailsSequencingReads = async railsIds => {
  const railsWorkflowRunIds = `[${railsIds.join(",")}]`;
  const railsWorkflowRunIdsInStrings = `["${railsIds.join('","')}"]`;
  const sequencingReadsFromRailsResponse = await makeRequestToRailsGQL(`
    query MyQuery {
      fedSequencingReads(
        input: {
          todoRemove: {workflowRunIds: ${railsWorkflowRunIds}}, consensusGenomesInput: {where: {producingRunId: {_in: ${railsWorkflowRunIdsInStrings}}}}
        }
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
    sequencingReadsFromRailsResponse?.data?.fedSequencingReads;

  if (isEmpty(railsSequencingReads)) {
    console.error("Failed to fetch sequencing reads from Rails");
    console.error(sequencingReadsFromRailsResponse);
    return false;
  }

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

  return true;
};

const fetchNextGenSequencingReads = async nextGenIds => {
  const nextGenIdsInStrings = `["${nextGenIds.join('", "')}"]`;
  const responseFromNextGen = await makeRequestToNextGenGQL(`
    query MyQuery {
      sequencingReads(
        where: {consensusGenomes: {producingRunId: {_in: ${nextGenIdsInStrings}}}}
      ) {
        consensusGenomes(
          where: {producingRunId: {_in: ${nextGenIdsInStrings}}}
        ) {
          ${cgFragment}
        }
        ${sequencingReadFragment}
      }
    }
  `);

  // Create a map of the consensus genomes from NextGen, where the key is the producingRunId and the value the consensus genome
  const nextGenSequencingReads = responseFromNextGen?.data?.sequencingReads;
  if (isEmpty(nextGenSequencingReads)) {
    console.error("No sequencing reads found in NextGen");
    console.error(responseFromNextGen);
    return false;
  }

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

  return true;
};

// Paginate through the consensus genomes from Rails and NextGen and make assertions
test.describe("Validate consensus genomes between Rails & Nextgen are equivelant", async () => {
  test.skip(`metrics, accession, sequencingRead, and sample should be the same`, async () => {
    const nextGenIdToRailsIdEntries = Object.entries(nextGenIdToRailsIdMap);
    const chunkedNextGenIdToRailsIdEntries = splitArrayIntoChunks(
      nextGenIdToRailsIdEntries,
      CHUNK_SIZE,
    );

    for (const nextGenIdToRailsIdChunk of chunkedNextGenIdToRailsIdEntries) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const railsIds = nextGenIdToRailsIdChunk.map(([_, railsId]) => railsId);
      const nextGenIds = nextGenIdToRailsIdChunk.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([nextGenId, _]) => nextGenId,
      );

      // Fetch the sequencing reads and populate the railsSequencingReadsMap and nextGenSequencingReadsMap
      const sequencingReadsFetchedFromRails = await fetchRailsSequencingReads(
        railsIds,
      );
      const sequencingReadsFetchedFromNextGen =
        await fetchNextGenSequencingReads(nextGenIds);

      expect
        .soft(
          sequencingReadsFetchedFromRails,
          `failed to fetch sequencing reads from Rails for workflow run ids: ${railsIds}`,
        )
        .toBe(true);
      expect
        .soft(
          sequencingReadsFetchedFromNextGen,
          `failed to fetch sequencing reads from NextGen for workflow run ids: ${nextGenIds}`,
        )
        .toBe(true);

      if (
        !sequencingReadsFetchedFromRails &&
        !sequencingReadsFetchedFromNextGen
      ) {
        continue;
      }

      // Iterate through the consensus genomes ids, look them up in the maps, and assert that they are the same
      for (const [
        nextGenWorkflowRunId,
        railsWorkflowRunId,
      ] of nextGenIdToRailsIdChunk) {
        if (
          railsWorkflowRunId in railsSequencingReadsMap &&
          nextGenWorkflowRunId in nextGenSequencingReadsMap
        ) {
          const railsCg = railsSequencingReadsMap[railsWorkflowRunId];
          const nextGenCg = nextGenSequencingReadsMap[nextGenWorkflowRunId];

          const testStepName = `Rails ID: ${railsWorkflowRunId}, NextGen ID: ${nextGenWorkflowRunId}`;
          await test.step(testStepName, () => {
            // Compare the data of the two consensus genomes
            expect
              .soft(
                railsCg.metrics,
                `metrics should be equal for ${testStepName}`,
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

            expect
              .soft(railsCg.taxon, `taxon should be equal for ${testStepName}`)
              .toEqual(nextGenCg.taxon);
          });
        }
      }

      // Clear the maps to avoid memory issues
      railsSequencingReadsMap = {};
      nextGenSequencingReadsMap = {};
    }
  });

  // This test queries the consensus genomes from Rails and NextGen and compares the metrics
  // The above test is more comprehensive, but this one is more focused on metrics (includes coverage viz metrics)
  test.skip("consensus genomes metrics should be the same", async () => {
    const fragment = `
      metrics {
        coverageBinSize
        coverageBreadth
        coverageDepth
        coverageTotalLength
        coverageViz
        gcPercent
        mappedReads
        nActg
        nAmbiguous
        nMissing
        percentIdentity
        percentGenomeCalled
        referenceGenomeLength
        refSnps
        totalReads
      }
    `;

    for (const [railsWorkflowRunId, nextGenWorkflowRunId] of Object.entries(
      railsIdToNextGenIdMap,
    )) {
      const testStepName = `Rails ID: ${railsWorkflowRunId}, NextGen ID: ${nextGenWorkflowRunId}`;

      await test.step(testStepName, async () => {
        const responseFromRails = await makeRequestToRailsGQL(`
            query MyQuery {
              fedConsensusGenomes(input: {where: {producingRunId: {_eq: "${railsWorkflowRunId}"}}}) {
                ${fragment}
              }
            }
          `);

        const responseFromNextGen = await makeRequestToNextGenGQL(`
            query MyQuery {
              consensusGenomes(where: {producingRunId: {_eq: "${nextGenWorkflowRunId}"}}) {
                id
                ${fragment}
              }
            }
          `);

        const railsCg = responseFromRails?.data?.fedConsensusGenomes?.at(0);
        const nextGenCg = responseFromNextGen?.data?.consensusGenomes?.at(0);
        expect
          .soft(railsCg, `CG not exist in Rails for ${testStepName}`)
          .not.toBe(undefined);
        expect
          .soft(nextGenCg, `CG does not exist in Nextgen for ${testStepName}`)
          .not.toBe(undefined);

        expect
          .soft(
            railsCg !== undefined && nextGenCg === undefined,
            `Rails CG did not get migrated to Nextgen for ${testStepName}`,
          )
          .toBe(false);

        if (railsCg && nextGenCg) {
          expect
            .soft(
              railsCg.metrics,
              `metrics should be equal for ${testStepName}`,
            )
            .toEqual(nextGenCg.metrics);
        }
      });
    }
  });
});
