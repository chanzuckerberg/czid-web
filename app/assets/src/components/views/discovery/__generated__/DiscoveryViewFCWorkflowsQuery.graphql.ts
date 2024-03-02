/**
 * @generated SignedSource<<fad76ab45b71da81eaa57f7fd0230d5f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type queryInput_fedWorkflowRuns_input_Input = {
  entityInputsInput?: queryInput_fedWorkflowRuns_input_entityInputsInput_Input | null | undefined;
  orderBy?: queryInput_fedWorkflowRuns_input_orderBy_Input | null | undefined;
  todoRemove?: queryInput_fedWorkflowRuns_input_todoRemove_Input | null | undefined;
  where?: queryInput_fedWorkflowRuns_input_where_Input | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_todoRemove_Input = {
  authenticityToken?: string | null | undefined;
  domain?: string | null | undefined;
  host?: ReadonlyArray<number | null | undefined> | null | undefined;
  locationV2?: ReadonlyArray<string | null | undefined> | null | undefined;
  orderBy?: string | null | undefined;
  orderDir?: string | null | undefined;
  projectId?: string | null | undefined;
  search?: string | null | undefined;
  taxon?: ReadonlyArray<number | null | undefined> | null | undefined;
  taxonLevels?: ReadonlyArray<string | null | undefined> | null | undefined;
  time?: ReadonlyArray<string | null | undefined> | null | undefined;
  tissue?: ReadonlyArray<string | null | undefined> | null | undefined;
  visibility?: string | null | undefined;
  workflow?: string | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_orderBy_Input = {
  startedAt?: string | null | undefined;
  workflowVersion?: queryInput_fedWorkflowRuns_input_orderBy_workflowVersion_Input | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_orderBy_workflowVersion_Input = {
  version?: string | null | undefined;
  workflow?: queryInput_fedWorkflowRuns_input_orderBy_workflowVersion_workflow_Input | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_orderBy_workflowVersion_workflow_Input = {
  name?: string | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_where_Input = {
  collectionId?: queryInput_fedWorkflowRuns_input_where_collectionId_Input | null | undefined;
  id?: queryInput_fedWorkflowRuns_input_where_id_Input | null | undefined;
  ownerUserId?: queryInput_fedWorkflowRuns_input_where_ownerUserId_Input | null | undefined;
  startedAt?: queryInput_fedWorkflowRuns_input_where_startedAt_Input | null | undefined;
  workflowVersion?: queryInput_fedWorkflowRuns_input_where_workflowVersion_Input | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_where_id_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_where_ownerUserId_Input = {
  _eq?: number | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_where_startedAt_Input = {
  _gte?: string | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_where_collectionId_Input = {
  _in?: ReadonlyArray<number | null | undefined> | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_where_workflowVersion_Input = {
  workflow?: queryInput_fedWorkflowRuns_input_where_workflowVersion_workflow_Input | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_where_workflowVersion_workflow_Input = {
  name?: queryInput_fedWorkflowRuns_input_where_workflowVersion_workflow_name_Input | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_where_workflowVersion_workflow_name_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_entityInputsInput_Input = {
  where?: queryInput_fedWorkflowRuns_input_entityInputsInput_where_Input | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_entityInputsInput_where_Input = {
  fieldName?: queryInput_fedWorkflowRuns_input_entityInputsInput_where_fieldName_Input | null | undefined;
};
export type queryInput_fedWorkflowRuns_input_entityInputsInput_where_fieldName_Input = {
  _eq?: string | null | undefined;
};
export type DiscoveryViewFCWorkflowsQuery$variables = {
  input?: queryInput_fedWorkflowRuns_input_Input | null | undefined;
};
export type DiscoveryViewFCWorkflowsQuery$data = {
  readonly fedWorkflowRuns: ReadonlyArray<{
    readonly entityInputs: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly entityType: string | null | undefined;
          readonly inputEntityId: string | null | undefined;
        };
      } | null | undefined>;
    };
    readonly id: string;
    readonly startedAt: string | null | undefined;
    readonly status: string | null | undefined;
    readonly workflowVersion: {
      readonly version: string | null | undefined;
      readonly workflow: {
        readonly name: string | null | undefined;
      } | null | undefined;
    } | null | undefined;
  } | null | undefined> | null | undefined;
};
export type DiscoveryViewFCWorkflowsQuery = {
  response: DiscoveryViewFCWorkflowsQuery$data;
  variables: DiscoveryViewFCWorkflowsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "query_fedWorkflowRuns_items",
    "kind": "LinkedField",
    "name": "fedWorkflowRuns",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "startedAt",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "status",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "query_fedWorkflowRuns_items_workflowVersion",
        "kind": "LinkedField",
        "name": "workflowVersion",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "version",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "query_fedWorkflowRuns_items_workflowVersion_workflow",
            "kind": "LinkedField",
            "name": "workflow",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "name",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "query_fedWorkflowRuns_items_entityInputs",
        "kind": "LinkedField",
        "name": "entityInputs",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "query_fedWorkflowRuns_items_entityInputs_edges_items",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "query_fedWorkflowRuns_items_entityInputs_edges_items_node",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "inputEntityId",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "entityType",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "DiscoveryViewFCWorkflowsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DiscoveryViewFCWorkflowsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "806458228b436e85fe93c9dd869e6621",
    "id": null,
    "metadata": {},
    "name": "DiscoveryViewFCWorkflowsQuery",
    "operationKind": "query",
    "text": "query DiscoveryViewFCWorkflowsQuery(\n  $input: queryInput_fedWorkflowRuns_input_Input\n) {\n  fedWorkflowRuns(input: $input) {\n    id\n    startedAt\n    status\n    workflowVersion {\n      version\n      workflow {\n        name\n      }\n    }\n    entityInputs {\n      edges {\n        node {\n          inputEntityId\n          entityType\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b013cd118ffde9f0c2cc85fa8822180d";

export default node;
