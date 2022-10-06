import cx from "classnames";
import { Tab, Tabs, Tooltip } from "czifui";
import {
  find,
  findIndex,
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
  difference,
  union,
  uniqueId,
  intersection,
} from "lodash/fp";
import QueryString from "query-string";
import React from "react";

import { getProjects, validateSampleNames, validateSampleFiles } from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import ProjectCreationModal from "~/components/common/ProjectCreationModal";
import ProjectSelect from "~/components/common/ProjectSelect";
import { UserContext } from "~/components/common/UserContext";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import {
  AMR_V1_FEATURE,
  ONT_V1_FEATURE,
  PRE_UPLOAD_CHECK_FEATURE,
} from "~/components/utils/features";
import PropTypes from "~/components/utils/propTypes";
import { WORKFLOWS } from "~/components/utils/workflows";
import IssueGroup from "~ui/notifications/IssueGroup";

import BasespaceSampleImport from "./BasespaceSampleImport";
import LocalSampleFileUpload from "./LocalSampleFileUpload";
import PreUploadQCCheck from "./PreUploadQCCheck";
import RemoteSampleFileUpload from "./RemoteSampleFileUpload";
import SampleUploadTable from "./SampleUploadTable";
import WorkflowSelector from "./WorkflowSelector";
import {
  CG_TECHNOLOGY_OPTIONS,
  SELECT_ID_KEY,
  DEFAULT_NANOPORE_WETLAB_OPTION,
  DEFAULT_MEDAKA_MODEL_OPTION,
  ILLUMINA,
  NANOPORE,
  MISMATCH_FORMAT_ERROR,
  ALLOWED_WORKFLOWS_BY_TECHNOLOGY,
  UNSUPPORTED_UPLOAD_OPTION_TOOLTIP,
} from "./constants";
import cs from "./sample_upload_flow.scss";
import {
  groupSamplesByLane,
  openBasespaceOAuthPopup,
  removeLaneFromName,
} from "./utils";

const LOCAL_UPLOAD = "local";
const REMOTE_UPLOAD = "remote";
const BASESPACE_UPLOAD = "basespace";

const LOCAL_UPLOAD_LABEL = "Upload from Your Computer";
const REMOTE_UPLOAD_LABEL = "Upload from S3";
const BASESPACE_UPLOAD_LABEL = "Upload from Basespace";

const UPLOADSAMPLESTEP_SAMPLE_CHANGED = "UploadSampleStep_sample_changed";

