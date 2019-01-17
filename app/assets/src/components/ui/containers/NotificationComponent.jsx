import React from "react";
import PropTypes from "prop-types";
import cs from "./notification_component.scss";

const NotificationComponent = ({ handleCloseToast }) => {
  return (
    <div className={cs.warningComponent}>
      Warning Component
      <div onClick={handleCloseToast}>Dismiss</div>
    </div>
  );
};

NotificationComponent.propTypes = {
  handleCloseToast: PropTypes.func
};

export default NotificationComponent;
