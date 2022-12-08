import { Button } from "czifui";
import deepEqual from "fast-deep-equal";
import {
  compact,
  filter,
  find,
  get,
  groupBy,
  head,
  isEmpty,
  isNull,
  isNil,
  isUndefined,
  keys,
  map,
  mapValues,
  merge,
  omit,
  pick,
  pull,
  set,
  uniq,
  size,
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
  trackEvent,
  withAnalytics,
  ANALYTICS_EVENT_NAMES,
} from "~/api/analytics";
import {
  getPersistedBackground,
  createPersistedBackground,
  updatePersistedBackground,
} from "~/api/persisted_backgrounds";
import DeprecatedAmrView from "~/components/DeprecatedAmrView";
import CoverageVizBottomSidebar from "~/components/common/CoverageVizBottomSidebar";
import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import { getCoverageVizParams } from "~/components/common/CoverageVizBottomSidebar/utils";
import { UserContext } from "~/components/common/UserContext";
import NarrowContainer from "~/components/layout/NarrowContainer";
import ErrorModal from "~/components/ui/containers/ErrorModal";
import Tabs from "~/components/ui/controls/Tabs";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import {
  computeReportTableValuesForCSV,
  createCSVObjectURL,
} from "~/components/utils/csv";
import {
  AMR_V1_FEATURE,
  AMR_DEPRECATED_FEATURE,
  BLAST_V1_FEATURE,
  MERGED_NT_NR_FEATURE,
  ONT_V1_FEATURE,
} from "~/components/utils/features";
import { logError } from "~/components/utils/logUtil";
import {
  COVERAGE_VIZ_FEATURE,
  isPipelineFeatureAvailable,
  MASS_NORMALIZED_FEATURE,
} from "~/components/utils/pipeline_versions";
import { sampleErrorInfo } from "~/components/utils/sample";
import {
  findInWorkflows,
  labelToVal,
  WORKFLOWS,
} from "~/components/utils/workflows";
import { CG_TECHNOLOGY_OPTIONS } from "~/components/views/SampleUploadFlow/constants";
import ConsensusGenomeView from "~/components/views/SampleView/ConsensusGenomeView";
import SampleMessage from "~/components/views/SampleView/SampleMessage";
import BlastContigsModal from "~/components/views/blast/BlastContigsModal";
import BlastReadsModal from "~/components/views/blast/BlastReadsModal";
import BlastV1ContigsModal from "~/components/views/blast/BlastV1ContigsModal";
import BlastV1ReadsModal from "~/components/views/blast/BlastV1ReadsModal";
import ConsensusGenomeCreationModal from "~/components/views/consensus_genome/ConsensusGenomeCreationModal";
import ConsensusGenomePreviousModal from "~/components/views/consensus_genome/ConsensusGenomePreviousModal";
import { getGeneraPathogenCounts } from "~/helpers/taxon";
import { copyShortUrlToClipboard } from "~/helpers/url";
import Sample, { WorkflowRun } from "~/interface/sample";
import {
  CurrentTabSample,
  AmrDeprectatedData,
  FilterSelections,
  RawReportData,
  SampleViewProps,
  SampleViewState,
} from "~/interface/sampleView";
import { Background, Taxon } from "~/interface/shared";
import { updateProjectIds } from "~/redux/modules/discovery/slice";
import { IconAlert, IconLoading } from "~ui/icons";
import StatusLabel from "~ui/labels/StatusLabel";
import { WORKFLOW_VALUES } from "../../utils/workflows";
import BlastSelectionModal from "../blast/BlastSelectionModal";
import AmrView from "./AmrView";
import DetailsSidebarSwitcher from "./DetailSidebarSwitcher";
import ReportFilters from "./ReportFilters";
import ReportTable from "./ReportTable";
import ReportViewSelector from "./ReportViewSelector";
import SampleViewHeader from "./SampleViewHeader";
import TaxonTreeVis from "./TaxonTreeVis";
import {
  GENUS_LEVEL_INDEX,
  LOCAL_STORAGE_FIELDS,
  NOTIFICATION_TYPES,
  PIPELINE_RUN_TABS,
  SPECIES_LEVEL_INDEX,
  SUCCEEDED_STATE,
  TABS,
  TREE_METRICS,
  URL_FIELDS,
  TAX_LEVEL_GENUS,
  TAX_LEVEL_SPECIES,
  KEY_SAMPLE_VIEW_OPTIONS,
  KEY_SELECTED_OPTIONS_BACKGROUND,
} from "./constants";
import {
  adjustMetricPrecision,
  countFilters,
  filterReportData,
  setDisplayName,
} from "./filters";
import { filteredMessage, renderReportInfo } from "./messages";
import { showNotification } from "./notifications";
import csSampleMessage from "./sample_message.scss";
import cs from "./sample_view.scss";
import {
  getWorkflowCount,
  getDefaultSelectedOptions,
  determineInitialTab,
  hasAppliedFilters,
} from "./setup";