class UploadSampleStep extends React.Component {
  state = {
    basespaceAccessToken: null,
    basespaceSamples: [],
    basespaceSelectedSampleIds: new Set(),
    createProjectOpen: false,
    currentTab: LOCAL_UPLOAD,
    localSamples: [],
    // We generate a unique "selectId" for each sample, which we use to store which samples are selected.
    // This simplifies the logic, because sample names can change (they can get renamed when de-duped)
    localSelectedSampleIds: new Set(),
    projects: [],
    remoteSamples: [],
    remoteSelectedSampleIds: new Set(),
    removedLocalFiles: [], // Invalid local files that were removed.
    selectedGuppyBasecallerSetting: null,
    selectedTechnology: null,
    selectedProject: null,
    selectedMedakaModel: DEFAULT_MEDAKA_MODEL_OPTION,
    selectedWetlabProtocol: null,
    selectedWorkflows: new Set(),
    showNoProjectError: false, // Whether we should show an error if no project is currently selected.
    usedClearLabs: false,
    files: [],
    validatingSamples: false, // Disable the "Continue" button while validating samples.
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
      this.handleBasespaceOAuthMessageEvent,
    );
  }

  // *** Basespace-related functions ***

  // Handle the message from the Basespace OAuth popup that authorizes CZ ID to read (i.e. download files) from user projects.
  handleBasespaceOAuthMessageEvent = async event => {
    const {
      selectedProject,
      selectedMedakaModel,
      selectedTechnology,
      selectedWetlabProtocol,
      selectedWorkflows,
      usedClearLabs,
      selectedGuppyBasecallerSetting,
    } = this.state;
    const basespaceSamples = this.getSelectedSamples(BASESPACE_UPLOAD);

    if (
      event.source === this._window &&
      event.origin === window.location.origin &&
      event.data.basespaceAccessToken
    ) {
      // This access token has permissions to download the files for each sample.
      const accessToken = event.data.basespaceAccessToken;

      // Add the access token to each sample. The token will be used on the back-end.
      let samplesWithToken = map(
        sample => ({
          ...sample,
          basespace_access_token: accessToken,
        }),
        basespaceSamples,
      );

      samplesWithToken = groupSamplesByLane(samplesWithToken, BASESPACE_UPLOAD);

      // Validate names of grouped samples after concatenation (need to do this
      // even if it's a group that only contains 1 dataset ID).
      const { samples: validatedSamples } = await this.validateSampleNames({
        samples: samplesWithToken,
      });
      samplesWithToken = validatedSamples;

      this.props.onUploadSamples({
        clearlabs: usedClearLabs,
        project: selectedProject,
        guppyBasecallerVersion: selectedGuppyBasecallerSetting,
        medakaModel: selectedMedakaModel,
        samples: samplesWithToken,
        technology: selectedTechnology,
        uploadType: BASESPACE_UPLOAD,
        wetlabProtocol: selectedWetlabProtocol,
        workflows: selectedWorkflows,
      });
    }
  };

  requestBasespaceReadProjectPermissions = () => {
    const basespaceSamples = this.getSelectedSamples(BASESPACE_UPLOAD);
    const { basespaceOauthRedirectUri, basespaceClientId } = this.props;

    // Request permissions to read (i.e. download files) from all source projects.
    const uniqueBasespaceProjectIds = uniq(
      map("basespace_project_id", basespaceSamples),
    );
    const projectReadPermissions = map(
      projectId => `,read+project+${projectId}`,
      uniqueBasespaceProjectIds,
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
    return [
      {
        value: LOCAL_UPLOAD,
        label: LOCAL_UPLOAD_LABEL,
      },
      {
        value: REMOTE_UPLOAD,
        label: REMOTE_UPLOAD_LABEL,
      },
      {
        value: BASESPACE_UPLOAD,
        label: BASESPACE_UPLOAD_LABEL,
      },
    ];
  };

  handleTabChange = tabIndex => {
    this.props.onDirty();
    const tab = this.getUploadTabs()[tabIndex].value;
    this.setState({ currentTab: tab });
    trackEvent("UploadSampleStep_tab_changed", {
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

    trackEvent("UploadSampleStep_project_created", {
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

    trackEvent("UploadSampleStep_project-selector_changed", {
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
    this.props.onDirty();
    const { allowedFeatures } = this.context || {};
    let { selectedWorkflows, selectedTechnology } = this.state;

    if (allowedFeatures.includes(AMR_V1_FEATURE)) {
      const workflowIsAlreadySelected = selectedWorkflows.has(workflow);
      workflowIsAlreadySelected
        ? selectedWorkflows.delete(workflow)
        : selectedWorkflows.add(workflow);

      selectedWorkflows = this.limitWorkflowSelection(
        workflow,
        selectedTechnology,
      );
      this.setState({
        selectedWorkflows,
        selectedWetlabProtocol: null,
        selectedTechnology:
          workflow === WORKFLOWS.AMR.value ? selectedTechnology : null,
      });
    } else {
      // TODO: Remove this `else` branch once AMR v1 launches.
      if (!selectedWorkflows.has(workflow)) {
        this.setState({
          selectedWorkflows: new Set([workflow]),
          selectedWetlabProtocol: null,
          selectedTechnology: null,
        });
      }
    }

    trackEvent(`UploadSampleStep_${workflow}-workflow_selected`);
  };

  limitWorkflowSelection = (workflowSelected, selectedTechnology) => {
    let { selectedWorkflows } = this.state;

    // Based on workflowSelected and selectedTechnology, determine which workflows are permitted
    let technology = selectedTechnology ?? ILLUMINA;
    const permittedWorkflows =
      ALLOWED_WORKFLOWS_BY_TECHNOLOGY[workflowSelected][technology];
    // Then delete non-permitted workflows
    let filteredWorkflows = new Set(selectedWorkflows);
    filteredWorkflows.forEach(workflow => {
      if (!permittedWorkflows.includes(workflow)) {
        filteredWorkflows.delete(workflow);
      }
    });
    return filteredWorkflows;
  };

  handleTechnologyToggle = technology => {
    this.props.onDirty();
    const { selectedWorkflows, usedClearLabs } = this.state;

    if (selectedWorkflows.has(WORKFLOWS.CONSENSUS_GENOME.value)) {
      // If user has selected Nanopore as their technology
      // and has previously toggled "Used Clear Labs" on,
      // then make sure to use the default wetlab + medaka model options.
      if (technology === NANOPORE && usedClearLabs) {
        this.setState({
          selectedTechnology: technology,
          selectedWetlabProtocol: DEFAULT_NANOPORE_WETLAB_OPTION,
          selectedMedakaModel: DEFAULT_MEDAKA_MODEL_OPTION,
        });
      } else {
        this.setState({
          selectedTechnology: technology,
          selectedWetlabProtocol: null,
        });
      }

      trackEvent(
        ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_TECHNOLOGY_CLICKED,
        { technology },
      );
    } else if (selectedWorkflows.has(WORKFLOWS.SHORT_READ_MNGS.value)) {
      const filteredWorkflows = this.limitWorkflowSelection(
        WORKFLOWS.SHORT_READ_MNGS.value,
        technology,
      );
      // We can reuse the same selectedTechnology state because we
      // could never have different technologies selected for mNGS and Consensus Genome.
      this.setState({
        selectedTechnology: technology,
        selectedWorkflows: filteredWorkflows,
      });
    }
  };

  handleWetlabProtocolChange = selected => {
    this.props.onDirty();
    this.setState({ selectedWetlabProtocol: selected });
    trackEvent(`UploadSampleStep_${selected}-protocol_selected`);
  };

  handleGuppyBasecallerSettingChange = selected => {
    this.props.onDirty();
    this.setState({ selectedGuppyBasecallerSetting: selected });
  };

  handleMedakaModelChange = selected => {
    this.props.onDirty();
    this.setState({ selectedMedakaModel: selected });
    trackEvent(
      ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_MEDAKA_MODEL_SELECTED,
      { selected },
    );
  };

  handleClearLabsChange = usedClearLabs => {
    this.props.onDirty();
    this.setState({
      usedClearLabs,
      // If uploading ClearLabs samples, only allow default wetlab and medaka model options.
      selectedWetlabProtocol: usedClearLabs
        ? DEFAULT_NANOPORE_WETLAB_OPTION
        : this.state.selectedWetlabProtocol,
      selectedMedakaModel: usedClearLabs
        ? DEFAULT_MEDAKA_MODEL_OPTION
        : this.state.selectedMedakaModel,
    });
    trackEvent(
      ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_CLEAR_LABS_TOGGLED,
      { usedClearLabs },
    );
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
      sample => selectedSampleIds.has(sample[SELECT_ID_KEY]),
      this.state[samplesKey],
    );
  };

  // Get fields for display in the SampleUploadTable.
  getSampleDataForUploadTable = sampleType => {
    if (sampleType === BASESPACE_UPLOAD)
      // Show how lanes will be concatenated
      return groupSamplesByLane(this.state.basespaceSamples, BASESPACE_UPLOAD);

    if (sampleType === REMOTE_UPLOAD || sampleType === LOCAL_UPLOAD) {
      const samplesKey = this.getSamplesKey(sampleType);
      const samples = this.state[samplesKey];

      // For local uploads, show how lanes will be concatenated
      // If applicable, also add information from the preupload QC checks.
      if (sampleType === LOCAL_UPLOAD) {
        const sampleInfo = [];
        const groups = groupSamplesByLane(samples, LOCAL_UPLOAD);

        for (let group in groups) {
          // Map errors/validation checks to each fileName
          // to inform if/how to display file errors in the SampleUploadtable.
          const pairedFiles = groups[group].files;

          let finishedValidating = {};
          let isValid = {};
          let error = {};

          pairedFiles.forEach(pair => {
            const files = pair.files;
            for (let fileName in files) {
              finishedValidating[fileName] = pair.finishedValidating;
              const correctSequenceTechnologySelected = this.validateCorrectFormat(
                pair,
              );
              isValid[fileName] =
                pair.isValid && correctSequenceTechnologySelected;
              const errorMsg = !correctSequenceTechnologySelected
                ? MISMATCH_FORMAT_ERROR
                : pair.error;
              error[fileName] = errorMsg || "";
            }
          });

          sampleInfo.push({
            file_names_R1: groups[group].filesR1.map(file => file.name),
            file_names_R2: groups[group].filesR2.map(file => file.name),
            name: removeLaneFromName(pairedFiles[0].name),
            // If we concatenate samples 1 through 4, the selectId = "1,2,3,4"
            [SELECT_ID_KEY]: pairedFiles
              .map(file => file[SELECT_ID_KEY])
              .join(","),
            finishedValidating,
            isValid,
            error,
          });
        }
        return sampleInfo;
      }

      return samples.map(sample => {
        const fileNames = map(
          file => file.name || file.source,
          sample.input_files_attributes,
        ).sort();

        return {
          ...pick(["name", SELECT_ID_KEY], sample),
          file_names_R1: [fileNames[0]],
          file_names_R2: [fileNames[1]],
        };
      });
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
                  sample.input_files_attributes,
                ),
              ),
            ),
            set(
              "files",
              // Files are keyed by name, so just overwrite.
              {
                ...newSample.files,
                ...sample.files,
              },
            ),
          )(sample);
        }
      },
      newSamplesByName,
      samplesByName,
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
      map("name", samples),
    );

    const validatedNameMap = zipObject(
      map("name", samples),
      validatedSampleNames,
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
    if (sampleType !== LOCAL_UPLOAD) {
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
        sample,
      ),
    );
    validatedSamples = validatedSamples.map(sample =>
      set(
        "input_files_attributes",
        filter(
          inputFileAttributes => fileNamesValidMap[inputFileAttributes.source],
          sample.input_files_attributes,
        ),
        sample,
      ),
    );

    // Filter out samples with no valid files.
    const filteredSamples = filter(
      sample => size(sample.files) > 0,
      validatedSamples,
    );

    return {
      samples: filteredSamples,
      removedLocalFiles: keys(
        pickBy(fileValid => !fileValid, fileNamesValidMap),
      ),
    };
  };

  // When a sample is checked or unchecked.
  handleSampleSelect = (value, checked, sampleType) => {
    const { allowedFeatures } = this.context || {};
    this.props.onDirty();
    const samplesKey = this.getSamplesKey(sampleType);
    const samples = this.state[samplesKey];

    // If the user tries to select an invalid sample, do nothing.
    // Note: we currently only run validation checks on locally uploaded samples
    if (
      allowedFeatures.includes(PRE_UPLOAD_CHECK_FEATURE) &&
      sampleType === LOCAL_UPLOAD
    ) {
      const sample = samples.find(sample => sample[SELECT_ID_KEY] === value);
      if (
        !sample ||
        sample.isValid === false ||
        !this.validateCorrectFormat(sample)
      ) {
        return;
      }
    }

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

  // Callback for PreUploadQCCheck to remove invalid samples from selectedSamples.
  handleInvalidSample = (value, checked, sampleType) => {
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
    const { allowedFeatures } = this.context || {};
    this.props.onDirty();
    const selectedSampleIdsKey = this.getSelectedSampleIdsKey(sampleType);
    const samplesKey = this.getSamplesKey(sampleType);
    let samples = this.state[samplesKey];

    // Filter out invalid samples.
    // Note: we currently only run validation checks on locally uploaded samples
    if (
      allowedFeatures.includes(PRE_UPLOAD_CHECK_FEATURE) &&
      sampleType === LOCAL_UPLOAD
    ) {
      samples = samples.filter(
        sample => sample.isValid && this.validateCorrectFormat(sample),
      );
    }

    this.setState({
      [selectedSampleIdsKey]: checked
        ? new Set(map(SELECT_ID_KEY, samples))
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
      ...(sampleType === LOCAL_UPLOAD ? { removedLocalFiles: [] } : {}),
    });

    const newSamplesWithSelectIds = this.addSelectIdToSamples(newSamples);

    const {
      samples: validatedNewSamples,
      removedLocalFiles,
    } = await this.validateAddedSamples(newSamplesWithSelectIds, sampleType);

    // This de-dupes the newly added samples using the sample name. The older sample's selectId is used.
    const mergedSamples = this.mergeSamples(
      this.state[samplesKey],
      validatedNewSamples,
    );

    const mergedSampleIds = map(SELECT_ID_KEY, mergedSamples);

    // Get the selectIds of all newly added samples that weren't already added.
    const newlyAddedSampleIds = intersection(
      map(SELECT_ID_KEY, validatedNewSamples),
      mergedSampleIds,
    );

    // Automatically select all newly added samples that weren't already added.
    const mergedSelectedSampleIds = new Set(
      union(Array.from(this.state[selectedSampleIdsKey]), newlyAddedSampleIds),
    );

    this.setState({
      validatingSamples: false,
      [samplesKey]: mergedSamples,
      [selectedSampleIdsKey]: mergedSelectedSampleIds,
      ...(sampleType === LOCAL_UPLOAD ? { removedLocalFiles } : {}),
      files: this.state.files.concat(validatedNewSamples),
    });

    trackEvent(UPLOADSAMPLESTEP_SAMPLE_CHANGED, {
      newSamples: validatedNewSamples.length,
      totalSamples: mergedSamples.length,
      sampleType,
      ...(sampleType === LOCAL_UPLOAD
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
      this.state[samplesKey],
    );
    const newSelectedSampleIds = new Set(
      difference(
        Array.from(this.getSelectedSampleIds(sampleType)),
        sampleSelectIds,
      ),
    );

    const newState = {
      [samplesKey]: newSamples,
      [selectedSampleIdsKey]: newSelectedSampleIds,
    };

    this.setState(newState);

    trackEvent("UploadSampleStep_samples_removed", {
      sampleNames: sampleSelectIds.length,
      sampleType: this.state.currentTab,
      ...this.getAnalyticsContext(),
    });
  };

  // *** Miscellaneous functions ***

  handleContinue = async () => {
    const { onUploadSamples } = this.props;
    const {
      currentTab,
      selectedTechnology,
      selectedMedakaModel,
      selectedProject,
      selectedWorkflows,
      selectedWetlabProtocol,
      usedClearLabs,
    } = this.state;

    if (currentTab === BASESPACE_UPLOAD) {
      this.requestBasespaceReadProjectPermissions();
    } else {
      let samples = this.getSelectedSamples(currentTab);

      // Provide concatenated lane files for next upload step
      if (currentTab === LOCAL_UPLOAD) {
        const groups = groupSamplesByLane(samples, LOCAL_UPLOAD);
        samples = map(group => group.concatenated, groups);
        // Validate names of grouped samples after concatenation (need to do this
        // even if it's a group that only contains 1 lane file).
        const { samples: validatedSamples } = await this.validateSampleNames({
          samples,
        });
        samples = validatedSamples;
      }

      onUploadSamples({
        samples,
        clearlabs: usedClearLabs,
        technology: selectedTechnology,
        medakaModel: selectedMedakaModel,
        project: selectedProject,
        uploadType: currentTab,
        wetlabProtocol: selectedWetlabProtocol,
        workflows: selectedWorkflows,
      });
    }

    trackEvent("UploadSampleStep_continue-button_clicked", {
      basespaceSamples: this.state.basespaceSamples.length,
      technology: selectedTechnology,
      currentTab: this.state.currentTab,
      localSamples: this.state.localSamples.length,
      remoteSamples: this.state.remoteSamples.length,
      wetlabProtocol: selectedWetlabProtocol,
      workflows: selectedWorkflows,
      ...this.getAnalyticsContext(),
    });
  };

  // Change state for files
  handleValidatedFilesChange = localSamples => {
    this.setState({
      localSamples,
    });
  };

  handleContinueButtonTooltip = () => {
    const {
      currentTab,
      localSamples,
      selectedProject,
      selectedTechnology,
      selectedWorkflows,
      selectedWetlabProtocol,
    } = this.state;
    const { allowedFeatures } = this.context || {};

    // Note: we currently only run validation checks on locally uploaded samples
    if (
      currentTab === LOCAL_UPLOAD &&
      allowedFeatures.includes(PRE_UPLOAD_CHECK_FEATURE)
    ) {
      if (!localSamples.every(element => element.finishedValidating))
        return "Please wait for file validation to complete";
    }
    if (!selectedProject) return "Please select a project to continue";
    else if (size(this.getSelectedSamples(currentTab)) < 1)
      return "Please select a sample to continue";
    else if (
      !selectedWorkflows ||
      !selectedTechnology ||
      !selectedWetlabProtocol
    )
      return "Please select an analysis type to continue";
  };

  // Whether the current user input is valid. Determines whether the Continue button is enabled.
  isValid = () => {
    const {
      currentTab,
      selectedTechnology,
      selectedProject,
      selectedWetlabProtocol,
      selectedWorkflows,
      validatingSamples,
      localSamples,
    } = this.state;
    const { allowedFeatures } = this.context || {};

    let workflowsValid;
    if (selectedWorkflows.has(WORKFLOWS.CONSENSUS_GENOME.value)) {
      switch (selectedTechnology) {
        case CG_TECHNOLOGY_OPTIONS.ILLUMINA:
          workflowsValid = !!selectedWetlabProtocol;
          break;
        case CG_TECHNOLOGY_OPTIONS.NANOPORE:
          workflowsValid = !!selectedWetlabProtocol;
          break;
        default:
          workflowsValid = false;
          break;
      }
    } else if (
      selectedWorkflows.has(WORKFLOWS.SHORT_READ_MNGS.value) ||
      selectedWorkflows.has(WORKFLOWS.AMR.value)
    ) {
      workflowsValid = true;
    }

    // Note: we currently only run validation checks on locally uploaded samples
    return allowedFeatures.includes(PRE_UPLOAD_CHECK_FEATURE) &&
      currentTab === LOCAL_UPLOAD
      ? selectedProject !== null &&
          size(this.getSelectedSamples(currentTab)) > 0 &&
          !validatingSamples &&
          workflowsValid &&
          localSamples.every(element => element.finishedValidating)
      : selectedProject !== null &&
          size(this.getSelectedSamples(currentTab)) > 0 &&
          !validatingSamples &&
          workflowsValid;
  };

  getAnalyticsContext = () => {
    const project = this.state.selectedProject;
    return {
      projectId: project && project.id,
      projectName: project && project.name,
    };
  };

  getSequenceTechnology = () => {
    const { selectedWorkflows, selectedTechnology } = this.state;
    const { allowedFeatures } = this.context || {};

    if (allowedFeatures.includes(ONT_V1_FEATURE)) {
      if (
        selectedTechnology === ILLUMINA ||
        selectedWorkflows.has(WORKFLOWS.AMR.value)
      )
        return ILLUMINA;
      else if (selectedTechnology === NANOPORE) return NANOPORE;
    } else {
      // TODO: We currently assume all metagenomics samples are Illumina by default.
      // Remove this block of logic after the metagenomics ONT pipeline has been
      // released to all users.
      if (
        selectedWorkflows.has(WORKFLOWS.SHORT_READ_MNGS.value) ||
        selectedWorkflows.has(WORKFLOWS.AMR.value) ||
        (selectedWorkflows.has(WORKFLOWS.CONSENSUS_GENOME.value) &&
          selectedTechnology === ILLUMINA)
      )
        return ILLUMINA;
      else if (
        selectedWorkflows.has(WORKFLOWS.CONSENSUS_GENOME.value) &&
        selectedTechnology === NANOPORE
      )
        return NANOPORE;
    }
  };

  validateCorrectFormat = file => {
    const sequenceTechnology = this.getSequenceTechnology();
    return file.format && sequenceTechnology
      ? file.format === sequenceTechnology
      : true;
  };

  // *** Render functions ***

  renderUploadTabs = () => {
    const { admin, biohubS3UploadEnabled } = this.props;
    const { selectedWorkflows, selectedTechnology } = this.state;
    const isLongReadMngs =
      selectedWorkflows.has(WORKFLOWS.SHORT_READ_MNGS.value) &&
      selectedTechnology === NANOPORE;

    // We're currently disabling S3 and basespace uploads for ONT v1, but they may be re-enabled in the future
    const s3Tab = this.renderUploadTab(isLongReadMngs, REMOTE_UPLOAD_LABEL);
    const basespaceTab = this.renderUploadTab(
      isLongReadMngs,
      BASESPACE_UPLOAD_LABEL,
    );

    return (
      <Tabs
        sdsSize="large"
        underlined
        value={findIndex(
          { value: this.state.currentTab },
          this.getUploadTabs(),
        )}
        onChange={(_, selectedTabIndex) =>
          this.handleTabChange(selectedTabIndex)
        }
      >
        <Tab label={LOCAL_UPLOAD_LABEL}></Tab>
        {(admin || biohubS3UploadEnabled) && s3Tab}
        {basespaceTab}
      </Tabs>
    );
  };

  renderUploadTab = (disabled, label) => {
    let tab = <Tab disabled={disabled} label={label}></Tab>;
    if (disabled) {
      tab = (
        <Tooltip
          arrow
          placement="top"
          title={UNSUPPORTED_UPLOAD_OPTION_TOOLTIP}
          leaveDelay={0}
        >
          <span>{tab}</span>
        </Tooltip>
      );
    }
    return tab;
  };

  renderUploadTabContent = () => {
    const { basespaceAccessToken, currentTab, selectedProject } = this.state;
    switch (currentTab) {
      case LOCAL_UPLOAD:
        return (
          <LocalSampleFileUpload
            onChange={samples => this.handleSamplesAdd(samples, LOCAL_UPLOAD)}
            project={selectedProject}
            samples={this.getSelectedSamples(LOCAL_UPLOAD)}
            hasSamplesLoaded={size(this.state.localSamples) > 0}
          />
        );
      case REMOTE_UPLOAD:
        return (
          <RemoteSampleFileUpload
            project={selectedProject}
            onChange={samples => this.handleSamplesAdd(samples, REMOTE_UPLOAD)}
            onNoProject={this.handleNoProject}
          />
        );
      case BASESPACE_UPLOAD:
        return (
          <BasespaceSampleImport
            project={selectedProject}
            onChange={samples =>
              this.handleSamplesAdd(samples, BASESPACE_UPLOAD)
            }
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
    const { allowedFeatures } = this.context || {};
    const {
      currentTab,
      selectedMedakaModel,
      selectedGuppyBasecallerSetting,
      selectedTechnology,
      selectedWetlabProtocol,
      selectedWorkflows,
      usedClearLabs,
      files,
      localSamples,
    } = this.state;

    const readyForBasespaceAuth =
      currentTab === BASESPACE_UPLOAD && this.isValid();
    return (
      <div
        className={cx(
          cs.uploadSampleStep,
          cs.uploadFlowStep,
          this.props.visible && cs.visible,
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
                <ProjectCreationModal
                  modalOpen
                  onCancel={withAnalytics(
                    this.closeCreateProject,
                    ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_PROJECT_CREATION_MODAL_CLOSED,
                  )}
                  onCreate={this.handleProjectCreate}
                />
              </div>
            ) : (
              <div
                className={cs.createProjectButton}
                onClick={withAnalytics(
                  this.openCreateProject,
                  "UploadSampleStep_create-project_opened",
                )}
              >
                + Create Project
              </div>
            )}
          </div>
          <WorkflowSelector
            onClearLabsChange={this.handleClearLabsChange}
            onMedakaModelChange={this.handleMedakaModelChange}
            onGuppyBasecallerSettingChange={
              this.handleGuppyBasecallerSettingChange
            }
            onWetlabProtocolChange={this.handleWetlabProtocolChange}
            onTechnologyToggle={this.handleTechnologyToggle}
            onWorkflowToggle={this.handleWorkflowToggle}
            selectedMedakaModel={selectedMedakaModel}
            selectedGuppyBasecallerSetting={selectedGuppyBasecallerSetting}
            selectedTechnology={selectedTechnology}
            selectedWorkflows={selectedWorkflows}
            selectedWetlabProtocol={selectedWetlabProtocol}
            usedClearLabs={usedClearLabs}
          />
          <div className={cs.fileUpload}>
            <div className={cs.title}>Upload Files</div>
            {this.renderUploadTabs()}
            {this.renderUploadTabContent()}
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
            files={files}
          />
          {localSamples.length > 0 &&
            allowedFeatures.includes(PRE_UPLOAD_CHECK_FEATURE) && (
              // Note: we currently only run validation checks on locally uploaded samples
              <PreUploadQCCheck
                samples={localSamples}
                changeState={this.handleValidatedFilesChange}
                handleSampleDeselect={this.handleInvalidSample}
                sequenceTechnology={this.getSequenceTechnology()}
              />
            )}
        </div>
        <div className={cs.controls}>
          {readyForBasespaceAuth && (
            <div className={cs.helpText}>
              Please authorize CZ ID to fetch your selected samples from
              Basespace.
            </div>
          )}
          <BasicPopup
            basic={false}
            disabled={this.isValid()}
            position="top center"
            trigger={
              <span>
                <PrimaryButton
                  className={cs.continueButton}
                  disabled={!this.isValid()}
                  onClick={this.handleContinue}
                  text={readyForBasespaceAuth ? "Authorize" : "Continue"}
                />
              </span>
            }
          >
            {this.handleContinueButtonTooltip()}
          </BasicPopup>
          <a href="/home">
            <SecondaryButton
              text="Cancel"
              onClick={() =>
                trackEvent("UploadSampleStep_cancel-button_clicked", {
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
