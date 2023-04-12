// This modal contains a wizard that allows users to upload metadata to a project.
import { flow, get, keyBy, mapValues, omit } from "lodash/fp";
import React from "react";
import { getSamples } from "~/api";
import { trackEvent, withAnalytics } from "~/api/analytics";
import { uploadMetadataForProject } from "~/api/metadata";
import { showToast } from "~/components/utils/toast";
import { NameId } from "~/interface/shared";
import Modal from "~ui/containers/Modal";
import Wizard from "~ui/containers/Wizard";
import ListNotification from "~ui/notifications/ListNotification";
import Notification from "~ui/notifications/Notification";
import cs from "./metadata_upload_modal.scss";
import ReviewPage from "./ReviewPage";
import UploadPage from "./UploadPage";

interface MetadataUploadModalProps {
  onClose?: $TSFixMeFunction;
  onComplete?: $TSFixMeFunction;
  project?: NameId;
  workflow?: string;
}

interface MetadataUploadModalState {
  metadata?: {
    rows: { sample_name: string; [key: string]: string }[];
    headers: string[];
  };
  issues?: $TSFixMeUnknown;
  projectSamples?: ProjectSample[];
}

export interface ProjectSample {
  details: { metadata: Record<string, string> };
  metadata?: ProjectSample["details"]["metadata"];
  name: string;
}

class MetadataUploadModal extends React.Component<
  MetadataUploadModalProps,
  MetadataUploadModalState
> {
  state: MetadataUploadModalState = {
    metadata: null,
    issues: null,
    projectSamples: null,
  };

  async componentDidMount() {
    const { project } = this.props;

    const { samples: projectSamples } = await getSamples({
      projectId: project.id,
    });

    projectSamples.forEach((sample: ProjectSample) => {
      // This maintains compatibility with downstream MetadataManualInput,
      // which expects sample.metadata instead of sample.details.metadata.
      sample.metadata = get("metadata", sample.details);
    });

    this.setState({
      projectSamples,
    });
  }

  handleMetadataChange = ({ metadata, issues }) => {
    this.setState({
      metadata,
      issues,
    });
  };

  handleComplete = async () => {
    const { onClose, onComplete } = this.props;
    onClose();

    const response = await uploadMetadataForProject(
      this.props.project.id,
      flow(
        keyBy(
          (row: MetadataUploadModalState["metadata"]["rows"][0]) =>
            row.sample_name || row["Sample Name"],
        ),
        mapValues(omit(["sample_name", "Sample Name"])),
      )(this.state.metadata.rows),
    );

    if (response.errors && response.errors.length > 0) {
      showToast(({ closeToast }) => (
        <ListNotification
          className={cs.publicSampleNotification}
          onClose={closeToast}
          type="error"
          label="Your metadata upload failed with the following errors."
          listItemName="error"
          listItems={response.errors}
        />
      ));

      trackEvent("MetadataUploadModal_modal_error", {
        projectId: this.props.project.id,
        projectSamples: this.state.projectSamples.length,
        errors: response.errors.length,
      });
    } else {
      showToast(
        ({ closeToast }) => (
          <Notification type="success" onClose={closeToast}>
            Metadata was successfully uploaded.
          </Notification>
        ),
        {
          autoClose: 3000,
        },
      );

      trackEvent("MetadataUploadModal_modal_success", {
        projectId: this.props.project.id,
        projectSamples: this.state.projectSamples.length,
      });
    }

    onComplete && onComplete();
  };

  getPages = () => {
    const { workflow } = this.props;
    const uploadTitle = (
      <span>
        Edit Metadata for{" "}
        <span className={cs.projectName}>{this.props.project.name}</span>
      </span>
    );
    const reviewTitle = (
      <span>
        Review Metadata for{" "}
        <span className={cs.projectName}>{this.props.project.name}</span>
      </span>
    );

    const uploadMetadataPage = (
      <UploadPage
        title={uploadTitle}
        key="1"
        onMetadataChange={this.handleMetadataChange}
        project={this.props.project}
        samples={this.state.projectSamples}
        workflow={workflow}
      />
    );

    const reviewMetadataPage = (
      <ReviewPage
        title={reviewTitle}
        key="2"
        metadata={this.state.metadata}
        samples={this.state.projectSamples}
      />
    );

    return [uploadMetadataPage, reviewMetadataPage];
  };

  render() {
    return (
      <Modal
        open
        tall
        wide
        onClose={withAnalytics(
          this.props.onClose,
          "MetadataUploadModal_modal_closed",
        )}
        className={cs.metadataUploadModal}
      >
        <Wizard onComplete={this.handleComplete}>{this.getPages()}</Wizard>
      </Modal>
    );
  }
}

export default MetadataUploadModal;
