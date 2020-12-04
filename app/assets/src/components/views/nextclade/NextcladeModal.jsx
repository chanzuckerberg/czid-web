import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { get } from "lodash/fp";

import { createConsensusGenomeCladeExport } from "~/api";
import { validateSampleIds } from "~/api/access_control";
import { WORKFLOWS } from "~utils/workflows";
import { logAnalyticsEvent } from "~/api/analytics";
import {
  NEXTCLADE_APP_LINK,
  NEXTCLADE_REFERENCE_TREE_LINK,
} from "~/components/utils/documentationLinks";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import InfoIconSmall from "~ui/icons/InfoIconSmall";
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
      projectIds: [],
      referenceTree: null,
      selectedTreeType: "global",
      validationError: null,
      validSampleIds: new Set(),
    };
  }

  componentDidMount() {
    const { selectedSampleIds } = this.props;

    this.fetchSampleValidationInfo(selectedSampleIds);
  }

  fetchSampleValidationInfo = async selectedSampleIds => {
    const { samples } = this.props;

    const {
      validSampleIds,
      invalidSampleNames,
      error,
    } = await validateSampleIds(
      Array.from(selectedSampleIds),
      WORKFLOWS.CONSENSUS_GENOME.value
    );

    const projectIds = validSampleIds.reduce((result, id) => {
      result.push(get(`${id}.projectId`, samples));
      return result;
    }, []);

    this.setState({
      validSampleIds: new Set(validSampleIds),
      invalidSampleNames,
      loading: false,
      validationError: error,
      projectIds: projectIds,
    });
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
        resolve(JSON.parse(reader.result));
      };
      reader.readAsText(inputFile);
    });
  };

  handleSelectTreeType = selectedTreeType => {
    this.setState({
      selectedTreeType,
    });
  };

  renderTooltip = ({ content, link, iconStyle = null }) => {
    return (
      <ColumnHeaderTooltip
        trigger={
          <InfoIconSmall className={cx(cs.infoIcon, iconStyle && iconStyle)} />
        }
        content={content}
        link={link}
      />
    );
  };

  handleConfirmationModalOpen = () => {
    this.setState({ confirmationModalOpen: true });
  };

  handleConfirmationModalClose = () => {
    this.setState({ confirmationModalOpen: false });
  };

  handleConfirmationModalConfirm = () => {
    const { onClose } = this.props;
    const { projectIds, validSampleIds, selectedTreeType } = this.state;

    const sampleIds = Array.from(validSampleIds);

    try {
      this.openExportLink();
      this.setState({ confirmationModalOpen: false }, () => {
        onClose();
        logAnalyticsEvent(
          "NextcladeModal_confirmation-modal-confirm-button_clicked",
          {
            sampleIds,
            selectedTreeType,
            projectIds,
          }
        );
      });
    } catch (error) {
      this.setState(
        {
          confirmationModalOpen: false,
          errorModalOpen: true,
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

  handleErrorModalRetry = () => {
    const { onClose } = this.props;
    const { projectIds, validSampleIds, selectedTreeType } = this.state;

    const sampleIds = Array.from(validSampleIds);

    try {
      this.openExportLink();
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
    const { open, onClose, selectedSampleIds } = this.props;
    const {
      confirmationModalOpen,
      errorModalOpen,
      invalidSampleNames,
      loading,
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
              {selectedSampleIds.size} Sample
              {selectedSampleIds.size !== 1 ? "s" : ""} selected
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
  selectedSampleIds: PropTypes.instanceOf(Set).isRequired,
};
