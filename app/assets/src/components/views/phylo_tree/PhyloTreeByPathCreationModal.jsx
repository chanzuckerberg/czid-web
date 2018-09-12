import Modal from "../../ui/containers/Modal";
import PhyloTreeByPathCreation from "./PhyloTreeByPathCreation";
import PropTypes from "prop-types";
import React from "react";

class PhyloTreeByPathCreationModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false
    };

    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleOpen() {
    console.log("handling open");
    this.setState({ open: true });
  }

  handleClose() {
    console.log("handling close");
    this.setState({ open: false });
  }

  render() {
    return (
      <Modal
        trigger={<span onClick={this.handleOpen}>{this.props.trigger}</span>}
        open={this.state.open}
        onClose={this.handleClose}
      >
        <PhyloTreeByPathCreation
          onComplete={() => {
            this.setState({ open: false });
          }}
          {...this.props}
        />
      </Modal>
    );
  }
}

export default PhyloTreeByPathCreationModal;
