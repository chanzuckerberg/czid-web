import React from "react";
import { Modal } from "semantic-ui-react";
import PropTypes from "prop-types";

class CliUserInstructionsModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Modal
        trigger={this.props.trigger}
        className="project-popup generic-centered-modal"
      >
        <Modal.Header>Command Line Upload Instructions</Modal.Header>
        <Modal.Content />
      </Modal>
    );
  }
}

CliUserInstructionsModal.propTypes = {
  trigger: PropTypes.node
};

export default CliUserInstructionsModal;
