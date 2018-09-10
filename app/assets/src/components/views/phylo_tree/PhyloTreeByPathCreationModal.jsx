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
  }

  handleOpen() {
    this.setState({ open: true });
  }

  render() {
    return (
      <Modal
        trigger={<span onClick={this.handleOpen}>{this.props.trigger}</span>}
        open={this.state.open}
      >
        <PhyloTreeByPathCreation
          onComplete={() => {
            this.setState({ open: false });
          }}
        />
      </Modal>
    );
  }
}

export default PhyloTreeByPathCreationModal;
