import { putWithCSRF } from "./core";

export const rerunPhyloTree = id => putWithCSRF(`/phylo_tree_ngs/${id}/rerun`);
