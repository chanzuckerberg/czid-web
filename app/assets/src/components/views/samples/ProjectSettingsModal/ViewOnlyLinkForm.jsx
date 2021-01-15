import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";

import {
  createSnapshot,
  getSnapshotInfo,
  deleteSnapshot,
} from "~/api/snapshot_links";
import { copyUrlToClipboard } from "~/helpers/url";
import BasicPopup from "~/components/BasicPopup";
import LoadingMessage from "~/components/common/LoadingMessage";
import HelpIcon from "~ui/containers/HelpIcon";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import Toggle from "~ui/controls/Toggle";
import { Input } from "~ui/controls";
import { IconInfoSmall } from "~/components/ui/icons";
import { logAnalyticsEvent } from "~/api/analytics";

import cs from "./view_only_link_form.scss";

class ViewOnlyLinkForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      sharingEnabled: false,
      automaticUpdateEnabled: false,
      snapshotShareId: "",
      snapshotNumSamples: 0,
      snapshotPipelineVersions: [],
      snapshotTimestamp: "",
    };
    // TODO(ihan): fill dropdown options with real values
    this.dropdownOptions = [
      { text: "NID Human CSF v3", value: "0" },
      { text: "Background Model 1", value: "1" },
      { text: "Background Model 2", value: "2" },
    ];
  }

  async componentDidMount() {
    this.setState({ isLoading: true });
    await this.fetchSnapshotInfo();
    this.setState({ isLoading: false });
  }

  fetchSnapshotInfo = async () => {
    const { project } = this.props;
    try {
      const snapshot = await getSnapshotInfo(project.id);
      // Check in case you received an HTML redirect response
      if (snapshot && snapshot.share_id) {
        this.setState({
          sharingEnabled: true,
          snapshotShareId: snapshot.share_id,
          snapshotNumSamples: snapshot.num_samples,
          snapshotPipelineVersions: snapshot.pipeline_versions,
          snapshotTimestamp: snapshot.timestamp,
        });
      }
    } catch (_) {
      this.clearSnapshotInfo();
    }
  };

  clearSnapshotInfo = () => {
    this.setState({
      sharingEnabled: false,
      snapshotShareId: "",
      snapshotNumSamples: 0,
      snapshotPipelineVersions: [],
      snapshotTimestamp: "",
    });
  };

  // TODO(ihan): implement automatic update feature
  handleAutomaticUpdateChange = () => {
    const { automaticUpdateEnabled } = this.state;
    this.setState({ automaticUpdateEnabled: !automaticUpdateEnabled });
  };

  handleSharingToggle = () => {
    const { sharingEnabled } = this.state;
    if (sharingEnabled) {
      this.handleDisableSharing();
    } else {
      this.handleEnableSharing();
    }
  };

  handleEnableSharing = async () => {
    const { snapshotShareId } = this.state;
    const { project } = this.props;
    try {
      await createSnapshot(project.id);
      await this.fetchSnapshotInfo();
      logAnalyticsEvent("ViewOnlyLinkForm_on-toggle_clicked", {
        snapshotShareId: snapshotShareId,
        projectId: project.id,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      logAnalyticsEvent("ViewOnlyLinkForm_snapshot_creation-failed", {
        projectId: project.id,
      });
    }
  };

  handleDisableSharing = async () => {
    const { snapshotShareId } = this.state;
    const { project } = this.props;
    try {
      await deleteSnapshot(snapshotShareId);
      this.clearSnapshotInfo();
      logAnalyticsEvent("ViewOnlyLinkForm_off-toggle_clicked", {
        projectId: project.id,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      logAnalyticsEvent("ViewOnlyLinkForm_snapshot_deletion-failed", {
        projectId: project.id,
      });
    }
  };

  renderNumSamples = () => {
    const { snapshotNumSamples } = this.state;
    return (
      snapshotNumSamples + " Sample" + (snapshotNumSamples === 1 ? "" : "s")
    );
  };

  renderPipelineVersions = () => {
    const { snapshotPipelineVersions } = this.state;

    const numPipelineVersions = snapshotPipelineVersions.length;
    if (numPipelineVersions === 0) return "No pipeline versions";
    if (numPipelineVersions === 1) {
      return "Pipeline version " + snapshotPipelineVersions[0];
    }

    // Ex: Pipeline versions 3.1, 3.2 or 3.3
    let result = "Pipeline versions ";
    if (numPipelineVersions <= 3) {
      result += snapshotPipelineVersions.slice(0, -1).join(", ");
      result += " or " + snapshotPipelineVersions.slice(-1)[0];
      return result;
    }

    // Ex: Pipeline versions 3.1, 3.2 or more
    result += snapshotPipelineVersions.slice(0, 2).join(", ");
    result += " or ";
    return (
      <span>
        {result}
        <ColumnHeaderTooltip
          trigger={<span className={cs.pipelineVersionTooltip}>more</span>}
          content={snapshotPipelineVersions.slice(2).join(", ")}
        />
      </span>
    );
  };

  render() {
    const {
      isLoading,
      sharingEnabled,
      automaticUpdateEnabled,
      snapshotShareId,
      snapshotTimestamp,
    } = this.state;
    const { project } = this.props;

    const viewOnlyHelpText = (
      <React.Fragment>
        <span>
          Users viewing this link <span className={cs.highlight}>can not</span>:
        </span>
        <ul className={cs.conditionList}>
          <li className={cs.conditionListItem}>Upload samples</li>
          <li className={cs.conditionListItem}>Edit metadata</li>
          <li className={cs.conditionListItem}>
            Download non-host reads/ contigs or unmapped reads
          </li>
        </ul>
      </React.Fragment>
    );
    const backgroundModelHelpText =
      "You can select our default or one created from samples you uploaded.";
    const shareableLink = window.location.origin + "/pub/" + snapshotShareId;

    return (
      <div className={cs.viewOnlyLinkForm}>
        <div className={cs.viewOnlyLinkHeader}>
          <div className={cx(cs.toggleContainer, cs.titleContainer)}>
            <div className={cs.title}>View-Only Link</div>
            {isLoading ? (
              <LoadingMessage className={cs.loadingIcon} />
            ) : (
              <Toggle
                className={cs.linkToggle}
                onLabel="On"
                offLabel="Off"
                initialChecked={sharingEnabled}
                onChange={this.handleSharingToggle}
              />
            )}
          </div>
          <div className={cs.noteContainer}>
            <div className={cs.note}>
              Anyone, including non-IDseq users, can use this link to access a
              View-Only version of your project.
            </div>
            <ColumnHeaderTooltip
              trigger={
                <span>
                  <IconInfoSmall className={cs.helpIcon} />
                </span>
              }
              content={viewOnlyHelpText}
            />
          </div>
        </div>
        {sharingEnabled && (
          <div className={cx(cs.viewOnlyLinkBody, cs.background)}>
            <div className={cs.label}>Details for View-Only</div>
            <div className={cs.note}>
              {this.renderNumSamples()} | {this.renderPipelineVersions()} |{" "}
              {snapshotTimestamp}
            </div>
            <div className={cs.settingsForm}>
              <div className={cs.settingsFormDropdown}>
                <div className={cs.backgroundModelLabel}>
                  <span>Background Model</span>
                  <HelpIcon
                    text={backgroundModelHelpText}
                    className={cs.helpIcon}
                  />
                </div>
                <Dropdown
                  fluid
                  className={cs.dropdown}
                  placeholder="NID Human CSF v3"
                  options={this.dropdownOptions}
                  onChange={() =>
                    console.warn("background model onChange not configured")
                  }
                />
              </div>
              <div className={cs.settingsFormField}>
                <div
                  className={cx(cs.toggleContainer, cs.formFieldLabelContainer)}
                >
                  <div className={cs.formFieldLabel}>Automatically update</div>
                  <Toggle
                    className={cs.automaticUpdateToggle}
                    onLabel="On"
                    offLabel="Off"
                    initialChecked={automaticUpdateEnabled}
                    onChange={this.handleAutomaticUpdateChange}
                  />
                </div>
                <div className={cs.noteContainer}>
                  <div className={cs.note}>
                    View-only link
                    <span className={cs.highlight}>
                      {automaticUpdateEnabled ? " will " : " will not "}
                    </span>
                    update to include new pipeline runs or new samples added to
                    this project.
                  </div>
                </div>
              </div>
            </div>
            <div className={cs.shareableLink}>
              <div className={cs.shareableLinkField}>
                <Input
                  className={cs.input}
                  fluid
                  type="text"
                  id="shareableLink"
                  value={shareableLink}
                />
              </div>
              <div className={cs.shareableLinkField}>
                <BasicPopup
                  trigger={
                    <SecondaryButton
                      className={cs.button}
                      text="Copy"
                      rounded={false}
                      onClick={() => {
                        copyUrlToClipboard(shareableLink);
                        logAnalyticsEvent(
                          "ViewOnlyLinkForm_copy-button_clicked",
                          {
                            snapshotShareId: snapshotShareId,
                            projectId: project.id,
                          }
                        );
                      }}
                    />
                  }
                  content="A shareable URL was copied to your clipboard!"
                  on="click"
                  hideOnScroll
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

ViewOnlyLinkForm.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.number,
  }).isRequired,
};

export default ViewOnlyLinkForm;