// @ts-expect-error working with Lodash types
const mapValuesWithKey = mapValues.convert({ cap: false });

class SampleView extends React.Component<SampleViewProps, SampleViewState> {
  urlParser: $TSFixMe;
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

    const { annotations, taxa, thresholds } = tempSelectedOptions || {};

    const persistedDiscoveryFiltersPresent = [
      annotations,
      taxa,
      thresholds,
    ].some(filter => !isEmpty(filter));

    if (persistedDiscoveryFiltersPresent) {
      showNotification(NOTIFICATION_TYPES.discoveryViewFiltersPersisted, {
        revertToSampleViewFilters: this.revertToSampleViewFilters,
      });
    }

    if (
      !get("background", selectedOptionsFromLocal) &&
      get("metric", selectedOptionsFromLocal) === "aggregatescore"
    ) {
      // If the user does not have a background and has metric 'aggregatescore', overwrite the selected option
      // 'metric' from 'aggregatescore' to 'NT r (total reads)' because the aggregatescore
      // is computed once the user selects a background.
      selectedOptionsFromLocal["metric"] = find(
        { value: "nt_r" },
        TREE_METRICS,
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
      currentTab: null,
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
        ...(!isEmpty(tempSelectedOptions)
          ? tempSelectedOptions
          : {
              ...selectedOptionsFromLocal,
              ...selectedOptionsFromUrl,
            }),
      },
      sidebarMode: null,
      sidebarVisible: false,
      sidebarTaxonData: null,
      view: "table",
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'analytics' does not exist on type 'Windo... Remove this comment to see the full error message
    if (window.analytics) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'analytics' does not exist on type 'Windo... Remove this comment to see the full error message
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

  loadState = (store: Storage, key: string) => {
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
    const selectedBackground = backgrounds.find(
      (background: $TSFixMe) => selectedOptions.background === background.id,
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

    const workflowCount = getWorkflowCount(sample);
    const newCurrentTab =
      currentTab ||
      determineInitialTab({
        initialWorkflow: sample.initial_workflow,
        workflowCount,
      });

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
        .catch((error: $TSFixMe) => {
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

  processRawSampleReportData = (rawReportData: $TSFixMe) => {
    const { selectedOptions } = this.state;

    const reportData: $TSFixMe = [];
    const highlightedTaxIds = new Set(rawReportData.highlightedTaxIds);
    if (rawReportData.sortedGenus) {
      const generaPathogenCounts = getGeneraPathogenCounts(
        rawReportData.counts[SPECIES_LEVEL_INDEX],
      );

      rawReportData.sortedGenus.forEach((genusTaxId: $TSFixMe) => {
        let hasHighlightedChildren = false;
        const childrenSpecies =
          rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId].species_tax_ids;
        const speciesData = childrenSpecies.map((speciesTaxId: $TSFixMe) => {
          const isHighlighted = highlightedTaxIds.has(speciesTaxId);
          hasHighlightedChildren = hasHighlightedChildren || isHighlighted;
          const speciesInfo =
            rawReportData.counts[SPECIES_LEVEL_INDEX][speciesTaxId];
          const speciesWithAdjustedMetricPrecision = adjustMetricPrecision(
            speciesInfo,
          );
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
      backgroundName: invalidBackground.name,
    });
  };

  // backgroundId is an optional parameter here that can be omitted.
  // If omitted, the sample report data will be fetched with the selectedOptions.background
  fetchSampleReportData = async ({
    backgroundId,
  }: { backgroundId?: number } = {}) => {
    const { snapshotShareId, sampleId } = this.props;
    const { allowedFeatures = [] } = this.context || {};
    const {
      currentTab,
      selectedOptions,
      pipelineRun,
      pipelineVersion,
    } = this.state;

    // On consensus-genome-only report pages, pipelineRun is undefined and data is fetched via fetchWorkflowRunResults
    if (isUndefined(pipelineRun)) return;

    const backgroundIdUsed = backgroundId || selectedOptions.background;
    const mergeNtNr =
      allowedFeatures.includes(MERGED_NT_NR_FEATURE) &&
      (currentTab === TABS.MERGED_NT_NR || currentTab === TABS.SHORT_READ_MNGS);

    this.setState({ loadingReport: true });
    trackEvent("PipelineSampleReport_sample_viewed", {
      sampleId,
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
    const { sample, pipelineRun } = this.state;

    if (
      isPipelineFeatureAvailable(
        COVERAGE_VIZ_FEATURE,
        get("pipeline_version", pipelineRun),
      )
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

    if (currentTab === TABS.SHORT_READ_MNGS) {
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

  handleTabChange = (tab: CurrentTabSample) => {
    if (tab === TABS.CONSENSUS_GENOME || tab === TABS.AMR) {
      const workflow = find(
        { workflow: labelToVal(tab) },
        this.state.sample.workflow_runs,
      );
      this.handleWorkflowRunSelect(workflow);
    }

    this.setState({ currentTab: tab });
    const name = tab.replace(/\W+/g, "-").toLowerCase();
    trackEvent(`SampleView_tab-${name}_clicked`, {
      tab: tab,
    });
  };

  updateHistoryAndPersistOptions = () => {
    const urlState = pick(keys(URL_FIELDS), this.state);

    const localStorageFields = LOCAL_STORAGE_FIELDS;

    const localState = mapValuesWithKey((options: $TSFixMe, key: $TSFixMe) => {
      return omit(options.excludePaths || [], this.state[key]);
    }, localStorageFields);

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
    }).catch((error: $TSFixMe) => {
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

  handleFilterRemoved = ({
    key,
    subpath,
    value,
  }: {
    key: string;
    subpath?: string;
    value: $TSFixMe;
  }) => {
    const { selectedOptions } = this.state;

    const newSelectedOptions = { ...selectedOptions };
    switch (key) {
      case "taxa":
      case "thresholds":
      case "annotations":
        newSelectedOptions[key] = pull(value, newSelectedOptions[key]);
        break;
      case "categories":
        newSelectedOptions.categories = set(
          subpath,
          pull(value, get(subpath, newSelectedOptions.categories)),
          newSelectedOptions.categories,
        );
        break;
      default:
        return;
    }

    this.refreshDataFromOptionsChange({ key, newSelectedOptions });
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
    const { reportData } = this.state;

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
      case "taxa":
      case "categories":
      case "thresholds":
      case "readSpecificity":
        this.setState({
          filteredReportData: filterReportData({
            reportData,
            filters: newSelectedOptions,
          }),
        });
        break;
      // - metric: no need to update anything except for the option below
      case "metric":
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

  toggleSidebar = ({ mode }: { mode: "sampleDetails" | "taxonDetails" }) => {
    const { sidebarMode, sidebarVisible } = this.state;
    if (sidebarVisible && sidebarMode === mode) {
      this.setState({ sidebarVisible: false });
    } else {
      this.setState({
        sidebarMode: mode,
        sidebarVisible: true,
      });
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
  }: $TSFixMe) => {
    const { sample } = this.state;
    const workflowRuns = await kickoffConsensusGenome({
      sampleId: sample.id,
      workflow: WORKFLOWS.CONSENSUS_GENOME.value,
      accessionId,
      accessionName,
      taxonId,
      taxonName,
      technology: CG_TECHNOLOGY_OPTIONS.ILLUMINA,
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
    this.handleCloseConsensusGenomeCreationModal();

    // Close both modals in case they came via the previous runs modal
    this.handleCloseConsensusGenomePreviousModal();
  };

  // Clicking the HoverAction to open the CG creation modal
  handleConsensusGenomeClick = ({
    percentIdentity,
    taxId,
    taxName,
  }: $TSFixMe) => {
    const { coverageVizDataByTaxon } = this.state;

    const accessionData = get(taxId, coverageVizDataByTaxon);
    const usedAccessions = uniq(
      map("inputs.accession_id", get(taxId, this.getConsensusGenomeData())),
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
  }: $TSFixMe) => {
    const previousRuns = get(taxId, this.getConsensusGenomeData());
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

  handleAnnotationUpdate = () => {
    this.fetchSampleReportData();
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
  }: $TSFixMe) => {
    const { allowedFeatures = [] } = this.context || {};
    const blastSelectionModalVisible = allowedFeatures.includes(
      BLAST_V1_FEATURE,
    );

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
  }: $TSFixMe) => {
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

  handleCloseConsensusGenomeCreationModal = () => {
    this.setState({
      consensusGenomeCreationModalVisible: false,
    });
  };

  handleConsensusGenomeErrorModalRetry = async () => {
    const { consensusGenomeCreationParams, sample } = this.state;
    const {
      accessionId,
      accessionName,
      taxonId,
      taxonName,
    } = consensusGenomeCreationParams;

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

  handleConsensusGenomeErrorModalClose = () => {
    this.setState({ consensusGenomeErrorModalVisible: false });
  };

  handleCloseConsensusGenomePreviousModal = () => {
    this.setState({
      consensusGenomePreviousModalVisible: false,
    });
  };

  // Opening up a previous Consensus Genome run
  handlePreviousConsensusGenomeReportClick = ({ rowData }: $TSFixMe) => {
    this.setState(
      {
        workflowRun: rowData,
        consensusGenomePreviousModalVisible: false,
      },
      () => this.handleTabChange(TABS.CONSENSUS_GENOME),
    );
  };

  handleMetadataUpdate = (key: $TSFixMe, value: $TSFixMe) => {
    const { sample } = this.state;
    if (key === "name") {
      this.setState({
        sample: Object.assign({}, sample, { name: value }),
      });
    }
  };

  getSidebarParams = () => {
    const {
      backgrounds,
      currentTab,
      sample,
      selectedOptions,
      sidebarMode,
      sidebarTaxonData,
    } = this.state;
    const { snapshotShareId } = this.props;

    if (sidebarMode === "taxonDetails") {
      return {
        background: find({ id: selectedOptions.background }, backgrounds),
        // @ts-expect-error Property 'taxId' does not exist on type {}
        parentTaxonId: (sidebarTaxonData.genus || {}).taxId,
        taxonId: sidebarTaxonData.taxId,
        taxonName: sidebarTaxonData.name,
        taxonValues: {
          NT: { rpm: get("nt.rpm", sidebarTaxonData) || 0 },
          NR: { rpm: get("nr.rpm", sidebarTaxonData) || 0 },
        },
      };
    } else if (sidebarMode === "sampleDetails") {
      const sampleWorkflowLabels = compact([
        sample.initial_workflow === WORKFLOWS.SHORT_READ_MNGS.value &&
          size(sample.pipeline_runs) &&
          WORKFLOWS.SHORT_READ_MNGS.label,
        sample.initial_workflow === WORKFLOWS.LONG_READ_MNGS.value &&
          size(sample.pipeline_runs) &&
          WORKFLOWS.LONG_READ_MNGS.label,
        find(
          { workflow: WORKFLOWS.CONSENSUS_GENOME.value },
          sample.workflow_runs,
        ) && WORKFLOWS.CONSENSUS_GENOME.label,
        find({ workflow: WORKFLOWS.AMR.value }, sample.workflow_runs) &&
          WORKFLOWS.AMR.label,
      ]);

      return {
        currentRun: this.getCurrentRun(),
        currentWorkflowTab: currentTab,
        handleWorkflowTabChange: this.handleTabChange,
        onWorkflowRunSelect: this.handleWorkflowRunSelect,
        sample,
        sampleId: sample.id,
        sampleWorkflowLabels,
        snapshotShareId: snapshotShareId,
        onMetadataUpdate: this.handleMetadataUpdate,
      };
    }
    return {};
  };

  clearAllFilters = () => {
    const { reportData, selectedOptions } = this.state;

    const newSelectedOptions = { ...selectedOptions };
    newSelectedOptions.categories = {};
    newSelectedOptions.taxa = [];
    newSelectedOptions.thresholds = [];
    newSelectedOptions.annotations = [];

    this.setState(
      {
        selectedOptions: newSelectedOptions,
        filteredReportData: filterReportData({
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
        (workflow: $TSFixMe) => workflow.label === currentTab,
      ).value;

      if (workflowRun && workflowRun.workflow === workflowType) {
        return workflowRun;
      }

      if (pipelineVersion) {
        const currentRun = sample.workflow_runs.find((run: $TSFixMe) => {
          if (run.workflow === workflowType && !!run.wdl_version) {
            return run.wdl_version === pipelineVersion;
          } else {
            return false;
          }
        });
        return currentRun;
      } else {
        return head(
          sample.workflow_runs.filter(
            (run: $TSFixMe) => run.workflow === workflowType,
          ),
        );
      }
    }
  };

  computeWorkflowTabs = () => {
    const { reportMetadata, sample } = this.state;
    const { allowedFeatures = [] } = this.context || {};

    /* customLabel field was added for long read mNGS
    because the display name does not match the label field passed in the URL
    from DiscoveryView. If another tab is added that needs a customized display name,
    we should think about adding a config to handle tab logic and rendering. */
    const customTab = (
      value: string,
      status: string,
      customLabel?: string,
    ) => ({
      value: value,
      label: (
        <>
          {customLabel || value}
          <StatusLabel
            className={cs.statusLabel}
            inline
            status={status}
            type="beta"
          />
        </>
      ),
    });

    const mergedNtNrTab = customTab(TABS.MERGED_NT_NR, "Prototype");
    const amrTab = customTab(TABS.AMR, "Beta");
    const ontTab = customTab(
      TABS.LONG_READ_MNGS,
      "Beta",
      WORKFLOWS.LONG_READ_MNGS.pluralizedLabel,
    );

    const {
      [WORKFLOWS.SHORT_READ_MNGS.value]: shortReadMngs,
      [WORKFLOWS.LONG_READ_MNGS.value]: longReadMngs,
      [WORKFLOWS.CONSENSUS_GENOME.value]: cg,
      [WORKFLOWS.AMR.value]: amr,
    } = getWorkflowCount(sample);

    // only show deprecated label on old AMR tab to users who have the new AMR feature enabled
    const deprecatedAmrLabel = allowedFeatures.includes(AMR_V1_FEATURE)
      ? allowedFeatures.includes(AMR_DEPRECATED_FEATURE) &&
        reportMetadata.pipelineRunStatus === "SUCCEEDED" &&
        TABS.AMR_DEPRECATED
      : allowedFeatures.includes(AMR_DEPRECATED_FEATURE) &&
        reportMetadata.pipelineRunStatus === "SUCCEEDED" &&
        TABS.AMR;

    const workflowTabs = compact([
      shortReadMngs && TABS.SHORT_READ_MNGS,
      longReadMngs && allowedFeatures.includes(ONT_V1_FEATURE) && ontTab,
      shortReadMngs &&
        allowedFeatures.includes(MERGED_NT_NR_FEATURE) &&
        mergedNtNrTab,
      shortReadMngs && deprecatedAmrLabel,
      allowedFeatures.includes(AMR_V1_FEATURE) && amr && amrTab,
      cg && TABS.CONSENSUS_GENOME,
    ]);
    if (isEmpty(workflowTabs)) {
      return [
        WORKFLOWS[findInWorkflows(sample.initial_workflow, "value")]?.label,
      ];
    } else {
      return workflowTabs;
    }
  };

  renderSampleMessage = () => {
    const { loadingReport, pipelineRun, reportMetadata, sample } = this.state;
    const { snapshotShareId } = this.props;
    const { pipelineRunStatus, jobStatus } = reportMetadata;
    let status: $TSFixMe, message, subtitle, linkText, type, link, icon;
    // Error messages were previously sent from the server in the reportMetadata,
    // but after the switch to SFN are now sent as part of the sample's information.
    // Try to extract the error messages from the sample if possible, then try the
    // reportMetadata for older samples.
    const errorMessage =
      sample && sample.error_message
        ? sample.error_message
        : reportMetadata.errorMessage;
    const knownUserError =
      sample && sample.known_user_error
        ? sample.known_user_error
        : reportMetadata.knownUserError;

    if (loadingReport) {
      status = "Loading";
      message = "Loading report data.";
      icon = <IconLoading className={csSampleMessage.icon} />;
      type = "inProgress";
    } else if (
      pipelineRunStatus === "WAITING" &&
      sample &&
      !sample.upload_error
    ) {
      // Note that the pipeline status "WAITING" is obtained from the API at `app/services/pipeline_report_service.rb`
      status = "IN PROGRESS";
      message = jobStatus;
      icon = <IconLoading className={csSampleMessage.icon} />;
      type = "inProgress";
      if (pipelineRun && pipelineRun.pipeline_version) {
        linkText = "View Pipeline Visualization";
        link = `/samples/${sample.id}/pipeline_viz/${pipelineRun.pipeline_version}`;
      }
    } else {
      // Some kind of error or warning has occurred.
      if (sample) {
        // If an upload error occurred, the pipeline run might not exist so
        // only try to set these fields if the pipeline run started.
        if (pipelineRun) {
          pipelineRun.known_user_error = knownUserError;
          pipelineRun.error_message = errorMessage;
        }
        ({ status, message, subtitle, linkText, type, link } = sampleErrorInfo({
          sample,
          pipelineRun,
        }));
      }
      icon = <IconAlert className={csSampleMessage.icon} type={type} />;
    }
    // Hide sample message links on snapshot pages.
    if (snapshotShareId) {
      link = "";
      linkText = "";
    }

    return (
      <SampleMessage
        icon={icon}
        link={link}
        linkText={linkText}
        message={message}
        subtitle={subtitle}
        status={status}
        type={type}
        onClick={() =>
          trackEvent(
            ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_SAMPLE_MESSAGE_LINK_CLICKED,
            { status },
          )
        }
      />
    );
  };

  handleViewClick = ({ view }: $TSFixMe) => {
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
    const [csvHeaders, csvRows] = computeReportTableValuesForCSV(
      this.state.filteredReportData,
      this.state.selectedOptions,
      this.state.backgrounds,
    );

    return createCSVObjectURL(csvHeaders, csvRows);
  };

  getConsensusGenomeData = () => {
    const { sample } = this.state;
    // Mapping of taxids to WorkflowRuns
    return groupBy(
      "inputs.taxon_id",
      filter(
        { workflow: WORKFLOWS.CONSENSUS_GENOME.value },
        get("workflow_runs", sample),
      ),
    );
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

  renderReport = ({ displayMergedNtNrValue = false } = {}) => {
    const {
      backgrounds,
      currentTab,
      enableMassNormalizedBackgrounds,
      filteredReportData,
      lineageData,
      loadingReport,
      ownedBackgrounds,
      otherBackgrounds,
      pipelineRun,
      project,
      reportData,
      reportMetadata,
      sample,
      selectedOptions,
      view,
    } = this.state;
    const { snapshotShareId } = this.props;

    // TODO(omar): Do users want to filter by SourceDB if MergedNTNR is successful?
    // reportReady is true if the pipeline run hasn't failed and is report-ready
    // (might still be running Experimental, but at least taxon_counts has been loaded).
    if (reportMetadata.reportReady) {
      return (
        <div className={cs.reportViewContainer}>
          <div className={cs.reportFilters}>
            <ReportFilters
              backgrounds={backgrounds}
              loadingReport={loadingReport}
              ownedBackgrounds={ownedBackgrounds}
              otherBackgrounds={otherBackgrounds}
              shouldDisableFilters={displayMergedNtNrValue}
              onFilterChanged={this.handleOptionChanged}
              onFilterRemoved={this.handleFilterRemoved}
              sampleId={sample && sample.id}
              selected={selectedOptions}
              view={view}
              enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
              snapshotShareId={snapshotShareId}
              currentTab={currentTab}
            />
          </div>
          <div className={cs.reportHeader}>
            <div className={cs.statsRow}>
              {renderReportInfo(currentTab, reportMetadata)}
              <div className={cs.statsRowFilterInfo}>
                {filteredMessage(currentTab, filteredReportData, reportData)}
                {!!countFilters(selectedOptions) && (
                  <span className={cs.clearAllFilters}>
                    <Button
                      sdsStyle="minimal"
                      sdsType="secondary"
                      onClick={this.clearAllFilters}
                    >
                      Clear Filters
                    </Button>
                  </span>
                )}
              </div>
            </div>
            <div className={cs.reportViewSelector}>
              <ReportViewSelector
                view={view}
                onViewClick={this.handleViewClick}
              />
            </div>
          </div>
          {view === "table" && (
            <div className={cs.reportTable}>
              <ReportTable
                alignVizAvailable={
                  !!(reportMetadata && reportMetadata.alignVizAvailable)
                }
                consensusGenomeData={this.getConsensusGenomeData()}
                consensusGenomeEnabled={sample && sample.editable}
                currentTab={currentTab}
                data={filteredReportData}
                displayMergedNtNrValue={displayMergedNtNrValue}
                displayNoBackground={isNil(selectedOptions.background)}
                fastaDownloadEnabled={
                  !!(reportMetadata && reportMetadata.hasByteRanges)
                }
                initialDbType={displayMergedNtNrValue ? "merged_nt_nr" : "nt"}
                onAnnotationUpdate={this.handleAnnotationUpdate}
                onBlastClick={this.handleBlastClick}
                onConsensusGenomeClick={this.handleConsensusGenomeClick}
                onCoverageVizClick={this.handleCoverageVizClick}
                onPreviousConsensusGenomeClick={
                  this.handlePreviousConsensusGenomeClick
                }
                onTaxonNameClick={withAnalytics(
                  this.handleTaxonClick,
                  "PipelineSampleReport_taxon-sidebar-link_clicked",
                )}
                phyloTreeAllowed={sample ? sample.editable : false}
                pipelineVersion={pipelineRun && pipelineRun.pipeline_version}
                pipelineRunId={pipelineRun && pipelineRun.id}
                projectId={project && project.id}
                projectName={project && project.name}
                sampleId={sample && sample.id}
                snapshotShareId={snapshotShareId}
              />
            </div>
          )}
          {view === "tree" && filteredReportData.length > 0 && (
            <div>
              <TaxonTreeVis
                lineage={lineageData}
                metric={selectedOptions.metric}
                nameType={selectedOptions.nameType}
                onTaxonClick={this.handleTaxonClick}
                taxa={filteredReportData}
              />
            </div>
          )}
        </div>
      );
    } else {
      // The report is either in progress or encountered an error.
      return this.renderSampleMessage();
    }
  };

  renderConsensusGenomeView = () => {
    const {
      loadingWorkflowRunResults,
      sample,
      workflowRunResults,
    } = this.state;

    return (
      sample && (
        <ConsensusGenomeView
          onWorkflowRunSelect={this.handleWorkflowRunSelect}
          sample={sample}
          loadingResults={loadingWorkflowRunResults}
          workflowRun={this.getCurrentRun() as WorkflowRun}
          workflowRunResults={workflowRunResults}
        />
      )
    );
  };

  renderAmrView = () => {
    return (
      this.state.sample && (
        <AmrView
          sample={this.state.sample}
          loadingResults={this.state.loadingWorkflowRunResults}
          workflowRun={this.getCurrentRun() as WorkflowRun}
        />
      )
    );
  };

  handleBlastContigsModalClose = () =>
    this.setState({ blastContigsModalVisible: false });

  handleBlastReadsModalClose = () =>
    this.setState({ blastReadsModalVisible: false });

  handleBlastV1ContigsModalClose = () =>
    this.setState({ blastV1ContigsModalVisible: false });

  handleBlastV1ReadsModalClose = () =>
    this.setState({ blastV1ReadsModalVisible: false });

  handleBlastSelectionModalClose = () =>
    this.setState({ blastSelectionModalVisible: false });

  handleBlastSelectionModalContinue = (blastModalInfo: $TSFixMe) => {
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
              deletable={sample ? sample.deletable : false}
              editable={sample ? sample.editable : false}
              getDownloadReportTableWithAppliedFiltersLink={
                this.getDownloadReportTableWithAppliedFiltersLink
              }
              hasAppliedFilters={hasAppliedFilters(selectedOptions)}
              onDetailsClick={this.toggleSampleDetailsSidebar}
              onPipelineVersionChange={this.handlePipelineVersionSelect}
              onShareClick={this.handleShareClick}
              project={project}
              projectSamples={projectSamples}
              reportMetadata={reportMetadata}
              sample={sample}
              snapshotShareId={snapshotShareId}
              view={view}
            />
          </div>
          <div className={cs.tabsContainer}>
            {sample && this.computeWorkflowTabs().length ? (
              <Tabs
                className={cs.tabs}
                tabs={this.computeWorkflowTabs()}
                value={currentTab}
                onChange={this.handleTabChange}
              />
            ) : (
              <div className={cs.dividerContainer}>
                <div className={cs.divider} />
              </div>
            )}
          </div>
          {currentTab === TABS.SHORT_READ_MNGS && this.renderReport()}
          {currentTab === TABS.LONG_READ_MNGS && this.renderReport()}
          {currentTab === TABS.MERGED_NT_NR &&
            this.renderReport({ displayMergedNtNrValue: true })}
          {currentTab === TABS.AMR_DEPRECATED && amrDeprecatedData && (
            <DeprecatedAmrView amr={amrDeprecatedData} />
          )}
          {currentTab === TABS.AMR && this.renderAmrView()}
          {currentTab === TABS.CONSENSUS_GENOME &&
            this.renderConsensusGenomeView()}
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
        {isPipelineFeatureAvailable(
          COVERAGE_VIZ_FEATURE,
          get("pipeline_version", pipelineRun),
        ) && (
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
          />
        )}
        {consensusGenomeCreationModalVisible && (
          <ConsensusGenomeCreationModal
            consensusGenomeData={consensusGenomeData}
            onClose={this.handleCloseConsensusGenomeCreationModal}
            onCreation={this.onConsensusGenomeCreation}
            open={consensusGenomeCreationModalVisible}
            sample={sample}
          />
        )}
        {consensusGenomePreviousModalVisible && (
          <ConsensusGenomePreviousModal
            consensusGenomeData={consensusGenomePreviousParams}
            onClose={this.handleCloseConsensusGenomePreviousModal}
            onNew={this.handleConsensusGenomeClick}
            onRowClick={this.handlePreviousConsensusGenomeReportClick}
            open={consensusGenomePreviousModalVisible}
            sample={sample}
          />
        )}
        {consensusGenomeErrorModalVisible && (
          <ErrorModal
            helpLinkEvent={
              ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_ERROR_MODAL_HELP_LINK_CLICKED
            }
            labelText="Failed"
            open={consensusGenomeErrorModalVisible}
            onCancel={this.handleConsensusGenomeErrorModalClose}
            onConfirm={this.handleConsensusGenomeErrorModalRetry}
            title={
              "Sorry! There was an error starting your consensus genome run."
            }
          />
        )}
        {blastSelectionModalVisible && (
          <BlastSelectionModal
            open
            onContinue={this.handleBlastSelectionModalContinue}
            onClose={this.handleBlastSelectionModalClose}
            taxonName={get("taxName", blastData)}
            taxonStatsByCountType={get("taxonStatsByCountType", blastData)}
          />
        )}
        {/* These are the BLAST v0 modals that will be removed once BLAST v1 is released **/}
        {blastContigsModalVisible && (
          <BlastContigsModal
            open
            onClose={this.handleBlastContigsModalClose}
            context={get("context", blastData)}
            pipelineVersion={get("pipelineVersion", blastData)}
            sampleId={get("sampleId", blastData)}
            taxonName={get("taxName", blastData)}
            taxonId={get("taxId", blastData)}
          />
        )}
        {blastReadsModalVisible && (
          <BlastReadsModal
            open
            onClose={this.handleBlastReadsModalClose}
            context={get("context", blastData)}
            pipelineVersion={get("pipelineVersion", blastData)}
            sampleId={get("sampleId", blastData)}
            taxonName={get("taxName", blastData)}
            taxonLevel={get("taxLevel", blastData)}
            taxonId={get("taxId", blastData)}
          />
        )}
        {/* BLAST v1 modals **/}
        {blastV1ContigsModalVisible && (
          <BlastV1ContigsModal
            open
            onClose={this.handleBlastV1ContigsModalClose}
            blastModalInfo={blastModalInfo}
            context={get("context", blastData)}
            pipelineVersion={get("pipelineVersion", blastData)}
            sampleId={get("sampleId", blastData)}
            taxonName={get("taxName", blastData)}
            taxonId={get("taxId", blastData)}
          />
        )}
        {blastV1ReadsModalVisible && (
          <BlastV1ReadsModal
            open
            onClose={this.handleBlastV1ReadsModalClose}
            blastModalInfo={blastModalInfo}
            context={get("context", blastData)}
            pipelineVersion={get("pipelineVersion", blastData)}
            sampleId={get("sampleId", blastData)}
            taxonName={get("taxName", blastData)}
            taxonLevel={get("taxLevel", blastData)}
            taxonId={get("taxId", blastData)}
          />
        )}
      </React.Fragment>
    );
  }
}

SampleView.contextType = UserContext;

const mapDispatchToProps = { updateDiscoveryProjectId: updateProjectIds };

// Don't need mapStateToProps yet so pass in null
const connectedComponent = connect(null, mapDispatchToProps)(SampleView);

// @ts-expect-error ts-migrate(2540) FIXME: Cannot assign to 'name' because it is a read-only ... Remove this comment to see the full error message
connectedComponent.name = "SampleView";

export default connectedComponent;
