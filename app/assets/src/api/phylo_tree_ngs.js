import { get, putWithCSRF } from "./core";

export const rerunPhyloTreeNg = id =>
  putWithCSRF(`/phylo_tree_ngs/${id}/rerun`);

export const getPhyloTreeNg = id => get(`/phylo_tree_ngs/${id}.json`);
