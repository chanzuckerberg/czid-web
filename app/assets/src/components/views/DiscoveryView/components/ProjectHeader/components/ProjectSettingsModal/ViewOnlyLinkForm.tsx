import { Icon } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import { getBackgrounds } from "~/api";
import {
  createSnapshot,
  deleteSnapshot,
  getSnapshotInfo,
  updateSnapshotBackground,
} from "~/api/snapshot_links";
import BasicPopup from "~/components/common/BasicPopup";
import LoadingMessage from "~/components/common/LoadingMessage";
import List from "~/components/ui/List";
import BackgroundModelFilter from "~/components/views/SampleView/components/MngsReport/components/ReportFilters/components/BackgroundModelFilter";
import { copyUrlToClipboard } from "~/helpers/url";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import HelpIcon from "~ui/containers/HelpIcon";
import { Input } from "~ui/controls";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";
import Toggle from "~ui/controls/Toggle";
import DisableSharingConfirmationModal from "./DisableSharingConfirmationModal";
import cs from "./view_only_link_form.scss";

interface ViewOnlyLinkFormProps {
  project: {
    id?: string;
  };
}

interface ViewOnlyLinkFormState {
  backgroundId?: number;
  backgroundOptions?: {
    mass_normalized: boolean;
    text: string;
    name?: string;
    id?: number;
    value?: number;
  }[];
  disableSharingConfirmationModalOpen: boolean;
  isLoading: boolean;
  sharingEnabled: boolean;
  enableMassNormalizedBackgrounds?: boolean;
  automaticUpdateEnabled: boolean;
  snapshotShareId: string;
  snapshotNumSamples: number;
  snapshotPipelineVersions: $TSFixMeUnknown[];
  snapshotTimestamp: string;
}
class ViewOnlyLinkForm extends React.Component<
  ViewOnlyLinkFormProps,
  ViewOnlyLinkFormState
> {
  constructor(props) {
    super(props);
    this.state = {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      backgroundId: null,
      disableSharingConfirmationModalOpen: false,
      isLoading: false,
      sharingEnabled: false,
      automaticUpdateEnabled: false,
      snapshotShareId: "",
      snapshotNumSamples: 0,
      snapshotPipelineVersions: [],
      snapshotTimestamp: "",
    };
  }

  async componentDidMount() {
    this.setState({ isLoading: true });
    await this.fetchSnapshotInfo();
    await this.fetchBackgrounds();
    this.setState({ isLoading: false });
  }

  fetchSnapshotInfo = async () => {
    const { project } = this.props;
    try {
      const snapshot = await getSnapshotInfo(project.id);
      // Check in case you received an HTML redirect response
      if (snapshot && snapshot.share_id) {
        this.setState({
          backgroundId: snapshot.background_id,
          enableMassNormalizedBackgrounds:
            snapshot.mass_normalized_backgronds_available,
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

  fetchBackgrounds = async () => {
    const { backgrounds } = await getBackgrounds({
      ownedOrPublicBackgroundsOnly: true,
    });
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const backgroundOptions = backgrounds.map(background => ({
      text: background.name,
      value: background.id,
      mass_normalized: background.mass_normalized,
    }));
    this.setState({ backgroundOptions });
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

  handleDisableSharingConfirmationModalOpen = () =>
    this.setState({ disableSharingConfirmationModalOpen: true });

  handleDisableSharingConfirmationModalClose = () =>
    this.setState({ disableSharingConfirmationModalOpen: false });

  handleSharingToggle = () => {
    const { sharingEnabled } = this.state;

    if (sharingEnabled) {
      this.handleDisableSharingConfirmationModalOpen();
    } else {
      this.handleEnableSharing();
    }
  };

  handleEnableSharing = async () => {
    const { project } = this.props;
    try {
      await createSnapshot(project.id);
      await this.fetchSnapshotInfo();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  handleDisableSharing = async () => {
    const { snapshotShareId } = this.state;
    try {
      await deleteSnapshot(snapshotShareId);
      this.clearSnapshotInfo();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }

    this.setState({ disableSharingConfirmationModalOpen: false });
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

  handleBackgroundChange = async backgroundId => {
    const { snapshotShareId } = this.state;
    this.setState({ backgroundId });
    try {
      await updateSnapshotBackground(snapshotShareId, backgroundId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  renderAutomaticUpdateControl = () => {
    const { automaticUpdateEnabled } = this.state;
    return (
      <div className={cs.settingsFormField}>
        <div className={cx(cs.toggleContainer, cs.formFieldLabelContainer)}>
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
            update to include new pipeline runs or new samples added to this
            project.
          </div>
        </div>
      </div>
    );
  };

  render() {
    const {
      backgroundId,
      backgroundOptions,
      disableSharingConfirmationModalOpen,
      enableMassNormalizedBackgrounds,
      isLoading,
      sharingEnabled,
      snapshotShareId,
      snapshotTimestamp,
    } = this.state;

    const viewOnlyHelpText = (
      <React.Fragment>
        <span>
          Users viewing this link <span className={cs.highlight}>can not</span>:
        </span>
        <List
          listClassName={cs.conditionList}
          listItems={[
            "Select samples",
            "Edit metadata",
            "Download non-host reads/ contigs or unmapped reads",
          ]}
        />
        <span>
          You can preview your View-only link in private browsing mode on your
          web browser.
        </span>
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
                isChecked={sharingEnabled}
                initialChecked={sharingEnabled}
                onChange={this.handleSharingToggle}
              />
            )}
          </div>
          <div className={cs.noteContainer}>
            <div className={cs.note}>
              Anyone, including non-CZ ID users, can use this link to access a
              View-Only version of your project.
            </div>
            <ColumnHeaderTooltip
              trigger={
                <span>
                  <Icon
                    sdsIcon="infoCircle"
                    sdsSize="s"
                    sdsType="interactive"
                    className={cs.helpIcon}
                  />
                </span>
              }
              content={viewOnlyHelpText}
            />
          </div>
        </div>
        {sharingEnabled && !isLoading && (
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
                <BackgroundModelFilter
                  allBackgrounds={backgroundOptions}
                  className={cs.dropdown}
                  enableMassNormalizedBackgrounds={
                    enableMassNormalizedBackgrounds
                  }
                  fluid
                  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                  label={null}
                  onChange={backgroundId =>
                    this.handleBackgroundChange(backgroundId)
                  }
                  rounded={false}
                  value={backgroundId}
                />
              </div>
              {/* Uncomment the line below when automatic update controls are implemented. */}
              {/* this.renderAutomaticUpdateControl() */}
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
                      }}
                    />
                  }
                  content="A shareable URL was copied to your clipboard!"
                  on="click"
                  hideOnScroll
                />
              </div>
            </div>
            <div className={cs.staticWarning}>
              This link will not update to include new pipeline runs or new
              samples added to this project.
            </div>
          </div>
        )}
        {disableSharingConfirmationModalOpen && (
          <DisableSharingConfirmationModal
            onCancel={this.handleDisableSharingConfirmationModalClose}
            onConfirm={this.handleDisableSharing}
            open
          />
        )}
      </div>
    );
  }
}

export default ViewOnlyLinkForm;
