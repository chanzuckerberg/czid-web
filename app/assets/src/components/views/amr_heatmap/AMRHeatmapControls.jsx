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

  generateChangeFunction(filter) {
    const changeFunction = option => {
      if (option === this.props.selectedOptions[filter]) {
        return;
      }
      this.props.onSelectedOptionsChange({ [filter]: option });
    };
    return changeFunction;
  }

  renderMetricSelect() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.props.options.metrics}
        onChange={this.generateChangeFunction("metric")}
        value={this.props.selectedOptions.metric}
        label="Metric"
        disabled={!this.props.data}
      />
    );
  }

  renderViewLevelSelect() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.props.options.viewLevels}
        onChange={this.generateChangeFunction("viewLevel")}
        value={this.props.selectedOptions.viewLevel}
        label="View Level"
        disabled={!this.props.data}
      />
    );
  }

  render() {
    return (
      <div className={cs.menu}>
        <Divider />
        <div className={`${cs.filterRow} row`}>
          <div className="col s3">{this.renderViewLevelSelect()}</div>
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
    viewLevels: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string,
        value: PropTypes.string,
      })
    ),
  }),
  selectedOptions: PropTypes.shape({
    metric: PropTypes.string,
    viewLevel: PropTypes.string,
  }),
  onSelectedOptionsChange: PropTypes.func.isRequired,
  data: PropTypes.bool,
};
