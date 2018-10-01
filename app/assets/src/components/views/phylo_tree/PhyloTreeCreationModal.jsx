import Modal from "../../ui/containers/Modal";
import PhyloTreeCreation from "./PhyloTreeCreation";
import PropTypes from "prop-types";
import React from "react";

class PhyloTreeCreationModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false
    };

    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleOpen() {
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false });
  }

  render() {
    return (
      <Modal
        trigger={<span onClick={this.handleOpen}>{this.props.trigger}</span>}
        open={this.state.open}
        onClose={this.handleClose}
      >
        <PhyloTreeCreation
          onComplete={() => {
            this.setState({ open: false });
          }}
          {...this.props}
        />
      </Modal>
    );
  }
}

PhyloTreeCreationModal.propTypes = {
  trigger: PropTypes.node
};

export default PhyloTreeCreationModal;
