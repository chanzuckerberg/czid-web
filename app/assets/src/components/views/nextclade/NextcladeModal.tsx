import { Icon } from "@czi-sds/components";
import cx from "classnames";
import { difference } from "lodash/fp";
import React from "react";
import { PopupProps } from "semantic-ui-react";
import { createConsensusGenomeCladeExport, getWorkflowRunsInfo } from "~/api";
import { validateWorkflowRunIds } from "~/api/access_control";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import ErrorModal from "~/components/ui/containers/ErrorModal";
import List from "~/components/ui/List";
import {
  NEXTCLADE_APP_LINK,
  NEXTCLADE_REFERENCE_TREE_LINK,
} from "~/components/utils/documentationLinks";
import { SARS_COV_2 } from "~/components/views/samples/SamplesView/constants";
import { CreationSource } from "~/interface/sample";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import Modal from "~ui/containers/Modal";
import { openUrlInNewTab } from "~utils/links";
import { WorkflowType } from "~utils/workflows";
import cs from "./nextclade_modal.scss";
import NextcladeConfirmationModal from "./NextcladeConfirmationModal";
import NextcladeModalFooter from "./NextcladeModalFooter";
import NextcladeReferenceTreeOptions from "./NextcladeReferenceTreeOptions";

interface NextcladeModalProps {
  onClose: $TSFixMeFunction;
  open?: boolean;
  selectedIds?: Set<$TSFixMe>;
  workflowEntity?: string;
}

interface NextcladeModalState {
  confirmationModalOpen: boolean;
  errorModalOpen: boolean;
  invalidSampleNames: $TSFixMe[];
  loading: boolean;
  loadingResults: boolean;
  samplesNotSentToNextclade: $TSFixMe[];
  projectIds: $TSFixMe[];
  referenceTree: $TSFixMe;
  selectedTreeType: string;
  validationError: $TSFixMe;
  validWorkflowRunIds: Set<$TSFixMe>;
  validWorkflowInfo: $TSFixMe[];
  referenceTreeContents?: $TSFixMe;
}

export default class NextcladeModal extends React.Component<
  NextcladeModalProps,
  NextcladeModalState
