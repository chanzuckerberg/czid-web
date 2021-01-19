import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { clamp } from "lodash/fp";

import cs from "./loading_bar.scss";

const LoadingBar = ({ error = false, percentage, showHint, tiny }) => {
  return (
    <div
      className={cx(
        cs.loadingBarBackground,
        tiny && cs.tiny,
        error || cs.loading
      )}
    >
      <div
        className={cx(
          cs.loadingBar,
          showHint && cs.showHint,
          error && cs.error
        )}
        style={{ width: `${clamp(0, 1, percentage) * 100}%` }}
      />
    </div>
  );
};

LoadingBar.propTypes = {
  // If true, set the loading bar's color to $error-medium.
  error: PropTypes.bool,
  percentage: PropTypes.number,
  // If true, we show a tiny sliver of loading bar even at 0%, to help users understand.
  showHint: PropTypes.bool,
  // Alternative styling for loading bars with small width. The height is narrower.
  tiny: PropTypes.bool,
};

export default LoadingBar;
