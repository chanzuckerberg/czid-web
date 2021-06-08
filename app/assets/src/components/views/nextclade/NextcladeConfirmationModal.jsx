import PropTypes from "prop-types";
import React from "react";

import { Image } from "semantic-ui-react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import IconLoading from "~/components/ui/icons/IconLoading";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";

import cs from "./nextclade_confirmation_modal.scss";

const NextcladeConfirmationModal = ({ onCancel, onConfirm, open, loading }) => {
  return (
    <Modal className={cs.nextcladeConfirmation} narrowest open={open}>
      <Image className={cs.logo} src="/assets/LogoNextclade.png" />
      <div className={cs.title}>
        You’re ready to send your consensus genomes to Nextclade.
      </div>
      <div className={cs.text}>
        Once you click Confirm, you will leave IDseq and send your sequence(s)
        and reference tree to Nextclade. Please ensure that your Reference Tree
        does not contain any personally identifiable information. Nextclade is a
        third-party tool and has its own policies. You can learn more at {}
        <ExternalLink
          href="https://clades.nextstrain.org"
          analyticsEventName={
            "NextcladeConfirmationModal_nextclade-link_clicked"
          }
        >
          clades.nextstrain.org
        </ExternalLink>
        .
      </div>
      <div className={cs.actions}>
        {loading ? (
          <React.Fragment>
            <IconLoading className={cs.loadingIcon} />
            <span className={cs.loading}>{"Loading..."}</span>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className={cs.item}>
              <PrimaryButton
                text="Confirm"
                rounded={true}
                onClick={onConfirm}
              />
            </div>
            <div className={cs.item}>
              <SecondaryButton
                text="Cancel"
                rounded={true}
                onClick={onCancel}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </Modal>
  );
};

NextcladeConfirmationModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  open: PropTypes.bool,
  loading: PropTypes.bool,
};

export default NextcladeConfirmationModal;
