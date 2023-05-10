import Aioli from "@biowasm/aioli";
import cx from "classnames";
import { Tab, Tabs, Tooltip } from "czifui";
import {
  compact,
  concat,
  difference,
  filter,
  find,
  findIndex,
  flatten,
  flow,
  forEach,
  get,
  includes,
  intersection,
  isEqual,
  kebabCase,
  keyBy,
  keys,
  map,
  mergeWith,
  pick,
  pickBy,
  reject,
  set,
  size,
  union,
  uniq,
  uniqBy,
  uniqueId,
  values,
  zipObject,
} from "lodash/fp";
import QueryString from "query-string";
import React from "react";
import { getProjects, validateSampleFiles, validateSampleNames } from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { TaxonOption } from "~/components/common/filters/types";
import ProjectCreationModal from "~/components/common/ProjectCreationModal";
import ProjectSelect from "~/components/common/ProjectSelect";
import { UserContext } from "~/components/common/UserContext";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import {
  AMR_V1_FEATURE,
  AMR_V2_FEATURE,
  ONT_V1_FEATURE,
  PRE_UPLOAD_CHECK_FEATURE,
} from "~/components/utils/features";
import { SampleUploadType } from "~/interface/shared";
import IssueGroup from "~ui/notifications/IssueGroup";
import BasespaceSampleImport from "../../BasespaceSampleImport";
import {
  ALLOWED_UPLOAD_WORKFLOWS_BY_TECHNOLOGY,
  BASESPACE_UPLOAD,
  DEFAULT_MEDAKA_MODEL_OPTION,
  DEFAULT_NANOPORE_WETLAB_OPTION,
  LOCAL_UPLOAD,
  NO_TECHNOLOGY_SELECTED,
  REMOTE_UPLOAD,
  SELECT_ID_KEY,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  UploadWorkflows,
  UPLOAD_WORKFLOWS,
} from "../../constants";
import LocalSampleFileUpload from "../../LocalSampleFileUpload";
import RemoteSampleFileUpload from "../../RemoteSampleFileUpload";
import cs from "../../sample_upload_flow.scss";
import SampleUploadTable, {
  SampleForUploadTable,
} from "../../SampleUploadTable";
import {
  groupSamplesByLane,
  openBasespaceOAuthPopup,
  removeLaneFromName,
} from "../../utils";
import { WorkflowSelector } from "../WorkflowSelector";
import { PreUploadQCCheck } from "./components/PreUploadQCCheck";
import {
  MISMATCH_FORMAT_ERROR,
  NCBI_GENBANK_REF_SEQ_HEADER_REGEX,
  UNSUPPORTED_UPLOAD_OPTION_TOOLTIP,
} from "./constants";
import {
  SamplesKeyType,
  SamplesRecord,
  SelectedSampleIdsKeyType,
  SelectedSampleIdsRecord,
  UploadSampleStepProps,
  UploadSampleStepState,
} from "./types";
import { getReadNames } from "./utils";

const LOCAL_UPLOAD_LABEL = "Upload from Your Computer";
const REMOTE_UPLOAD_LABEL = "Upload from S3";
const BASESPACE_UPLOAD_LABEL = "Upload from Basespace";

const UPLOADSAMPLESTEP_SAMPLE_CHANGED = "UploadSampleStep_sample_changed";

class UploadSampleStep extends React.Component<
  UploadSampleStepProps,
  UploadSampleStepState
