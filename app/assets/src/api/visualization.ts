import { putWithCSRF } from "./core";

const updateHeatmapName = (
  visualizationId: $TSFixMe,
  visualizationName: $TSFixMe,
) => {
  putWithCSRF(`/visualizations/${visualizationId}.json`, {
    name: visualizationName,
  });
};

export { updateHeatmapName };
