import cx from "classnames";
import { clamp } from "lodash/fp";
import React from "react";
import cs from "./loading_bar.scss";

interface LoadingBarProps {
  // If true, set the loading bar's color to $error-medium.
  error?: boolean;
  percentage?: number;
  // If true, we show a tiny sliver of loading bar even at 0%, to help users understand.
  showHint?: boolean;
  // Alternative styling for loading bars with small width. The height is narrower.
  tiny?: boolean;
}

const LoadingBar = ({
  error = false,
  percentage,
  showHint,
  tiny,
}: LoadingBarProps) => {
  return (
    <div
      className={cx(
        cs.loadingBarBackground,
        tiny && cs.tiny,
        error || cs.loading,
      )}
    >
      <div
        className={cx(
          cs.loadingBar,
          showHint && cs.showHint,
          error && cs.error,
        )}
        style={{ width: `${clamp(0, 1, percentage) * 100}%` }}
      />
    </div>
  );
};

export default LoadingBar;
