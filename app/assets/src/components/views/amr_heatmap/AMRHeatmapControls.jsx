import React from "react";
import PropTypes from "prop-types";
import { Dropdown } from "~ui/controls/dropdowns";
import { Divider } from "~/components/layout";

import cs from "./amr_heatmap_view.scss";

export default class AMRHeatmapControls extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  renderMetricSelect() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.props.options.metrics}
        onChange={this.onMetricChange}
        value={this.props.selectedOptions.metric}
        label="Metric"
        disabled={!this.props.data}
      />
    );
  }

  onMetricChange = metric => {
    if (metric === this.props.selectedOptions.metric) {
      return;
    }

    this.props.onSelectedOptionsChange({ metric });
  };

  render() {
    return (
      <div className={cs.menu}>
        <Divider />
        <div className={`${cs.filterRow} row`}>
          <div className="col s3">{this.renderMetricSelect()}</div>
        </div>
        <Divider />
      </div>
    );
  }
}

AMRHeatmapControls.propTypes = {
  options: PropTypes.shape({
    metrics: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string,
        value: PropTypes.string,
      })
    ),
  }),
  selectedOptions: PropTypes.shape({
    metric: PropTypes.string,
  }),
  onSelectedOptionsChange: PropTypes.func.isRequired,
  data: PropTypes.bool,
};
