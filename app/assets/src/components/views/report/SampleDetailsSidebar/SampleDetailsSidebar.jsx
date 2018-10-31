import React from "react";
import PropTypes from "prop-types";
import Sidebar from "../../../ui/containers/Sidebar";
import RemoveIcon from "../../../ui/icons/RemoveIcon";
import cs from "./sample_details_sidebar.scss";

class SampleDetailsSidebar extends React.Component {
  render() {
    const { visible } = this.props;
    return (
      <Sidebar visible={visible} width="very wide">
        <div className={cs.content}>
          <RemoveIcon className={cs.closeIcon} onClick={this.props.onClose} />
          <div className={cs.title}>Sample Details</div>
        </div>
      </Sidebar>
    );
  }
}

SampleDetailsSidebar.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired
};

export default SampleDetailsSidebar;
