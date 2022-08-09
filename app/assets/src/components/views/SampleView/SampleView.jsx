import { Button } from "czifui";
import deepEqual from "fast-deep-equal";
import {
  all,
  compact,
  every,
  filter,
  find,
  flatten,
  get,
  getOr,
  groupBy,
  has,
  head,
  isEmpty,
  isNull,
  isNil,
  keys,
  map,
  mapValues,
  merge,
  omit,
  pick,
  pull,
  set,
  size,
  some,
  snakeCase,
  sum,
  uniq,
  values,
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
import { getAmrData } from "~/api/amr";
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
import AMRView from "~/components/AMRView";
import CoverageVizBottomSidebar from "~/components/common/CoverageVizBottomSidebar";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { UserContext } from "~/components/common/UserContext";
import NarrowContainer from "~/components/layout/NarrowContainer";
import ErrorModal from "~/components/ui/containers/ErrorModal";
import Tabs from "~/components/ui/controls/Tabs";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { createCSVObjectURL, sanitizeCSVRow } from "~/components/utils/csv";
import {
  AMR_TABLE_FEATURE,
  MERGED_NT_NR_FEATURE,
} from "~/components/utils/features";
import { logError } from "~/components/utils/logUtil";
import { diff } from "~/components/utils/objectUtil";
import {
  COVERAGE_VIZ_FEATURE,
  isPipelineFeatureAvailable,
  MASS_NORMALIZED_FEATURE,
} from "~/components/utils/pipeline_versions";
import PropTypes from "~/components/utils/propTypes";
import { sampleErrorInfo } from "~/components/utils/sample";
import { showToast } from "~/components/utils/toast";
import { WORKFLOWS } from "~/components/utils/workflows";
import { CG_TECHNOLOGY_OPTIONS } from "~/components/views/SampleUploadFlow/constants";
import ConsensusGenomeView from "~/components/views/SampleView/ConsensusGenomeView";
import SampleMessage from "~/components/views/SampleView/SampleMessage";
import BlastContigsModal from "~/components/views/blastn/BlastContigsModal";
import BlastReadsModal from "~/components/views/blastn/BlastReadsModal";
import ConsensusGenomeCreationModal from "~/components/views/consensus_genome/ConsensusGenomeCreationModal";
import ConsensusGenomePreviousModal from "~/components/views/consensus_genome/ConsensusGenomePreviousModal";
import { getGeneraPathogenCounts } from "~/helpers/taxon";
import { copyShortUrlToClipboard } from "~/helpers/url";
import { updateProjectIds } from "~/redux/modules/discovery/slice";
import { IconAlert, IconLoading } from "~ui/icons";
import StatusLabel from "~ui/labels/StatusLabel";
import Notification from "~ui/notifications/Notification";

import ReportFilters from "./ReportFilters";
import ReportTable from "./ReportTable";
import ReportViewSelector from "./ReportViewSelector";
import SampleViewHeader from "./SampleViewHeader";
import TaxonTreeVis from "./TaxonTreeVis";
import {
  GENUS_LEVEL_INDEX,
  LOCAL_STORAGE_FIELDS,
  METRIC_DECIMAL_PLACES,
  NOTIFICATION_TYPES,
  PIPELINE_RUN_TABS,
  SPECIES_LEVEL_INDEX,
  SUCCEEDED_STATE,
  TABS,
  TAXON_COUNT_TYPE_METRICS,
  TAXON_GENERAL_FIELDS,
  TREE_METRICS,
  URL_FIELDS,
  TAX_LEVEL_GENUS,
  TAX_LEVEL_SPECIES,
  KEY_SAMPLE_VIEW_OPTIONS,
  KEY_SELECTED_OPTIONS_BACKGROUND,
} from "./constants";
import csSampleMessage from "./sample_message.scss";
import cs from "./sample_view.scss";

const mapValuesWithKey = mapValues.convert({ cap: false });

class SampleView extends React.Component {
  constructor(props) {
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
      this.showNotification(NOTIFICATION_TYPES.discoveryViewFiltersPersisted);
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
      amrData: null,
      backgrounds: [],
      blastData: {},
      blastContigsModalVisible: false,
      blastReadsModalVisible: false,
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
        ...this.getDefaultSelectedOptions(),
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
    if (window.analytics) {
      window.analytics.page();
    }
    // fetchBackgrounds will subsequently call fetchSample and fetchSampleReportData.
    this.fetchBackgrounds();
  };

  componentDidUpdate(_, prevState) {
    const {
      amrData,
      currentTab,
      loadingWorkflowRunResults,
      workflowRun,
      workflowRunResults,
    } = this.state;

    if (currentTab === TABS.AMR && !amrData) {
      this.fetchAmrData();
    }

    if (currentTab === TABS.CONSENSUS_GENOME) {
      const currentRun = this.getCurrentRun();
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
      const currentWorkflowRun = this.getCurrentRun();

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

  loadState = (store, key) => {
    try {
      return JSON.parse(store.getItem(key)) || {};
    } catch (e) {
      // Avoid possible bad transient state related crash
      // eslint-disable-next-line no-console
      console.warn(`Bad state: ${e}`);
    }
    return {};
  };

  getDefaultSelectedOptions = () => {
    return {
      annotations: [],
      background: null,
      categories: { categories: [], subcategories: { Viruses: [] } },
      // Don't set the default metric as 'aggregatescore' because it computed based on the background model and will error if the background model is 'None'.
      metric: find({ value: "nt_r" }, TREE_METRICS).value,
      nameType: "Scientific name",
      readSpecificity: 0,
      taxa: [],
      thresholds: [],
    };
  };

  // TODO(omar): Generalize when new workflows are introduced
  getWorkflowCount = sample => ({
    [WORKFLOWS.SHORT_READ_MNGS.value]: size(sample.pipeline_runs),
    [WORKFLOWS.CONSENSUS_GENOME.value]: size(sample.workflow_runs),
  });

  determineInitialTab = ({
    initialWorkflow,
    workflowCount: {
      [WORKFLOWS.SHORT_READ_MNGS.value]: mngs,
      [WORKFLOWS.CONSENSUS_GENOME.value]: cg,
    },
  }) => {
    if (mngs) {
      return TABS.SHORT_READ_MNGS;
    } else if (cg) {
      return TABS.CONSENSUS_GENOME;
    } else {
      return initialWorkflow === WORKFLOWS.SHORT_READ_MNGS.value
        ? TABS.SHORT_READ_MNGS
        : TABS.CONSENSUS_GENOME;
    }
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
    let newSelectedOptions = { ...selectedOptions };
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
        this.showNotification(NOTIFICATION_TYPES.invalidBackground, {
          backgroundName: selectedBackground.name,
        });
    }

    const workflowCount = this.getWorkflowCount(sample);
    const newCurrentTab =
      currentTab ||
      this.determineInitialTab({
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

  fetchPersistedBackground = async ({ projectId }) => {
    const { sharedWithNoBackground, selectedOptions } = this.state;

    if (projectId) {
      let persistedBackground;
      let hasPersistedBackground = false;

      await getPersistedBackground(projectId)
        .then(({ background_id: persistedBackgroundFetched }) => {
          persistedBackground = persistedBackgroundFetched;
          hasPersistedBackground = true;
        })
        .catch(error => {
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
      const projectSamples = await getSamples({
        projectId: project.id,
        snapshotShareId: snapshotShareId,
        basic: true,
      });

      this.setState({ projectSamples: projectSamples.samples });
    }
  };

  processRawSampleReportData = rawReportData => {
    const { selectedOptions } = this.state;

    const reportData = [];
    const highlightedTaxIds = new Set(rawReportData.highlightedTaxIds);
    if (rawReportData.sortedGenus) {
      const generaPathogenCounts = getGeneraPathogenCounts(
        rawReportData.counts[SPECIES_LEVEL_INDEX],
      );

      rawReportData.sortedGenus.forEach(genusTaxId => {
        let hasHighlightedChildren = false;
        const childrenSpecies =
          rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId].species_tax_ids;
        const speciesData = childrenSpecies.map(speciesTaxId => {
          const isHighlighted = highlightedTaxIds.has(speciesTaxId);
          hasHighlightedChildren = hasHighlightedChildren || isHighlighted;
          const speciesInfo =
            rawReportData.counts[SPECIES_LEVEL_INDEX][speciesTaxId];
          const speciesWithAdjustedMetricPrecision = this.adjustMetricPrecision(
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

    this.setDisplayName({ reportData, ...selectedOptions });
    const filteredReportData = this.filterReportData({
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

  handleInvalidBackgroundSelection = ({ invalidBackgroundId }) => {
    const { backgrounds } = this.state;

    const invalidBackground = backgrounds.find(
      background => invalidBackgroundId === background.id,
    );

    this.handleOptionChanged({ key: "background", value: null });
    this.showNotification(NOTIFICATION_TYPES.invalidBackground, {
      backgroundName: invalidBackground.name,
    });
  };

  // backgroundId is an optional parameter here that can be omitted.
  // If omitted, the sample report data will be fetched with the selectedOptions.background
  fetchSampleReportData = async ({ backgroundId } = {}) => {
    const { snapshotShareId, sampleId } = this.props;
    const { allowedFeatures = [] } = this.context || {};
    const { currentTab, selectedOptions, pipelineVersion } = this.state;

    const backgroundIdUsed = backgroundId || selectedOptions.background;
    const mergeNtNr =
      allowedFeatures.includes(MERGED_NT_NR_FEATURE) &&
      (currentTab === TABS.MERGED_NT_NR || currentTab === TABS.SHORT_READ_MNGS);

    this.setState({ loadingReport: true });
    trackEvent("PipelineSampleReport_sample_viewed", {
      sampleId,
    });
    try {
      const rawReportData = await getSampleReportData({
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

  fetchAmrData = async () => {
    const { sample } = this.state;
    const amrData = await getAmrData(sample.id);
    this.setState({ amrData });
  };

  fetchBackgrounds = async () => {
    const { snapshotShareId } = this.props;

    this.setState({ loadingReport: true });
    const {
      owned_backgrounds: ownedBackgrounds,
      other_backgrounds: otherBackgrounds,
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

  applyFilters = ({
    row,
    categories,
    subcategories,
    thresholds,
    readSpecificity,
    taxa,
    annotations,
  }) => {
    // When adding filters consider their order based on filter complexity (more complex later)
    // and effeciency (filters more likely to filter out more taxa earlier)
    return (
      this.filterTaxa({ row, taxa }) &&
      this.filterAnnotations({ row, annotations }) &&
      this.filterCategories({ row, categories, subcategories }) &&
      this.filterReadSpecificity({ row, readSpecificity }) &&
      this.filterThresholds({ row, thresholds })
    );
  };

  filterTaxa = ({ row, taxa }) => {
    // If there's no taxa to filter, then return true
    if (isEmpty(taxa)) return true;

    return some(
      taxon => row.taxId === taxon.id || row.genus_tax_id === taxon.id,
      taxa,
    );
  };

  filterAnnotations = ({ row, annotations }) => {
    if (isEmpty(annotations)) return true;
    // When this component is converted to typescript, we can define a type for the
    // annotation filters and row data, and remove this comment
    // Use snake case on filter options and raw data for consistent comparisons
    // selected annotation options from filter are "Hit", "Not a hit", "Inconclusive"
    // annotations options from the source data are "hit", "not_a_hit", "inconclusive"
    const selectedAnnotationsInSnakeCase = map(a => snakeCase(a), annotations);
    return selectedAnnotationsInSnakeCase.includes(snakeCase(row.annotation));
  };

  filterCategories = ({ row, categories, subcategories }) => {
    // no category have been chosen: all pass
    if (categories.size === 0 && subcategories.size === 0) {
      return true;
    }

    // at least one of taxon's subcategory was selected
    if (
      some(
        subcategory => subcategories.has(subcategory),
        row.subcategories || [],
      )
    ) {
      return true;
    }

    // taxon's category was selected and its subcategories were not excluded
    let allSubcategoriesIncluded = all(
      subcategory => subcategories.has(subcategory),
      row.subcategories || [],
    );
    if (
      (categories.has(row.category) && allSubcategoriesIncluded) ||
      (categories.has("uncategorized") && row.category === null)
    ) {
      return true;
    }

    return false;
  };

  getTaxonMetricValue = (row, metric) => {
    let parsedMetric = metric.split(":");
    let parsedValue = get(parsedMetric, row);
    return parsedValue;
  };

  adjustMetricPrecision = species => {
    Object.entries(species).forEach(([key, metricValue]) => {
      if (isNil(metricValue)) {
        // Do nothing
      } else if (key in METRIC_DECIMAL_PLACES) {
        species[key] = parseFloat(
          Number(metricValue).toFixed(METRIC_DECIMAL_PLACES[key]),
        );
      } else if (["nt", "nr", "merged_nt_nr"].includes(key)) {
        Object.entries(species[key]).forEach(([metricKey, metricValue]) => {
          if (metricKey in METRIC_DECIMAL_PLACES && metricValue) {
            species[key][metricKey] = parseFloat(
              Number(metricValue).toFixed(METRIC_DECIMAL_PLACES[metricKey]),
            );
          }
        });
      }
    });
    return species;
  };

  filterThresholds = ({ row, thresholds }) => {
    if (thresholds && thresholds.length) {
      const res = every(threshold => {
        const { metric, operator, value } = threshold;
        const parsedThresholdValue = parseFloat(value);
        const parsedValue = this.getTaxonMetricValue(row, metric);

        switch (operator) {
          case ">=":
            return parsedThresholdValue <= parsedValue;
          case "<=":
            return parsedThresholdValue >= parsedValue;
        }
        return true;
      }, thresholds);
      return res;
    }

    return true;
  };

  filterReadSpecificity = ({ row, readSpecificity }) => {
    // for read specificity, species filtering is determined by their genus
    return (
      !readSpecificity ||
      (row.taxLevel === "genus" ? row.taxId > 0 : row.genus_tax_id > 0)
    );
  };

  setDisplayName = ({ reportData, nameType }) => {
    const useScientific = nameType === "Scientific name";
    reportData.forEach(genus => {
      genus.displayName = useScientific ? genus.name : genus.common_name;
      genus.species.forEach(species => {
        species.displayName = useScientific
          ? species.name
          : species.common_name;
      });
    });
  };

  filterReportData = ({
    reportData,
    filters: { categories, thresholds, readSpecificity, taxa, annotations },
  }) => {
    const categoriesSet = new Set(
      map(c => c.toLowerCase(), categories.categories || []),
    );
    const subcategoriesSet = new Set(
      map(sc => sc.toLowerCase(), flatten(values(categories.subcategories))),
    );

    const filteredData = [];
    reportData.forEach(genusRow => {
      genusRow.passedFilters = this.applyFilters({
        row: genusRow,
        categories: categoriesSet,
        subcategories: subcategoriesSet,
        thresholds,
        readSpecificity,
        taxa,
        annotations,
      });

      genusRow.filteredSpecies = genusRow.species.filter(speciesRow =>
        this.applyFilters({
          row: speciesRow,
          categories: categoriesSet,
          subcategories: subcategoriesSet,
          thresholds,
          readSpecificity,
          taxa,
          annotations,
        }),
      );
      if (genusRow.passedFilters || genusRow.filteredSpecies.length) {
        filteredData.push(genusRow);
      }
    });

    return filteredData;
  };

  handlePipelineVersionSelect = newPipelineVersion => {
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
    } else if (currentTab === TABS.CONSENSUS_GENOME) {
      const newRun = find(
        { wdl_version: newPipelineVersion },
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

  handleWorkflowRunSelect = workflowRun => {
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

  handleTabChange = tab => {
    this.setState({ currentTab: tab });
    const name = tab.replace(/\W+/g, "-").toLowerCase();
    trackEvent(`SampleView_tab-${name}_clicked`, {
      tab: tab,
    });
  };

  updateHistoryAndPersistOptions = () => {
    const urlState = pick(keys(URL_FIELDS), this.state);

    let localStorageFields = LOCAL_STORAGE_FIELDS;

    let localState = mapValuesWithKey((options, key) => {
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

  handleOptionChanged = ({ key, value }) => {
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

  persistNewBackgroundModelSelection = async ({ newBackgroundId }) => {
    const { hasPersistedBackground, project } = this.state;

    const persistBackgroundApi = !hasPersistedBackground
      ? createPersistedBackground
      : updatePersistedBackground;

    await persistBackgroundApi({
      projectId: project.id,
      backgroundId: newBackgroundId,
    }).catch(error => {
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

  handleFilterRemoved = ({ key, subpath, value }) => {
    const { selectedOptions } = this.state;

    let newSelectedOptions = { ...selectedOptions };
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

  handleCoverageVizClick = newCoverageVizParams => {
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

  // Aggregate the accessions from multiple species into a single data object.
  // Used for coverage viz.
  getCombinedAccessionDataForSpecies = speciesTaxons => {
    const { coverageVizDataByTaxon } = this.state;
    // This helper function gets the best accessions for a species taxon.
    const getSpeciesBestAccessions = taxon => {
      const speciesBestAccessions = get(
        [taxon.taxId, "best_accessions"],
        coverageVizDataByTaxon,
      );
      // Add the species taxon name to each accession.
      return map(
        accession => ({
          ...accession,
          // Use snake_case for consistency with other fields.
          taxon_name: taxon.name,
          taxon_common_name: taxon.commonName,
        }),
        speciesBestAccessions,
      );
    };

    const speciesTaxIds = map("taxId", speciesTaxons);

    return {
      best_accessions: flatten(
        compact(map(getSpeciesBestAccessions, speciesTaxons)),
      ),
      num_accessions: sum(
        map(
          taxId => get([taxId, "num_accessions"], coverageVizDataByTaxon),
          speciesTaxIds,
        ),
      ),
    };
  };

  getCoverageVizParams = () => {
    const { coverageVizParams, coverageVizDataByTaxon } = this.state;

    if (!coverageVizParams) {
      return {};
    }

    let accessionData = null;

    // For genus-level taxons, we aggregate all the available species-level taxons for that genus.
    if (coverageVizParams.taxLevel === "genus") {
      accessionData = this.getCombinedAccessionDataForSpecies(
        coverageVizParams.taxSpecies,
      );
    } else {
      accessionData = get(coverageVizParams.taxId, coverageVizDataByTaxon);
    }
    return {
      taxonId: coverageVizParams.taxId,
      taxonName: coverageVizParams.taxName,
      taxonCommonName: coverageVizParams.taxCommonName,
      taxonLevel: coverageVizParams.taxLevel,
      alignmentVizUrl: coverageVizParams.alignmentVizUrl,
      accessionData,
    };
  };

  refreshDataFromOptionsChange = ({ key, newSelectedOptions }) => {
    const { reportData } = this.state;

    let updateSelectedOptions = true;
    // different behavior given type of option
    switch (key) {
      // - name type: reset table to force a rerender
      case "nameType":
        this.setDisplayName({ reportData, ...newSelectedOptions });
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
          filteredReportData: this.filterReportData({
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

  toggleSidebar = ({ mode }) => {
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

  handleTaxonClick = clickedTaxonData => {
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
  }) => {
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
    this.showNotification(NOTIFICATION_TYPES.consensusGenomeCreated);
    this.handleCloseConsensusGenomeCreationModal();

    // Close both modals in case they came via the previous runs modal
    this.handleCloseConsensusGenomePreviousModal();
  };

  // Clicking the HoverAction to open the CG creation modal
  handleConsensusGenomeClick = ({ percentIdentity, taxId, taxName }) => {
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
  }) => {
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
    taxName,
    taxLevel,
    taxId,
  }) => {
    this.setState({
      ...(shouldBlastContigs
        ? { blastContigsModalVisible: true }
        : { blastReadsModalVisible: true }),
      blastData: {
        context,
        pipelineVersion,
        sampleId,
        taxName,
        taxLevel,
        taxId,
      },
    });
  };

  onConsensusGenomeCreation = async ({
    accessionId,
    accessionName,
    taxonId,
    taxonName,
  }) => {
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
  handlePreviousConsensusGenomeReportClick = ({ rowData }) => {
    this.setState(
      {
        workflowRun: rowData,
        consensusGenomePreviousModalVisible: false,
      },
      () => this.handleTabChange(TABS.CONSENSUS_GENOME),
    );
  };

  handleMetadataUpdate = (key, value) => {
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
        size(sample.pipeline_runs) && WORKFLOWS.SHORT_READ_MNGS.label,
        size(sample.workflow_runs) && WORKFLOWS.CONSENSUS_GENOME.label,
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

  countReportRows = () => {
    const { currentTab, filteredReportData, reportData } = this.state;

    let total = 0;
    let filtered = 0;
    if (currentTab === TABS.MERGED_NT_NR) {
      reportData.forEach(genusRow => {
        if (genusRow["merged_nt_nr"]) {
          total += 1;
          genusRow.species.forEach(speciesRow => {
            if (speciesRow["merged_nt_nr"]) {
              total += 1;
            }
          });
        }
      });
      filteredReportData.forEach(genusRow => {
        if (genusRow["merged_nt_nr"]) {
          filtered += 1;
          genusRow.filteredSpecies.forEach(speciesRow => {
            if (speciesRow["merged_nt_nr"]) {
              filtered += 1;
            }
          });
        }
      });
    } else {
      total = reportData.length;
      filtered = filteredReportData.length;
      reportData.forEach(genusRow => {
        total += genusRow.species.length;
        filtered += genusRow.filteredSpecies.length;
      });
    }

    return { total, filtered };
  };

  filteredMessage = () => {
    const { total, filtered } = this.countReportRows();

    return filtered !== total
      ? `${filtered} rows passing the above filters, out of ${total} total rows`
      : `${total} rows`;
  };

  truncatedMessage = () => {
    const {
      reportMetadata: { truncatedReadsCount },
    } = this.state;
    return (
      truncatedReadsCount &&
      `Initial input was truncated to ${truncatedReadsCount} reads.`
    );
  };

  subsamplingMessage = () => {
    const {
      reportMetadata: { subsampledReadsCount, adjustedRemainingReadsCount },
    } = this.state;
    return (
      subsampledReadsCount &&
      adjustedRemainingReadsCount &&
      subsampledReadsCount !== adjustedRemainingReadsCount &&
      `Report values are computed from ${subsampledReadsCount} unique reads subsampled \
        randomly from the ${adjustedRemainingReadsCount} reads passing host and quality filters.`
    );
  };

  whitelistedMessage = () => {
    const {
      reportMetadata: { taxonWhitelisted },
    } = this.state;
    return (
      taxonWhitelisted &&
      `Report was processed with a whitelist filter of respiratory pathogens.`
    );
  };

  renderReportInfo = () => {
    return compact([
      this.truncatedMessage(),
      this.subsamplingMessage(),
      this.filteredMessage(),
      this.whitelistedMessage(),
    ]).map((msg, i) => (
      <span className={cs.reportInfoMsg} key={`msg-${i}`}>
        {msg}
      </span>
    ));
  };

  clearAllFilters = () => {
    const { reportData, selectedOptions } = this.state;

    const newSelectedOptions = { ...selectedOptions };
    newSelectedOptions.categories = {};
    newSelectedOptions.taxa = [];
    newSelectedOptions.thresholds = [];

    this.setState(
      {
        selectedOptions: newSelectedOptions,
        filteredReportData: this.filterReportData({
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

  countFilters = () => {
    const {
      selectedOptions: { categories, thresholds, taxa },
    } = this.state;

    let numFilters = taxa.length;
    numFilters += thresholds.length;
    numFilters += (categories.categories || []).length;
    numFilters += sum(
      map(v => v.length, values(categories.subcategories || {})),
    );
    return numFilters;
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
        const currentRun = sample.workflow_runs.find(run => {
          if (run.workflow === workflowType && !!run.wdl_version) {
            return run.wdl_version === pipelineVersion;
          } else {
            return false;
          }
        });
        return currentRun;
      } else {
        return head(
          sample.workflow_runs.filter(run => run.workflow === workflowType),
        );
      }
    }
  };

  computeWorkflowTabs = () => {
    const { reportMetadata, sample } = this.state;
    const { allowedFeatures = [] } = this.context || {};

    const mergedNtNrTab = {
      value: TABS.MERGED_NT_NR,
      label: (
        <>
          {TABS.MERGED_NT_NR}
          <StatusLabel
            className={cs.statusLabel}
            inline
            status="Prototype"
            type="beta"
          />
        </>
      ),
    };

    const {
      [WORKFLOWS.SHORT_READ_MNGS.value]: mngs,
      [WORKFLOWS.CONSENSUS_GENOME.value]: cg,
    } = this.getWorkflowCount(sample);
    const workflowTabs = compact([
      mngs && TABS.SHORT_READ_MNGS,
      mngs && allowedFeatures.includes(MERGED_NT_NR_FEATURE) && mergedNtNrTab,
      allowedFeatures.includes(AMR_TABLE_FEATURE) &&
        reportMetadata.pipelineRunStatus === "SUCCEEDED" &&
        TABS.AMR,
      cg && TABS.CONSENSUS_GENOME,
    ]);

    if (isEmpty(workflowTabs)) {
      return sample.initial_workflow === WORKFLOWS.SHORT_READ_MNGS.value
        ? [TABS.SHORT_READ_MNGS]
        : [TABS.CONSENSUS_GENOME];
    } else {
      return workflowTabs;
    }
  };

  renderSampleMessage = () => {
    const { loadingReport, pipelineRun, reportMetadata, sample } = this.state;
    const { snapshotShareId } = this.props;
    const { pipelineRunStatus, jobStatus } = reportMetadata;
    let status, message, subtitle, linkText, type, link, icon;
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
        ({
          status,
          message,
          subtitle,
          linkText,
          type,
          link,
          icon,
        } = sampleErrorInfo({
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

  handleViewClick = ({ view }) => {
    trackEvent(`PipelineSampleReport_${view}-view-menu_clicked`);
    this.setState({ view }, () => {
      this.updateHistoryAndPersistOptions();
    });
  };

  showNotification = (notification, params = {}) => {
    switch (notification) {
      case NOTIFICATION_TYPES.invalidBackground: {
        showToast(
          ({ closeToast }) =>
            this.renderIncompatibleBackgroundError(closeToast, params),
          {
            autoClose: 12000,
          },
        );
        break;
      }
      case NOTIFICATION_TYPES.consensusGenomeCreated: {
        showToast(
          ({ closeToast }) => this.renderConsensusGenomeCreated(closeToast),
          {
            autoClose: 12000,
          },
        );
        break;
      }
      case NOTIFICATION_TYPES.discoveryViewFiltersPersisted: {
        showToast(
          ({ closeToast }) =>
            this.renderPersistedDiscoveryViewThresholds(closeToast),
          {
            autoClose: 12000,
          },
        );
        break;
      }
    }
  };

  renderIncompatibleBackgroundError = (closeToast, { backgroundName }) => (
    <Notification
      type="info"
      displayStyle="elevated"
      onClose={closeToast}
      closeWithIcon
    >
      The previous background &quot;{backgroundName}&quot; is not compatible
      with this sample, please select another background.
    </Notification>
  );

  renderConsensusGenomeCreated = closeToast => {
    return (
      <Notification
        className={cs.notificationBody}
        closeWithDismiss={false}
        closeWithIcon={true}
        type="info"
      >
        We&apos;re creating your requested consensus genome, you&apos;ll be able
        to view it in the Consensus Genome tab.
        <div
          className={cs.consensusGenomeLink}
          onClick={() => {
            this.handleTabChange(TABS.CONSENSUS_GENOME);
            closeToast();
          }}
          onKeyDown={() => {
            this.handleTabChange(TABS.CONSENSUS_GENOME);
            closeToast();
          }}
        >
          View Consensus Genomes
        </div>
      </Notification>
    );
  };

  renderPersistedDiscoveryViewThresholds = closeToast => (
    <Notification
      className={cs.notificationBody}
      closeWithIcon
      closeWithDismiss={false}
      onClose={closeToast}
      type="warning"
    >
      The taxon filters from the samples page have carried over. If you would
      like to use filters previously applied to the report, click the button
      below.
      <div
        className={cs.revertFiltersLink}
        onClick={() => {
          this.revertToSampleViewFilters();
          closeToast();
        }}
        onKeyDown={() => {
          this.revertToSampleViewFilters();
          closeToast();
        }}
      >
        Revert
      </div>
    </Notification>
  );

  revertToSampleViewFilters = () => {
    const { selectedOptions: selectedOptionsFromLocal } = this.loadState(
      localStorage,
      KEY_SAMPLE_VIEW_OPTIONS,
    );
    const newSelectedOptions = {
      ...this.getDefaultSelectedOptions(),
      ...selectedOptionsFromLocal,
    };

    this.setState({ selectedOptions: newSelectedOptions }, () => {
      this.refreshDataFromOptionsChange({
        key: "taxa",
        newSelectedOptions,
      });
    });
  };

  hasAppliedFilters = () => {
    const { selectedOptions } = this.state;
    const { categories, readSpecificity, taxa, thresholds } = selectedOptions;

    const hasCategoryFilters =
      !isEmpty(getOr([], "categories", categories)) ||
      !isEmpty(getOr([], "subcategories.Viruses", categories));
    const hasReadSpecificityFilters = readSpecificity !== 0;
    const hasTaxonFilter = !isEmpty(taxa);
    const hasThresholdFilters = !isEmpty(thresholds);

    return (
      hasCategoryFilters ||
      hasReadSpecificityFilters ||
      hasTaxonFilter ||
      hasThresholdFilters
    );
  };

  getAppliedFilters = () => {
    const { selectedOptions } = this.state;

    // Only Taxon, Category, Subcategories, Read Specifity, and Threshold Filters are considered "Applied Filters"
    return omit(
      ["nameType", "metric", "background"],
      diff(selectedOptions, this.getDefaultSelectedOptions()),
    );
  };

  createCSVRowForAppliedFilters = appliedFilters => {
    const { backgrounds, selectedOptions } = this.state;

    const filterRow = [];
    if (selectedOptions.background) {
      const selectedBackgroundName = find(
        { id: selectedOptions.background },
        backgrounds,
      ).name;
      filterRow.push(`\nBackground:, "${selectedBackgroundName}"`);
    }

    let numberOfFilters = 0;
    for (const [optionName, optionVal] of Object.entries(appliedFilters)) {
      if (!optionVal) continue;
      switch (optionName) {
        case "categories": {
          const categoryFilters = [];

          if (has("categories", optionVal)) {
            const categories = get("categories", optionVal);
            categoryFilters.push(categories);
            numberOfFilters += categories.length;
          }

          if (has("subcategories", optionVal)) {
            const subcategories = [];
            for (const [subcategoryName, subcategoryVal] of Object.entries(
              get("subcategories", optionVal),
            )) {
              if (!isEmpty(subcategoryVal)) {
                subcategories.push(
                  `${subcategoryName} - ${subcategoryVal.join()}`,
                );
              }
            }
            categoryFilters.push(subcategories);
            numberOfFilters += subcategories.length;
          }

          const flattenedCategoryFilters = flatten(categoryFilters).join();
          if (!isEmpty(flattenedCategoryFilters)) {
            // Explicitly add commas to create blank cells for formatting purposes
            filterRow.push(`Categories:, ${flattenedCategoryFilters}`);
          }

          break;
        }
        case "taxa": {
          optionVal.forEach(taxon => {
            filterRow.push(`Taxon Name:, ${get("name", taxon)}`);
            numberOfFilters += 1;
          });
          break;
        }
        case "thresholds": {
          const thresholdFilters = optionVal.reduce((result, threshold) => {
            result.push(
              `${threshold["metricDisplay"]} ${threshold["operator"]} ${threshold["value"]}`,
            );
            return result;
          }, []);

          if (!isEmpty(thresholdFilters)) {
            filterRow.push(`Thresholds:, ${thresholdFilters.join()}`);
            numberOfFilters += thresholdFilters.length;
          }
          break;
        }
        case "readSpecificity": {
          const readSpecificityOptions = {
            0: "All",
            1: "Specific Only",
          };

          filterRow.push(
            `Read Specificity:, "${readSpecificityOptions[optionVal]}"`,
          );
          numberOfFilters += 1;
          break;
        }
        default:
          logError({
            message:
              "SampleView: Invalid filter passed to createCSVRowForSelectedOptions()",
            details: { optionName, optionVal },
          });
          break;
      }
    }

    // Insert filter statement after Background
    filterRow.splice(
      1,
      0,
      `${numberOfFilters} Filter${numberOfFilters > 1 ? "s" : ""} Applied:`,
    );
    return [sanitizeCSVRow(filterRow).join()];
  };

  computeReportTableValuesForCSV = () => {
    const { filteredReportData } = this.state;

    const csvRows = [];
    const csvHeaders = [
      ...TAXON_GENERAL_FIELDS,
      ...Array.from(TAXON_COUNT_TYPE_METRICS, metric => "nt." + metric),
      ...Array.from(TAXON_COUNT_TYPE_METRICS, metric => "nr." + metric),
    ];

    filteredReportData.forEach(datum => {
      const genusRow = [];
      csvHeaders.forEach(column => {
        let val = JSON.stringify(getOr("-", column, datum));
        val = val === "null" ? '"-"' : val;

        // If value contains a comma, add double quoutes around it to preserve the comma and prevent the creation of a new column.
        genusRow.push(val.includes(",") ? `"${val}"` : val);
      });
      csvRows.push([sanitizeCSVRow(genusRow).join()]);

      if (has("filteredSpecies", datum)) {
        datum["filteredSpecies"].forEach(speciesTaxon => {
          const speciesRow = [];
          csvHeaders.forEach(column => {
            let val = JSON.stringify(getOr("-", column, speciesTaxon));
            val = val === "null" ? '"-"' : val;

            // If value contains a comma, add double quoutes around it to preserve the comma and prevent the creation of a new column.
            speciesRow.push(val.includes(",") ? `"${val}"` : val);
          });
          csvRows.push([sanitizeCSVRow(speciesRow).join()]);
        });
      }
    });

    if (this.hasAppliedFilters()) {
      csvRows.push(
        this.createCSVRowForAppliedFilters(this.getAppliedFilters()),
      );
    }

    return [[csvHeaders.join()], csvRows];
  };

  getDownloadReportTableWithAppliedFiltersLink = () => {
    const [csvHeaders, csvRows] = this.computeReportTableValuesForCSV();

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
      enableMassNormalizedBackgrounds,
      filteredReportData,
      lineageData,
      loadingReport,
      ownedBackgrounds,
      otherBackgrounds,
      pipelineRun,
      project,
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
            />
          </div>
          <div className={cs.reportHeader}>
            <div className={cs.statsRow}>
              {this.renderReportInfo()}
              {!!this.countFilters() && (
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
                sample={sample}
                taxa={filteredReportData}
                useReportV2Format={true}
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
          workflowRun={this.getCurrentRun()}
          workflowRunResults={workflowRunResults}
        />
      )
    );
  };

  handleBlastContigsModalClose = () =>
    this.setState({ blastContigsModalVisible: false });

  handleBlastReadsModalClose = () =>
    this.setState({ blastReadsModalVisible: false });

  render = () => {
    const {
      amrData,
      blastData,
      blastContigsModalVisible,
      blastReadsModalVisible,
      consensusGenomeData,
      consensusGenomePreviousParams,
      consensusGenomeCreationModalVisible,
      consensusGenomeErrorModalVisible,
      consensusGenomePreviousModalVisible,
      coverageVizVisible,
      currentTab,
      pipelineRun,
      project,
      projectSamples,
      reportMetadata,
      sample,
      selectedOptions,
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
              hasAppliedFilters={this.hasAppliedFilters()}
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
          {currentTab === TABS.MERGED_NT_NR &&
            this.renderReport({ displayMergedNtNrValue: true })}
          {currentTab === TABS.AMR && amrData && <AMRView amr={amrData} />}
          {currentTab === TABS.CONSENSUS_GENOME &&
            this.renderConsensusGenomeView()}
        </NarrowContainer>
        {sample && (
          <DetailsSidebar
            visible={sidebarVisible}
            mode={sidebarMode}
            onClose={withAnalytics(
              this.closeSidebar,
              "SampleView_details-sidebar_closed",
              {
                sampleId: sample.id,
                sampleName: sample.name,
              },
            )}
            params={this.getSidebarParams()}
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
            params={this.getCoverageVizParams()}
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
        {blastContigsModalVisible && (
          <BlastContigsModal
            open
            context={get("context", blastData)}
            onClose={this.handleBlastContigsModalClose}
            pipelineVersion={get("pipelineVersion", blastData)}
            sampleId={get("sampleId", blastData)}
            taxonName={get("taxName", blastData)}
            taxonId={get("taxId", blastData)}
          />
        )}
        {blastReadsModalVisible && (
          <BlastReadsModal
            open
            context={get("context", blastData)}
            onClose={this.handleBlastReadsModalClose}
            pipelineVersion={get("pipelineVersion", blastData)}
            sampleId={get("sampleId", blastData)}
            taxonName={get("taxName", blastData)}
            taxonLevel={get("taxLevel", blastData)}
            taxonId={get("taxId", blastData)}
          />
        )}
      </React.Fragment>
    );
  };
}

SampleView.propTypes = {
  sampleId: PropTypes.number,
  snapshotShareId: PropTypes.string,
  updateDiscoveryProjectId: PropTypes.func,
};

SampleView.contextType = UserContext;

const mapDispatchToProps = { updateDiscoveryProjectId: updateProjectIds };

// Don't need mapStateToProps yet so pass in null
const connectedComponent = connect(null, mapDispatchToProps)(SampleView);

connectedComponent.name = "SampleView";

export default connectedComponent;
