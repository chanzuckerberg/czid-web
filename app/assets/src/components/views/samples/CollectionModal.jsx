import React from "react";
import PropTypes from "prop-types";

import {
  getMassNormalizedBackgroundAvailability,
  createBackground,
} from "~/api";
import { withAnalytics } from "~/api/analytics";
import PrimaryButton from "~ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";
import Input from "~ui/controls/Input";
import Textarea from "~ui/controls/Textarea";
import Modal from "~ui/containers/Modal";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import Notification from "~ui/notifications/Notification";
import SubtextDropdown from "~ui/controls/dropdowns/SubtextDropdown";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import InfoIconSmall from "~ui/icons/InfoIconSmall";
import { UserContext } from "~/components/common/UserContext";

import { BACKGROUND_CORRECTION_METHODS } from "./constants";

import cs from "./collection_modal.scss";

/**
 * NOTE: "Collections" were an unrealized generalization of the background concept.
 * For the time being, a collection is equivalent to a background.
 */
class CollectionModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      backgroundCreationResponse: null,
      backgroundDescription: null,
      backgroundName: "",
      appliedMethod: "",
      modalOpen: false,
    };
  }

  componentDidMount() {
    this.fetchBackgroundAvailability();
  }

  componentDidUpdate(prevProps, prevState) {
    const prevSamples = prevProps.selectedSampleIds;
    if (prevSamples !== this.props.selectedSampleIds) {
      this.fetchBackgroundAvailability();
    }
  }

  openModal = () =>
    this.setState({
      modalOpen: true,
      appliedMethod: this.state.enableMassNormalizedBackgrounds
        ? "massNormalized"
        : "standard",
    });
  closeModal = () => this.setState({ modalOpen: false });

  renderSampleList = () => {
    const { fetchedSamples, selectedSampleIds, maxSamplesShown } = this.props;

    const samplesToDisplay = fetchedSamples.slice(0, maxSamplesShown);
    const numSamplesNotDisplayed =
      selectedSampleIds.size - samplesToDisplay.length;

    return (
      <div className={cs.sampleList}>
        <div className={cs.label}>Selected samples:</div>
        <div className={cs.warning}>
          <Notification className={cs.notification} type="warn">
            A large number of samples may increase the processing time before
            your background can be used in reports.
          </Notification>
        </div>
        <ul className={cs.selectedSamples}>
          {samplesToDisplay.map(sample => (
            <li key={sample.id}>
              <span className={cs.sampleName}>{sample.sample.name}</span>
              <span
                className={cs.sampleDetails}
              >{`(Project: ${sample.sample.project})`}</span>
            </li>
          ))}
        </ul>
        {numSamplesNotDisplayed > 0 && (
          <div className={cs.moreSamplesCount}>
            and {numSamplesNotDisplayed} more...
          </div>
        )}
      </div>
    );
  };

  handleNameChange = backgroundName => {
    this.setState({ backgroundName });
  };

  handleDescriptionChange = backgroundDescription => {
    this.setState({ backgroundDescription });
  };

  handleMethodChange = appliedMethod => {
    this.setState({ appliedMethod });
  };

  handleCreateBackground = async () => {
    const { selectedSampleIds } = this.props;
    const { backgroundName, backgroundDescription, appliedMethod } = this.state;

    let backgroundCreationResponse = null;
    try {
      backgroundCreationResponse = await createBackground({
        name: backgroundName,
        description: backgroundDescription,
        sampleIds: Array.from(selectedSampleIds),
        massNormalized: appliedMethod === "massNormalized",
      });
    } catch (_) {
      backgroundCreationResponse = {
        status: "error",
        message: "Something went wrong.",
      };
    }
    this.setState({ backgroundCreationResponse });
  };

  fetchBackgroundAvailability = async () => {
    const { selectedSampleIds } = this.props;
    let enableMassNormalizedBackgrounds = await getMassNormalizedBackgroundAvailability(
      Array.from(selectedSampleIds)
    );

    this.setState({
      enableMassNormalizedBackgrounds:
        enableMassNormalizedBackgrounds.massNormalizedBackgroundsAvailable,
    });
  };

  renderForm = () => {
    const { numDescriptionRows } = this.props;

    const { enableMassNormalizedBackgrounds, appliedMethod } = this.state;

    const dropdownOptions = BACKGROUND_CORRECTION_METHODS;
    if (enableMassNormalizedBackgrounds) {
      dropdownOptions.massNormalized.disabled = false;
      dropdownOptions.massNormalized.tooltip = null;
    } else {
      dropdownOptions.massNormalized.disabled = true;
      dropdownOptions.massNormalized.tooltip =
        "Only for ERCC samples run on Pipeline v4.0 or later";
    }

    return (
      <div className={cs.form}>
        <div className={cs.label}>Name</div>
        <Input
          fluid
          onChange={this.handleNameChange}
          value={this.state.backgroundName}
        />
        <div className={cs.label}>
          Description
          <span className={cs.optional}>Optional</span>
        </div>
        <Textarea
          rows={numDescriptionRows}
          onChange={this.handleDescriptionChange}
        />
        <div>
          <div className={cs.label}>
            Applied Correction Method
            <ColumnHeaderTooltip
              trigger={
                <span>
                  <InfoIconSmall className={cs.infoIcon} />
                </span>
              }
              content="Applied Correction Method is the method used when comparing a chosen set of samples against a background model."
              link="https://chanzuckerberg.zendesk.com/hc/en-us/articles/360050883054#h_01ECWXA46KAHRF7N61D7SE1M1F"
            />
          </div>
          <SubtextDropdown
            fluid
            className={cs.dropdown}
            options={Object.values(dropdownOptions)}
            initialSelectedValue={appliedMethod}
            onChange={withAnalytics(
              this.handleMethodChange,
              "CollectionModal_applied-correction-method_changed"
            )}
          />
        </div>
        {this.renderSampleList()}
        <div className={cs.buttons}>
          <PrimaryButton
            text="Create"
            onClick={withAnalytics(
              this.handleCreateBackground,
              "CollectionModal_create-collection-button_clicked",
              {
                selectedSampleIds: this.props.selectedSampleIds.length,
              }
            )}
          />
          <SecondaryButton
            text="Cancel"
            onClick={withAnalytics(
              this.closeModal,
              "CollectionModal_cancel-button_clicked"
            )}
          />
        </div>
      </div>
    );
  };

  renderStatus = () => {
    const { backgroundCreationResponse } = this.state;
    return (
      <div>
        {backgroundCreationResponse.status === "ok" ? (
          <Notification className={cs.notification} type="success">
            Your Background Model is being created and will be visible on the
            report page once statistics have been computed.
          </Notification>
        ) : (
          <Notification className={cs.notification} type="error">
            {backgroundCreationResponse.message}
          </Notification>
        )}
      </div>
    );
  };

  render() {
    const { trigger } = this.props;
    const { backgroundCreationResponse } = this.state;

    return (
      <div>
        <div
          onClick={withAnalytics(
            this.openModal,
            "CollectionModal_open-link_clicked"
          )}
        >
          {trigger}
        </div>
        {this.state.modalOpen && (
          <Modal
            open
            narrow
            onClose={withAnalytics(
              this.closeModal,
              "CollectionModal_close-link_clicked"
            )}
            className={cs.collectionModal}
          >
            <div className={cs.title}>Create a Background Model</div>
            <div className={cs.description}>
              A background is a group of samples. You can use a background as a
              statistical model to compare your samples to. When you select a
              background on a report or heatmap, the z-scores will indicate how
              much a sample deviates from the mean of that background.{" "}
              <ExternalLink
                className={cs.link}
                href="https://chanzuckerberg.zendesk.com/hc/en-us/articles/360035166174-How-do-I-create-and-use-background-models-in-IDseq-"
              >
                Learn More
              </ExternalLink>
              .
            </div>
            {this.renderForm()}
            {backgroundCreationResponse && this.renderStatus()}
          </Modal>
        )}
      </div>
    );
  }
}

CollectionModal.defaultProps = {
  maxSamplesShown: 10,
  numDescriptionRows: 7,
};

CollectionModal.propTypes = {
  maxSamplesShown: PropTypes.number,
  numDescriptionRows: PropTypes.number,
  fetchedSamples: PropTypes.array,
  selectedSampleIds: PropTypes.instanceOf(Set),
  trigger: PropTypes.node.isRequired,
};

CollectionModal.contextType = UserContext;

export default CollectionModal;
