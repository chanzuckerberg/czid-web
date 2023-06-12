import deepEqual from "fast-deep-equal";
import {
  filter,
  find,
  get,
  head,
  isEmpty,
  isNil,
  isNull,
  isUndefined,
  keys,
  map,
  mapValues,
  merge,
  omit,
  pick,
  uniq,
} from "lodash/fp";
import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import {
  getBackgrounds,
  getCoverageVizSummary,
  getSample,
  getSampleReportData,
  getSamples,
  getWorkflowRunResults,
  kickoffConsensusGenome,
} from "~/api";
import { getAmrDeprecatedData } from "~/api/amr";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import {
  createPersistedBackground,
  getPersistedBackground,
  updatePersistedBackground,
} from "~/api/persisted_backgrounds";
import CoverageVizBottomSidebar from "~/components/common/CoverageVizBottomSidebar";
import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import { getCoverageVizParams } from "~/components/common/CoverageVizBottomSidebar/utils";
import { UserContext } from "~/components/common/UserContext";
import NarrowContainer from "~/components/layout/NarrowContainer";
import {
  computeMngsReportTableValuesForCSV,
  createCSVObjectURL,
} from "~/components/utils/csv";
import {
  BLAST_V1_FEATURE,
  MERGED_NT_NR_FEATURE,
  MULTITAG_PATHOGENS_FEATURE,
} from "~/components/utils/features";
import { logError } from "~/components/utils/logUtil";
import {
  COVERAGE_VIZ_FEATURE,
  isPipelineFeatureAvailable,
  MASS_NORMALIZED_FEATURE,
} from "~/components/utils/pipeline_versions";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import {
  findInWorkflows,
  isMngsWorkflow,
  labelToVal,
  WORKFLOWS,
} from "~/components/utils/workflows";
import { SEQUENCING_TECHNOLOGY_OPTIONS } from "~/components/views/SampleUploadFlow/constants";
import {
  getAllGeneraPathogenCounts,
  getGeneraPathogenCounts,
} from "~/helpers/taxon";
import { copyShortUrlToClipboard } from "~/helpers/url";
import Sample, { WorkflowRun } from "~/interface/sample";
import {
  AmrDeprectatedData,
  BlastData,
  ConsensusGenomeClick,
  ConsensusGenomeParams,
  CurrentTabSample,
  FilterSelections,
  RawReportData,
  SampleReportViewMode,
  SampleViewProps,
  SampleViewState,
} from "~/interface/sampleView";
import { Background, Taxon } from "~/interface/shared";
import { updateProjectIds } from "~/redux/modules/discovery/slice";
import { WORKFLOW_VALUES } from "../../utils/workflows";
import { BlastModalInfo } from "../blast/constants";
import { ReportPanel } from "./components/ReportPanel";
import { TabSwitcher } from "./components/TabSwitcher";
import {
  GENUS_LEVEL_INDEX,
  KEY_SAMPLE_VIEW_OPTIONS,
  KEY_SELECTED_OPTIONS_BACKGROUND,
  LOCAL_STORAGE_FIELDS,
  NOTIFICATION_TYPES,
  PIPELINE_RUN_TABS,
  SPECIES_LEVEL_INDEX,
  SUCCEEDED_STATE,
  TABS,
  TAX_LEVEL_GENUS,
  TAX_LEVEL_SPECIES,
  TREE_METRICS,
  URL_FIELDS,
} from "./constants";
import DetailsSidebarSwitcher from "./DetailSidebarSwitcher";
import {
  adjustMetricPrecision,
  filterReportData,
  setDisplayName,
} from "./filters";
import { showNotification } from "./notifications";
import cs from "./sample_view.scss";
import { SampleViewHeader } from "./SampleViewHeader";
import SampleViewModals from "./SampleViewModals";
import {
  determineInitialTab,
  getDefaultSelectedOptions,
  getWorkflowCount,
  hasAppliedFilters,
  hasMngsRuns,
} from "./setup";
import {
  addSampleDeleteFlagToSessionStorage,
  getConsensusGenomeData,
} from "./utils";

// @ts-expect-error working with Lodash types
const mapValuesWithKey = mapValues.convert({ cap: false });

