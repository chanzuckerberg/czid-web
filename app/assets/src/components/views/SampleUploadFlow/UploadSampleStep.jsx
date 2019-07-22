import React from "react";
import cx from "classnames";
import QueryString from "query-string";
import {
  find,
  filter,
  keys,
  pickBy,
  includes,
  flatten,
  set,
  reject,
  size,
  flow,
  values,
  mapValues,
  keyBy,
  get,
  concat,
  map,
  omit,
  zipObject,
  mapKeys,
  mergeWith,
  uniqBy,
  uniq,
  compact,
} from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";
import ProjectSelect from "~/components/common/ProjectSelect";
import Tabs from "~/components/ui/controls/Tabs";
import IssueGroup from "~ui/notifications/IssueGroup";
import { getProjects, validateSampleNames, validateSampleFiles } from "~/api";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import BulkSampleUploadTable from "~ui/controls/BulkSampleUploadTable";
import ProjectCreationForm from "~/components/common/ProjectCreationForm";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import { RequestContext } from "~/components/common/RequestContext";

import LocalSampleFileUpload from "./LocalSampleFileUpload";
import RemoteSampleFileUpload from "./RemoteSampleFileUpload";
import BasespaceSampleImport from "./BasespaceSampleImport";
import cs from "./sample_upload_flow.scss";
import BasespaceSampleUploadTable from "./BasespaceSampleUploadTable";
import { openBasespaceOAuthPopup } from "./utils";

const LOCAL_UPLOAD_TAB = "Upload from Your Computer";
const REMOTE_UPLOAD_TAB = "Upload from S3";
const BASESPACE_UPLOAD_TAB = "Upload from Basespace";

const UPLOADSAMPLESTEP_SAMPLE_CHANGED = "UploadSampleStep_sample_changed";

class UploadSampleStep extends React.Component {
  state = {
    selectedProject: null,
    createProjectOpen: false,
    projects: [],
    currentTab: LOCAL_UPLOAD_TAB,
    localSamples: [],
    remoteSamples: [],
    basespaceSamples: [],
    basespaceAccessToken: null,
    removedLocalFiles: [], // Invalid local files that were removed.
    sampleNamesToFiles: {}, // Needed for local samples.
    validatingSamples: false, // Disable the "Continue" button while validating samples.
  };

  async componentDidMount() {
    window.addEventListener("message", this.handleMessageEvent);

    const projects = await getProjects({
      domain: "updatable",
      basic: true,
    });

    this.setState({
      projects,
    });

    // Pre-populate the selected project from URL params.
    let urlParams = QueryString.parse(location.search, {
      arrayFormat: "bracket",
    });

    const projectId = parseInt(urlParams.projectId);
    if (projectId && !this.state.selectedProject) {
      const selectedProject = find(["id", projectId], projects);

      if (selectedProject) {
        this.handleProjectChange(selectedProject);
      }
    }

    // Clear all URL params.
    window.history.replaceState({}, document.title, location.pathname);
  }

  componentWillUnmount() {
    window.removeEventListener("message", this.handleMessageEvent);
  }

  handleMessageEvent = async event => {
    const { basespaceSamples, selectedProject } = this.state;
    if (
      event.source === this._window &&
      event.origin === window.location.origin &&
      event.data.basespaceAccessToken
    ) {
      // This access token has permissions to download the files for each sample.
      const accessToken = event.data.basespaceAccessToken;

      // Add the access token to each sample. The token will be used on the back-end.
      const samplesWithToken = map(
        sample => ({
          ...sample,
          basespace_access_token: accessToken,
        }),
        basespaceSamples
      );

      this.props.onUploadSamples({
        samples: samplesWithToken,
        project: selectedProject,
        uploadType: "basespace",
      });
    }
  };

  requestBasespaceReadProjectPermissions = () => {
    const { basespaceSamples } = this.state;
    const { basespaceOauthRedirectUri, basespaceClientId } = this.props;

    // Request permissions to read (i.e. download files) from all source projects.
    const uniqueBasespaceProjectIds = uniq(
      map("basespace_project_id", basespaceSamples)
    );
    const projectReadPermissions = map(
      projectId => `,read+project+${projectId}`,
      uniqueBasespaceProjectIds
    ).join("");

    this._window = openBasespaceOAuthPopup({
      client_id: basespaceClientId,
      redirect_uri: basespaceOauthRedirectUri,
      scope: `browse+global${projectReadPermissions}`,
    });
  };

