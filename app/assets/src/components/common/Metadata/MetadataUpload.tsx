import cx from "classnames";
import _fp, {
  isEmpty,
  isEqual,
  filter,
  get,
  keyBy,
  concat,
  find,
  sortBy,
  remove,
  flatten,
} from "lodash/fp";
import React from "react";

import { getAllHostGenomes, getAllSampleTypes } from "~/api";
import { trackEvent, withAnalytics } from "~/api/analytics";
import { getProjectMetadataFields } from "~/api/metadata";
import MetadataCSVLocationsMenu from "~/components/common/Metadata/MetadataCSVLocationsMenu";
import MetadataCSVUpload from "~/components/common/Metadata/MetadataCSVUpload";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import Tabs from "~/components/ui/controls/Tabs";
import { generateClientDownloadFromEndpoint } from "~/components/utils/clientDownload";
import { WORKFLOWS } from "~/components/utils/workflows";
import { MetadataType } from "~/interface/shared";
import { IconAlert } from "~ui/icons";
import IssueGroup from "~ui/notifications/IssueGroup";
import LoadingMessage from "../LoadingMessage";
import MetadataManualInput from "./MetadataManualInput";
import { METADATA_FIELDS_UNAVAILABLE_BY_WORKFLOW } from "./constants";
import cs from "./metadata_upload.scss";
import {
  MetadataCSVLocationsMenuProps,
  MetadataUploadProps,
  MetadataUploadState,
} from "./types";
import { geosearchCSVLocations } from "./utils";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const map = _fp.map.convert({ cap: false });

class MetadataUpload extends React.Component<
  MetadataUploadProps,
  MetadataUploadState
