import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import {
  compact,
  difference,
  filter,
  keys,
  map,
  size,
  uniq,
  values,
} from "lodash/fp";

import { createConsensusGenomeCladeExport } from "~/api";
import { validateSampleIds } from "~/api/access_control";
import { UserContext } from "~/components/common/UserContext";
import { WORKFLOWS } from "~utils/workflows";
import { logAnalyticsEvent } from "~/api/analytics";
import {
  NEXTCLADE_APP_LINK,
  NEXTCLADE_REFERENCE_TREE_LINK,
} from "~/components/utils/documentationLinks";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import { IconInfoSmall } from "~/components/ui/icons";
import Modal from "~ui/containers/Modal";
import { openUrlInNewTab } from "~utils/links";
import NextcladeConfirmationModal from "./NextcladeConfirmationModal";
import NextcladeErrorModal from "./NextcladeErrorModal";
import NextcladeModalFooter from "./NextcladeModalFooter";
import NextcladeReferenceTreeOptions from "./NextcladeReferenceTreeOptions";

import cs from "./nextclade_modal.scss";

export default class NextcladeModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      confirmationModalOpen: false,
      errorModalOpen: false,
      invalidSampleNames: [],
      loading: true,
      loadingResults: false,
      projectIds: [],
      referenceTree: null,
      selectedTreeType: "global",
      validationError: null,
      validSampleIds: new Set(),
    };
  }

  componentDidMount() {
    const { samples } = this.props;
    const { admin } = this.context || {};

    this.fetchSampleValidationInfo(keys(samples).map(Number));

    if (admin) this.checkAdminSelections();
  }

  fetchSampleValidationInfo = async selectedSampleIds => {
    const { samples } = this.props;

    const {
      validSampleIds,
      invalidSampleNames,
      error,
    } = await validateSampleIds(
      selectedSampleIds,
      WORKFLOWS.CONSENSUS_GENOME.value
    );

    const projectIds = map(
      "projectId",
      filter(s => validSampleIds.includes(s.id), values(samples))
    );

    this.setState({
      validSampleIds: new Set(validSampleIds),
      invalidSampleNames,
      loading: false,
      validationError: error,
      projectIds: projectIds,
    });
  };

  checkAdminSelections = async () => {
    const { userId } = this.context || {};
    const { samples } = this.props;

    const selectedOwnerIds = compact(
      uniq(map("sample.userId", values(samples)))
    );
    if (difference(selectedOwnerIds, [userId]).length) {
      window.alert(
        "Admin warning: You have selected samples that belong to other users. Double-check that you have permission to send to Nextclade for production samples."
      );
    }
  };

  openExportLink = async () => {
    const {
      validSampleIds,
      referenceTreeContents,
      selectedTreeType,
    } = this.state;
    const link = await createConsensusGenomeCladeExport({
      sampleIds: Array.from(validSampleIds),
      referenceTree:
        selectedTreeType === "upload" ? referenceTreeContents : null,
    });
    openUrlInNewTab(link.external_url);
  };

  handleFileUpload = async file => {
    const fileContents = await this.readUploadedFile(file);
    this.setState({
      referenceTree: file,
      referenceTreeContents: fileContents,
    });
  };

  readUploadedFile = inputFile => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onerror = () => {
        reader.abort();
        reject(reader.error);
      };

      reader.onload = () => {
        // stringify-parse to remove excess whitespace
        resolve(JSON.stringify(JSON.parse(reader.result)));
      };
      reader.readAsText(inputFile);
    });
  };

  handleSelectTreeType = selectedTreeType => {
    this.setState({
      selectedTreeType,
    });
  };

  renderTooltip = ({
    content,
    link,
    iconStyle = null,
    offset = 0,
    position = "top center",
  }) => {
    return (
      <ColumnHeaderTooltip
        trigger={
          <IconInfoSmall className={cx(cs.infoIcon, iconStyle && iconStyle)} />
        }
        content={content}
        link={link}
        offset={offset}
        position={position}
      />
    );
  };

  handleConfirmationModalOpen = () => {
    this.setState({ confirmationModalOpen: true });
  };

  handleConfirmationModalClose = () => {
    const { projectIds, validSampleIds, selectedTreeType } = this.state;

    logAnalyticsEvent(
      "NextcladeModal_confirmation-modal-cancel-button_clicked",
      {
        sampleIds: Array.from(validSampleIds),
        selectedTreeType,
        projectIds,
      }
    );

    this.setState({ confirmationModalOpen: false });
  };

  handleConfirmationModalConfirm = async () => {
    const { onClose } = this.props;
    const { projectIds, validSampleIds, selectedTreeType } = this.state;

    const sampleIds = Array.from(validSampleIds);

    try {
      this.setState({ loadingResults: true }, () => {
        logAnalyticsEvent(
          "NextcladeModal_confirmation-modal-confirm-button_clicked",
          {
            sampleIds,
            selectedTreeType,
            projectIds,
          }
        );
      });

      await this.openExportLink();
      this.setState({ confirmationModalOpen: false }, () => {
        onClose();
      });
    } catch (error) {
      this.setState(
        {
          confirmationModalOpen: false,
          errorModalOpen: true,
          loadingResults: false,
        },
        () => {
          console.error(error);
          logAnalyticsEvent("NextcladeModal_upload_failed", {
            error,
            sampleIds,
            selectedTreeType,
            projectIds,
          });
        }
      );
    }
  };

  handleErrorModalRetry = async () => {
    const { onClose } = this.props;
    const { projectIds, validSampleIds, selectedTreeType } = this.state;

    const sampleIds = Array.from(validSampleIds);

    try {
      await this.openExportLink();
      this.setState({ errorModalOpen: false }, () => {
        onClose();
        logAnalyticsEvent(
          "NextcladeModal_confirmation-modal-retry-button_clicked",
          {
            sampleIds,
            selectedTreeType,
            projectIds,
          }
        );
      });
    } catch (error) {
      console.error(error);
      logAnalyticsEvent("NextcladeModal_retry-upload_failed", {
        error,
        sampleIds,
        selectedTreeType,
        projectIds,
      });
    }
  };

  handleErrorModalClose = () => {
    this.setState({ errorModalOpen: false });
  };

  render() {
    const { open, onClose, samples } = this.props;
    const {
      confirmationModalOpen,
      errorModalOpen,
      invalidSampleNames,
      loading,
      loadingResults,
      referenceTree,
      validationError,
      validSampleIds,
      selectedTreeType,
    } = this.state;

    return (
      <Modal narrow open={open} tall onClose={onClose}>
        <div className={cs.modal}>
          <div className={cs.nextcladeHeader}>
            <div className={cs.title}>
              View Samples in Nextclade
              {this.renderTooltip({
                content:
                  "Nextclade is a third-party tool and has its own policies.",
                link: NEXTCLADE_APP_LINK,
              })}
            </div>
            <div className={cs.tagline}>
              {size(samples)} Sample
              {size(samples) !== 1 ? "s" : ""} selected
            </div>
          </div>
          <div className={cs.nextcladeDescription}>
            <div className={cs.title}> Nextclade helps you: </div>
            <ul>
              <li>
                <span>Assess sequence quality</span>
              </li>
              <li>
                <span>
                  See where your samples differ from the reference sequence
                </span>
              </li>
              <li>
                <span>
                  Identify which clade or lineage your samples belong to
                </span>
              </li>
              <li>
                <span>
                  View sample placement in the context of a Nextstrain
                  phylogenetic tree
                  {this.renderTooltip({
                    content:
                      "Exercise caution when interpreting this tree. Nextclade’s algorithms are meant for quick assessments and not a replacement for full analysis with the Nextstrain pipeline.",
                    iconStyle: cs.lower,
                    position: "top right",
                    offset: 11,
                  })}
                </span>
              </li>
            </ul>
          </div>
          <div className={cs.referenceTree}>
            <div className={cs.title}>
              Reference Tree
              {this.renderTooltip({
                content:
                  "Nextclade will graft your sequences onto the reference tree to provide more context.",
                link: NEXTCLADE_REFERENCE_TREE_LINK,
                iconStyle: cs.lower,
              })}
            </div>
            <div className={cs.options}>
              <NextcladeReferenceTreeOptions
                referenceTree={referenceTree && referenceTree.name}
                onChange={this.handleFileUpload}
                onSelect={this.handleSelectTreeType}
                selectedType={selectedTreeType}
              />
            </div>
          </div>
          <div className={cs.footer}>
            <NextcladeModalFooter
              onClick={this.handleConfirmationModalOpen}
              invalidSampleNames={invalidSampleNames}
              loading={loading}
              validationError={validationError}
              validSampleIds={validSampleIds}
            />
          </div>
        </div>
        {confirmationModalOpen && (
          <NextcladeConfirmationModal
            open
            onCancel={this.handleConfirmationModalClose}
            onConfirm={this.handleConfirmationModalConfirm}
            loading={loadingResults}
          />
        )}
        {errorModalOpen && (
          <NextcladeErrorModal
            open
            onCancel={this.handleErrorModalClose}
            onConfirm={this.handleErrorModalRetry}
          />
        )}
      </Modal>
    );
  }
}

NextcladeModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
  samples: PropTypes.object.isRequired,
};

NextcladeModal.contextType = UserContext;
