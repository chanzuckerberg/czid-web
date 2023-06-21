import cx from "classnames";
import React from "react";
import { Modal as SemanticModal } from "semantic-ui-react";
import { IconClose } from "~ui/icons";
import cs from "./modal.scss";

interface ModalProps {
  children?: React.ReactNode[] | React.ReactNode;
  className?: string;
  onClose?: $TSFixMeFunction;
  open?: boolean;
  fixedHeight?: boolean;
  minimumHeight?: boolean;
  narrow?: boolean; // Sets the Modal to a minimum height it cannot shrink past.;
  narrowest?: boolean; // Decrease the width of the Modal for smaller modals.;
  wide?: boolean; // Decrease the width of the Modal for the smallest modals.;
  tall?: boolean; // Increase the width of the Modal for the wider modals.;
  title?: string; // Increase the max-height of the Modal for tall content.;
  sCloseIcon?: boolean;
  xlCloseIcon?: boolean;
}

class Modal extends React.Component<ModalProps> {
  static defaultProps: ModalProps;
  render() {
    const {
      fixedHeight,
      minimumHeight,
      narrow,
      narrowest,
      tall,
      wide,
      className,
      sCloseIcon,
      xlCloseIcon,
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
          fixedHeight && cs.fixedHeight,
          minimumHeight && cs.minimumHeight,
        )}
        dimmer={"inverted"}
        trigger={<span />}
      >
        {this.props.title && (
          <SemanticModal.Header>{this.props.title}</SemanticModal.Header>
        )}
        {this.props.onClose && (
          <IconClose
            className={cx(
              cs.closeIcon,
              xlCloseIcon && cs.xl,
              sCloseIcon && cs.s,
            )}
            onClick={this.props.onClose}
            data-testid="modal-close-icon"
          />
        )}
        <SemanticModal.Content>{this.props.children}</SemanticModal.Content>
      </SemanticModal>
    );
  }
}

Modal.defaultProps = {
  sCloseIcon: false,
  xlCloseIcon: false,
};

export default Modal;
