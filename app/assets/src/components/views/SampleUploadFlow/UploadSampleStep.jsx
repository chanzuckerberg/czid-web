import React from "react";
import cx from "classnames";
import QueryString from "query-string";
import {
  find,
  filter,
  keys,
  pick,
  pickBy,
  includes,
  flatten,
  set,
  reject,
  size,
  flow,
  values,
  keyBy,
  get,
  concat,
  map,
  zipObject,
  mergeWith,
  uniqBy,
  uniq,
  compact,
  difference,
  union,
  uniqueId,
  intersection,
} from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";
import { WORKFLOWS } from "~/components/utils/workflows";
import ProjectSelect from "~/components/common/ProjectSelect";
import Tabs from "~/components/ui/controls/Tabs";
import IssueGroup from "~ui/notifications/IssueGroup";
import { getProjects, validateSampleNames, validateSampleFiles } from "~/api";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import ProjectCreationForm from "~/components/common/ProjectCreationForm";
import { UserContext } from "~/components/common/UserContext";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";

import LocalSampleFileUpload from "./LocalSampleFileUpload";
import RemoteSampleFileUpload from "./RemoteSampleFileUpload";
import BasespaceSampleImport from "./BasespaceSampleImport";
import WorkflowSelector from "./WorkflowSelector";
import cs from "./sample_upload_flow.scss";
import SampleUploadTable from "./SampleUploadTable";
import { openBasespaceOAuthPopup } from "./utils";
import { SELECT_ID_KEY } from "./constants";

const LOCAL_UPLOAD = "local";
const REMOTE_UPLOAD = "remote";
const BASESPACE_UPLOAD = "basespace";

const LOCAL_UPLOAD_LABEL = "Upload from Your Computer";
const REMOTE_UPLOAD_LABEL = "Upload from S3";
const BASESPACE_UPLOAD_LABEL = "Upload from Basespace";

const UPLOADSAMPLESTEP_SAMPLE_CHANGED = "UploadSampleStep_sample_changed";

class UploadSampleStep extends React.Component {
  state = {
    selectedProject: null,
    createProjectOpen: false,
    projects: [],
    currentTab: LOCAL_UPLOAD,
    localSamples: [],
    remoteSamples: [],
    basespaceSamples: [],
    // We generate a unique "selectId" for each sample, which we use to store which samples are selected.
    // This simplifies the logic, because sample names can change (they can get renamed when de-duped)
    localSelectedSampleIds: new Set(),
    remoteSelectedSampleIds: new Set(),
    basespaceSelectedSampleIds: new Set(),
    basespaceAccessToken: null,
    removedLocalFiles: [], // Invalid local files that were removed.
    validatingSamples: false, // Disable the "Continue" button while validating samples.
    showNoProjectError: false, // Whether we should show an error if no project is currently selected.
    selectedWorkflows: new Set([WORKFLOWS.SHORT_READ_MNGS.value]),
    selectedWetlabProtocol: null,
  };

  async componentDidMount() {
    window.addEventListener("message", this.handleBasespaceOAuthMessageEvent);

    const response = await getProjects({
      domain: "updatable",
      basic: true,
    });
    const projects = (response || {}).projects;
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
    window.removeEventListener(
      "message",
      this.handleBasespaceOAuthMessageEvent
    );
  }

  // *** Basespace-related functions ***

