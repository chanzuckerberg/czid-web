import PropTypes from "prop-types";
import React from "react";
import { Modal as SemanticModal } from "semantic-ui-react";
import RemoveIcon from "../icons/RemoveIcon";

class Modal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <SemanticModal className="idseq-ui" {...this.props}>
        {this.props.title && (
          <SemanticModal.Header>{this.props.title}</SemanticModal.Header>
        )}
        {this.props.onClose && (
          <div className="close-icon" onClick={this.props.onClose}>
            <RemoveIcon />
          </div>
        )}
        <SemanticModal.Content>{this.props.children}</SemanticModal.Content>
      </SemanticModal>
    );
  }
}

Modal.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  trigger: PropTypes.node.isRequired
};

export default Modal;
