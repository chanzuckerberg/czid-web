import React from "react";

import ThresholdMap from "~/components/utils/ThresholdMap";
import PropTypes from "~/components/utils/propTypes";

import FilterTag from "~ui/controls/FilterTag";

export default class ThresholdFilterTag extends React.Component {
  render() {
    const { threshold, onClose, className } = this.props;
    const text = `${threshold.metricDisplay} ${threshold.operator} ${threshold.value}`;

    if (ThresholdMap.isThresholdValid(threshold)) {
      return <FilterTag text={text} onClose={onClose} className={className} />;
    }
    return null;
  }
}

ThresholdFilterTag.propTypes = {
  onClose: PropTypes.func,
  threshold: PropTypes.shape({
    metric: PropTypes.string,
    value: PropTypes.string,
    operator: PropTypes.string,
    metricDisplay: PropTypes.string,
  }),
  className: PropTypes.string,
};