  getCurrentSamples = () => {
    if (this.state.currentTab === LOCAL_UPLOAD_TAB) {
      return this.state.localSamples;
    }
    if (this.state.currentTab === REMOTE_UPLOAD_TAB) {
      return this.state.remoteSamples;
    }
    if (this.state.currentTab === BASESPACE_UPLOAD_TAB) {
      return this.state.basespaceSamples;
    }
    return [];
  };

  getUploadTabs = allowedFeatures => {
    const { admin } = this.props;
    return compact([
      LOCAL_UPLOAD_TAB,
      REMOTE_UPLOAD_TAB,
      (admin || allowedFeatures.includes("basespace_upload_enabled")) &&
        BASESPACE_UPLOAD_TAB,
    ]);
  };

  isValid = () =>
    this.state.selectedProject !== null &&
    size(this.getCurrentSamples()) > 0 &&
    !this.state.validatingSamples;

  // Modify the project_id in our samples, and validate the names and sampleNamesToFiles again.
  updateSamplesForNewProject = async ({
    samples,
    project,
    sampleNamesToFiles,
  }) => {
    const {
      samples: validatedSamples,
      sampleNamesToFiles: validatedSampleNamesToFiles,
    } = await this.validateSampleNames({
      samples,
      project,
      sampleNamesToFiles,
    });

    return {
      samples: map(set("project_id", get("id", project)), validatedSamples),
      sampleNamesToFiles: validatedSampleNamesToFiles,
    };
  };

  handleProjectChange = async project => {
    this.props.onDirty();
    this.setState({
      validatingSamples: true,
    });

    const [
      { samples: newLocalSamples, sampleNamesToFiles: newSampleNamesToFiles },
      { samples: newRemoteSamples },
      { samples: newBasespaceSamples },
    ] = await Promise.all([
      this.updateSamplesForNewProject({
        samples: this.state.localSamples,
        project,
        sampleNamesToFiles: this.state.sampleNamesToFiles,
      }),
      this.updateSamplesForNewProject({
        samples: this.state.remoteSamples,
        project,
      }),
      this.updateSamplesForNewProject({
        samples: this.state.basespaceSamples,
        project,
      }),
    ]);

    this.setState({
      selectedProject: project,
      validatingSamples: false,
      localSamples: newLocalSamples,
      remoteSamples: newRemoteSamples,
      basespaceSamples: newBasespaceSamples,
      sampleNamesToFiles: newSampleNamesToFiles,
    });

    logAnalyticsEvent("UploadSampleStep_project-selector_changed", {
      localSamples: newLocalSamples.length,
      remoteSamples: newRemoteSamples.length,
      ...this.getAnalyticsContext(),
    });
  };

  // Rename duplicated sample names in 'samples' and 'sampleNamesToFiles' if needed.
  validateSampleNames = async ({ samples, project, sampleNamesToFiles }) => {
    const selectedProject = project || this.state.selectedProject;
    if (!selectedProject || size(samples) <= 0) {
      return Promise.resolve({
        samples,
        sampleNamesToFiles,
      });
    }

    const validatedSampleNames = await validateSampleNames(
      get("id", selectedProject),
      map("name", samples)
    );

    const validatedNameMap = zipObject(
      map("name", samples),
      validatedSampleNames
    );

    const validatedData = {
      samples: samples.map(sample => ({
        ...sample,
        name: validatedNameMap[sample.name],
      })),
    };

    if (sampleNamesToFiles) {
      validatedData.sampleNamesToFiles = mapKeys(
        name => validatedNameMap[name],
        sampleNamesToFiles
      );
    }

    return validatedData;
  };