class SampleView extends React.Component<SampleViewProps, SampleViewState> {
  urlParser: UrlQueryParser;
  constructor(props: SampleViewProps) {
    super(props);

    this.urlParser = new UrlQueryParser(URL_FIELDS);

    // remove nested options to be merge separately
    const {
      selectedOptions: selectedOptionsFromUrl,
      tempSelectedOptions,
      workflowRunId: workflowRunIdFromUrl,
      ...nonNestedUrlState
    } = this.urlParser.parse(location.search);

    const {
      selectedOptions: selectedOptionsFromLocal,
      ...nonNestedLocalState
    } = this.loadState(localStorage, KEY_SAMPLE_VIEW_OPTIONS);

    const { annotations, taxa, thresholdsShortReads } =
      tempSelectedOptions || {};
    const { currentTab } = nonNestedUrlState;
    const persistedDiscoveryFiltersPresent = [
      annotations,
      taxa,
      thresholdsShortReads,
    ].some(filter => !isEmpty(filter));

    if (
      persistedDiscoveryFiltersPresent &&
      currentTab !== TABS.LONG_READ_MNGS
    ) {
      showNotification(NOTIFICATION_TYPES.discoveryViewFiltersPersisted, {
        revertToSampleViewFilters: this.revertToSampleViewFilters,
      });
    }

    if (
      !get("background", selectedOptionsFromLocal) &&
      get("metricShortReads", selectedOptionsFromLocal) === "aggregatescore"
    ) {
      // If the user does not have a background and has metric 'aggregatescore', overwrite the selected option
      // 'metric' from 'aggregatescore' to 'NT r (total reads)' because the aggregatescore
      // is computed once the user selects a background.
      selectedOptionsFromLocal["metricShortReads"] = find(
        { value: "nt_r" },
        TREE_METRICS[TABS.SHORT_READ_MNGS],
      ).value;
    }

    this.state = {
      amrDeprecatedData: null,
      backgrounds: [],
      blastData: {},
      blastModalInfo: {},
      blastSelectionModalVisible: false,
      blastContigsModalVisible: false,
      blastReadsModalVisible: false,
      blastV1ContigsModalVisible: false,
      blastV1ReadsModalVisible: false,
      consensusGenomeData: {},
      consensusGenomeCreationParams: {},
      consensusGenomePreviousParams: {},
      consensusGenomeCreationModalVisible: false,
      consensusGenomeErrorModalVisible: false,
      consensusGenomePreviousModalVisible: false,
      coverageVizDataByTaxon: {},
      coverageVizParams: {},
      coverageVizVisible: false,
      currentTab: currentTab,
      hasPersistedBackground: false,
      filteredReportData: [],
      loadingReport: false,
      loadingWorkflowRunResults: false,
      ownedBackgrounds: null,
      otherBackgrounds: null,
      pipelineRun: null,
      pipelineVersion: null,
      project: null,
      projectSamples: [],
      reportData: [],
      reportMetadata: {},
      sample: null,
      selectedOptions: {
        ...getDefaultSelectedOptions(),
        // for long read mNGS samples, do not allow taxon filters in tempSelectedOptions to persist from DiscoveryView
        ...(!isEmpty(tempSelectedOptions) && currentTab !== TABS.LONG_READ_MNGS
          ? tempSelectedOptions
          : {
              ...selectedOptionsFromLocal,
              ...selectedOptionsFromUrl,
            }),
      },
      sidebarMode: null,
      sidebarVisible: false,
      sidebarTaxonData: null,
      view: "table" as const,
      workflowRun: null,
      workflowRunId: workflowRunIdFromUrl || null,
      workflowRunResults: null,
      sharedWithNoBackground: !!(
        (
          (selectedOptionsFromUrl &&
            isNull(selectedOptionsFromUrl.background)) ||
          !isEmpty(tempSelectedOptions)
        ) // Don't fetch saved background if have temp options (e.g. if coming from heatmap)
      ),
      ...nonNestedLocalState,
      ...nonNestedUrlState,
    };
  }

  componentWillUnmount = () => {
    toast.dismiss();
  };

  componentDidMount = () => {
    // When we navigate to the SampleView via React Router, let Appcues know we are on this page.
    if (window.analytics) {
      window.analytics.page();
    }
    // fetchBackgrounds will subsequently call fetchSample and fetchSampleReportData.
    this.fetchBackgrounds();
  };

  componentDidUpdate(_: unknown, prevState: SampleViewState) {
    const {
      amrDeprecatedData,
      currentTab,
      loadingWorkflowRunResults,
      workflowRun,
      workflowRunResults,
    } = this.state;

    if (currentTab === TABS.AMR_DEPRECATED && !amrDeprecatedData) {
      this.fetchAmrDeprecatedData();
    }
    // Only the Consensus Genome Tab needs workflowRunResults,
    // here we fetch it and it can remain unchanged for all other tabs.
    if (currentTab === TABS.CONSENSUS_GENOME) {
      const currentRun = this.getCurrentRun() as WorkflowRun;
      const isFirstCGLoad = !isNil(currentRun) && isNil(workflowRunResults);
      const tabChanged = currentTab !== prevState.currentTab;
      const workflowRunChanged =
        workflowRun &&
        get("id", workflowRun) !== get("id", prevState.workflowRun);
      if (
        !loadingWorkflowRunResults &&
        (isFirstCGLoad || tabChanged || workflowRunChanged)
      ) {
        this.fetchWorkflowRunResults();
      }
    }
  }

  fetchWorkflowRunResults = async () => {
    const { loadingWorkflowRunResults } = this.state;
    if (!loadingWorkflowRunResults) {
      this.setState({ loadingWorkflowRunResults: true });
      const currentWorkflowRun = this.getCurrentRun() as WorkflowRun;
      // getWorkflowRunResults raises error unless successful
      const results =
        currentWorkflowRun.status === SUCCEEDED_STATE
          ? await getWorkflowRunResults(currentWorkflowRun.id)
          : {};

      this.setState({
        loadingWorkflowRunResults: false,
        workflowRunResults: results,
      });
    }
  };

  loadState = (
    store: Storage,
    key: string,
  ): {
    selectedOptions?: { background: number; metric: string };
    [x: string]: unknown;
  } => {
    try {
      return JSON.parse(store.getItem(key)) || {};
    } catch (e) {
      // Avoid possible bad transient state related crash
      // eslint-disable-next-line no-console
      console.warn(`Bad state: ${e}`);
    }
    return {};
  };

  fetchSample = async () => {
    this.setState({ loadingReport: true });

    const { snapshotShareId, sampleId, updateDiscoveryProjectId } = this.props;
    const {
      backgrounds,
      currentTab,
      pipelineVersion,
      selectedOptions,
      sharedWithNoBackground,
    } = this.state;

    const sample = await getSample({ snapshotShareId, sampleId });
    sample.id = sampleId;

    const pipelineRun = find(
      pipelineVersion
        ? { pipeline_version: pipelineVersion }
        : { id: sample.default_pipeline_run_id },
      sample.pipeline_runs,
    );

    const enableMassNormalizedBackgrounds =
      pipelineRun &&
      pipelineRun.total_ercc_reads > 0 &&
      isPipelineFeatureAvailable(
        MASS_NORMALIZED_FEATURE,
        pipelineRun.pipeline_version,
      );
    // If the currently selected background is mass normalized and the sample is incompatible,
    // then load the report with the default background instead.
    const newSelectedOptions = { ...selectedOptions };

    const workflowCount = getWorkflowCount(sample);
    const newCurrentTab = determineInitialTab({
      initialWorkflow: sample.initial_workflow,
      workflowCount,
      currentTab,
    });
    const tabChanged = newCurrentTab !== currentTab;

    if (newCurrentTab === TABS.SHORT_READ_MNGS) {
      const selectedBackground = backgrounds.find(
        background => selectedOptions.background === background.id,
      );

      if (
        (!sharedWithNoBackground && isEmpty(selectedBackground)) ||
        (!enableMassNormalizedBackgrounds &&
          get("mass_normalized", selectedBackground))
      ) {
        // When the selectedBackground is incompatible with the sample, set it to "None"
        // and show a popup about why it is not compatible.
        newSelectedOptions.background = null;
        selectedBackground &&
          showNotification(NOTIFICATION_TYPES.invalidBackground, {
            backgroundName: selectedBackground.name,
          });
      }
    }

    this.setState(
      {
        currentTab: newCurrentTab,
        sample,
        pipelineRun,
        project: sample.project,
        enableMassNormalizedBackgrounds,
        selectedOptions: newSelectedOptions,
      },
      () => {
        // Fetches persisted background, then loads sample report
        this.fetchPersistedBackground({ projectId: sample.project.id });

        // Updates the projectId in the Redux store to add global context in our analytic events
        updateDiscoveryProjectId(sample.project.id);
        this.fetchProjectSamples();
        this.fetchCoverageVizData();
        if (tabChanged) {
          this.handleTabChange(newCurrentTab);
        }
      },
    );
  };

