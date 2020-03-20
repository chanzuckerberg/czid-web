import PropTypes from "prop-types";
import React from "react";
import cx from "classnames";
import { forbidExtraProps } from "airbnb-prop-types";
import { Modal as SemanticModal } from "semantic-ui-react";
import RemoveIcon from "../icons/RemoveIcon";
import cs from "./modal.scss";

class Modal extends React.Component {
  render() {
    const {
      fixedHeight,
      narrow,
      narrowest,
      tall,
      wide,
      className,
      ...extraProps
    } = this.props;

    return (
      <SemanticModal
        {...extraProps}
        className={cx(
          cs.modal,
          className,
          narrow && cs.narrow,
          narrowest && cs.narrowest,
          tall && cs.tall,
          wide && cs.wide,
          fixedHeight && cs.fixedHeight
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
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  fixedHeight: PropTypes.bool,
  narrow: PropTypes.bool, // Decrease the width of the Modal for smaller modals.
  narrowest: PropTypes.bool, // Decrease the width of the Modal for the smallest modals.
  wide: PropTypes.bool, // Increase the width of the Modal for the wider modals.
  tall: PropTypes.bool, // Increase the max-height of the Modal for tall content.
  title: PropTypes.string,
});

export default Modal;
