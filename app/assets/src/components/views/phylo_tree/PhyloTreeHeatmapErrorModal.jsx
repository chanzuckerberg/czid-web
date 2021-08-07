import PropTypes from "prop-types";
import React from "react";

import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import AccordionNotification from "~/components/ui/notifications/AccordionNotification";
import { PHYLO_TREE_LINK } from "~/components/utils/documentationLinks";
import Modal from "~ui/containers/Modal";
import { PrimaryButton } from "~ui/controls/buttons";
import ImgHeatmapPrimary from "~ui/illustrations/ImgHeatmapPrimary";

import cs from "./phylo_tree_heatmap_error_modal.scss";

const PhyloTreeHeatmapErrorModal = ({
  onContinue,
  open,
  showLowCoverageWarning,
}) => {
  const lowCoverageWarning =
    "Your samples were too divergent, possibly due to low coverage. To address this issue, try creating a new tree with samples that have coverage above 25%.";

  const defaultWarning =
    "Your samples were too divergent. To address this issue, try creating a new tree without the divergent samples.";

  const notificationMessage = (
    <>
      {showLowCoverageWarning ? lowCoverageWarning : defaultWarning}{" "}
      <ExternalLink
        analyticsEventName={
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_HEATMAP_ERROR_MODAL_NOTIFICATION_HELP_LINK_CLICKED
        }
        coloredBackground={true}
        href={PHYLO_TREE_LINK}
      >
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
            Instead, view genomic distances between samples in a heatmap
          </div>
          <ImgHeatmapPrimary className={cs.imgHeatmap} />
        </div>
        <div className={cs.message}>
          The heatmap provides kmer-based estimates of genomic distance that can
          be used to show general relationships between the samples.{" "}
          <ExternalLink
            analyticsEventName={
              ANALYTICS_EVENT_NAMES.PHYLO_TREE_HEATMAP_ERROR_MODAL_HELP_LINK_CLICKED
            }
            href={PHYLO_TREE_LINK}
          >
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

PhyloTreeHeatmapErrorModal.propTypes = {
  onContinue: PropTypes.func.isRequired,
  open: PropTypes.bool,
  showLowCoverageWarning: PropTypes.bool,
};

PhyloTreeHeatmapErrorModal.defaultProps = {
  showLowCoverageWarning: false,
};

export default PhyloTreeHeatmapErrorModal;