  fetchPersistedBackground = async ({ projectId }: { projectId: number }) => {
    const { sharedWithNoBackground, selectedOptions } = this.state;

    if (projectId) {
      let persistedBackground: number;
      let hasPersistedBackground = false;

      await getPersistedBackground(projectId)
        .then(({ background_id: persistedBackgroundFetched }) => {
          persistedBackground = persistedBackgroundFetched;
          hasPersistedBackground = true;
        })
        .catch((error: object) => {
          persistedBackground = null;
          console.error(error);
        });

      const newSelectedOptions = Object.assign({}, selectedOptions, {
        background: persistedBackground,
      });

      this.setState(
        {
          ...(!sharedWithNoBackground && {
            selectedOptions: newSelectedOptions,
          }),
          hasPersistedBackground,
        },
        () => {
          if (sharedWithNoBackground) {
            this.fetchSampleReportData({
              backgroundId: selectedOptions.background,
            });
          } else {
            this.refreshDataFromOptionsChange({
              key: "background",
              newSelectedOptions,
            });
          }
        },
      );
    }
  };

  fetchProjectSamples = async () => {
    const { project } = this.state;
    const { snapshotShareId } = this.props;

    if (project) {
      // only really need sample names and ids, so request the basic version without extra details
      const projectSamples: {
        samples: Pick<Sample, "id" | "name">[];
      } = await getSamples({
        projectId: project.id,
        snapshotShareId: snapshotShareId,
        basic: true,
      });
      this.setState({ projectSamples: projectSamples.samples });
    }
  };

