import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import cs from "./icon_close_small.scss";

const IconCloseSmall = ({ className, onClick }) => {
  return (
    <svg
      className={cx(className, cs.removeIcon, onClick && cs.clickable)}
      onClick={onClick}
      width="14px"
      height="14px"
      viewBox="0 0 14 14"
      fillRule="evenodd"
    >
      <polygon points="12.1320625 0.752850121 7.061 5.824 1.98994949 0.752512627 0.752512627 1.98994949 5.824 7.061 0.752512627 12.1324 1.98994949 13.3698369 7.061 8.298 12.1320625 13.3694994 13.3698744 12.1324375 8.298 7.061 13.3698744 1.98991199"></polygon>
    </svg>
  );
};

IconCloseSmall.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default IconCloseSmall;
