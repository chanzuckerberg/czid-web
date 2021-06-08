import cx from "classnames";
import {
  compact,
  difference,
  filter,
  keys,
  map,
  max,
  size,
  uniq,
  values,
} from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";

import { createConsensusGenomeCladeExport } from "~/api";
import {
  validateSampleIds,
  validateWorkflowRunIds,
} from "~/api/access_control";
import { logAnalyticsEvent, ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import List from "~/components/ui/List";
import ErrorModal from "~/components/ui/containers/ErrorModal";
import { IconInfoSmall } from "~/components/ui/icons";
import {
  NEXTCLADE_APP_LINK,
  NEXTCLADE_REFERENCE_TREE_LINK,
} from "~/components/utils/documentationLinks";
import { SARS_COV_2 } from "~/components/views/samples/SamplesView/constants";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import Modal from "~ui/containers/Modal";
import { openUrlInNewTab } from "~utils/links";
import { WORKFLOWS, WORKFLOW_ENTITIES } from "~utils/workflows";
import NextcladeConfirmationModal from "./NextcladeConfirmationModal";
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
      nonSarsCov2SampleNames: [],
      projectIds: [],
      referenceTree: null,
      selectedTreeType: "global",
      validationError: null,
      validSampleIds: new Set(),
      validWorkflowRunIds: new Set(),
    };
  }

  componentDidMount() {
    const { objects } = this.props;
    const { admin } = this.context || {};

    this.fetchValidationInfo({ ids: keys(objects).map(Number) });

    if (admin) this.checkAdminSelections();
  }

  fetchValidationInfo = async ({ ids }) => {
    const { objects, workflowEntity } = this.props;

    const isWorkflowRunEntity =
      workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS;
    const { validIds, invalidSampleNames, error } = isWorkflowRunEntity
      ? await validateWorkflowRunIds({
          workflowRunIds: ids,
          workflow: WORKFLOWS.CONSENSUS_GENOME.value,
        })
      : await validateSampleIds({
          sampleIds: ids,
          workflow: WORKFLOWS.CONSENSUS_GENOME.value,
        });

    const validConsensusGenomes = filter(
      o => validIds.includes(o.id),
      values(objects)
    );

    const projectIds = map("projectId", validConsensusGenomes);

    const nonSarsCov2SampleNames = values(validConsensusGenomes)
      .filter(cg => cg.referenceGenome.taxonName !== SARS_COV_2)
      .map(cg => cg.sample.name);

    this.setState({
      ...(isWorkflowRunEntity
        ? { validWorkflowRunIds: new Set(validIds) }
        : { validSampleIds: new Set(validIds) }),
      invalidSampleNames,
      loading: false,
      nonSarsCov2SampleNames,
      validationError: error,
      projectIds: projectIds,
    });
  };

  checkAdminSelections = async () => {
    const { userId } = this.context || {};
    const { objects } = this.props;

    const selectedOwnerIds = compact(
      uniq(map("sample.userId", values(objects)))
    );
    if (difference(selectedOwnerIds, [userId]).length) {
      window.alert(
        "Admin warning: You have selected consensus genomes that belong to other users. Double-check that you have permission to send to Nextclade for production consensus genomes."
      );
    }
  };

  openExportLink = async () => {
    const { workflowEntity } = this.props;
    const {
      validSampleIds,
      validWorkflowRunIds,
      referenceTreeContents,
      selectedTreeType,
    } = this.state;
    const link = await createConsensusGenomeCladeExport({
      ...(workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
        ? { workflowRunIds: Array.from(validWorkflowRunIds) }
        : { sampleIds: Array.from(validSampleIds) }),
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
    offset = [0, 0],
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
    const {
      projectIds,
      validSampleIds,
      validWorkflowRunIds,
      selectedTreeType,
    } = this.state;

    logAnalyticsEvent(
      ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CANCEL_BUTTON_CLICKED,
      {
        sampleIds: Array.from(validSampleIds),
        workflowRunIds: Array.from(validWorkflowRunIds),
        selectedTreeType,
        projectIds,
      }
    );

    this.setState({ confirmationModalOpen: false });
  };

  handleConfirmationModalConfirm = async () => {
    const { onClose } = this.props;
    const {
      projectIds,
      validSampleIds,
      validWorkflowRunIds,
      selectedTreeType,
    } = this.state;

    try {
      this.setState({ loadingResults: true }, () => {
        logAnalyticsEvent(
          ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED,
          {
            sampleIds: Array.from(validSampleIds),
            workflowRunIds: Array.from(validWorkflowRunIds),
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
          logAnalyticsEvent(
            ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_UPLOAD_FAILED,
            {
              error,
              sampleIds: Array.from(validSampleIds),
              workflowRunIds: Array.from(validWorkflowRunIds),
              selectedTreeType,
              projectIds,
            }
          );
        }
      );
    }
  };

  handleErrorModalRetry = async () => {
    const { onClose } = this.props;
    const {
      projectIds,
      validSampleIds,
      validWorkflowRunIds,
      selectedTreeType,
    } = this.state;

    try {
      await this.openExportLink();
      this.setState({ errorModalOpen: false }, () => {
        onClose();
        logAnalyticsEvent(
          ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_CONFIRMATION_MODAL_RETRY_BUTTON_CLICKED,
          {
            sampleIds: Array.from(validSampleIds),
            workflowRunIds: Array.from(validWorkflowRunIds),
            selectedTreeType,
            projectIds,
          }
        );
      });
    } catch (error) {
      console.error(error);
      logAnalyticsEvent(
        ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_RETRY_UPLOAD_FAILED,
        {
          error,
          sampleIds: Array.from(validSampleIds),
          workflowRunIds: Array.from(validWorkflowRunIds),
          selectedTreeType,
          projectIds,
        }
      );
    }
  };

  handleErrorModalClose = () => {
    this.setState({ errorModalOpen: false });
  };

  render() {
    const { open, onClose, objects } = this.props;
    const {
      confirmationModalOpen,
      errorModalOpen,
      invalidSampleNames,
      loading,
      loadingResults,
      nonSarsCov2SampleNames,
      referenceTree,
      validationError,
      validSampleIds,
      validWorkflowRunIds,
      selectedTreeType,
    } = this.state;

    return (
      <Modal narrow open={open} tall onClose={onClose}>
        <div className={cs.modal}>
          <div className={cs.nextcladeHeader}>
            <div className={cs.title}>
              View Consensus Genomes in Nextclade
              {this.renderTooltip({
                content:
                  "Nextclade is a third-party tool and has its own policies.",
                link: NEXTCLADE_APP_LINK,
              })}
            </div>
            <div className={cs.tagline}>
              {size(objects)} Consensus Genome
              {size(objects) !== 1 ? "s" : ""} selected
            </div>
          </div>
          <div className={cs.nextcladeDescription}>
            <div className={cs.title}> Nextclade helps you: </div>
            <List
              listItems={[
                `Assess sequence quality`,
                `See where your consensus genomes differ from the reference sequence`,
                `Identify which clade or lineage your consensus genomes belong to`,
                <>
                  View consensus genome placement in the context of a Nextstrain{" "}
                  <br />
                  phylogenetic tree
                  {this.renderTooltip({
                    content:
                      "Exercise caution when interpreting this tree. Nextclade’s algorithms are meant for quick assessments and not a replacement for full analysis with the Nextstrain pipeline.",
                    iconStyle: cs.lower,
                    position: "top right",
                    offset: [11, 0],
                  })}
                </>,
              ]}
            />
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
              nonSarsCov2SampleNames={nonSarsCov2SampleNames}
              validationError={validationError}
              hasValidIds={
                max([validWorkflowRunIds.size, validSampleIds.size]) > 0
              }
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
          <ErrorModal
            helpLinkEvent={
              ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_ERROR_MODAL_HELP_LINK_CLICKED
            }
            labelText="Failed to send"
            open
            onCancel={this.handleErrorModalClose}
            onConfirm={this.handleErrorModalRetry}
            title={
              "Sorry! There was an error sending your consensus genomes to Nextclade."
            }
          />
        )}
      </Modal>
    );
  }
}

NextcladeModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
  objects: PropTypes.object.isRequired,
  workflowEntity: PropTypes.string,
};

NextcladeModal.contextType = UserContext;