  // Remove invalid files from sampleNamesToFiles and remove samples with no valid files.
  validateSampleNamesAndFiles = async ({
    samples,
    project,
    sampleNamesToFiles,
  }) => {
    if (size(samples) <= 0) {
      return Promise.resolve({
        samples,
        sampleNamesToFiles,
        removedLocalFiles: [],
      });
    }

    const sampleFiles = map("name", flatten(values(sampleNamesToFiles)));

    const [
      {
        samples: validatedSamples,
        sampleNamesToFiles: validatedSampleNamesToFiles,
      },
      areFilesValid,
    ] = await Promise.all([
      // Call validateSampleNames to update sample names.
      this.validateSampleNames({ samples, project, sampleNamesToFiles }),
      validateSampleFiles(sampleFiles),
    ]);

    const filesValidMap = zipObject(sampleFiles, areFilesValid);

    // Filter out invalid files.
    const filteredSampleNamesToFiles = mapValues(
      files => filter(file => filesValidMap[file.name], files),
      validatedSampleNamesToFiles
    );

    // Filter out samples with no valid files.
    const emptySampleNames = keys(
      pickBy(files => files.length === 0, filteredSampleNamesToFiles)
    );
    const filteredSamples = filter(
      sample => !includes(sample.name, emptySampleNames),
      validatedSamples
    );

    return {
      samples: filteredSamples,
      sampleNamesToFiles: filteredSampleNamesToFiles,
      removedLocalFiles: keys(pickBy(fileValid => !fileValid, filesValidMap)),
    };
  };

  openCreateProject = () => {
    this.setState({
      createProjectOpen: true,
    });
  };

  closeCreateProject = () => {
    this.setState({
      createProjectOpen: false,
    });
  };

  handleProjectCreate = async project => {
    this.props.onDirty();
    this.setState({
      validatingSamples: true,
    });

    const [
      { samples: newLocalSamples, sampleNamesToFiles: newSampleNamesToFiles },
      { samples: newRemoteSamples },
      { samples: newBasespaceSamples },
    ] = await Promise.all([
      this.updateSamplesForNewProject({
        samples: this.state.localSamples,
        project,
        sampleNamesToFiles: this.state.sampleNamesToFiles,
      }),
      this.updateSamplesForNewProject({
        samples: this.state.remoteSamples,
        project,
      }),
      this.updateSamplesForNewProject({
        samples: this.state.basespaceSamples,
        project,
      }),
    ]);

    this.setState({
      validatingSamples: false,
      projects: concat(project, this.state.projects),
      selectedProject: project,
      createProjectOpen: false,
      localSamples: newLocalSamples,
      remoteSamples: newRemoteSamples,
      basespaceSamples: newBasespaceSamples,
      sampleNamesToFiles: newSampleNamesToFiles,
    });

    logAnalyticsEvent("UploadSampleStep_project_created", {
      localSamples: newLocalSamples.length,
      remoteSamples: newRemoteSamples.length,
      ...this.getAnalyticsContext(),
    });
  };

  handleTabChange = tab => {
    this.props.onDirty();
    this.setState({ currentTab: tab });
    logAnalyticsEvent("UploadSampleStep_tab_changed", {
      tab,
    });
  };

  // Merge newly added samples with the list of samples already added.
  mergeSamples = (samples, newSamples) => {
    let samplesByName = keyBy("name", samples);
    let newSamplesByName = keyBy("name", newSamples);

    // If a sample with the same name already exists, just merge their input_files_attributes.
    const mergedSamples = mergeWith(
      (newSample, sample) => {
        if (sample && newSample) {
          return set(
            "input_files_attributes",
            // Ensure that the files are all unique by looking at the source field.
            uniqBy(
              "source",
              concat(
                newSample.input_files_attributes,
                sample.input_files_attributes
              )
            ),
            sample
          );
        }
      },
      newSamplesByName,
      samplesByName
    );

    return values(mergedSamples);
  };

  handleBasespaceAccessTokenChange = basespaceAccessToken => {
    this.setState({
      basespaceAccessToken,
    });
  };

  handleLocalSampleChange = async (localSamples, sampleNamesToFiles) => {
    this.props.onDirty();
    this.setState({
      validatingSamples: true,
      removedLocalFiles: [],
    });

    const {
      samples: validatedLocalSamples,
      sampleNamesToFiles: validatedSampleNamesToFiles,
      removedLocalFiles,
    } = await this.validateSampleNamesAndFiles({
      samples: localSamples,
      sampleNamesToFiles,
    });

    this.setState({
      validatingSamples: false,
      localSamples: this.mergeSamples(
        this.state.localSamples,
        validatedLocalSamples
      ),
      sampleNamesToFiles: mergeWith(
        (newFiles, files) => {
          if (newFiles && files) {
            return uniqBy("name", concat(newFiles, files));
          }
        },
        validatedSampleNamesToFiles,
        this.state.sampleNamesToFiles
      ),
      removedLocalFiles,
    });

    logAnalyticsEvent(UPLOADSAMPLESTEP_SAMPLE_CHANGED, {
      totalSamples: localSamples.length,
      newSamples: validatedLocalSamples.length,
      removedLocalFiles: removedLocalFiles.length,
      sampleType: "local",
      ...this.getAnalyticsContext(),
    });
  };

