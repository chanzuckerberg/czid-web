import React from "react";
import cx from "classnames";
import BareDropdown from "~/components/ui/controls/dropdowns/BareDropdown";
import PropTypes from "prop-types";
import cs from "./pipeline_status_filter.scss";

const STATUS_OPTIONS = [
  {
    name: "In Progress",
    class: "uploading"
  },
  {
    name: "Complete",
    class: "complete"
  },
  {
    name: "Failed",
    class: "failed"
  },
  {
    name: "All",
    class: "all"
  }
];

class PipelineStatusFilter extends React.Component {
  render() {
    const { className, onStatusFilterSelect } = this.props;

    let trigger = (
      <i
        className={cx(className, cs.tableColumnHeader, "fa fa-filter")}
        aria-hidden="true"
      />
    );

    return (
      <BareDropdown trigger={trigger} floating scrolling hideArrow>
        <BareDropdown.Menu>
          <BareDropdown.Header
            content="Filter Pipeline Status"
            className={cs.header}
          />
          {STATUS_OPTIONS.map(option => (
            <BareDropdown.Item
              key={option.name}
              onClick={() => onStatusFilterSelect(option.name)}
              className={cs.option}
            >
              <span className={cs[option.class]}>{option.name}</span>
            </BareDropdown.Item>
          ))}
        </BareDropdown.Menu>
      </BareDropdown>
    );
  }
}

PipelineStatusFilter.propTypes = {
  className: PropTypes.string,
  onStatusFilterSelect: PropTypes.func
};

export default PipelineStatusFilter;
