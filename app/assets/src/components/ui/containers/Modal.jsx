import PropTypes from "prop-types";
import React from "react";
import cx from "classnames";
import { forbidExtraProps } from "airbnb-prop-types";
import { Modal as SemanticModal } from "semantic-ui-react";
import RemoveIcon from "../icons/RemoveIcon";
import cs from "./modal.scss";

class Modal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <SemanticModal
        {...this.props}
        className={cx(
          cs.modal,
          this.props.className,
          this.props.tall && cs.tall
        )}
        trigger={<span />}
      >
        {this.props.title && (
          <SemanticModal.Header>{this.props.title}</SemanticModal.Header>
        )}
        {this.props.onClose && (
          <RemoveIcon className={cs.closeIcon} onClick={this.props.onClose} />
        )}
        <SemanticModal.Content>{this.props.children}</SemanticModal.Content>
      </SemanticModal>
    );
  }
}

Modal.propTypes = forbidExtraProps({
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  open: PropTypes.bool,
  className: PropTypes.string,
  tall: PropTypes.bool // Increase the max-height of the Modal for tall content.
});

export default Modal;