  // Handle new samples from remote (S3) and Basespace.
  handleSampleChange = async (samples, sampleType) => {
    let sampleFieldName = "remoteSamples";
    if (sampleType === "basespace") {
      sampleFieldName = "basespaceSamples";
    }

    this.props.onDirty();
    this.setState({
      validatingSamples: true,
    });

    const { samples: validatedSamples } = await this.validateSampleNames({
      samples,
    });

    const newSamples = this.mergeSamples(
      this.state[sampleFieldName],
      validatedSamples
    );

    this.setState({
      validatingSamples: false,
      [sampleFieldName]: newSamples,
    });

    logAnalyticsEvent(UPLOADSAMPLESTEP_SAMPLE_CHANGED, {
      newSamples: validatedSamples.length,
      totalSamples: newSamples.length,
      sampleType,
      ...this.getAnalyticsContext(),
    });
  };

  handleSampleRemoved = sampleName => {
    this.props.onDirty();
    const newSamples = reject(["name", sampleName], this.getCurrentSamples());

    if (this.state.currentTab === LOCAL_UPLOAD_TAB) {
      const newSampleNamesToFiles = omit(
        sampleName,
        this.state.sampleNamesToFiles
      );

      this.setState({
        localSamples: newSamples,
        sampleNamesToFiles: newSampleNamesToFiles,
      });
    }

    if (this.state.currentTab === REMOTE_UPLOAD_TAB) {
      this.setState({
        remoteSamples: newSamples,
      });
    }

    if (this.state.currentTab === BASESPACE_UPLOAD_TAB) {
      this.setState({
        basespaceSamples: newSamples,
      });
    }

    logAnalyticsEvent("UploadSampleStep_sample_removed", {
      sampleName,
      sampleType: this.state.currentTab,
      ...this.getAnalyticsContext(),
    });
  };

  handleContinue = () => {
    if (this.state.currentTab === LOCAL_UPLOAD_TAB) {
      this.props.onUploadSamples({
        samples: this.state.localSamples,
        project: this.state.selectedProject,
        sampleNamesToFiles: this.state.sampleNamesToFiles,
        uploadType: "local",
      });
    }

    if (this.state.currentTab === REMOTE_UPLOAD_TAB) {
      this.props.onUploadSamples({
        samples: this.state.remoteSamples,
        project: this.state.selectedProject,
        uploadType: "remote",
      });
    }

    if (this.state.currentTab === BASESPACE_UPLOAD_TAB) {
      this.requestBasespaceReadProjectPermissions();
    }

    logAnalyticsEvent("UploadSampleStep_continue-button_clicked", {
      localSamples: this.state.localSamples.length,
      remoteSamples: this.state.remoteSamples.length,
      basespaceSamples: this.state.basespaceSamples.length,
      currentTab: this.state.currentTab,
      ...this.getAnalyticsContext(),
    });
  };

  getSampleNamesToFiles = () => {
    return flow(
      keyBy("name"),
      mapValues(sample => sample.input_files_attributes)
    )(this.getCurrentSamples());
  };

  renderTab = () => {
    const {
      basespaceAccessToken,
      currentTab,
      selectedProject,
      localSamples,
    } = this.state;
    switch (currentTab) {
      case LOCAL_UPLOAD_TAB:
        return (
          <LocalSampleFileUpload
            onChange={this.handleLocalSampleChange}
            project={selectedProject}
            samples={localSamples}
          />
        );
      case REMOTE_UPLOAD_TAB:
        return (
          <RemoteSampleFileUpload
            project={selectedProject}
            onChange={samples => this.handleSampleChange(samples, "remote")}
          />
        );
      case BASESPACE_UPLOAD_TAB:
        return (
          <BasespaceSampleImport
            project={selectedProject}
            onChange={samples => this.handleSampleChange(samples, "basespace")}
            accessToken={basespaceAccessToken}
            onAccessTokenChange={this.handleBasespaceAccessTokenChange}
            basespaceClientId={this.props.basespaceClientId}
            basespaceOauthRedirectUri={this.props.basespaceOauthRedirectUri}
          />
        );
      default:
        return <div />;
    }
  };

