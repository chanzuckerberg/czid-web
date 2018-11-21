import { forbidExtraProps } from "airbnb-prop-types";
import Modal from "../../ui/containers/Modal";
import PhyloTreeCreation from "./PhyloTreeCreation";
import PropTypes from "prop-types";
import React from "react";

class PhyloTreeCreationModal extends React.Component {
  render() {
    // <PhyloTreeCreationModal> is always open when rendered.
    // To hide <PhyloTreeCreationModal>, we simply don't render it.
    return (
      <Modal open onClose={this.props.onClose}>
        <PhyloTreeCreation onComplete={this.props.onClose} {...this.props} />
      </Modal>
    );
  }
}

PhyloTreeCreationModal.propTypes = forbidExtraProps({
  onClose: PropTypes.func.isRequired,
  admin: PropTypes.number,
  csrf: PropTypes.string.isRequired,
  projectId: PropTypes.number,
  projectName: PropTypes.string,
  taxonId: PropTypes.number,
  taxonName: PropTypes.string
});

export default PhyloTreeCreationModal;
