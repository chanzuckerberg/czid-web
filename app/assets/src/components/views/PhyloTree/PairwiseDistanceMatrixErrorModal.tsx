import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import AccordionNotification from "~/components/ui/notifications/AccordionNotification";
import {
  PAIRWISE_DISTANCE_MATRIX_INSTEAD_OF_TREE_LINK,
  PHYLO_TREE_LINK,
} from "~/components/utils/documentationLinks";
import Modal from "~ui/containers/Modal";
import { PrimaryButton } from "~ui/controls/buttons";
import ImgMatrixPrimary from "~ui/illustrations/ImgMatrixPrimary";
import cs from "./pairwise_distance_matrix_error_modal.scss";

interface PairwiseDistanceMatrixErrorModalProps {
  onContinue: $TSFixMeFunction;
  open?: boolean;
  showLowCoverageWarning?: boolean;
}

const PairwiseDistanceMatrixErrorModal = ({
  onContinue,
  open,
  showLowCoverageWarning = false,
}: PairwiseDistanceMatrixErrorModalProps) => {
  const lowCoverageWarning =
    "Your samples were too divergent, possibly due to low coverage. To address this issue, try creating a new tree with samples that have coverage above 25%.";

  const defaultWarning =
    "Your samples were too divergent. To address this issue, try creating a new tree without the divergent samples.";

  const notificationMessage = (
    <>
      {showLowCoverageWarning ? lowCoverageWarning : defaultWarning}{" "}
      <ExternalLink coloredBackground={true} href={PHYLO_TREE_LINK}>
        Learn more.
      </ExternalLink>
    </>
  );

  return (
    <Modal className={cs.errorModal} narrowest open={open}>
      <AccordionNotification
        bottomContentPadding={false}
        className={cs.accordionNotification}
        header={"Sorry, we were unable to compute a phylogenetic tree."}
        headerClassName={cs.accordionHeader}
        content={notificationMessage}
        notificationClassName={cs.notification}
        open={false}
        type={"error"}
        displayStyle={"flat"}
      />
      <div className={cs.textContainer}>
        <div className={cs.title}>
          <div className={cs.text}>
            Instead, view genomic distances between samples in a pairwise
            distance matrix
          </div>
          <ImgMatrixPrimary className={cs.imgMatrix} />
        </div>
        <div className={cs.message}>
          The pairwise distance matrix provides kmer-based estimates of genomic
          distance that can be used to show general relationships between the
          samples.{" "}
          <ExternalLink href={PAIRWISE_DISTANCE_MATRIX_INSTEAD_OF_TREE_LINK}>
            Learn more.
          </ExternalLink>
        </div>
      </div>
      <div className={cs.actions}>
        <div className={cs.item}>
          <PrimaryButton text="Continue" rounded={true} onClick={onContinue} />
        </div>
      </div>
    </Modal>
  );
};

export default PairwiseDistanceMatrixErrorModal;