  getAnalyticsContext = () => {
    const project = this.state.selectedProject;
    return {
      projectId: project && project.id,
      projectName: project && project.name,
    };
  };

  render() {
    const { currentTab } = this.state;
    const readyForBasespaceAuth =
      currentTab === BASESPACE_UPLOAD_TAB && this.isValid();

    return (
      <div
        className={cx(
          cs.uploadSampleStep,
          cs.uploadFlowStep,
          this.props.visible && cs.visible
        )}
      >
        <div className={cs.flexContent}>
          <div className={cs.projectSelect}>
            <div className={cs.label}>Project</div>
            <ProjectSelect
              projects={this.state.projects}
              value={get("id", this.state.selectedProject)}
              onChange={this.handleProjectChange}
              disabled={this.state.createProjectOpen}
            />
            {this.state.createProjectOpen ? (
              <div className={cs.projectCreationContainer}>
                <ProjectCreationForm
                  onCancel={withAnalytics(
                    this.closeCreateProject,
                    "UploadSampleStep_project-creation-form_closed"
                  )}
                  onCreate={this.handleProjectCreate}
                />
              </div>
            ) : (
              <div
                className={cs.createProjectButton}
                onClick={withAnalytics(
                  this.openCreateProject,
                  "UploadSampleStep_create-project_opened"
                )}
              >
                + Create Project
              </div>
            )}
          </div>
          <div className={cs.fileUpload}>
            <div className={cs.title}>Upload Files</div>
            <RequestContext.Consumer>
              {({ allowedFeatures } = {}) => {
                return (
                  <Tabs
                    className={cs.tabs}
                    tabs={this.getUploadTabs(allowedFeatures)}
                    value={this.state.currentTab}
                    onChange={this.handleTabChange}
                  />
                );
              }}
            </RequestContext.Consumer>
            {this.renderTab()}
          </div>
          {this.state.currentTab === LOCAL_UPLOAD_TAB &&
            this.state.removedLocalFiles.length > 0 && (
              <IssueGroup
                caption={`${
                  this.state.removedLocalFiles.length
                } files were invalid. Please check the acceptable file formats under "More Info".`}
                headers={["Invalid File Names"]}
                rows={this.state.removedLocalFiles.map(file => [file])}
                type="warning"
              />
            )}
          {(currentTab === REMOTE_UPLOAD_TAB ||
            currentTab === LOCAL_UPLOAD_TAB) && (
            <BulkSampleUploadTable
              sampleNamesToFiles={this.getSampleNamesToFiles()}
              onRemoved={this.handleSampleRemoved}
              hideProgressColumn
              showCount={this.state.currentTab === REMOTE_UPLOAD_TAB}
              className={cs.uploadTable}
            />
          )}
          {currentTab === BASESPACE_UPLOAD_TAB && (
            <BasespaceSampleUploadTable
              samples={this.getCurrentSamples()}
              onSampleRemove={this.handleSampleRemoved}
            />
          )}
        </div>
        <div className={cs.controls}>
          {readyForBasespaceAuth && (
            <div className={cs.helpText}>
              Please authorize IDseq to fetch your selected samples from
              Basespace.
            </div>
          )}
          <PrimaryButton
            text={readyForBasespaceAuth ? "Authorize" : "Continue"}
            onClick={this.handleContinue}
            disabled={!this.isValid()}
            rounded={false}
            className={cs.continueButton}
          />
          <a href="/home">
            <SecondaryButton
              text="Cancel"
              rounded={false}
              onClick={() =>
                logAnalyticsEvent("UploadSampleStep_cancel-button_clicked", {
                  ...this.getAnalyticsContext(),
                })
              }
            />
          </a>
        </div>
      </div>
    );
  }
}

UploadSampleStep.propTypes = {
  onUploadSamples: PropTypes.func.isRequired,
  // Immediately called when the user changes anything, even before validation has returned.
  // Used to disable later steps the header navigation if the data in previous steps has changed.
  onDirty: PropTypes.func.isRequired,
  visible: PropTypes.bool,
  basespaceClientId: PropTypes.string.isRequired,
  basespaceOauthRedirectUri: PropTypes.string.isRequired,
  admin: PropTypes.bool,
};

export default UploadSampleStep;
