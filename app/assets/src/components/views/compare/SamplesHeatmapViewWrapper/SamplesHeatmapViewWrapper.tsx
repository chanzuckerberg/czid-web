import React from "react";
import { UserContext } from "~/components/common/UserContext";
import { CZID_8194_HEATMAP_SCROLL } from "~/components/utils/features";
import SamplesHeatmapView, {
  SamplesHeatmapViewProps,
} from "../SamplesHeatmapView/SamplesHeatmapView";
import SamplesHeatmapViewCZID8194 from "../SamplesHeatmapViewCZID8194";

// This component is a wrapper for the SamplesHeatmapView and SamplesHeatmapVieCZID8194 components.
// It is a class component because it's rendered by react_component in Rails.

class SamplesHeatmapViewWrapper extends React.Component<SamplesHeatmapViewProps> {
  render() {
    const { allowedFeatures } = this.context;
    return allowedFeatures?.includes(CZID_8194_HEATMAP_SCROLL) ? (
      <SamplesHeatmapViewCZID8194 {...this.props} />
    ) : (
      <SamplesHeatmapView {...this.props} />
    );
  }
}

SamplesHeatmapViewWrapper.contextType = UserContext;

// SamplesHeatmapViewWrapper.name = "SamplesHeatmapViewWrapper";
export default SamplesHeatmapViewWrapper;