> {
  _window: $TSFixMeUnknown;
  state = {
    accessionId: null,
    accessionName: null,
    basespaceAccessToken: null,
    basespaceSamples: [],
    basespaceSelectedSampleIds: new Set() as Set<string>,
    bedFile: null,
    CLI: null,
    refSeqFile: null,
    createProjectOpen: false,
    currentTab: LOCAL_UPLOAD as SampleUploadType,
    // enable all workflows on first load
    enabledWorkflows: map(w => w.value, UPLOAD_WORKFLOWS),
    localSamples: [],
    // We generate a unique "selectId" for each sample, which we use to store which samples are selected.
    // This simplifies the logic, because sample names can change (they can get renamed when de-duped)
    localSelectedSampleIds: new Set() as Set<string>,
    projects: [],
    remoteSamples: [],
    remoteSelectedSampleIds: new Set() as Set<string>,
    removedLocalFiles: [], // Invalid local files that were removed.
    // TODO (mlila): move the following technology-specific state/callbacks as sub-state within selectedWorkflows
    selectedGuppyBasecallerSetting: null,
    selectedTaxon: null,
    // we can only select one technology at a time. If the user attempts to select a second technology
    // the first will automatically be deselected for them and we will use the tech most recently chosen
    selectedTechnology: null,
    selectedProject: null,
    selectedMedakaModel: DEFAULT_MEDAKA_MODEL_OPTION,
    selectedWetlabProtocol: null,
    selectedWorkflows: new Set() as Set<UploadWorkflows>,
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
    const urlParams = QueryString.parse(location.search, {
      arrayFormat: "bracket",
    });

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | string[] | null' is not... Remove this comment to see the full error message
    const projectId = parseInt(urlParams.projectId);
    if (projectId && !this.state.selectedProject) {
      const selectedProject = find(["id", projectId], projects);

      if (selectedProject) {
        this.handleProjectChange(selectedProject);
      }
    }

    // Clear all URL params.
    window.history.replaceState({}, document.title, location.pathname);

    // Initialize CLI, which is used to call bioinformatics tools for PreUploadQC checks (biowasm, etc...)
    // and Reference Sequence file-parsing
    const pathToAssets = `${location.origin}/assets`;
    const CLI = await new Aioli([
      {
        tool: "htslib",
        program: "htsfile",
        version: "1.10",
        urlPrefix: pathToAssets,
      },
      { tool: "seqtk", version: "1.3", urlPrefix: pathToAssets },
    ]);
    this.setState({ CLI });
  }

  componentWillUnmount() {
    window.removeEventListener(
      "message",
      this.handleBasespaceOAuthMessageEvent,
    );
  }

  // *** Basespace-related functions ***

  // Handle the message from the Basespace OAuth popup that authorizes CZ ID to read (i.e. download files) from user projects.
  handleBasespaceOAuthMessageEvent = async (event: {
    source: unknown;
    origin: string;
    data: { basespaceAccessToken: any };
  }) => {
    const {
      selectedProject,
      selectedMedakaModel,
      selectedTechnology,
      selectedWetlabProtocol,
      selectedWorkflows,
      usedClearLabs,
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

      // @ts-expect-error ts-migrate(2740) FIXME: Type '{}' is missing the following properties from... Remove this comment to see the full error message
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

  handleBasespaceAccessTokenChange = (basespaceAccessToken: $TSFixMe) => {
    this.setState({
      basespaceAccessToken,
    });
  };

  // *** Tab-related functions ***

  getUploadTabs = () => {
    const { admin, biohubS3UploadEnabled } = this.props;
    return compact([
      {
        value: LOCAL_UPLOAD as SampleUploadType,
        label: LOCAL_UPLOAD_LABEL,
      },
      (admin || biohubS3UploadEnabled) && {
        value: REMOTE_UPLOAD as SampleUploadType,
        label: REMOTE_UPLOAD_LABEL,
      },
      {
        value: BASESPACE_UPLOAD as SampleUploadType,
        label: BASESPACE_UPLOAD_LABEL,
      },
    ]);
  };

  handleTabChange = (tabIndex: number) => {
    this.props.onDirty();
    const tab = this.getUploadTabs()[tabIndex].value;
    this.setState({ currentTab: tab });
    trackEvent("UploadSampleStep_tab_changed", {
      tab,
    });
  };

  // Modify the project_id in our samples, and validate the sample names again.
  updateSamplesForNewProject = async ({ samples, project }: $TSFixMe) => {
    const { samples: validatedSamples } = await this.validateSampleNames({
      samples,
      project,
    });

    return {
      samples: map(set("project_id", get("id", project)), validatedSamples),
    };
  };

  handleProjectCreate = async (project: $TSFixMe) => {
    const { getPipelineVersionsForExistingProject, onDirty } = this.props;
    onDirty();
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
      getPipelineVersionsForExistingProject(project.id),
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

  handleProjectChange = async (project: $TSFixMe) => {
    const { getPipelineVersionsForExistingProject, onDirty } = this.props;
    onDirty();
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
      getPipelineVersionsForExistingProject(project.id),
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
  handleWorkflowToggle = (
    workflow: UploadWorkflows,
    technology?: SEQUENCING_TECHNOLOGY_OPTIONS,
  ) => {
    this.props.onDirty();
    const { allowedFeatures } = this.context || {};
    const { selectedWorkflows } = this.state;

    if (allowedFeatures.includes(AMR_V1_FEATURE || AMR_V2_FEATURE)) {
      // deselecting a workflow
      if (this.isWorkflowSelected(workflow)) {
        const newSelectedWorkflows = new Set(selectedWorkflows);
        newSelectedWorkflows.delete(workflow);

        this.setState(
          {
            selectedWorkflows: newSelectedWorkflows,
          },
          () => {
            this.updateAllowedWorkflows();
          },
        );
        // selecting a workflow
      } else {
        this.updateAllowedWorkflows(workflow, technology);
      }

      this.setState({
        selectedWetlabProtocol: null,
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

  getPermittedSelectedWorkflows = ({
    selectedWorkflows,
    workflowsForNewSelection,
    technology,
  }): UploadWorkflows[] => {
    let permittedWorkflows = [...workflowsForNewSelection];

    // Disallow any previously selected workflows that are incompatible with the new option
    // (for example, if the technologies conflict)
    selectedWorkflows = filter(
      w => permittedWorkflows.includes(w),
      Array.from(selectedWorkflows),
    );

    // Then iterate over all the selected workflows. The only workflows that should be allowed are
    // the ones that are allowed for _all_ of the workflows which are already selected.
    // (ie: an intersection of the "allowed" lists for selected workflows)
    forEach((workflow: UploadWorkflows) => {
      // Figure out what is permitted for this specific workflow
      const allowedConcurrentWorkflows =
        ALLOWED_UPLOAD_WORKFLOWS_BY_TECHNOLOGY[workflow][technology];

      // Then delete any of the ones that aren't allowed
      permittedWorkflows = permittedWorkflows.filter(w =>
        allowedConcurrentWorkflows.includes(w),
      );
    }, Array.from(selectedWorkflows));

    return permittedWorkflows;
  };

  // TODO (mlila): when we refactor this component, we should calculate permitted workflows in
  // TODO          a useEffect dependent on selectedWorkflows
  updateAllowedWorkflows = (
    newSelectedWorkflow?: UploadWorkflows,
    newSelectedTechnology?: SEQUENCING_TECHNOLOGY_OPTIONS,
  ) => {
    const { selectedWorkflows, selectedTechnology } = this.state;

    let newTechnology;
    let workflowsForNewSelection = [];
    let permittedWorkflows = [];
    let newSelectedWorkflows: Set<UploadWorkflows>;

    if (newSelectedWorkflow) {
      // new selection happened
      // We start with the workflows that are allowed for the workflow/technology combo that was *just* selected.
      // This facilitates the behavior that deselects incompatible, previously-chosen options.
      newTechnology =
        newSelectedTechnology ?? selectedTechnology ?? NO_TECHNOLOGY_SELECTED;

      workflowsForNewSelection =
        ALLOWED_UPLOAD_WORKFLOWS_BY_TECHNOLOGY[newSelectedWorkflow][
          newTechnology
        ];

      // Uncheck any previously selected workflows that are incompatible with the new option
      // (for example, if the technologies conflict)
      newSelectedWorkflows = new Set(
        filter(
          w => workflowsForNewSelection.includes(w),
          Array.from(selectedWorkflows),
        ),
      );

      permittedWorkflows = this.getPermittedSelectedWorkflows({
        workflowsForNewSelection,
        selectedWorkflows: newSelectedWorkflows,
        technology: newTechnology,
      });

      // ensure the new option added as checked
      newSelectedWorkflows.add(newSelectedWorkflow);
    } else {
      // deselection happens
      // if this action is a deselection, then start off with all workflows allowed before
      // narrowing the list, since no technology needs priority order -- you can't become
      // more restrictive when you choose fewer workflows
      workflowsForNewSelection = map(w => w.value, UPLOAD_WORKFLOWS);
      newTechnology =
        selectedWorkflows.size > 0
          ? selectedTechnology
          : NO_TECHNOLOGY_SELECTED;
      newSelectedWorkflows = selectedWorkflows;
      permittedWorkflows = this.getPermittedSelectedWorkflows({
        workflowsForNewSelection,
        selectedWorkflows,
        technology: newTechnology,
      });
    }

    // let the workflow selector know which workflows are now chosen and can be chosen
    // given the new/current selection
    this.setState({
      enabledWorkflows: permittedWorkflows,
      selectedWorkflows: newSelectedWorkflows,
      selectedTechnology: newTechnology,
    });
  };

  handleTechnologyToggle = (
    workflow: UploadWorkflows,
    technology: SEQUENCING_TECHNOLOGY_OPTIONS,
  ) => {
    this.props.onDirty();
    const { usedClearLabs } = this.state;

    if (
      this.isWorkflowSelected(UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value)
    ) {
      // If user has selected Nanopore as their technology
      // and has previously toggled "Used Clear Labs" on,
      // then make sure to use the default wetlab + medaka model options.
      if (
        technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE &&
        usedClearLabs
      ) {
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
    } else if (this.isWorkflowSelected(UPLOAD_WORKFLOWS.MNGS.value)) {
      trackEvent(
        ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_MNGS_TECHNOLOGY_CLICKED,
        { technology },
      );
    }

    this.updateAllowedWorkflows(workflow, technology);
  };

  handleBedFileChanged = (newFile?: File) => {
    this.props.onDirty();
    this.setState({ bedFile: newFile });
  };

  parseRefSeqHeader = async (refSeqFile: File) => {
    const { CLI } = this.state;
    const nullAccessionData = [null, null];

    // Verify the file contains a RefSeq header
    const refSeqNameArr = await getReadNames(CLI, refSeqFile);
    if (!refSeqNameArr || refSeqNameArr.length !== 1) return nullAccessionData;
    const refSeqName = refSeqNameArr[0];

    // Verify the RefSeq header matchs NCBI GenBank's format
    const matchArr = refSeqName.match(NCBI_GENBANK_REF_SEQ_HEADER_REGEX);
    if (!matchArr) return nullAccessionData;

    // Return accession data
    const accessionId = matchArr[1];
    const accessionName = matchArr[2];
    return [accessionId, accessionName];
  };

  handleRefSeqFileChanged = async (newFile?: File) => {
    this.props.onDirty();

    if (newFile) {
      const [accessionId, accessionName] = await this.parseRefSeqHeader(
        newFile,
      );
      this.setState({ accessionId, accessionName, refSeqFile: newFile });
    } else {
      this.setState({
        accessionId: null,
        accessionName: null,
        refSeqFile: null,
      });
    }
  };

  handleTaxonChange = (newTaxon: TaxonOption) => {
    // prevent infinite loop
    if (isEqual(newTaxon, this.state.selectedTaxon)) return;

    this.props.onDirty();
    this.setState({ selectedTaxon: newTaxon });
  };

  handleWetlabProtocolChange = (selected: string) => {
    this.props.onDirty();
    this.setState({ selectedWetlabProtocol: selected });
    trackEvent(`UploadSampleStep_${selected}-protocol_selected`);
  };

  handleGuppyBasecallerSettingChange = (selected: string) => {
    this.props.onDirty();
    this.setState({ selectedGuppyBasecallerSetting: selected });
  };

  handleMedakaModelChange = (selected: string) => {
    this.props.onDirty();
    this.setState({ selectedMedakaModel: selected });
    trackEvent(
      ANALYTICS_EVENT_NAMES.UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_MEDAKA_MODEL_SELECTED,
      { selected },
    );
  };

  handleClearLabsChange = (usedClearLabs: boolean) => {
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
  getSelectedSampleIdsKey = (
    sampleType: SampleUploadType,
  ): SelectedSampleIdsKeyType => `${sampleType}SelectedSampleIds`;
  getSamplesKey = (sampleType: SampleUploadType): SamplesKeyType =>
    `${sampleType}Samples`;

  getSelectedSampleIds = (sampleType: SampleUploadType): Set<string> => {
    return this.state[this.getSelectedSampleIdsKey(sampleType)] as Set<string>;
  };

  getSelectedSamples = (sampleType: SampleUploadType) => {
    const selectedSampleIds = this.getSelectedSampleIds(sampleType);
    const samplesKey = this.getSamplesKey(sampleType);
    return filter(
      sample => selectedSampleIds.has(sample[SELECT_ID_KEY]),
      this.state[samplesKey],
    );
  };

  // Get fields for display in the SampleUploadTable.
  getSampleDataForUploadTable = (
    sampleType: SampleUploadType,
  ): SampleForUploadTable[] | Record<string, unknown> => {
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

        for (const group in groups) {
          // Map errors/validation checks to each fileName
          // to inform if/how to display file errors in the SampleUploadtable.
          const pairedFiles = groups[group].files;

          const finishedValidating = {};
          const isValid = {};
          const error = {};

          pairedFiles.forEach((pair: $TSFixMe) => {
            const files = pair.files;
            for (const fileName in files) {
              finishedValidating[fileName] = pair.finishedValidating;
              const correctSequenceTechnologySelected =
                this.validateCorrectFormat(pair);
              isValid[fileName] =
                pair.isValid && correctSequenceTechnologySelected;
              const errorMsg = !correctSequenceTechnologySelected
                ? MISMATCH_FORMAT_ERROR
                : pair.error;
              error[fileName] = errorMsg || "";
            }
          });

          sampleInfo.push({
            file_names_R1: groups[group].filesR1.map(
              (file: $TSFixMe) => file.name,
            ),
            file_names_R2: groups[group].filesR2.map(
              (file: $TSFixMe) => file.name,
            ),
            name: removeLaneFromName(pairedFiles[0].name),
            // If we concatenate samples 1 through 4, the selectId = "1,2,3,4"
            [SELECT_ID_KEY]: pairedFiles
              .map((file: $TSFixMe) => file[SELECT_ID_KEY])
              .join(","),
            finishedValidating,
            isValid,
            error,
          });
        }
        return sampleInfo;
      }

      return samples.map((sample: $TSFixMe) => {
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
  addSelectIdToSamples = (samples: $TSFixMe) =>
    // @ts-expect-error uniqueId(): Expected 1 arguments, but got 0
    map(sample => set(SELECT_ID_KEY, uniqueId(), sample), samples);

  // Merge newly added samples with the list of samples already added.
  mergeSamples = (samples: $TSFixMe, newSamples: $TSFixMe) => {
    const samplesByName = keyBy("name", samples);
    const newSamplesByName = keyBy("name", newSamples);

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
  validateSampleNames = async ({ samples, project }: $TSFixMe) => {
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
      samples: samples.map((sample: $TSFixMe) => ({
        ...sample,
        name: validatedNameMap[sample.name],
      })),
    };
  };

  // Perform sample validation and return the validated samples.
  validateAddedSamples = async (samples: $TSFixMe, sampleType: $TSFixMe) => {
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

    // eslint-disable-next-line prefer-const
    let [{ samples: validatedSamples }, areFilesValid] = await Promise.all([
      // Call validateSampleNames to update sample names.
      this.validateSampleNames({ samples }),
      validateSampleFiles(sampleFileNames),
    ]);

    const fileNamesValidMap = zipObject(sampleFileNames, areFilesValid);

    // For each sample, filter out files that aren't valid.
    validatedSamples = validatedSamples.map((sample: $TSFixMe) =>
      set(
        "files",
        pickBy((_file, fileName) => fileNamesValidMap[fileName], sample.files),
        sample,
      ),
    );
    validatedSamples = validatedSamples.map((sample: $TSFixMe) =>
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
  handleSampleSelect = (
    value: string,
    checked: boolean,
    sampleType: SampleUploadType,
  ) => {
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
      const sample = samples.find(
        (sample: $TSFixMe) => sample[SELECT_ID_KEY] === value,
      );
      if (
        !sample ||
        sample.isValid === false ||
        !this.validateCorrectFormat(sample)
      ) {
        return;
      }
    }

    const selectedSampleIdsKey = this.getSelectedSampleIdsKey(sampleType);
    const selectedSamples: Set<$TSFixMe> = this.state[selectedSampleIdsKey];
    if (checked) {
      selectedSamples.add(value);
    } else {
      selectedSamples.delete(value);
    }

    this.setState({
      [selectedSampleIdsKey]: selectedSamples,
    } as SelectedSampleIdsRecord);
  };

  // Callback for PreUploadQCCheck to remove invalid samples from selectedSamples.
  handleInvalidSample = (
    value: $TSFixMe,
    checked: $TSFixMe,
    sampleType: SampleUploadType,
  ) => {
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
    } as SelectedSampleIdsRecord);
  };

  handleAllSamplesSelect = (checked: $TSFixMe, sampleType: $TSFixMe) => {
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
        (sample: $TSFixMe) =>
          sample.isValid && this.validateCorrectFormat(sample),
      );
    }

    this.setState({
      [selectedSampleIdsKey]: checked
        ? new Set(map(SELECT_ID_KEY, samples))
        : new Set(),
    } as SelectedSampleIdsRecord);
  };

  // Handle newly added samples
  handleSamplesAdd = async (newSamples: $TSFixMe, sampleType: $TSFixMe) => {
    this.props.onDirty();
    const samplesKey = this.getSamplesKey(sampleType);
    const selectedSampleIdsKey = this.getSelectedSampleIdsKey(sampleType);

    // If local samples, we also want to keep track of invalid files that were removed
    // so we can show a warning.
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'removedLocalFiles' does not exist on typ... Remove this comment to see the full error message
    this.setState({
      validatingSamples: true,
      ...(sampleType === LOCAL_UPLOAD ? { removedLocalFiles: [] } : {}),
    });

    const newSamplesWithSelectIds = this.addSelectIdToSamples(newSamples);

    const {
      samples: validatedNewSamples,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'removedLocalFiles' does not exist on typ... Remove this comment to see the full error message
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

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'removedLocalFiles' does not exist on typ... Remove this comment to see the full error message
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

  handleSamplesRemove = (sampleSelectIds: $TSFixMe, sampleType: $TSFixMe) => {
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
    } as SamplesRecord & SelectedSampleIdsRecord;

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
      accessionId,
      accessionName,
      bedFile,
      currentTab,
      refSeqFile,
      selectedTechnology,
      selectedMedakaModel,
      selectedGuppyBasecallerSetting,
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
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'concatenated' does not exist on type 'ne... Remove this comment to see the full error message
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
        project: selectedProject,
        technology: selectedTechnology,
        uploadType: currentTab,
        workflows: selectedWorkflows,
        // mNGS Nanopore only inputs
        guppyBasecallerSetting: selectedGuppyBasecallerSetting,
        // WGS only inputs
        accessionId,
        accessionName,
        bedFile,
        refSeqFile,
        // Covid CG only inputs
        wetlabProtocol: selectedWetlabProtocol,
        // CG Nanopore only inputs
        clearlabs: usedClearLabs,
        medakaModel: selectedMedakaModel,
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
  handleValidatedFilesChange = (localSamples: $TSFixMe) => {
    this.setState({
      localSamples,
    });
  };

  handleContinueButtonTooltip = () => {
    const {
      currentTab,
      localSamples,
      refSeqFile,
      selectedGuppyBasecallerSetting,
      selectedProject,
      selectedTaxon,
      selectedTechnology,
      selectedWetlabProtocol,
      selectedWorkflows,
    } = this.state;
    const { allowedFeatures } = this.context || {};

    // Note: we currently only run validation checks on locally uploaded samples
    if (
      currentTab === LOCAL_UPLOAD &&
      allowedFeatures.includes(PRE_UPLOAD_CHECK_FEATURE) &&
      !localSamples.every(element => element.finishedValidating)
    ) {
      return "Please wait for file validation to complete";
    }

    if (!selectedProject) return "Please select a project to continue";

    if (!selectedWorkflows || !selectedTechnology) {
      return "Please select an analysis type to continue";
    }

    if (
      this.isWorkflowSelected(UPLOAD_WORKFLOWS.MNGS.value) &&
      allowedFeatures.includes(ONT_V1_FEATURE) &&
      selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE &&
      !selectedGuppyBasecallerSetting
    ) {
      return "Please select a basecaller to continue";
    }

    if (
      this.isWorkflowSelected(UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value) &&
      !selectedWetlabProtocol
    ) {
      return "Please select a wetlab protocol to continue";
    }

    if (
      this.isWorkflowSelected(UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value) &&
      !selectedTaxon
    ) {
      return "Please select a taxon to continue";
    }

    if (
      this.isWorkflowSelected(UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value) &&
      !refSeqFile
    ) {
      return "Please upload a reference sequence to continue";
    }

    if (size(this.getSelectedSamples(currentTab)) < 1) {
      return "Please select a sample to continue";
    }
  };

  isWorkflowSelected = (workflow: UploadWorkflows) => {
    const { selectedWorkflows } = this.state;
    return selectedWorkflows.has(workflow);
  };

  // Whether the current user input is valid. Determines whether the Continue button is enabled.
  isValid = () => {
    const {
      currentTab,
      selectedGuppyBasecallerSetting,
      selectedTechnology,
      selectedProject,
      selectedWetlabProtocol,
      validatingSamples,
      localSamples,
    } = this.state;
    const { allowedFeatures } = this.context || {};

    let workflowsValid: boolean;
    if (this.isWorkflowSelected(UPLOAD_WORKFLOWS.MNGS.value)) {
      // If ont_v1 is enabled, the user must select either Illumina or Nanopore before proceeding.
      // If they select Nanopore, they must additionally select their Guppy Basecaller Setting.
      if (allowedFeatures.includes(ONT_V1_FEATURE)) {
        switch (selectedTechnology) {
          case SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA:
            workflowsValid = true;
            break;
          case SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE:
            workflowsValid = !!selectedGuppyBasecallerSetting;
            break;
          default:
            workflowsValid = false;
            break;
        }
      } else {
        // If ont_v1 is not enabled, then metagenomics will automatically use Illumina as the sequencing platform,
        // so no additional selections are required.
        workflowsValid = true;
      }
    } else if (
      this.isWorkflowSelected(UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value)
    ) {
      switch (selectedTechnology) {
        case SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA:
        case SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE:
          workflowsValid = !!selectedWetlabProtocol;
          break;
        default:
          workflowsValid = false;
          break;
      }
    } else if (this.isWorkflowSelected(UPLOAD_WORKFLOWS.AMR.value)) {
      workflowsValid = true;
    } else if (
      this.isWorkflowSelected(UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value)
    ) {
      // TODO: Disable Pre-Upload Checks while Taxon seletion logic is WIP
      // workflowsValid = !!refSeqFile && !!selectedTaxon;
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
    const { selectedTechnology } = this.state;
    const { allowedFeatures } = this.context || {};

    if (allowedFeatures.includes(ONT_V1_FEATURE)) {
      if (
        selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA ||
        this.isWorkflowSelected(UPLOAD_WORKFLOWS.AMR.value)
      )
        return SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA;
      else if (selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE)
        return SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;
    } else {
      // TODO: We currently assume all metagenomics samples are Illumina by default.
      // Remove this block of logic after the metagenomics ONT pipeline has been
      // released to all users.
      if (
        this.isWorkflowSelected(UPLOAD_WORKFLOWS.MNGS.value) ||
        this.isWorkflowSelected(UPLOAD_WORKFLOWS.AMR.value) ||
        this.isWorkflowSelected(
          UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
        ) ||
        (this.isWorkflowSelected(
          UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value,
        ) &&
          selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA)
      )
        return SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA;
      else if (
        this.isWorkflowSelected(
          UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value,
        ) &&
        selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE
      )
        return SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;
    }
  };

  validateCorrectFormat = (file: $TSFixMe) => {
    const sequenceTechnology = this.getSequenceTechnology();
    return file.format && sequenceTechnology
      ? file.format === sequenceTechnology
      : true;
  };

  // *** Render functions ***

  renderUploadTabs = () => {
    const { admin, biohubS3UploadEnabled } = this.props;
    const { selectedTechnology } = this.state;
    const shouldDisableS3Tab =
      this.isWorkflowSelected(UPLOAD_WORKFLOWS.MNGS.value) &&
      selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;
    const shouldDisableBasespaceTab =
      (this.isWorkflowSelected(UPLOAD_WORKFLOWS.MNGS.value) ||
        this.isWorkflowSelected(
          UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value,
        )) &&
      selectedTechnology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;

    // We're currently disabling S3 tab for ONT v1, but it could be re-enabled in the future.
    // Basespace upload is disabled for Nanopore pipelines because it only stores Illumina files.
    const s3Tab = this.renderUploadTab(shouldDisableS3Tab, REMOTE_UPLOAD_LABEL);
    const basespaceTab = this.renderUploadTab(
      shouldDisableBasespaceTab,
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
        <Tab
          label={LOCAL_UPLOAD_LABEL}
          data-testid={kebabCase(LOCAL_UPLOAD_LABEL)}
        ></Tab>
        {(admin || biohubS3UploadEnabled) && s3Tab}
        {basespaceTab}
      </Tabs>
    );
  };

  renderUploadTab = (disabled: $TSFixMe, label: $TSFixMe) => {
    let tab = (
      <Tab
        disabled={disabled}
        label={label}
        data-testid={kebabCase(label)}
      ></Tab>
    );
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
            onChange={(samples: $TSFixMe) =>
              this.handleSamplesAdd(samples, LOCAL_UPLOAD)
            }
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
            onChange={(samples: $TSFixMe) =>
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
    const { admin, biohubS3UploadEnabled, pipelineVersions } = this.props;
    const { allowedFeatures } = this.context || {};
    const {
      bedFile,
      refSeqFile,
      CLI,
      currentTab,
      enabledWorkflows,
      selectedMedakaModel,
      selectedGuppyBasecallerSetting,
      selectedProject,
      selectedTaxon,
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
            <div className={cs.header} role="heading" aria-level={2}>
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
              data-testid="select-project"
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
              <button
                className={cx(cs.createProjectButton, "noStyleButton")}
                onClick={withAnalytics(
                  this.openCreateProject,
                  "UploadSampleStep_create-project_opened",
                )}
                data-testid="create-project"
              >
                + Create Project
              </button>
            )}
          </div>
          <WorkflowSelector
            enabledWorkflows={enabledWorkflows}
            onBedFileChanged={this.handleBedFileChanged}
            onClearLabsChange={this.handleClearLabsChange}
            onMedakaModelChange={this.handleMedakaModelChange}
            onRefSeqFileChanged={this.handleRefSeqFileChanged}
            onGuppyBasecallerSettingChange={
              this.handleGuppyBasecallerSettingChange
            }
            onWetlabProtocolChange={this.handleWetlabProtocolChange}
            onTaxonChange={this.handleTaxonChange}
            onTechnologyToggle={this.handleTechnologyToggle}
            onWorkflowToggle={this.handleWorkflowToggle}
            currentTab={currentTab}
            projectPipelineVersions={pipelineVersions[selectedProject?.id]}
            bedFileName={bedFile?.name}
            refSeqFileName={refSeqFile?.name}
            selectedMedakaModel={selectedMedakaModel}
            selectedGuppyBasecallerSetting={selectedGuppyBasecallerSetting}
            selectedTaxon={selectedTaxon}
            selectedTechnology={selectedTechnology}
            selectedWorkflows={selectedWorkflows}
            selectedWetlabProtocol={selectedWetlabProtocol}
            s3UploadEnabled={admin || biohubS3UploadEnabled}
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
            // @ts-expect-error basespace samples are in a different format, causing a type error
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
                CLI={CLI}
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

UploadSampleStep.contextType = UserContext;

export default UploadSampleStep;
