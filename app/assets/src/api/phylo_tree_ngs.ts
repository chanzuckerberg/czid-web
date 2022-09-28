import { get, putWithCSRF } from "./core";

export const rerunPhyloTreeNg = (id: $TSFixMe) =>
  putWithCSRF(`/phylo_tree_ngs/${id}/rerun`);

export const getPhyloTreeNg = (id: $TSFixMe) =>
  get(`/phylo_tree_ngs/${id}.json`);

export const chooseTaxon = ({ query, projectId }: $TSFixMe) =>
  get("/phylo_tree_ngs/choose_taxon", {
    params: {
      query,
      projectId,
      args: "species,genus",
    },
  });
