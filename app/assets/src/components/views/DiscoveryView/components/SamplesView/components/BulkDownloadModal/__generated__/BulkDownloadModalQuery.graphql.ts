/**
 * @generated SignedSource<<cbfb8c6999980ba8a93bab60e3efa47b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type BulkDownloadModalQuery$variables = {
  authenticityToken: string;
  downloadType: string;
  includeMetadata: boolean;
  workflow: string;
  workflowRunIdsStrings?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type BulkDownloadModalQuery$data = {
  readonly BulkDownloadCGOverview: {
    readonly cgOverviewRows: ReadonlyArray<ReadonlyArray<string | null | undefined> | null | undefined>;
  } | null | undefined;
};
export type BulkDownloadModalQuery = {
  response: BulkDownloadModalQuery$data;
  variables: BulkDownloadModalQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "authenticityToken"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "downloadType"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "includeMetadata"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "workflow"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "workflowRunIdsStrings"
},
v5 = [
  {
    "alias": null,
    "args": [
      {
        "fields": [
          {
            "kind": "Variable",
            "name": "authenticityToken",
            "variableName": "authenticityToken"
          },
          {
            "kind": "Variable",
            "name": "downloadType",
            "variableName": "downloadType"
          },
          {
            "kind": "Variable",
            "name": "includeMetadata",
            "variableName": "includeMetadata"
          },
          {
            "kind": "Variable",
            "name": "workflow",
            "variableName": "workflow"
          },
          {
            "kind": "Variable",
            "name": "workflowRunIdsStrings",
            "variableName": "workflowRunIdsStrings"
          }
        ],
        "kind": "ObjectValue",
        "name": "input"
      }
    ],
    "concreteType": "ConsensusGenomeOverviewRows",
    "kind": "LinkedField",
    "name": "BulkDownloadCGOverview",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "cgOverviewRows",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "BulkDownloadModalQuery",
    "selections": (v5/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v4/*: any*/),
      (v2/*: any*/),
      (v1/*: any*/),
      (v3/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "BulkDownloadModalQuery",
    "selections": (v5/*: any*/)
  },
  "params": {
    "cacheID": "884ca446270ea638658e0efb106a96b5",
    "id": null,
    "metadata": {},
    "name": "BulkDownloadModalQuery",
    "operationKind": "query",
    "text": "query BulkDownloadModalQuery(\n  $workflowRunIdsStrings: [String]\n  $includeMetadata: Boolean!\n  $downloadType: String!\n  $workflow: String!\n  $authenticityToken: String!\n) {\n  BulkDownloadCGOverview(input: {workflowRunIdsStrings: $workflowRunIdsStrings, includeMetadata: $includeMetadata, downloadType: $downloadType, workflow: $workflow, authenticityToken: $authenticityToken}) {\n    cgOverviewRows\n  }\n}\n"
  }
};
})();

(node as any).hash = "20951dadce7836e8207ee210b7b22a03";

export default node;
