import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import cs from "./categorical_legend.scss";

// This component takes in an array of objects, each having a color
// and label key, and renders a colored circle and the label text just
// to the right of it.
// Schema:
// this.props.data = [ { color: "#aeaeae", label: "Sample Label" } ]

export default class CategoricalLegend extends React.Component {
  renderCategories() {
    const { data } = this.props;

    const categories = data.map(item => {
      return (
        <div className={cs.category} key={`${item.color}+${item.label}`}>
          <svg className={cs.colorCircle}>
            <circle
              // Circle in the center of the viewBox
              cx="50%"
              cy="50%"
              fill={item.color}
            />
          </svg>
          <span className={cs.label}>{item.label}</span>
        </div>
      );
    });

    return categories;
  }

  render() {
    const { className } = this.props;
    return (
      <div className={cx(cs.legendContainer, className)}>
        {this.renderCategories()}
      </div>
    );
  }
}

CategoricalLegend.propTypes = {
  data: PropTypes.array,
};
