import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { clamp } from "lodash/fp";

import cs from "./loading_bar.scss";

class LoadingBar extends React.Component {
  render() {
    const { percentage, showHint, tiny } = this.props;

    return (
      <div className={cx(cs.loadingBarBackground, tiny && cs.tiny)}>
        <div
          className={cx(cs.loadingBar, showHint && cs.showHint)}
          style={{ width: `${clamp(0, 1, percentage) * 100}%` }}
        />
      </div>
    );
  }
}

LoadingBar.propTypes = {
  percentage: PropTypes.number,
  // If true, we show a tiny sliver of loading bar even at 0%, to help users understand.
  showHint: PropTypes.bool,
  // Alternative styling for loading bars with small width. The height is narrower.
  tiny: PropTypes.bool,
};

export default LoadingBar;