  // Handle the message from the Basespace OAuth popup that authorizes IDseq to read (i.e. download files) from user projects.
  handleBasespaceOAuthMessageEvent = async event => {
    const {
      selectedProject,
      selectedWorkflows,
      selectedWetlabProtocol,
    } = this.state;
    const basespaceSamples = this.getSelectedSamples("basespace");

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
        project: selectedProject,
        samples: samplesWithToken,
        uploadType: "basespace",
        wetlabProtocol: selectedWetlabProtocol,
        workflows: selectedWorkflows,
      });
    }
  };

  requestBasespaceReadProjectPermissions = () => {
    const basespaceSamples = this.getSelectedSamples("basespace");
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

  handleBasespaceAccessTokenChange = basespaceAccessToken => {
    this.setState({
      basespaceAccessToken,
    });
  };

  // *** Tab-related functions ***

  getUploadTabs = () => {
    const { admin, biohubS3UploadEnabled } = this.props;
    return compact([
      {
        value: LOCAL_UPLOAD,
        label: LOCAL_UPLOAD_LABEL,
      },
      (admin || biohubS3UploadEnabled) && {
        value: REMOTE_UPLOAD,
        label: REMOTE_UPLOAD_LABEL,
      },
      {
        value: BASESPACE_UPLOAD,
        label: BASESPACE_UPLOAD_LABEL,
      },
    ]);
  };

  handleTabChange = tab => {
    this.props.onDirty();
    this.setState({ currentTab: tab });
    logAnalyticsEvent("UploadSampleStep_tab_changed", {
      tab,
    });
  };

  // *** Project-related functions ***

  // Modify the project_id in our samples, and validate the sample names again.
  updateSamplesForNewProject = async ({ samples, project }) => {
    const { samples: validatedSamples } = await this.validateSampleNames({
      samples,
      project,
    });

    return {
      samples: map(set("project_id", get("id", project)), validatedSamples),
    };
  };

  handleProjectCreate = async project => {
    this.props.onDirty();
    this.setState({
      validatingSamples: true,
      showNoProjectError: false,
    });

    const [
      { samples: newLocalSamples },
      { samples: newRemoteSamples },
      { samples: newBasespaceSamples },
    ] = await Promise.all([
      this.updateSamplesForNewProject({
        samples: this.state.localSamples,
        project,
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
    });

    logAnalyticsEvent("UploadSampleStep_project_created", {
      localSamples: newLocalSamples.length,
      remoteSamples: newRemoteSamples.length,
      basespaceSamples: newBasespaceSamples.length,
      ...this.getAnalyticsContext(),
    });
  };

  handleProjectChange = async project => {
    this.props.onDirty();
    this.setState({
      validatingSamples: true,
      showNoProjectError: false,
    });

    const [
      { samples: newLocalSamples },
      { samples: newRemoteSamples },
      { samples: newBasespaceSamples },
    ] = await Promise.all([
      this.updateSamplesForNewProject({
        samples: this.state.localSamples,
        project,
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
    });

    logAnalyticsEvent("UploadSampleStep_project-selector_changed", {
      localSamples: newLocalSamples.length,
      remoteSamples: newRemoteSamples.length,
      basespaceSamples: newBasespaceSamples.length,
      ...this.getAnalyticsContext(),
    });
  };

  handleNoProject = () => {
    this.setState({
      showNoProjectError: true,
    });
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

  // *** Pipeline workflow related functions ***

  handleWorkflowToggle = workflow => {
    let { selectedWorkflows } = this.state;
    // TODO: Behavior will change to support multiple selectedWorkflows.
    if (!selectedWorkflows.has(workflow)) {
      this.setState({
        selectedWorkflows: new Set([workflow]),
        selectedWetlabProtocol: null,
      });
      logAnalyticsEvent(`UploadSampleStep_${workflow}-workflow_selected`);
    }
  };

  handleWetlabProtocolChange = selected => {
    this.setState({ selectedWetlabProtocol: selected });
    logAnalyticsEvent(`UploadSampleStep_${selected}-protocol_selected`);
  };

  // *** Sample-related functions ***

  // Functions to get the state key by sample type, e.g. this.state.localSamples, this.state.basespaceSamples
  getSelectedSampleIdsKey = sampleType => `${sampleType}SelectedSampleIds`;
  getSamplesKey = sampleType => `${sampleType}Samples`;

  getSelectedSampleIds = sampleType => {
    return this.state[this.getSelectedSampleIdsKey(sampleType)];
  };

  getSelectedSamples = sampleType => {
    const selectedSampleIds = this.getSelectedSampleIds(sampleType);
    const samplesKey = this.getSamplesKey(sampleType);
    return filter(
      sample => selectedSampleIds.has(sample._selectId),
      this.state[samplesKey]
    );
  };

  // Get fields for display in the SampleUploadTable.
  getSampleDataForUploadTable = sampleType => {
    if (sampleType === "basespace") {
      return this.state.basespaceSamples;
    }

    if (sampleType === "remote" || sampleType === "local") {
      const samplesKey = this.getSamplesKey(sampleType);
      const samples = this.state[samplesKey];
      return samples.map(sample => ({
        ...pick(["name", SELECT_ID_KEY], sample),
        file_names: map(
          file => file.name || file.source,
          sample.input_files_attributes
        ).sort(),
      }));
    }
  };

  // Add a unique select id to each sample, for tracking selection state.
  addSelectIdToSamples = samples =>
    map(sample => set(SELECT_ID_KEY, uniqueId(), sample), samples);

  // Merge newly added samples with the list of samples already added.
  mergeSamples = (samples, newSamples) => {
    let samplesByName = keyBy("name", samples);
    let newSamplesByName = keyBy("name", newSamples);

    // If a sample with the same name already exists, just merge their input_files_attributes and files.
    const mergedSamples = mergeWith(
      (newSample, sample) => {
        if (sample && newSample) {
          // Merge input_files_attribute and files from newSample into sample.
          return flow(
            set(
              "input_files_attributes",
              // Ensure that the files are all unique by looking at the source field.
              uniqBy(
                "source",
                concat(
                  newSample.input_files_attributes,
                  sample.input_files_attributes
                )
              )
            ),
            set(
              "files",
              // Files are keyed by name, so just overwrite.
              {
                ...newSample.files,
                ...sample.files,
              }
            )
          )(sample);
        }
      },
      newSamplesByName,
      samplesByName
    );

    return values(mergedSamples);
  };

  // Rename duplicated sample names if needed.
  validateSampleNames = async ({ samples, project }) => {
    const selectedProject = project || this.state.selectedProject;
    if (!selectedProject || size(samples) <= 0) {
      return {
        samples,
      };
    }

    const validatedSampleNames = await validateSampleNames(
      get("id", selectedProject),
      map("name", samples)
    );

    const validatedNameMap = zipObject(
      map("name", samples),
      validatedSampleNames
    );

    // Replace samples name with their de-duped names.
    return {
      samples: samples.map(sample => ({
        ...sample,
        name: validatedNameMap[sample.name],
      })),
    };
  };

  // Perform sample validation and return the validated samples.
  validateAddedSamples = async (samples, sampleType) => {
    // For non-local samples, we just need to de-dupe the name.
    if (sampleType !== "local") {
      return this.validateSampleNames({ samples });
    }

    // For local samples, we also need to:
    //   Validate that sample files have a valid extension, based on the file name.
    //   Remove samples with no valid files.
    //   Return any removed files.
    if (size(samples) <= 0) {
      return {
        samples,
        removedLocalFiles: [],
      };
    }

    // Get all the sample file names.
    const sampleFileNames = flatten(map(sample => keys(sample.files), samples));

    let [{ samples: validatedSamples }, areFilesValid] = await Promise.all([
      // Call validateSampleNames to update sample names.
      this.validateSampleNames({ samples }),
      validateSampleFiles(sampleFileNames),
    ]);

    const fileNamesValidMap = zipObject(sampleFileNames, areFilesValid);

    // For each sample, filter out files that aren't valid.
    validatedSamples = validatedSamples.map(sample =>
      set(
        "files",
        pickBy((_file, fileName) => fileNamesValidMap[fileName], sample.files),
        sample
      )
    );
    validatedSamples = validatedSamples.map(sample =>
      set(
        "input_files_attributes",
        filter(
          inputFileAttributes => fileNamesValidMap[inputFileAttributes.source],
          sample.input_files_attributes
        ),
        sample
      )
    );

    // Filter out samples with no valid files.
    const filteredSamples = filter(
      sample => size(sample.files) > 0,
      validatedSamples
    );

    return {
      samples: filteredSamples,
      removedLocalFiles: keys(
        pickBy(fileValid => !fileValid, fileNamesValidMap)
      ),
    };
  };

  // When a sample is checked or unchecked.
  handleSampleSelect = (value, checked, sampleType) => {
    this.props.onDirty();
    const selectedSampleIdsKey = this.getSelectedSampleIdsKey(sampleType);
    const selectedSamples = this.state[selectedSampleIdsKey];

    if (checked) {
      selectedSamples.add(value);
    } else {
      selectedSamples.delete(value);
    }

    this.setState({
      [selectedSampleIdsKey]: selectedSamples,
    });
  };

  handleAllSamplesSelect = (checked, sampleType) => {
    this.props.onDirty();
    const selectedSampleIdsKey = this.getSelectedSampleIdsKey(sampleType);
    const samplesKey = this.getSamplesKey(sampleType);

    this.setState({
      [selectedSampleIdsKey]: checked
        ? new Set(map(SELECT_ID_KEY, this.state[samplesKey]))
        : new Set(),
    });
  };

  // Handle newly added samples
  handleSamplesAdd = async (newSamples, sampleType) => {
    this.props.onDirty();
    const samplesKey = this.getSamplesKey(sampleType);
    const selectedSampleIdsKey = this.getSelectedSampleIdsKey(sampleType);

    // If local samples, we also want to keep track of invalid files that were removed
    // so we can show a warning.
    this.setState({
      validatingSamples: true,
      ...(sampleType === "local" ? { removedLocalFiles: [] } : {}),
    });

    const newSamplesWithSelectIds = this.addSelectIdToSamples(newSamples);

    const {
      samples: validatedNewSamples,
      removedLocalFiles,
    } = await this.validateAddedSamples(newSamplesWithSelectIds, sampleType);

    // This de-dupes the newly added samples using the sample name. The older sample's selectId is used.
    const mergedSamples = this.mergeSamples(
      this.state[samplesKey],
      validatedNewSamples
    );

    const mergedSampleIds = map(SELECT_ID_KEY, mergedSamples);

    // Get the selectIds of all newly added samples that weren't already added.
    const newlyAddedSampleIds = intersection(
      map(SELECT_ID_KEY, validatedNewSamples),
      mergedSampleIds
    );

    // Automatically select all newly added samples that weren't already added.
    const mergedSelectedSampleIds = new Set(
      union(Array.from(this.state[selectedSampleIdsKey]), newlyAddedSampleIds)
    );

    this.setState({
      validatingSamples: false,
      [samplesKey]: mergedSamples,
      [selectedSampleIdsKey]: mergedSelectedSampleIds,
      ...(sampleType === "local" ? { removedLocalFiles } : {}),
    });

    logAnalyticsEvent(UPLOADSAMPLESTEP_SAMPLE_CHANGED, {
      newSamples: validatedNewSamples.length,
      totalSamples: mergedSamples.length,
      sampleType,
      ...(sampleType === "local"
        ? { removedLocalFiles: removedLocalFiles.length }
        : {}),
      ...this.getAnalyticsContext(),
    });
  };

  handleSamplesRemove = (sampleSelectIds, sampleType) => {
    this.props.onDirty();
    const samplesKey = this.getSamplesKey(sampleType);
    const selectedSampleIdsKey = this.getSelectedSampleIdsKey(sampleType);

    const newSamples = reject(
      sample => includes(sample[SELECT_ID_KEY], sampleSelectIds),
      this.state[samplesKey]
    );
    const newSelectedSampleIds = new Set(
      difference(
        Array.from(this.getSelectedSampleIds(sampleType)),
        sampleSelectIds
      )
    );

    const newState = {
      [samplesKey]: newSamples,
      [selectedSampleIdsKey]: newSelectedSampleIds,
    };

    this.setState(newState);

    logAnalyticsEvent("UploadSampleStep_samples_removed", {
      sampleNames: sampleSelectIds.length,
      sampleType: this.state.currentTab,
      ...this.getAnalyticsContext(),
    });
  };

  // *** Miscellaneous functions ***

  handleContinue = () => {
    const {
      currentTab,
      selectedProject,
      selectedWorkflows,
      selectedWetlabProtocol,
    } = this.state;

    if (this.state.currentTab === BASESPACE_UPLOAD) {
      this.requestBasespaceReadProjectPermissions();
    } else {
      this.props.onUploadSamples({
        project: selectedProject,
        samples: this.getSelectedSamples(currentTab),
        uploadType: currentTab,
        wetlabProtocol: selectedWetlabProtocol,
        workflows: selectedWorkflows,
      });
    }

    logAnalyticsEvent("UploadSampleStep_continue-button_clicked", {
      localSamples: this.state.localSamples.length,
      remoteSamples: this.state.remoteSamples.length,
      basespaceSamples: this.state.basespaceSamples.length,
      currentTab: this.state.currentTab,
      wetlabProtocol: selectedWetlabProtocol,
      workflows: selectedWorkflows,
      ...this.getAnalyticsContext(),
    });
  };

  // Whether the current user input is valid. Determines whether the Continue button is enabled.
  isValid = () => {
    const {
      currentTab,
      selectedProject,
      selectedWetlabProtocol,
      selectedWorkflows,
      validatingSamples,
    } = this.state;

    const workflowsValid = selectedWorkflows.has(
      WORKFLOWS.CONSENSUS_GENOME.value
    )
      ? !!selectedWetlabProtocol
      : true;
    return (
      selectedProject !== null &&
      size(this.getSelectedSamples(currentTab)) > 0 &&
      !validatingSamples &&
      workflowsValid
    );
  };

  getAnalyticsContext = () => {
    const project = this.state.selectedProject;
    return {
      projectId: project && project.id,
      projectName: project && project.name,
    };
  };

  // *** Render functions ***

  renderTab = () => {
    const { basespaceAccessToken, currentTab, selectedProject } = this.state;
    switch (currentTab) {
      case LOCAL_UPLOAD:
        return (
          <LocalSampleFileUpload
            onChange={samples => this.handleSamplesAdd(samples, "local")}
            project={selectedProject}
            samples={this.getSelectedSamples("local")}
            hasSamplesLoaded={size(this.state.localSamples) > 0}
          />
        );
      case REMOTE_UPLOAD:
        return (
          <RemoteSampleFileUpload
            project={selectedProject}
            onChange={samples => this.handleSamplesAdd(samples, "remote")}
            onNoProject={this.handleNoProject}
          />
        );
      case BASESPACE_UPLOAD:
        return (
          <BasespaceSampleImport
            project={selectedProject}
            onChange={samples => this.handleSamplesAdd(samples, "basespace")}
            accessToken={basespaceAccessToken}
            onAccessTokenChange={this.handleBasespaceAccessTokenChange}
            basespaceClientId={this.props.basespaceClientId}
            basespaceOauthRedirectUri={this.props.basespaceOauthRedirectUri}
            onNoProject={this.handleNoProject}
          />
        );
      default:
        return <div />;
    }
  };

  render() {
    const {
      currentTab,
      selectedWorkflows,
      selectedWetlabProtocol,
    } = this.state;

    const readyForBasespaceAuth =
      currentTab === BASESPACE_UPLOAD && this.isValid();

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
            <div className={cs.header} role="heading">
              Select Project
            </div>
            <div className={cs.label}>Project</div>
            <ProjectSelect
              projects={this.state.projects}
              value={get("id", this.state.selectedProject)}
              onChange={this.handleProjectChange}
              disabled={this.state.createProjectOpen}
              erred={
                this.state.showNoProjectError &&
                this.state.selectedProject === null
              }
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
          <WorkflowSelector
            onWetlabProtocolChange={this.handleWetlabProtocolChange}
            onWorkflowToggle={this.handleWorkflowToggle}
            selectedWorkflows={selectedWorkflows}
            selectedWetlabProtocol={selectedWetlabProtocol}
          />
          <div className={cs.fileUpload}>
            <div className={cs.title}>Upload Files</div>
            <Tabs
              className={cs.tabs}
              tabs={this.getUploadTabs()}
              value={this.state.currentTab}
              onChange={this.handleTabChange}
            />
            {this.renderTab()}
          </div>
          {this.state.currentTab === LOCAL_UPLOAD &&
            this.state.removedLocalFiles.length > 0 && (
              <IssueGroup
                caption={`${this.state.removedLocalFiles.length} files were invalid. Please check the acceptable file formats under "More Info".`}
                headers={["Invalid File Names"]}
                rows={this.state.removedLocalFiles.map(file => [file])}
                type="warning"
              />
            )}
          <SampleUploadTable
            samples={this.getSampleDataForUploadTable(currentTab)}
            onSamplesRemove={sampleNames =>
              this.handleSamplesRemove(sampleNames, currentTab)
            }
            onSampleSelect={(value, checked) =>
              this.handleSampleSelect(value, checked, currentTab)
            }
            onAllSamplesSelect={checked =>
              this.handleAllSamplesSelect(checked, currentTab)
            }
            selectedSampleIds={this.getSelectedSampleIds(currentTab)}
            sampleUploadType={currentTab}
          />
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
  admin: PropTypes.bool,
  biohubS3UploadEnabled: PropTypes.bool,
  basespaceClientId: PropTypes.string.isRequired,
  basespaceOauthRedirectUri: PropTypes.string.isRequired,
};

UploadSampleStep.contextType = UserContext;

export default UploadSampleStep;
