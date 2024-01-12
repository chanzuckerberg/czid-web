/**
 * @generated SignedSource<<f5fa02544ae64b29280843080d31610f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type MetadataTabFragment$data = {
  readonly editable: boolean | null | undefined;
  readonly host_genome_name: string | null | undefined;
  readonly host_genome_taxa_category: string | null | undefined;
  readonly name: string | null | undefined;
  readonly project_id: number | null | undefined;
  readonly project_name: string | null | undefined;
  readonly " $fragmentType": "MetadataTabFragment";
};
export type MetadataTabFragment$key = {
  readonly " $data"?: MetadataTabFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"MetadataTabFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "MetadataTabFragment",
  "selections": [
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
      "name": "editable",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "project_id",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "project_name",
      "storageKey": null
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
    }
  ],
  "type": "query_SampleMetadata_additional_info",
  "abstractKey": null
};

(node as any).hash = "8fc9519f8eba99a9c5cc9f267280247a";

export default node;
