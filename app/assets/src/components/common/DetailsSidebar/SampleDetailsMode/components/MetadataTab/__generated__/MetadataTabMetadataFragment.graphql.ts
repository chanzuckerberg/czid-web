/**
 * @generated SignedSource<<527125da4d85973cbac608b19d6b9523>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type MetadataTabMetadataFragment$data = {
  readonly additional_info: {
    readonly editable: boolean | null | undefined;
    readonly host_genome_name: string | null | undefined;
    readonly host_genome_taxa_category: string | null | undefined;
    readonly name: string;
    readonly project_id: number;
    readonly project_name: string;
    readonly upload_date: string | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "MetadataTabMetadataFragment";
};
export type MetadataTabMetadataFragment$key = {
  readonly " $data"?: MetadataTabMetadataFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"MetadataTabMetadataFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "MetadataTabMetadataFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "query_SampleMetadata_additional_info",
      "kind": "LinkedField",
      "name": "additional_info",
      "plural": false,
      "selections": [
        {
          "kind": "RequiredField",
          "field": {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "name",
            "storageKey": null
          },
          "action": "LOG",
          "path": "additional_info.name"
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "editable",
          "storageKey": null
        },
        {
          "kind": "RequiredField",
          "field": {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "project_id",
            "storageKey": null
          },
          "action": "LOG",
          "path": "additional_info.project_id"
        },
        {
          "kind": "RequiredField",
          "field": {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "project_name",
            "storageKey": null
          },
          "action": "LOG",
          "path": "additional_info.project_name"
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "host_genome_taxa_category",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "host_genome_name",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "upload_date",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "SampleMetadata",
  "abstractKey": null
};

(node as any).hash = "5df9852e1d7dbe81a1e479fefbb1620f";

export default node;
