/**
 * @generated SignedSource<<fa262452bed45a6aaceffe0cfedf9e1c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PathogenListViewQuery$variables = {};
export type PathogenListViewQuery$data = {
  readonly pathogenList: {
    readonly citations: ReadonlyArray<string> | null;
    readonly updatedAt: any | null;
    readonly version: string | null;
    readonly " $fragmentSpreads": FragmentRefs<"AnchorMenuFragment" | "SectionNavigationFragment">;
  };
};
export type PathogenListViewQuery = {
  response: PathogenListViewQuery$data;
  variables: PathogenListViewQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "version",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "citations",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "PathogenListViewQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "PathogenList",
        "kind": "LinkedField",
        "name": "pathogenList",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          (v1/*: any*/),
          (v2/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "AnchorMenuFragment"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "SectionNavigationFragment"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "PathogenListViewQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "PathogenList",
        "kind": "LinkedField",
        "name": "pathogenList",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          (v1/*: any*/),
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Pathogen",
            "kind": "LinkedField",
            "name": "pathogens",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "category",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "name",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "taxId",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "dd275fde5f321cf72e9d4a9670273701",
    "id": null,
    "metadata": {},
    "name": "PathogenListViewQuery",
    "operationKind": "query",
    "text": "query PathogenListViewQuery {\n  pathogenList {\n    version\n    citations\n    updatedAt\n    ...AnchorMenuFragment\n    ...SectionNavigationFragment\n    id\n  }\n}\n\nfragment AnchorMenuFragment on PathogenList {\n  pathogens {\n    category\n    name\n    taxId\n  }\n}\n\nfragment SectionNavigationFragment on PathogenList {\n  pathogens {\n    category\n    name\n  }\n}\n"
  }
};
})();

(node as any).hash = "bb3565e84afb1d35a43ea510d2ffdb2a";

export default node;
