import React from "react";
import PropTypes from "prop-types";

import { Divider } from "~/components/layout";
import { Dropdown } from "~ui/controls/dropdowns";

import cs from "./amr_heatmap_view.scss";

export default class AMRHeatmapControls extends React.Component {
  constructor(props) {
    super(props);
  }

  generateChangeFunction(filter) {
    const changeFunction = option => {
      if (option === this.props.selectedOptions[filter]) {
        return;
      }
      this.props.onSelectedOptionsChange({ [filter]: option });
    };
    return changeFunction;
  }

  generateFilterDropdown(filter) {
    return (
      <Dropdown
        fluid
        rounded
        options={this.props.filters.get(filter).options}
        onChange={this.generateChangeFunction(filter)}
        value={this.props.selectedOptions[filter]}
        label={this.props.filters.get(filter).label}
        disabled={!this.props.data}
      />
    );
  }

  renderFilterDropdowns() {
    const filtersList = [];
    this.props.filters.forEach((_, filter) => {
      const dropdown = this.generateFilterDropdown(filter);
      filtersList.push(<div className="col s3">{dropdown}</div>);
    });
    return filtersList;
  }

  render() {
    return (
      <div className={cs.menu}>
        <Divider />
        <div className={`${cs.filterRow} row`}>
          {this.renderFilterDropdowns()}
        </div>
        <Divider />
      </div>
    );
  }
}

AMRHeatmapControls.propTypes = {
  filters: PropTypes.instanceOf(Map).isRequired,
  selectedOptions: PropTypes.shape({
    metric: PropTypes.string,
    viewLevel: PropTypes.string,
  }),
  onSelectedOptionsChange: PropTypes.func.isRequired,
  data: PropTypes.bool,
};
