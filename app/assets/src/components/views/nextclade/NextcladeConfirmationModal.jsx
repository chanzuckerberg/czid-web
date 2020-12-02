import React from "react";
import PropTypes from "prop-types";

import { Image } from "semantic-ui-react";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";

import cs from "./nextclade_confirmation_modal.scss";

const NextcladeConfirmationModal = ({ onCancel, onConfirm, open }) => {
  return (
    <Modal className={cs.nextcladeConfirmation} narrowest open={open}>
      <Image className={cs.logo} src="/assets/LogoNextclade.png" />
      <div className={cs.title}>
        Please confirm you're ready to send your data to Nextclade.
      </div>
      <div className={cs.text}>
        You are leaving IDseq and sending your sequence and reference tree to a
        private visualization on nextstrain.org, which is not controlled by
        IDseq.
      </div>
      <div className={cs.actions}>
        <div className={cs.item}>
          <PrimaryButton text="Confirm" rounded={true} onClick={onConfirm} />
        </div>
        <div className={cs.item}>
          <SecondaryButton text="Cancel" rounded={true} onClick={onCancel} />
        </div>
      </div>
    </Modal>
  );
};

NextcladeConfirmationModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  open: PropTypes.bool,
};

export default NextcladeConfirmationModal;
