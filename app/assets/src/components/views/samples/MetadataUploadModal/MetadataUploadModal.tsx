// This modal contains a wizard that allows users to upload metadata to a project.
import { flow, get, keyBy, mapValues, omit } from "lodash/fp";
import React from "react";
import { getSamples } from "~/api";
import { uploadMetadataForProject } from "~/api/metadata";
import { showToast } from "~/components/utils/toast";
import { NameId, SampleFromApi } from "~/interface/shared";
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
  projectSamples?: SampleFromApi[];
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    metadata: null,
    issues: null,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    projectSamples: null,
  };

  async componentDidMount() {
    const { project } = this.props;

    const { samples: projectSamples } = await getSamples({
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
    onClose();

    const response = await uploadMetadataForProject(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      this.props.project.id,
      flow(
        keyBy(
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
          (row: MetadataUploadModalState["metadata"]["rows"][0]) =>
            row.sample_name || row["Sample Name"],
        ),
        mapValues(omit(["sample_name", "Sample Name"])),
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
    }

    onComplete && onComplete();
  };

  getPages = () => {
    const { workflow } = this.props;
    const uploadTitle = (
      <span>
        Edit Metadata for{" "}
        {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
        <span className={cs.projectName}>{this.props.project.name}</span>
      </span>
    );
    const reviewTitle = (
      <span>
        Review Metadata for{" "}
        {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
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
        onClose={this.props.onClose}
        className={cs.metadataUploadModal}
      >
        <Wizard onComplete={this.handleComplete}>{this.getPages()}</Wizard>
      </Modal>
    );
  }
}

export default MetadataUploadModal;