> {
  constructor(props) {
    super(props);

    this.state = {
      confirmationModalOpen: false,
      errorModalOpen: false,
      invalidSampleNames: [],
      loading: true,
      loadingResults: false,
      samplesNotSentToNextclade: [],
      projectIds: [],
      referenceTree: null,
      selectedTreeType: "global",
      validationError: null,
      validWorkflowRunIds: new Set(),
      validWorkflowInfo: [],
    };
  }

  componentDidMount() {
    this.fetchValidationInfo();
  }

  fetchValidationInfo = async () => {
    const { selectedIds } = this.props;

    const { validIds, invalidSampleNames, error } =
      await validateWorkflowRunIds({
        basic: false,
        workflowRunIds: Array.from(selectedIds),
        workflow: WorkflowType.CONSENSUS_GENOME,
      });

    const { workflowRunInfo } = await getWorkflowRunsInfo(validIds);

    const projectIds = workflowRunInfo.map(workflow => workflow.projectId);

    // WGS samples cannot be sent to nextclade, and other cg uploads can only
    // be sent if they are SC2 samples, even if they are uploaded via cli
    const samplesNotSentToNextclade = workflowRunInfo
      .filter(
        cg =>
          cg.taxonName !== SARS_COV_2 ||
          cg.creationSource === CreationSource.WGS,
      )
      .map(cg => cg.name);

    this.setState(
      {
        invalidSampleNames,
        loading: false,
        samplesNotSentToNextclade,
        validationError: error,
        validWorkflowRunIds: new Set(validIds),
        validWorkflowInfo: workflowRunInfo,
        projectIds: projectIds,
      },
      this.checkAdminSelections,
    );
  };

  checkAdminSelections = () => {
    const { admin, userId } = this.context || {};
    const { validWorkflowInfo } = this.state;

    if (admin) {
      const selectedOwnerIds = validWorkflowInfo.map(
        workflow => workflow.userId,
      );
      if (difference(selectedOwnerIds, [userId]).length) {
        window.alert(
          "Admin warning: You have selected consensus genomes that belong to other users. Double-check that you have permission to send to Nextclade for production consensus genomes.",
        );
      }
    }
  };

  openExportLink = async () => {
    const { validWorkflowRunIds, referenceTreeContents, selectedTreeType } =
      this.state;
    const link = await createConsensusGenomeCladeExport({
      workflowRunIds: Array.from(validWorkflowRunIds),
      referenceTree:
        selectedTreeType === "upload" ? referenceTreeContents : null,
    });
    openUrlInNewTab(link.external_url);
  };

  handleFileUpload = async file => {
    // Stringify, then parse to remove excess whitespace
    const fileContents = JSON.stringify(JSON.parse(await file.text()));
    this.setState({
      referenceTree: file,
      referenceTreeContents: fileContents,
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
  }: {
    content: string;
    link?: string;
    iconStyle?: string;
    offset?: [number, number];
    position?: PopupProps["position"];
  }) => {
    return (
      <ColumnHeaderTooltip
        trigger={
          <span>
            <Icon
              sdsIcon="infoCircle"
              sdsSize="s"
              sdsType="interactive"
              className={cx(cs.infoIcon, !!iconStyle && iconStyle)}
            />
          </span>
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
    const { projectIds, validWorkflowRunIds, selectedTreeType } = this.state;

    trackEvent(
      ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CANCEL_BUTTON_CLICKED,
      {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        workflowRunIds: Array.from(validWorkflowRunIds),
        selectedTreeType,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        projectIds,
      },
    );

    this.setState({ confirmationModalOpen: false });
  };

  handleConfirmationModalConfirm = async () => {
    const { onClose } = this.props;
    const { projectIds, validWorkflowRunIds, selectedTreeType } = this.state;

    try {
      this.setState({ loadingResults: true }, () => {
        trackEvent(
          ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED,
          {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
            workflowRunIds: Array.from(validWorkflowRunIds),
            selectedTreeType,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
            projectIds,
          },
        );
        trackEvent(
          ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED_ALLISON_TESTING,
          {
            workflowRunIds: JSON.stringify(Array.from(validWorkflowRunIds)),
            selectedTreeType,
            projectIds: JSON.stringify(projectIds),
          },
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
          trackEvent(ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_UPLOAD_FAILED, {
            error,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
            workflowRunIds: Array.from(validWorkflowRunIds),
            selectedTreeType,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
            projectIds,
          });
        },
      );
    }
  };

  handleErrorModalRetry = async () => {
    const { onClose } = this.props;
    const { projectIds, validWorkflowRunIds, selectedTreeType } = this.state;

    try {
      await this.openExportLink();
      this.setState({ errorModalOpen: false }, () => {
        onClose();
        trackEvent(
          ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_CONFIRMATION_MODAL_RETRY_BUTTON_CLICKED,
          {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
            workflowRunIds: Array.from(validWorkflowRunIds),
            selectedTreeType,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
            projectIds,
          },
        );
      });
    } catch (error) {
      console.error(error);
      trackEvent(ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_RETRY_UPLOAD_FAILED, {
        error,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        workflowRunIds: Array.from(validWorkflowRunIds),
        selectedTreeType,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        projectIds,
      });
    }
  };

  handleErrorModalClose = () => {
    this.setState({ errorModalOpen: false });
  };

  render() {
    const { open, onClose, selectedIds } = this.props;
    const {
      confirmationModalOpen,
      errorModalOpen,
      invalidSampleNames,
      loading,
      loadingResults,
      samplesNotSentToNextclade,
      referenceTree,
      validationError,
      validWorkflowRunIds,
      selectedTreeType,
    } = this.state;

    const sentToNextcladeCount =
      selectedIds.size - samplesNotSentToNextclade.length;

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
              {sentToNextcladeCount} Consensus Genome
              {sentToNextcladeCount !== 1 ? "s" : ""} selected
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
              samplesNotSentToNextclade={samplesNotSentToNextclade}
              validationError={validationError}
              hasValidIds={validWorkflowRunIds && validWorkflowRunIds.size > 0}
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

NextcladeModal.contextType = UserContext;
