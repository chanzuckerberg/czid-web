import PropTypes from "prop-types";
import React from "react";
import { Modal as SemanticModal } from "semantic-ui-react";

class Modal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <SemanticModal
        className="idseq-ui"
        open={this.props.open}
        trigger={this.props.trigger}
      >
        {this.props.title && (
          <SemanticModal.Header>{this.props.title}</SemanticModal.Header>
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
  title: PropTypes.string,
  trigger: PropTypes.node.isRequired
};

export default Modal;
