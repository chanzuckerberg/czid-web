import React from "react";
import PropTypes from "prop-types";

import { clamp } from "lodash/fp";

import cs from "./loading_bar.scss";

class LoadingBar extends React.Component {
  render() {
    const { percentage } = this.props;

    return (
      <div className={cs.loadingBarBackground}>
        <div
          className={cs.loadingBar}
          style={{ width: `${clamp(0, 1, percentage) * 100}%` }}
        />
      </div>
    );
  }
}

LoadingBar.propTypes = {
  percentage: PropTypes.number,
};

export default LoadingBar;
