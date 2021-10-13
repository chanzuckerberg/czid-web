import { get, putWithCSRF } from "./core";

export const rerunPhyloTreeNg = id =>
  putWithCSRF(`/phylo_tree_ngs/${id}/rerun`);

export const getPhyloTreeNg = id => get(`/phylo_tree_ngs/${id}.json`);

export const chooseTaxon = ({ query, projectId }) =>
  get("/phylo_tree_ngs/choose_taxon", {
    params: {
      query,
      projectId,
      args: "species,genus",
    },
  });