> {
  state: MetadataUploadState = {
    currentTab: "Manual Input",
    issues: {
      errors: [],
      warnings: [],
    },
    projectMetadataFields: null,
    hostGenomes: [],
    sampleTypes: [],
    validatingCSV: false,
    fetchingCSVLocationMatches: false,
    showMetadataCSVLocationsMenu: false,
    allProjectMetadataFields: null,
  };

  // Define the order in which metadata fields should be render in the upload
  // grid. The order was defined by the perceived affinity of fields.
  // Any field not defined will appear after in the pre-existing order.
  ordering = {
    host_genome: 1, // currently, this is not a MetadataField technically
    sample_type: 2,
    water_control: 3,
    nucleotide_type: 4,
    collection_date: 5,
    collection_location: 6, // legacy, code for both cases to be safe
    collection_location_v2: 7,
  };

  async componentDidMount() {
    const [
      projectMetadataFields,
      hostGenomes,
      sampleTypes,
    ] = await Promise.all([
      getProjectMetadataFields(this.props.project.id),
      getAllHostGenomes(),
      getAllSampleTypes(),
    ]);
    this.setState({
      allProjectMetadataFields: projectMetadataFields,
      projectMetadataFields: this.processProjectMetadataFields(
        projectMetadataFields,
      ),
      hostGenomes,
      sampleTypes,
    });
  }

  async componentDidUpdate(prevProps: MetadataUploadProps) {
    if (prevProps.project.id !== this.props.project.id) {
      // Set the projectMetadataFields to null while fetching the new fields.
      // This forces the MetadataManualInput to re-mount which is necessary for correct behavior.
      this.setState({
        projectMetadataFields: null,
      });

      const projectMetadataFields: MetadataUploadState["allProjectMetadataFields"] = await getProjectMetadataFields(
        this.props.project.id,
      );

      this.setState({
        allProjectMetadataFields: projectMetadataFields,
        projectMetadataFields: this.processProjectMetadataFields(
          projectMetadataFields,
        ),
      });
    }

    // User may switch workflows during the sample uploading process so we need to keep
    // the project metadata available up to date.
    if (
      this.state.allProjectMetadataFields &&
      !isEqual(prevProps.workflows, this.props.workflows)
    ) {
      this.setState({
        projectMetadataFields: this.processProjectMetadataFields(
          this.state.allProjectMetadataFields,
        ),
      });
    }
  }

  // Removes metadataFields that should not be selectable for a particular workflow
  filterMetadataFieldsByWorkflow = (
    projectMetadataFields: MetadataType[],
  ): MetadataType[] => {
    const { workflows } = this.props;

    const metadataFieldsToRemove = new Set(
      flatten(
        Array.from(workflows).map(
          workflow => METADATA_FIELDS_UNAVAILABLE_BY_WORKFLOW[workflow],
        ),
      ),
    );
    return remove(
      metadataField => metadataFieldsToRemove.has(get("key", metadataField)),
      projectMetadataFields,
    );
  };

  processProjectMetadataFields = (projectMetadataFields: MetadataType[]) => {
    if (!isEmpty(projectMetadataFields)) {
      const filteredProjectMetadataFields = this.filterMetadataFieldsByWorkflow(
        projectMetadataFields,
      );
      const sorted = sortBy(
        metadataField =>
          this.ordering[metadataField.key] || Number.MAX_SAFE_INTEGER,
        filteredProjectMetadataFields,
      );
      return keyBy("key", sorted);
    }
  };

  handleTabChange = (tab: string) => {
    this.setState({ currentTab: tab, issues: null });
    // When the tab changes, reset state.
    this.props.onMetadataChange({
      metadata: null,
      issues: null,
      wasManual: tab === "Manual Input",
    });
    trackEvent("MetadataUpload_tab_changed", {
      tab,
      projectId: this.props.project.id,
      projectName: this.props.project.name,
    });
  };

  // MetadataCSVUpload validates metadata before calling onMetadataChangeCSV.
  onMetadataChangeCSV = ({
    metadata,
    issues,
    validatingCSV,
    newHostGenomes,
  }) => {
    this.props.onMetadataChange({
      metadata,
      issues,
      wasManual: false,
      newHostGenomes,
    });
    this.setState({
      issues,
      validatingCSV,
    });
    if (!validatingCSV) {
      // We only want to log on the second call when issues are present
      trackEvent("MetadataUpload_csv-metadata_changed", {
        errors: issues.errors.length,
        warnings: issues.warnings.length,
        projectId: this.props.project.id,
        projectName: this.props.project.name,
      });
      // Batch geosearch for locations for the interactive menu
      const hasErrors = issues && issues.errors.length > 0;
      if (!hasErrors) {
        this.getCSVLocationMatches(metadata);
      }
    } else {
      // If the user re-uploads a CSV, hide the locations menu until the CSV validation has no issues.
      this.setState({
        showMetadataCSVLocationsMenu: false,
      });
    }
  };

  getCSVLocationMatches = async metadata => {
    const { onMetadataChange } = this.props;
    if (!metadata) return;

    try {
      this.setState({
        fetchingCSVLocationMatches: true,
      });
      const newMetadata = await geosearchCSVLocations(
        metadata,
        this.getRequiredLocationMetadataType(),
      );
      // Here we set issues to null on the assumption that getCSVLocationMatches
      // is called only when warnings and errors have been dealt with.
      // wasManual will trigger another validation when the Continue button is clicked.
      onMetadataChange({
        metadata: newMetadata,
        wasManual: true,
        issues: null,
      });
      this.setState({
        showMetadataCSVLocationsMenu: true,
        fetchingCSVLocationMatches: false,
      });
    } catch (e) {
      // On failure, locations will remain plain text.
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  onMetadataChangeCSVLocationsMenu = ({ metadata }) => {
    // Disable the Step 3 navigation breadcrumb once a value has changed.
    if (this.props.onDirty) {
      this.props.onDirty();
    }
    // wasManual will trigger another validation when the Continue button is clicked.
    this.props.onMetadataChange({ metadata, wasManual: true });
  };

  // MetadataManualInput doesn't validate metadata before calling onMetadataChangeManual.
  // This happens when Continue is clicked in the parent component.
  onMetadataChangeManual = ({ metadata }) => {
    // Disable the Step 3 navigation breadcrumb once a value has changed.
    if (this.props.onDirty) {
      this.props.onDirty();
    }
    // wasManual will trigger another validation when the Continue button is clicked.
    this.props.onMetadataChange({ metadata, wasManual: true });
    trackEvent("MetadataUpload_manual-metadata_changed", {
      projectId: this.props.project.id,
      projectName: this.props.project.name,
    });
  };

  handleDownloadCSV = () => {
    const params = {
      ...(this.props.samplesAreNew
        ? { new_sample_names: map("name", this.props.samples) }
        : {}),
      project_id: this.props.project.id,
    };

    generateClientDownloadFromEndpoint({
      endpoint: "/metadata/metadata_template_csv",
      params,
      fileName: "metadata_template.csv",
      fileType: "text/csv",
    });
  };

  getRequiredLocationMetadataType = (): MetadataCSVLocationsMenuProps["locationMetadataType"] => {
    const { projectMetadataFields } = this.state;
    // Use the first required location MetadataField
    return find(
      { dataType: "location", is_required: 1 },
      Object.values(projectMetadataFields),
    );
  };

  renderTab = () => {
    const {
      onDirty,
      onShowCSVInstructions,
      project,
      samples,
      samplesAreNew,
      visible,
      withinModal,
    } = this.props;
    const {
      currentTab,
      hostGenomes,
      projectMetadataFields,
      sampleTypes,
    } = this.state;

    if (currentTab === "Manual Input") {
      if (!samples || !projectMetadataFields) {
        return <div className={cs.loadingMsg}>Loading...</div>;
      } else {
        return (
          <MetadataManualInput
            project={project}
            samples={samples}
            samplesAreNew={samplesAreNew}
            onMetadataChange={this.onMetadataChangeManual}
            withinModal={withinModal}
            projectMetadataFields={projectMetadataFields}
            hostGenomes={hostGenomes}
            sampleTypes={sampleTypes}
          />
        );
      }
    }

    if (currentTab === "CSV Upload") {
      return (
        <>
          <div>
            <button
              className={cx(cs.link, "noStyleButton")}
              onClick={withAnalytics(
                onShowCSVInstructions,
                "MetadataUpload_instruction-link_clicked",
              )}
              onKeyDown={withAnalytics(
                onShowCSVInstructions,
                "MetadataUpload_instruction-link_clicked",
              )}
            >
              View CSV Upload Instructions
            </button>
          </div>
          <MetadataCSVUpload
            className={cs.metadataCSVUpload}
            samples={samples}
            onMetadataChange={this.onMetadataChangeCSV}
            project={project}
            samplesAreNew={samplesAreNew}
            visible={visible}
            onDirty={onDirty}
          />
          <button
            className={cx(cs.link, "noStyleButton")}
            onClick={() => {
              this.handleDownloadCSV();
              trackEvent("MetadataUpload_download-csv-template_clicked", {
                projectId: project.id,
                projectName: project.name,
              });
            }}
            onKeyDown={() => {
              this.handleDownloadCSV();
              trackEvent("MetadataUpload_download-csv-template_clicked", {
                projectId: project.id,
                projectName: project.name,
              });
            }}
          >
            Download Metadata CSV Template
          </button>
          {this.state.validatingCSV && (
            <LoadingMessage
              message="Validating metadata..."
              className={cs.validationMessage}
            />
          )}
          {this.state.fetchingCSVLocationMatches && (
            <LoadingMessage
              message="Verifying collection locations..."
              className={cs.validationMessage}
            />
          )}
        </>
      );
    }
    return null;
  };

  // issueType is "error" or "warning".
  renderIssue = (issue, issueType, index) => {
    if (issue.isGroup) {
      return (
        <IssueGroup
          caption={issue.caption}
          headers={issue.headers}
          rows={issue.rows}
          key={index}
          type={issueType}
          className={cs.issueGroup}
        />
      );
    } else {
      // Some issues are still plain strings.
      return (
        <div className={cx(cs.issue, cs[issueType])} key={index}>
          <IconAlert className={cs.icon} type={cs[issueType]} />
          {issue}
        </div>
      );
    }
  };

  renderIssues = () => {
    const issues = this.props.issues || this.state.issues;
    const hasErrors = issues && issues.errors.length > 0;
    const hasWarnings = issues && issues.warnings.length > 0;

    if (!hasErrors && !hasWarnings) return null;

    let error = "Fix the following errors.";

    if (this.state.currentTab === "CSV Upload") {
      error = this.state.showMetadataCSVLocationsMenu
        ? "Fix these errors with your location selections."
        : "Fix the following errors.";
    }

    return (
      <div className={cs.issues}>
        {hasErrors && (
          <div className={cs.errors}>
            <div className={cs.header}>{error}</div>
            <div>
              {issues.errors.map((error, index) =>
                this.renderIssue(error, "error", index),
              )}
            </div>
          </div>
        )}
        {hasWarnings && (
          <div className={cs.warnings}>
            <div className={cs.header}>Warnings</div>
            <div>
              {issues.warnings.map((warning, index) =>
                this.renderIssue(warning, "warning", index),
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  renderCSVLocationsMenu = () => {
    const { metadata } = this.props;
    const {
      currentTab,
      showMetadataCSVLocationsMenu,
      hostGenomes,
    } = this.state;

    return currentTab === "CSV Upload" && showMetadataCSVLocationsMenu ? (
      <MetadataCSVLocationsMenu
        locationMetadataType={this.getRequiredLocationMetadataType()}
        metadata={metadata}
        onMetadataChange={this.onMetadataChangeCSVLocationsMenu}
        hostGenomes={hostGenomes}
      />
    ) : null;
  };

  render() {
    const { hostGenomes, projectMetadataFields, currentTab } = this.state;
    const { samplesAreNew, workflows } = this.props;
    const requiredFields = concat(
      "Host Organism",
      map("name", filter(["is_required", 1], projectMetadataFields)),
    );
    return (
      <div className={cx(cs.metadataUpload, this.props.className)}>
        {samplesAreNew && (
          <div className={cs.info}>
            <div className={cs.details}>
              <span className={cs.label}>
                We require the following metadata to determine how to process
                your data and display the results:{" "}
                {requiredFields && requiredFields.join(", ")}.{" "}
              </span>
              <ExternalLink
                href="/metadata/dictionary"
                className={cs.link}
                analyticsEventName="MetadataUpload_full-dictionary-link_clicked"
                analyticsEventData={{
                  projectId: this.props.project.id,
                  projectName: this.props.project.name,
                }}
              >
                View Full Metadata Dictionary
              </ExternalLink>
              .
            </div>
            <div className={cs.details}>
              <span className={cs.label}>
                {"Available organisms for host subtraction: "}
              </span>
              {workflows.has(WORKFLOWS.CONSENSUS_GENOME.value)
                ? "Human only"
                : hostGenomes &&
                  hostGenomes
                    .filter(h => !h.ercc_only && h.showAsOption === true)
                    .map(h => h.name)
                    .join(", ")}
              .
            </div>
          </div>
        )}
        <div>
          {!samplesAreNew && (
            <span>
              <ExternalLink
                href="/metadata/dictionary"
                className={cs.link}
                analyticsEventName="MetadataUpload_dictionary-link_clicked"
                analyticsEventData={{
                  projectId: this.props.project.id,
                  projectName: this.props.project.name,
                }}
              >
                View Metadata Dictionary
              </ExternalLink>
            </span>
          )}
        </div>
        <Tabs
          className={cs.tabs}
          tabs={["Manual Input", "CSV Upload"]}
          value={currentTab}
          onChange={this.handleTabChange}
        />
        {this.renderTab()}
        {this.renderCSVLocationsMenu()}
        {this.renderIssues()}
      </div>
    );
  }
}

export default MetadataUpload;
