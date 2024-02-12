/**
 * @generated SignedSource<<1aa1324f820b09de4d6858f66dd22707>>
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
  workflowRunIds: ReadonlyArray<number | null | undefined>;
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
  "name": "workflowRunIds"
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
            "name": "workflowRunIds",
            "variableName": "workflowRunIds"
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
    "cacheID": "685ed8602156ec175864e1c44c441cd3",
    "id": null,
    "metadata": {},
    "name": "BulkDownloadModalQuery",
    "operationKind": "query",
    "text": "query BulkDownloadModalQuery(\n  $workflowRunIds: [Int]!\n  $includeMetadata: Boolean!\n  $downloadType: String!\n  $workflow: String!\n  $authenticityToken: String!\n) {\n  BulkDownloadCGOverview(input: {workflowRunIds: $workflowRunIds, includeMetadata: $includeMetadata, downloadType: $downloadType, workflow: $workflow, authenticityToken: $authenticityToken}) {\n    cgOverviewRows\n  }\n}\n"
  }
};
})();

(node as any).hash = "fdcdc7a2646afdbd902d9fad6b3ed797";

export default node;
