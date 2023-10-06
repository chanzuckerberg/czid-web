/**
 * @generated SignedSource<<f51c423daf2cf301277a6b206b09caec>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type ConsensusGenomeViewQuery$variables = {};
export type ConsensusGenomeViewQuery$data = {
  readonly ConsensusGenomeWorkflowResults: {
    readonly reference_genome: {
      readonly accession_id: any | null;
    } | null;
  } | null;
};
export type ConsensusGenomeViewQuery = {
  response: ConsensusGenomeViewQuery$data;
  variables: ConsensusGenomeViewQuery$variables;
};

const node: ConcreteRequest = (function () {
  var v0 = [
    {
      alias: null,
      args: [
        {
          kind: "Literal",
          name: "workflowRunId",
          value: "2265",
        },
      ],
      concreteType: "ConsensusGenomeWorkflowResults",
      kind: "LinkedField",
      name: "ConsensusGenomeWorkflowResults",
      plural: false,
      selections: [
        {
          alias: null,
          args: null,
          concreteType: "query_ConsensusGenomeWorkflowResults_reference_genome",
          kind: "LinkedField",
          name: "reference_genome",
          plural: false,
          selections: [
            {
              alias: null,
              args: null,
              kind: "ScalarField",
              name: "accession_id",
              storageKey: null,
            },
          ],
          storageKey: null,
        },
      ],
      storageKey: 'ConsensusGenomeWorkflowResults(workflowRunId:"2265")',
    },
  ];
  return {
    fragment: {
      argumentDefinitions: [],
      kind: "Fragment",
      metadata: null,
      name: "ConsensusGenomeViewQuery",
      selections: v0 /*: any*/,
      type: "Query",
      abstractKey: null,
    },
    kind: "Request",
    operation: {
      argumentDefinitions: [],
      kind: "Operation",
      name: "ConsensusGenomeViewQuery",
      selections: v0 /*: any*/,
    },
    params: {
      cacheID: "64756183b028fe23abec3875a89e4828",
      id: null,
      metadata: {},
      name: "ConsensusGenomeViewQuery",
      operationKind: "query",
      text: 'query ConsensusGenomeViewQuery {\n  ConsensusGenomeWorkflowResults(workflowRunId: "2265") {\n    reference_genome {\n      accession_id\n    }\n  }\n}\n',
    },
  };
})();

(node as any).hash = "245ab5362a53366467c57cb6aab22f76";

export default node;
