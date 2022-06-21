import { putWithCSRF } from "./core";

const updateHeatmapName = (visualizationId, visualizationName) => {
  putWithCSRF(`/visualizations/${visualizationId}.json`, {
    name: visualizationName,
  });
};

export { updateHeatmapName };