  processRawSampleReportData = (rawReportData: RawReportData) => {
    const { allowedFeatures = [] } = this.context || {};
    const { currentTab, selectedOptions } = this.state;

    const reportData: Taxon[] = [];
    const highlightedTaxIds = new Set(rawReportData.highlightedTaxIds);
    if (rawReportData.sortedGenus) {
      const generaPathogenCounts = allowedFeatures.includes(
        MULTITAG_PATHOGENS_FEATURE,
      )
        ? getAllGeneraPathogenCounts(rawReportData.counts[SPECIES_LEVEL_INDEX])
        : getGeneraPathogenCounts(rawReportData.counts[SPECIES_LEVEL_INDEX]);

      rawReportData.sortedGenus.forEach((genusTaxId: number) => {
        let hasHighlightedChildren = false;
        const childrenSpecies =
          rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId].species_tax_ids;
        const speciesData = childrenSpecies.map((speciesTaxId: number) => {
          const isHighlighted = highlightedTaxIds.has(speciesTaxId);
          hasHighlightedChildren = hasHighlightedChildren || isHighlighted;
          const speciesInfo =
            rawReportData.counts[SPECIES_LEVEL_INDEX][speciesTaxId];
          const speciesWithAdjustedMetricPrecision =
            adjustMetricPrecision(speciesInfo);
          return merge(speciesWithAdjustedMetricPrecision, {
            highlighted: isHighlighted,
            taxId: speciesTaxId,
            taxLevel: TAX_LEVEL_SPECIES,
          });
        });
        reportData.push(
          merge(rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId], {
            highlightedChildren: hasHighlightedChildren,
            pathogens: generaPathogenCounts[genusTaxId],
            taxId: genusTaxId,
            taxLevel: TAX_LEVEL_GENUS,
            species: speciesData,
          }),
        );
      });
    }

    setDisplayName({ reportData, ...selectedOptions });
    const filteredReportData = filterReportData({
      currentTab,
      reportData,
      filters: selectedOptions,
    });

    this.setState({
      filteredReportData,
      lineageData: rawReportData.lineage,
      reportData,
      reportMetadata: rawReportData.metadata,
      selectedOptions: Object.assign({}, selectedOptions, {
        background: rawReportData.metadata.backgroundId,
      }),
    });
  };

  handleInvalidBackgroundSelection = ({
    invalidBackgroundId,
  }: {
    invalidBackgroundId: number;
  }) => {
    const { backgrounds } = this.state;

    const invalidBackground = backgrounds.find(
      background => invalidBackgroundId === background.id,
    );

    this.handleOptionChanged({ key: "background", value: null });
    showNotification(NOTIFICATION_TYPES.invalidBackground, {
      backgroundName: invalidBackground?.name,
    });
  };

  // backgroundId is an optional parameter here that can be omitted.
  // If omitted, the sample report data will be fetched with the selectedOptions.background
  fetchSampleReportData = async ({
    backgroundId,
  }: { backgroundId?: number } = {}) => {
    const { snapshotShareId, sampleId } = this.props;
    const { allowedFeatures = [] } = this.context || {};
    const { currentTab, selectedOptions, pipelineRun, pipelineVersion } =
      this.state;
    // On consensus-genome-only or amr-only report pages,
    // pipelineRun is undefined and data is fetched via fetchWorkflowRunResults
    // Also if the mngs upload failed, set loading to false so it can show the appropriate error message
    if (isUndefined(pipelineRun)) {
      this.setState({ loadingReport: false });
      return;
    }

    const backgroundIdUsed = backgroundId || selectedOptions.background;
    const mergeNtNr =
      allowedFeatures.includes(MERGED_NT_NR_FEATURE) &&
      (currentTab === TABS.MERGED_NT_NR || currentTab === TABS.SHORT_READ_MNGS);

    this.setState({ loadingReport: true });
    trackEvent("PipelineSampleReport_sample_viewed", {
      sampleId,
      workflow: currentTab,
    });
    try {
      const rawReportData: RawReportData = await getSampleReportData({
        snapshotShareId,
        sampleId,
        background: backgroundIdUsed,
        pipelineVersion,
        mergeNtNr,
      });
      this.setState(
        ({ selectedOptions: prevSelectedOptions }) => {
          const newSelectedOptions = {
            ...selectedOptions,
            ...(!isEmpty(rawReportData?.all_tax_ids) &&
              !isEmpty(selectedOptions.taxa) && {
                taxa: filter(
                  taxon => rawReportData?.all_tax_ids.includes(taxon.id),
                  selectedOptions.taxa,
                ),
              }),
            ...(prevSelectedOptions.background !== backgroundIdUsed && {
              background: backgroundIdUsed,
            }),
          };

          return {
            loadingReport: false,
            selectedOptions: newSelectedOptions,
          };
        },
        () => {
          if (rawReportData) {
            this.processRawSampleReportData(rawReportData);
          }
        },
      );
      return !!rawReportData;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  fetchAmrDeprecatedData = async () => {
    const { sample } = this.state;
    const amrDeprecatedData: AmrDeprectatedData[] = await getAmrDeprecatedData(
      sample.id,
    );
    this.setState({ amrDeprecatedData });
  };

  fetchBackgrounds = async () => {
    const { snapshotShareId } = this.props;

    this.setState({ loadingReport: true });
    const {
      owned_backgrounds: ownedBackgrounds,
      other_backgrounds: otherBackgrounds,
    }: {
      owned_backgrounds: Background[];
      other_backgrounds: Background[];
    } = await getBackgrounds({
      snapshotShareId,
      categorizeBackgrounds: !snapshotShareId,
    });

    this.setState(
      {
        backgrounds: [...ownedBackgrounds, ...otherBackgrounds],
        ownedBackgrounds,
        otherBackgrounds,
      },
      () => {
        this.fetchSample();
      },
    );
  };

  fetchCoverageVizData = async () => {
    const { snapshotShareId } = this.props;
    const { sample, pipelineRun, currentTab } = this.state;

    if (
      isPipelineFeatureAvailable(
        COVERAGE_VIZ_FEATURE,
        get("pipeline_version", pipelineRun),
      ) ||
      currentTab === TABS.LONG_READ_MNGS
    ) {
      const coverageVizSummary = await getCoverageVizSummary({
        sampleId: sample.id,
        snapshotShareId,
      });
      this.setState({
        coverageVizDataByTaxon: coverageVizSummary,
      });
    }
  };

  handlePipelineVersionSelect = (newPipelineVersion: string) => {
    const { currentTab, pipelineVersion, sample } = this.state;

    if (newPipelineVersion === pipelineVersion) {
      return;
    }

    if (
      currentTab === TABS.SHORT_READ_MNGS ||
      currentTab === TABS.LONG_READ_MNGS
    ) {
      const newRun = find(
        { pipeline_version: newPipelineVersion },
        sample.pipeline_runs,
      );
      this.setState(
        {
          pipelineRun: newRun,
          pipelineVersion: newPipelineVersion,
          filteredReportData: [],
          reportData: [],
        },
        () => {
          this.updateHistoryAndPersistOptions();
          this.fetchSampleReportData();
          this.fetchCoverageVizData();
        },
      );
    } else if (
      currentTab === TABS.CONSENSUS_GENOME ||
      currentTab === TABS.AMR
    ) {
      const workflowVal: WORKFLOW_VALUES =
        WORKFLOWS[findInWorkflows(currentTab, "label")]?.value;
      const newRun = find(
        { wdl_version: newPipelineVersion, workflow: workflowVal },
        sample.workflow_runs,
      );
      this.setState(
        {
          workflowRun: newRun,
          pipelineVersion: newPipelineVersion,
        },
        () => this.updateHistoryAndPersistOptions(),
      );
    }
  };

  handleWorkflowRunSelect = (workflowRun: WorkflowRun) => {
    const updatedQueryParameters = this.urlParser.updateQueryStringParameter(
      location.search,
      "workflowRunId",
      workflowRun.id,
    );
    const stringifiedQueryParams = this.urlParser.stringify(
      updatedQueryParameters,
    );

    history.replaceState(
      updatedQueryParameters,
      `SampleView`,
      `${location.pathname + "?" + stringifiedQueryParams}`,
    );
    this.setState({ workflowRun, workflowRunId: workflowRun.id });
  };

  handleDeleteCurrentRun = () => {
    const { currentTab, reportMetadata, sample, project, workflowRun } =
      this.state;
    const workflowCount = getWorkflowCount(sample);
    const workflow = labelToVal(currentTab);

    let status: string;
    if (isMngsWorkflow(workflow)) {
      status = reportMetadata.pipelineRunStatus ?? "upload_failed";
    } else {
      status = workflowRun?.status ?? "no workflow run status";
    }

    trackEvent("SampleView_single_run_deleted", {
      workflow: workflow,
      runStatus: status.toLowerCase(),
      projectId: project?.id,
    });

    // add all the values of the workflowCount object
    const totalWorkflowCount = Object.values(workflowCount).reduce(
      (a, b) => a + b,
      0,
    );
    if (totalWorkflowCount <= 1) {
      // if there is only one or zero workflow run(s), navigate to the project page
      // zero workflow runs happens for failed short read mNGS uploads
      addSampleDeleteFlagToSessionStorage(sample?.name);
      location.replace(`/home?project_id=${sample.project_id}`);
      return;
    }

    // choose pipeline runs or workflow runs based on current tab
    const runType = isMngsWorkflow(workflow)
      ? "pipeline_runs"
      : "workflow_runs";
    const runs: { id: number }[] = sample[runType];

    // filter out the current run
    const newRuns = runs.filter(run => run.id !== this.getCurrentRun().id);

    // update the workflowCount object
    workflowCount[workflow] -= 1;

    const nextTab = determineInitialTab({
      initialWorkflow: sample.initial_workflow,
      workflowCount,
      currentTab,
    });

    // update the state to remove the current run and change the tab
    this.setState(
      {
        sample: {
          ...sample,
          [runType]: newRuns,
        },
      },
      () => this.handleTabChange(nextTab),
    );
  };

  handleTabChange = (tab: CurrentTabSample) => {
    if (tab === TABS.CONSENSUS_GENOME || tab === TABS.AMR) {
      const workflow = find(
        { workflow: labelToVal(tab) },
        this.state.sample.workflow_runs,
      );
      this.handleWorkflowRunSelect(workflow);
    }

    this.setState({ currentTab: tab }, () => {
      this.updateHistoryAndPersistOptions();
    });
    const name = tab.replace(/\W+/g, "-").toLowerCase();
    trackEvent(`SampleView_tab-${name}_clicked`, {
      tab: tab,
    });
  };

  updateHistoryAndPersistOptions = () => {
    const urlState = pick(keys(URL_FIELDS), this.state);

    const localStorageFields = LOCAL_STORAGE_FIELDS;

    const localState: Partial<Readonly<SampleViewState>> = mapValuesWithKey(
      (options: { excludePaths: string[] }, key: string) => {
        return omit(options.excludePaths || [], this.state[key]);
      },
      localStorageFields,
    );

    // Saving on URL enables sharing current view with other users
    let urlQuery = this.urlParser.stringify(urlState);
    if (urlQuery) {
      urlQuery = `?${urlQuery}`;
    }
    history.replaceState(urlState, `SampleView`, `${urlQuery}`);

    localStorage.setItem(KEY_SAMPLE_VIEW_OPTIONS, JSON.stringify(localState));
  };

  handleOptionChanged = ({ key, value }: { key: string; value: unknown }) => {
    const { sample, project, selectedOptions } = this.state;
    if (deepEqual(selectedOptions[key], value)) {
      return;
    }

    const newSelectedOptions = Object.assign({}, selectedOptions, {
      [key]: value,
    });

    if (key === KEY_SELECTED_OPTIONS_BACKGROUND) {
      trackEvent(ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_BACKGROUND_MODEL_SELECTED, {
        sampleId: sample.id,
        projectId: project.id,
        backgroundId: value,
      });
    }

    this.refreshDataFromOptionsChange({ key, newSelectedOptions });
  };

  persistNewBackgroundModelSelection = async ({
    newBackgroundId,
  }: {
    newBackgroundId: number;
  }) => {
    const { hasPersistedBackground, project } = this.state;

    const persistBackgroundApi = !hasPersistedBackground
      ? createPersistedBackground
      : updatePersistedBackground;

    await persistBackgroundApi({
      projectId: project.id,
      backgroundId: newBackgroundId,
    }).catch((error: Error) => {
      logError({
        message: "SampleView: Failed to persist background model selection",
        details: {
          error,
          projectId: project.id,
          backgroundId: newBackgroundId,
          hasExistingPersistedBackground: hasPersistedBackground,
        },
      });
      console.error(error);
    });

    this.setState(
      ({ selectedOptions: previousSelectedOptions }) => ({
        hasPersistedBackground: true,
        selectedOptions: {
          ...previousSelectedOptions,
          background: newBackgroundId,
        },
      }),
      () => this.updateHistoryAndPersistOptions(),
    );
  };

  handleCoverageVizClick = (newCoverageVizParams: CoverageVizParamsRaw) => {
    const { coverageVizParams, coverageVizVisible } = this.state;
    if (!newCoverageVizParams.taxId) {
      this.setState({
        coverageVizVisible: false,
      });
      return;
    }

    if (
      coverageVizVisible &&
      get("taxId", coverageVizParams) === newCoverageVizParams.taxId
    ) {
      this.setState({
        coverageVizVisible: false,
      });
    } else {
      this.setState({
        coverageVizParams: newCoverageVizParams,
        coverageVizVisible: true,
        sidebarVisible: false,
      });
    }
  };

  closeCoverageViz = () => {
    this.setState({
      coverageVizVisible: false,
    });
  };

  refreshDataFromOptionsChange = ({
    key,
    newSelectedOptions,
  }: {
    key: string;
    newSelectedOptions: FilterSelections;
  }) => {
    const { currentTab, reportData } = this.state;

    let updateSelectedOptions = true;
    // different behavior given type of option
    switch (key) {
      // - name type: reset table to force a rerender
      case "nameType":
        setDisplayName({ reportData, ...newSelectedOptions });
        this.setState({ reportData: [...reportData] });
        break;

      // - background: requires a new reload from server
      case "background":
        // Only update the background in the selectedOptions if the report loaded successfully.
        updateSelectedOptions = false;
        this.setState({ sharedWithNoBackground: false, reportData: [] }, () => {
          // if there are no mngs runs, we do not need to update the background
          if (!hasMngsRuns(this.state.sample)) {
            this.setState({ loadingReport: false });
            return;
          }
          this.fetchSampleReportData({
            backgroundId: newSelectedOptions.background,
          })
            .then(successfullyFetchedSampleReportData => {
              if (successfullyFetchedSampleReportData) {
                this.persistNewBackgroundModelSelection({
                  newBackgroundId: newSelectedOptions.background,
                });
              } else {
                this.handleInvalidBackgroundSelection({
                  invalidBackgroundId: newSelectedOptions.background,
                });
              }
            })
            .catch(err => console.error(err));
        });
        break;

      // - taxa: refresh filtered data
      // - categories: refresh filtered data
      // - threshold filters: refresh filtered data
      // - read specificity: refresh filtered data
      case "annotations":
      case "flags":
      case "taxa":
      case "categories":
      case "thresholdsShortReads":
      case "thresholdsLongReads":
      case "readSpecificity":
        this.setState({
          filteredReportData: filterReportData({
            currentTab,
            reportData,
            filters: newSelectedOptions,
          }),
        });
        break;
      // - metricShortReads or metricLongReads: no need to update anything except for the option below
      case "metricShortReads":
      case "metricLongReads":
        break;
      default:
        return;
    }

    if (updateSelectedOptions) {
      // save options in state and persist in local storage
      this.setState(
        {
          selectedOptions: newSelectedOptions,
        },
        () => {
          this.updateHistoryAndPersistOptions();
        },
      );
    }
  };

  handleTaxonClick = (clickedTaxonData: Taxon) => {
    const { sidebarMode, sidebarVisible, sidebarTaxonData } = this.state;

    if (!clickedTaxonData.taxId) {
      this.setState({ sidebarVisible: false });
      return;
    }

    if (
      sidebarMode === "taxonDetails" &&
      sidebarVisible &&
      sidebarTaxonData &&
      sidebarTaxonData.taxId === clickedTaxonData.taxId
    ) {
      this.setState({
        sidebarVisible: false,
      });
    } else {
      this.setState({
        sidebarMode: "taxonDetails",
        sidebarTaxonData: clickedTaxonData,
        sidebarVisible: true,
        coverageVizVisible: false,
      });
    }
  };

  toggleSampleDetailsSidebar = () => {
    const { sidebarMode, sidebarVisible } = this.state;
    if (sidebarVisible && sidebarMode === "sampleDetails") {
      this.setState({ sidebarVisible: false });
    } else {
      this.setState({
        sidebarMode: "sampleDetails",
        sidebarVisible: true,
      });
    }
  };

  closeSidebar = () => {
    this.setState({
      sidebarVisible: false,
    });
  };

  handleConsensusGenomeKickoff = async ({
    accessionId,
    accessionName,
    taxonId,
    taxonName,
  }: ConsensusGenomeParams) => {
    const { sample } = this.state;
    const workflowRuns = await kickoffConsensusGenome({
      sampleId: sample.id,
      workflow: WORKFLOWS.CONSENSUS_GENOME.value,
      alignment_config_name: sample?.pipeline_runs[0]?.alignment_config_name,
      accessionId,
      accessionName,
      taxonId,
      taxonName,
      technology: SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA,
    });

    this.setState({
      consensusGenomeErrorModalVisible: false,
      // Update the sample's workflow runs to include the newly created CG run and ensure the CG tab is displayed.
      sample: {
        ...sample,
        workflow_runs: workflowRuns,
      },
    });
    showNotification(NOTIFICATION_TYPES.consensusGenomeCreated, {
      handleTabChange: this.handleTabChange,
    });
    this.handleModalClose("consensusGenomeCreationModalVisible");

    // Close both modals in case they came via the previous runs modal
    this.handleModalClose("consensusGenomePreviousModalVisible");
  };

  // Clicking the HoverAction to open the CG creation modal
  handleConsensusGenomeClick = ({
    percentIdentity,
    taxId,
    taxName,
  }: ConsensusGenomeClick) => {
    const { coverageVizDataByTaxon, sample } = this.state;

    const accessionData = get(taxId, coverageVizDataByTaxon);
    const usedAccessions = uniq(
      map("inputs.accession_id", get(taxId, getConsensusGenomeData(sample))),
    );
    this.setState({
      consensusGenomeData: {
        accessionData,
        percentIdentity,
        taxId,
        taxName,
        usedAccessions,
      },
      consensusGenomeCreationModalVisible: true,
    });
  };

  // Clicking the HoverAction to open the previous CG modal
  handlePreviousConsensusGenomeClick = ({
    percentIdentity,
    taxId,
    taxName,
  }: ConsensusGenomeClick) => {
    const previousRuns = get(taxId, getConsensusGenomeData(this.state.sample));
    this.setState({
      consensusGenomePreviousParams: {
        percentIdentity,
        previousRuns,
        taxId,
        taxName,
      },
      consensusGenomePreviousModalVisible: true,
    });
  };

  handleBlastClick = ({
    context,
    pipelineVersion,
    sampleId,
    shouldBlastContigs,
    taxonStatsByCountType,
    taxName,
    taxLevel,
    taxId,
  }: BlastData) => {
    const { allowedFeatures = [] } = this.context || {};
    const blastSelectionModalVisible =
      allowedFeatures.includes(BLAST_V1_FEATURE);

    this.setState({
      blastSelectionModalVisible,
      ...(!blastSelectionModalVisible &&
        (shouldBlastContigs
          ? { blastContigsModalVisible: true }
          : { blastReadsModalVisible: true })),
      blastData: {
        context,
        pipelineVersion,
        sampleId,
        taxName,
        taxLevel,
        taxId,
        taxonStatsByCountType,
      },
    });
  };

  onConsensusGenomeCreation = async ({
    accessionId,
    accessionName,
    taxonId,
    taxonName,
  }: ConsensusGenomeParams) => {
    const { sample } = this.state;
    try {
      // Save the creation parameters if kickoff fails and we need to retry.
      this.setState({
        consensusGenomeCreationParams: {
          accessionId,
          accessionName,
          taxonId,
          taxonName,
        },
      });
      await this.handleConsensusGenomeKickoff({
        accessionId,
        accessionName,
        taxonId,
        taxonName,
      });
    } catch (error) {
      this.setState(
        {
          consensusGenomeErrorModalVisible: true,
        },
        () => {
          console.error(error);
          trackEvent(
            ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_KICKOFF_FAILED,
            {
              error,
              sampleId: sample.id,
              accessionId,
              accessionName,
              taxonId,
              taxonName,
            },
          );
        },
      );
    }
  };

  handleConsensusGenomeErrorModalRetry = async () => {
    const { consensusGenomeCreationParams, sample } = this.state;
    const { accessionId, accessionName, taxonId, taxonName } =
      consensusGenomeCreationParams;

    try {
      await this.handleConsensusGenomeKickoff({
        accessionId,
        accessionName,
        taxonId,
        taxonName,
      });

      trackEvent(
        ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_ERROR_MODAL_RETRY_BUTTON_CLICKED,
        {
          accessionId,
          accessionName,
          taxonId,
          taxonName,
          sampleId: sample.id,
        },
      );
    } catch (error) {
      console.error(error);
      trackEvent(
        ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_RETRY_KICKOFF_FAILED,
        {
          error,
          sampleId: sample.id,
          accessionId,
          accessionName,
          taxonId,
          taxonName,
        },
      );
    }
  };

  // Opening up a previous Consensus Genome run
  handlePreviousConsensusGenomeReportClick = ({
    rowData,
  }: {
    rowData: WorkflowRun;
  }) => {
    this.setState(
      {
        workflowRun: rowData,
        consensusGenomePreviousModalVisible: false,
      },
      () => this.handleTabChange(TABS.CONSENSUS_GENOME),
    );
  };

  handleMetadataUpdate = (key: string, value: string) => {
    const { sample } = this.state;
    if (key === "name") {
      this.setState({
        sample: Object.assign({}, sample, { name: value }),
      });
    }
  };

  clearAllFilters = () => {
    const { currentTab, reportData, selectedOptions } = this.state;

    const newSelectedOptions = { ...selectedOptions };
    newSelectedOptions.categories = {};
    newSelectedOptions.taxa = [];
    // Only clear thresholds filters that apply to the current tab
    if (currentTab === TABS.SHORT_READ_MNGS) {
      newSelectedOptions.thresholdsShortReads = [];
    } else if (currentTab === TABS.LONG_READ_MNGS) {
      newSelectedOptions.thresholdsLongReads = [];
    }
    newSelectedOptions.annotations = [];

    this.setState(
      {
        selectedOptions: newSelectedOptions,
        filteredReportData: filterReportData({
          currentTab,
          reportData,
          filters: newSelectedOptions,
        }),
      },
      () => {
        this.updateHistoryAndPersistOptions();
      },
    );
    trackEvent("PipelineSampleReport_clear-filters-link_clicked");
  };

  getCurrentRun = () => {
    const {
      currentTab,
      pipelineRun,
      pipelineVersion,
      sample,
      workflowRun,
      workflowRunId,
    } = this.state;
    if (PIPELINE_RUN_TABS.includes(currentTab)) {
      return pipelineRun;
    }

    if (sample && sample.workflow_runs.length > 0) {
      if (workflowRunId) {
        return find({ id: workflowRunId }, sample.workflow_runs);
      }

      const workflowType = Object.values(WORKFLOWS).find(
        workflow => workflow.label === currentTab,
      ).value;

      if (workflowRun && workflowRun.workflow === workflowType) {
        return workflowRun;
      }

      if (pipelineVersion) {
        return sample.workflow_runs.find(run => {
          if (run.workflow === workflowType && !!run.wdl_version) {
            return run.wdl_version === pipelineVersion;
          } else {
            return false;
          }
        });
      } else {
        return head(
          sample.workflow_runs.filter(run => run.workflow === workflowType),
        );
      }
    }
  };

  handleViewClick = ({ view }: { view: SampleReportViewMode }) => {
    trackEvent(`PipelineSampleReport_${view}-view-menu_clicked`);
    this.setState({ view }, () => {
      this.updateHistoryAndPersistOptions();
    });
  };

  revertToSampleViewFilters = () => {
    const { selectedOptions: selectedOptionsFromLocal } = this.loadState(
      localStorage,
      KEY_SAMPLE_VIEW_OPTIONS,
    );
    const newSelectedOptions = {
      ...getDefaultSelectedOptions(),
      ...selectedOptionsFromLocal,
    };

    this.setState({ selectedOptions: newSelectedOptions }, () => {
      this.refreshDataFromOptionsChange({
        key: "taxa",
        newSelectedOptions,
      });
    });
  };

  getDownloadReportTableWithAppliedFiltersLink = () => {
    const { allowedFeatures = [] } = this.context || {};
    const includePathogenFlags = allowedFeatures.includes(
      MULTITAG_PATHOGENS_FEATURE,
    );
    const [csvHeaders, csvRows] = computeMngsReportTableValuesForCSV(
      this.state.filteredReportData,
      this.state.selectedOptions,
      this.state.backgrounds,
      this.state.currentTab,
      includePathogenFlags,
    );

    return createCSVObjectURL(csvHeaders, csvRows);
  };

  handleShareClick = () => {
    const { sample } = this.state;
    // Ensure Share recipient sees report with the same options:
    this.updateHistoryAndPersistOptions();
    copyShortUrlToClipboard();
    trackEvent("SampleView_share-button_clicked", {
      sampleId: sample && sample.id,
    });
  };

  handleModalClose = (name: string) => {
    const newState = { [name]: false } as unknown as Pick<
      SampleViewState,
      keyof SampleViewState
    >;

    this.setState(newState);
  };

  handleBlastSelectionModalContinue = (blastModalInfo: BlastModalInfo) => {
    const { shouldBlastContigs } = blastModalInfo;

    this.setState({
      blastSelectionModalVisible: false,
      blastModalInfo,
      ...(shouldBlastContigs
        ? { blastV1ContigsModalVisible: true }
        : { blastV1ReadsModalVisible: true }),
    });
  };

  render() {
    const {
      amrDeprecatedData,
      backgrounds,
      blastData,
      blastModalInfo,
      blastContigsModalVisible,
      blastReadsModalVisible,
      blastV1ContigsModalVisible,
      blastV1ReadsModalVisible,
      blastSelectionModalVisible,
      consensusGenomeData,
      consensusGenomePreviousParams,
      consensusGenomeCreationModalVisible,
      consensusGenomeErrorModalVisible,
      consensusGenomePreviousModalVisible,
      coverageVizVisible,
      coverageVizParams,
      coverageVizDataByTaxon,
      currentTab,
      pipelineRun,
      project,
      projectSamples,
      reportMetadata,
      sample,
      selectedOptions,
      sidebarTaxonData,
      sidebarVisible,
      sidebarMode,
      view,
    } = this.state;
    const { snapshotShareId } = this.props;

    const currentRun = this.getCurrentRun();

    return (
      <React.Fragment>
        <NarrowContainer className={cs.sampleViewContainer}>
          <div className={cs.sampleViewHeader}>
            <SampleViewHeader
              backgroundId={
                isNaN(selectedOptions.background)
                  ? null
                  : selectedOptions.background
              }
              currentRun={currentRun}
              currentTab={currentTab}
              editable={sample ? sample.editable : false}
              getDownloadReportTableWithAppliedFiltersLink={
                this.getDownloadReportTableWithAppliedFiltersLink
              }
              hasAppliedFilters={hasAppliedFilters(currentTab, selectedOptions)}
              onDetailsClick={this.toggleSampleDetailsSidebar}
              onPipelineVersionChange={this.handlePipelineVersionSelect}
              onShareClick={this.handleShareClick}
              project={project}
              projectSamples={projectSamples}
              reportMetadata={reportMetadata}
              sample={sample}
              snapshotShareId={snapshotShareId}
              view={view}
              onDeleteRunSuccess={this.handleDeleteCurrentRun}
            />
          </div>
          <TabSwitcher
            currentTab={currentTab}
            handleTabChange={this.handleTabChange}
            reportMetadata={reportMetadata}
            sample={sample}
          />
          <ReportPanel
            amrDeprecatedData={amrDeprecatedData}
            backgrounds={backgrounds}
            currentTab={currentTab}
            currentRun={this.getCurrentRun()}
            clearAllFilters={this.clearAllFilters}
            enableMassNormalizedBackgrounds={
              this.state.enableMassNormalizedBackgrounds
            }
            filteredReportData={this.state.filteredReportData}
            handleAnnotationUpdate={this.fetchSampleReportData}
            handleBlastClick={this.handleBlastClick}
            handleConsensusGenomeClick={this.handleConsensusGenomeClick}
            handleCoverageVizClick={this.handleCoverageVizClick}
            handlePreviousConsensusGenomeClick={
              this.handlePreviousConsensusGenomeClick
            }
            handleOptionChanged={this.handleOptionChanged}
            handleTaxonClick={this.handleTaxonClick}
            handleViewClick={this.handleViewClick}
            handleWorkflowRunSelect={this.handleWorkflowRunSelect}
            refreshDataFromOptionsChange={this.refreshDataFromOptionsChange}
            lineageData={this.state.lineageData}
            loadingReport={this.state.loadingReport}
            loadingWorkflowRunResults={this.state.loadingWorkflowRunResults}
            ownedBackgrounds={this.state.ownedBackgrounds}
            otherBackgrounds={this.state.otherBackgrounds}
            project={project}
            reportData={this.state.reportData}
            reportMetadata={reportMetadata}
            sample={sample}
            selectedOptions={selectedOptions}
            snapshotShareId={snapshotShareId}
            view={view}
            workflowRunResults={this.state.workflowRunResults}
          />
        </NarrowContainer>
        {sample && (
          <DetailsSidebarSwitcher
            handleMetadataUpdate={this.handleMetadataUpdate}
            handleWorkflowRunSelect={this.handleWorkflowRunSelect}
            handleTabChange={this.handleTabChange}
            getCurrentRun={this.getCurrentRun}
            closeSidebar={this.closeSidebar}
            currentTab={currentTab}
            snapshotShareId={snapshotShareId}
            sidebarVisible={sidebarVisible}
            sidebarMode={sidebarMode}
            sample={sample}
            backgrounds={backgrounds}
            selectedOptions={selectedOptions}
            sidebarTaxonData={sidebarTaxonData}
          />
        )}
        {sample &&
          (isPipelineFeatureAvailable(
            COVERAGE_VIZ_FEATURE,
            get("pipeline_version", pipelineRun),
          ) ||
            currentTab === TABS.LONG_READ_MNGS) && (
            <CoverageVizBottomSidebar
              nameType={selectedOptions.nameType}
              onBlastClick={this.handleBlastClick}
              onClose={withAnalytics(
                this.closeCoverageViz,
                "SampleView_coverage-viz-sidebar_closed",
                {
                  sampleId: sample.id,
                  sampleName: sample.name,
                },
              )}
              params={getCoverageVizParams(
                coverageVizParams,
                coverageVizDataByTaxon,
              )}
              pipelineVersion={pipelineRun.pipeline_version}
              sampleId={sample.id}
              snapshotShareId={snapshotShareId}
              visible={coverageVizVisible}
              workflow={sample.initial_workflow}
            />
          )}
        <SampleViewModals
          blastData={blastData}
          blastModalInfo={blastModalInfo}
          blastSelectionModalVisible={blastSelectionModalVisible}
          blastContigsModalVisible={blastContigsModalVisible}
          blastReadsModalVisible={blastReadsModalVisible}
          blastV1ContigsModalVisible={blastV1ContigsModalVisible}
          blastV1ReadsModalVisible={blastV1ReadsModalVisible}
          consensusGenomeData={consensusGenomeData}
          consensusGenomeCreationModalVisible={
            consensusGenomeCreationModalVisible
          }
          consensusGenomeErrorModalVisible={consensusGenomeErrorModalVisible}
          consensusGenomePreviousParams={consensusGenomePreviousParams}
          consensusGenomePreviousModalVisible={
            consensusGenomePreviousModalVisible
          }
          handleBlastSelectionModalContinue={
            this.handleBlastSelectionModalContinue
          }
          handleConsensusGenomeClick={this.handleConsensusGenomeClick}
          handleConsensusGenomeErrorModalRetry={
            this.handleConsensusGenomeErrorModalRetry
          }
          handleModalClose={this.handleModalClose}
          handlePreviousConsensusGenomeReportClick={
            this.handlePreviousConsensusGenomeReportClick
          }
          onConsensusGenomeCreation={this.onConsensusGenomeCreation}
          sample={sample}
        />
      </React.Fragment>
    );
  }
}

SampleView.contextType = UserContext;

const mapDispatchToProps = { updateDiscoveryProjectId: updateProjectIds };

// Don't need mapStateToProps yet so pass in null
const connectedComponent = connect(null, mapDispatchToProps)(SampleView);

(connectedComponent.name as string) = "SampleView";

export default connectedComponent;
