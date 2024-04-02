/**
 * @generated SignedSource<<dc5426bf20a2b8a84cdcea47358b42d3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type queryInput_fedWorkflowRunsAggregateTotalCount_input_Input = {
  todoRemove?: queryInput_fedWorkflowRunsAggregateTotalCount_input_todoRemove_Input | null | undefined;
  where?: queryInput_fedWorkflowRunsAggregateTotalCount_input_where_Input | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregateTotalCount_input_where_Input = {
  collectionId?: queryInput_fedWorkflowRunsAggregateTotalCount_input_where_collectionId_Input | null | undefined;
  workflowVersion?: queryInput_fedWorkflowRunsAggregateTotalCount_input_where_workflowVersion_Input | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregateTotalCount_input_where_collectionId_Input = {
  _in?: ReadonlyArray<number | null | undefined> | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregateTotalCount_input_where_workflowVersion_Input = {
  workflow?: queryInput_fedWorkflowRunsAggregateTotalCount_input_where_workflowVersion_workflow_Input | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregateTotalCount_input_where_workflowVersion_workflow_Input = {
  name?: queryInput_fedWorkflowRunsAggregateTotalCount_input_where_workflowVersion_workflow_name_Input | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregateTotalCount_input_where_workflowVersion_workflow_name_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedWorkflowRunsAggregateTotalCount_input_todoRemove_Input = {
  domain?: string | null | undefined;
  projectId?: string | null | undefined;
};
export type DiscoveryViewFCFedWorkflowsTotalCountQuery$variables = {
  input?: queryInput_fedWorkflowRunsAggregateTotalCount_input_Input | null | undefined;
};
export type DiscoveryViewFCFedWorkflowsTotalCountQuery$data = {
  readonly fedWorkflowRunsAggregateTotalCount: {
    readonly aggregate: ReadonlyArray<{
      readonly count: number;
      readonly groupBy: {
        readonly workflowVersion: {
          readonly workflow: {
            readonly name: string;
          };
        };
      };
    } | null | undefined> | null | undefined;
  } | null | undefined;
};
export type DiscoveryViewFCFedWorkflowsTotalCountQuery = {
  response: DiscoveryViewFCFedWorkflowsTotalCountQuery$data;
  variables: DiscoveryViewFCFedWorkflowsTotalCountQuery$variables;
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
    "concreteType": "fedWorkflowRunsAggregateTotalCount",
    "kind": "LinkedField",
    "name": "fedWorkflowRunsAggregateTotalCount",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "query_fedWorkflowRunsAggregateTotalCount_aggregate_items",
        "kind": "LinkedField",
        "name": "aggregate",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "count",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "query_fedWorkflowRunsAggregateTotalCount_aggregate_items_groupBy",
            "kind": "LinkedField",
            "name": "groupBy",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "query_fedWorkflowRunsAggregateTotalCount_aggregate_items_groupBy_workflowVersion",
                "kind": "LinkedField",
                "name": "workflowVersion",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "query_fedWorkflowRunsAggregateTotalCount_aggregate_items_groupBy_workflowVersion_workflow",
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
    "name": "DiscoveryViewFCFedWorkflowsTotalCountQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DiscoveryViewFCFedWorkflowsTotalCountQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "5450ae3241ae567cd6f176ce061ee835",
    "id": null,
    "metadata": {},
    "name": "DiscoveryViewFCFedWorkflowsTotalCountQuery",
    "operationKind": "query",
    "text": "query DiscoveryViewFCFedWorkflowsTotalCountQuery(\n  $input: queryInput_fedWorkflowRunsAggregateTotalCount_input_Input\n) {\n  fedWorkflowRunsAggregateTotalCount(input: $input) {\n    aggregate {\n      count\n      groupBy {\n        workflowVersion {\n          workflow {\n            name\n          }\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "e447cbe8e119a4b0f564f01c18ec1c68";

export default node;
