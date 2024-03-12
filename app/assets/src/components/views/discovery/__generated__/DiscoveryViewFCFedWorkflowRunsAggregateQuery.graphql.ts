/**
 * @generated SignedSource<<34d6821b55d89326bb94e2af6293ccb7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type queryInput_fedWorkflowRunsAggregate_input_Input = {
  todoRemove?: queryInput_fedWorkflowRunsAggregate_input_todoRemove_Input | null | undefined;
  where?: queryInput_fedWorkflowRunsAggregate_input_where_Input | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregate_input_where_Input = {
  id?: queryInput_fedWorkflowRunsAggregate_input_where_id_Input | null | undefined;
  workflowVersion?: queryInput_fedWorkflowRunsAggregate_input_where_workflowVersion_Input | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregate_input_where_id_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregate_input_where_workflowVersion_Input = {
  workflow?: queryInput_fedWorkflowRunsAggregate_input_where_workflowVersion_workflow_Input | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregate_input_where_workflowVersion_workflow_Input = {
  name?: queryInput_fedWorkflowRunsAggregate_input_where_workflowVersion_workflow_name_Input | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregate_input_where_workflowVersion_workflow_name_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregate_input_todoRemove_Input = {
  annotations?: ReadonlyArray<queryInput_fedWorkflowRunsAggregate_input_todoRemove_annotations_items_Input | null | undefined> | null | undefined;
  domain?: string | null | undefined;
  host?: ReadonlyArray<number | null | undefined> | null | undefined;
  locationV2?: ReadonlyArray<string | null | undefined> | null | undefined;
  projectId?: string | null | undefined;
  search?: string | null | undefined;
  taxaLevels?: ReadonlyArray<string | null | undefined> | null | undefined;
  taxon?: ReadonlyArray<number | null | undefined> | null | undefined;
  taxonThresholds?: ReadonlyArray<queryInput_fedWorkflowRunsAggregate_input_todoRemove_taxonThresholds_items_Input | null | undefined> | null | undefined;
  time?: ReadonlyArray<string | null | undefined> | null | undefined;
  tissue?: ReadonlyArray<string | null | undefined> | null | undefined;
  visibility?: string | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregate_input_todoRemove_taxonThresholds_items_Input = {
  count_type?: string | null | undefined;
  metric?: string | null | undefined;
  operator?: string | null | undefined;
  value?: string | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregate_input_todoRemove_annotations_items_Input = {
  name?: string | null | undefined;
};
export type DiscoveryViewFCFedWorkflowRunsAggregateQuery$variables = {
  input?: queryInput_fedWorkflowRunsAggregate_input_Input | null | undefined;
};
export type DiscoveryViewFCFedWorkflowRunsAggregateQuery$data = {
  readonly fedWorkflowRunsAggregate: {
    readonly aggregate: ReadonlyArray<{
      readonly count: number;
      readonly groupBy: {
        readonly collectionId: number;
        readonly workflowVersion: {
          readonly workflow: {
            readonly name: string;
          };
        };
      };
    } | null | undefined> | null | undefined;
  } | null | undefined;
};
export type DiscoveryViewFCFedWorkflowRunsAggregateQuery = {
  response: DiscoveryViewFCFedWorkflowRunsAggregateQuery$data;
  variables: DiscoveryViewFCFedWorkflowRunsAggregateQuery$variables;
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
    "concreteType": "fedWorkflowRunsAggregate",
    "kind": "LinkedField",
    "name": "fedWorkflowRunsAggregate",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "query_fedWorkflowRunsAggregate_aggregate_items",
        "kind": "LinkedField",
        "name": "aggregate",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "query_fedWorkflowRunsAggregate_aggregate_items_groupBy",
            "kind": "LinkedField",
            "name": "groupBy",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "collectionId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "query_fedWorkflowRunsAggregate_aggregate_items_groupBy_workflowVersion",
                "kind": "LinkedField",
                "name": "workflowVersion",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "query_fedWorkflowRunsAggregate_aggregate_items_groupBy_workflowVersion_workflow",
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
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "count",
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
    "name": "DiscoveryViewFCFedWorkflowRunsAggregateQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DiscoveryViewFCFedWorkflowRunsAggregateQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "b898dce6714face6756b9a7f2a13bda2",
    "id": null,
    "metadata": {},
    "name": "DiscoveryViewFCFedWorkflowRunsAggregateQuery",
    "operationKind": "query",
    "text": "query DiscoveryViewFCFedWorkflowRunsAggregateQuery(\n  $input: queryInput_fedWorkflowRunsAggregate_input_Input\n) {\n  fedWorkflowRunsAggregate(input: $input) {\n    aggregate {\n      groupBy {\n        collectionId\n        workflowVersion {\n          workflow {\n            name\n          }\n        }\n      }\n      count\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "caccf7f95c73f91dd9c9ba8d9f0e8239";

export default node;
