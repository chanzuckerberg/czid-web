import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import cs from "./remove_icon.scss";

const RemoveIcon = ({ className, onClick }) => {
  return (
    <svg
      className={cx(className, cs.removeIcon, onClick && cs.clickable)}
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
    >
      <path
        fill="#000"
        fillRule="evenodd"
        d="M6.868 6L12 11.132l-.868.868L6 6.868.868 12 0 11.132 5.132 6 0 .868.868 0 6 5.132 11.132 0 12 .868z"
      />
    </svg>
  );
};

RemoveIcon.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default RemoveIcon;
