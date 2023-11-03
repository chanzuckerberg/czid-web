import React, { useState } from "react";
import { Image } from "semantic-ui-react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { NCBI_POLICIES_AND_DISCLAIMERS_LINK } from "~/components/utils/documentationLinks";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import Checkbox from "~ui/controls/Checkbox";
import cs from "./blast_redirection_modal.scss";

interface BlastRedirectionModalProps {
  open?: boolean;
  onClose?: $TSFixMeFunction;
  onContinue?: $TSFixMeFunction;
  shouldOpenMultipleTabs?: boolean;
}

const BlastRedirectionModal = ({
  open,
  onClose,
  onContinue,
  shouldOpenMultipleTabs,
}: BlastRedirectionModalProps) => {
  const [shouldRedirectBlast, setShouldRedirectBlast] = useState(false);

  const renderActions = () => {
    return (
      <div className={cs.actions}>
        <div className={cs.item}>
          <PrimaryButton
            text="Continue"
            rounded
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
            onClick={() => onContinue(shouldRedirectBlast)}
          />
        </div>
        <div className={cs.item}>
          <SecondaryButton text="Cancel" rounded onClick={onClose} />
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
          sequencing data to NCBI{"'"}s BLAST service, and that you understand
          this may make the data accessible to others. NCBI is a separate
          service from CZ ID. Your data will be subject to their{" "}
          <ExternalLink href={NCBI_POLICIES_AND_DISCLAIMERS_LINK}>
            Policies and Disclaimers
          </ExternalLink>
          .
        </div>
        <div className={cs.autoRedirect}>
          <Checkbox
            checked={shouldRedirectBlast}
            onChange={() => setShouldRedirectBlast(true)}
          />
          Automatically redirect in the future.
        </div>
        <div className={cs.actions}>{renderActions()}</div>
        {shouldOpenMultipleTabs && (
          <div className={cs.linksOpeningInMultipleTabNotification}>
            Multiple tabs will open because the NCBI server can only receive
            about 8000 characters per URL.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BlastRedirectionModal;
