import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { Divider } from "~/components/layout";
import { Dropdown } from "~ui/controls/dropdowns";
import SequentialLegendVis from "~/components/visualizations/legends/SequentialLegendVis.jsx";

import cs from "./amr_heatmap_view.scss";

export default class AMRHeatmapControls extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      legend: {
        max: 0,
        scale: "symlog",
      },
    };
  }

  componentDidUpdate() {
    if (
      this.props.maxValueForLegend !== this.state.legend.max ||
      this.props.selectedOptions.scale !== this.state.legend.scale
    ) {
      this.setState({
        legend: {
          max: this.props.maxValueForLegend,
          scale: this.props.selectedOptions.scale,
        },
      });
    }
  }

  handleOptionChange(control, option) {
    const { selectedOptions, onSelectedOptionsChange } = this.props;
    if (option !== selectedOptions[control]) {
      onSelectedOptionsChange({ [control]: option });
    }
  }

  renderControlDropdowns() {
    const { controls, selectedOptions, isDataReady } = this.props;
    const controlsList = controls.map(control => {
      return (
        <div className="col s3" key={control.key}>
          <Dropdown
            fluid
            rounded
            options={control.options}
            onChange={option => this.handleOptionChange(control.key, option)}
            value={selectedOptions[control.key]}
            label={control.label}
            disabled={!isDataReady}
          />
        </div>
      );
    });
    return controlsList;
  }

  renderLegend() {
    // Don't render a color legend if the heatmap is still loading
    if (!this.props.isDataReady) {
      return;
    }
    // This code is here so that when we need the legend to change
    // because the scale has changed, React will unload the current
    // legend from the DOM, and render the new, proper one when state updates.
    if (
      this.props.maxValueForLegend !== this.state.legend.max ||
      this.props.selectedOptions.scale !== this.state.legend.scale
    ) {
      return;
    }
    return (
      <div className="col s3" key="SequentialLegendVis">
        <SequentialLegendVis
          min={0}
          max={this.state.legend.max}
          scale={this.state.legend.scale}
        />
      </div>
    );
  }

  render() {
    return (
      <div className={cs.menu}>
        <Divider />
        <div className={cx(cs.filterRow, "row")}>
          {this.renderControlDropdowns()}
          {this.renderLegend()}
        </div>
        <Divider />
      </div>
    );
  }
}

AMRHeatmapControls.propTypes = {
  controls: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
          value: PropTypes.string,
        })
      ),
      label: PropTypes.string,
    })
  ),
  selectedOptions: PropTypes.shape({
    metric: PropTypes.string,
    viewLevel: PropTypes.string,
    scale: PropTypes.string,
  }),
  onSelectedOptionsChange: PropTypes.func.isRequired,
  isDataReady: PropTypes.bool,
  maxValueForLegend: PropTypes.number,
};
