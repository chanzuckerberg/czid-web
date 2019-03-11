import React from "react";
import { intersection, map, take } from "lodash/fp";
import { Modal, Form } from "semantic-ui-react";
import cx from "classnames";
import PrimaryButton from "~ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";
import cs from "./collection_modal.scss";

// TODO(tiago): complete refactor by migrating to ui/containers/modal
class CollectionModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalOpen: false,
      name: "",
      description: ""
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.renderTextField = this.renderTextField.bind(this);
    this.renderSampleList = this.renderSampleList.bind(this);
  }

  renderSampleList() {
    const { fetchedSampleIds, samples, selectedSampleIds } = this.props;

    const MAX_SAMPLES_TO_SHOW = 10;

    const availableSampleIds = intersection(
      selectedSampleIds,
      fetchedSampleIds
    );

    const samplesToShow = map(
      id => this.props.parent.state.fetchedSamples[id],
      take(MAX_SAMPLES_TO_SHOW, availableSampleIds)
    );

    const getSampleAttribute = this.props.parent.getSampleAttribute;

    const getSampleDetails = sample => {
      const projectId = getSampleAttribute(sample, "project_id");
      const pipelineRunId = getSampleAttribute(sample, "pipeline_run_id");
      return ` (project_id: ${projectId}, pipeine_run_id: ${pipelineRunId})`;
    };

    const samplesRemaining =
      this.props.selectedSampleIds.length - samplesToShow.length;

    return (
      <div className={cx("background-modal-contents", cs.sampleList)}>
        <div className="label-text">Selected samples:</div>
        <div className={cs.warning}>
          <i className="fa fa-exclamation-triangle" />
          A large number of samples may increase the processing time before your
          collection can be used as a background.
        </div>
        <ul className={cs.selectedSamples}>
          {samplesToShow.map(sample => (
            <li key={sample.db_sample.id}>
              <span>
                {getSampleAttribute(sample, "name")}
                {this.props.parent.admin && (
                  <span className="secondary-text">
                    {getSampleDetails(sample)}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {samplesRemaining > 0 && (
          <div className={cs.moreSamplesCount}>
            and {samplesRemaining} more...
          </div>
        )}
      </div>
    );
  }

  handleOpen() {
    this.setState({
      modalOpen: true,
      name: "",
      description: ""
    });
    this.props.parent.setState({
      background_creation_response: {}
    });
  }
  handleClose() {
    this.sample_names = [];
    this.setState({
      modalOpen: false,
      name: "",
      description: ""
    });
  }
  handleChange(e, { name, value }) {
    this.setState({ [e.target.id]: value });
  }
  handleSubmit() {
    this.props.parent.handleCreateBackground(
      this.state.new_background_name,
      this.state.new_background_description,
      this.props.parent.state.selectedSampleIds
    );
  }
  renderTextField(label, optional, id, rows) {
    return (
      <div className="background-modal-contents">
        <div className="label-text">
          {label}
          <span className="secondary-text">{optional ? " Optional" : ""}</span>
        </div>
        <Form.TextArea
          autoHeight
          className={`col s12 browser-default`}
          rows={rows}
          id={id}
          onChange={this.handleChange}
        />
      </div>
    );
  }

  render() {
    let background_creation_response = this.props.parent.state
      .background_creation_response;
    return (
      <Modal
        trigger={
          <div className="button-container">
            <PrimaryButton
              text="Create Collection"
              onClick={this.handleOpen}
              disabled={!this.props.selectedSampleIds.length}
            />
          </div>
        }
        open={this.state.modalOpen}
        onClose={this.handleClose}
        className="modal project-popup add-user-modal"
      >
        <Modal.Header className="project_modal_header">
          Create a Collection
        </Modal.Header>
        <Modal.Content className="modal-content">
          <div>
            A collection is a group of samples. You can use this collection as a
            background model to be selected on a sample report page. It{"'"}ll
            update the calculated z-score to indicate how much the the sample
            deviates from the norm for that collection.
          </div>
          <Form onSubmit={this.handleSubmit}>
            {this.renderTextField("Name", false, "new_background_name", 1)}
            {this.renderTextField(
              "Description",
              true,
              "new_background_description",
              7
            )}
            {this.renderSampleList()}
            <div className="background-button-section">
              <PrimaryButton text="Create" type="submit" />
              <SecondaryButton text="Cancel" onClick={this.handleClose} />
            </div>
          </Form>
          {background_creation_response.status === "ok" ? (
            <div className="status-message status teal-text text-darken-2">
              <i className="fa fa-smile-o fa-fw" />
              Collection is being created and will be visible on the report page
              once statistics have been computed.
            </div>
          ) : background_creation_response.message ? (
            <div className="status-message">
              <i className="fa fa-close fa-fw" />
              {background_creation_response.message.join("; ")}
            </div>
          ) : null}
        </Modal.Content>
      </Modal>
    );
  }
}

CollectionModal.propTypes = {
  // selectedSampleIds:
  // fetchedSampleIds
  // getSampleAttribute
  // selectedSampleIds
};

export default CollectionModal;

// TODO(tiago):
// * handleCreateBackground: migrate handle create background here
// * what is done with background_creation_response?
// * parent getSampleAttribute?
