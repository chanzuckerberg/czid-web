import PropTypes from "prop-types";
import React, { useState } from "react";

import { Image } from "semantic-ui-react";
import { withAnalytics, ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { NCBI_BLAST_USAGE_GUIDELINES_LINK } from "~/components/utils/documentationLinks";
import Modal from "~ui/containers/Modal";
import Checkbox from "~ui/controls/Checkbox";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";

import cs from "./blast_redirection_modal.scss";

const BlastRedirectionModal = ({ open, onClose, onContinue }) => {
  const [shouldRedirectBlast, setShouldRedirectBlast] = useState(false);

  const renderActions = () => {
    return (
      <div className={cs.actions}>
        <div className={cs.item}>
          <PrimaryButton
            text="Continue"
            rounded
            onClick={() => onContinue(shouldRedirectBlast)}
          />
        </div>
        <div className={cs.item}>
          <SecondaryButton
            text="Cancel"
            rounded
            onClick={withAnalytics(
              onClose,
              ANALYTICS_EVENT_NAMES.BLAST_REDIRECTION_MODAL_CANCEL_BUTTON_CLICKED
            )}
          />
        </div>
      </div>
    );
  };

  return (
    <Modal open={open} narrowest>
      <div className={cs.blastRedirectionModal}>
        <Image className={cs.logo} src="/assets/LogoNCBI.png" />
        <div className={cs.title}>You are now leaving CZ ID.</div>
        <div className={cs.text}>
          By clicking {'"'}Continue{'"'} you agree to send a copy of your
          sequencing data to NCBI{"'"}s BLAST service,and that you understand
          this may make the data accessible to others. NCBI is a separate
          service from CZ ID. Your data will be subject to their{" "}
          <ExternalLink
            analyticEventName={
              ANALYTICS_EVENT_NAMES.BLAST_REDIRECTION_MODAL_CONDITIONS_OF_USE_LINK_CLICKED
            }
            href={NCBI_BLAST_USAGE_GUIDELINES_LINK}
          >
            Conditions of Use
          </ExternalLink>
        </div>
        <div className={cs.autoRedirect}>
          <Checkbox
            checked={shouldRedirectBlast}
            onChange={withAnalytics(
              () => setShouldRedirectBlast(true),
              ANALYTICS_EVENT_NAMES.BLAST_REDIRECTION_MODAL_AUTO_REDIRECT_CHECKBOX_CHECKED
            )}
          />
          Automatically redirect in the future.
        </div>
        <div className={cs.actions}>{renderActions()}</div>
      </div>
    </Modal>
  );
};

BlastRedirectionModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onContinue: PropTypes.func,
};

export default BlastRedirectionModal;
