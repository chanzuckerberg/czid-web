import React from "react";
import { connect } from "react-redux";
import { updateProjectId } from "~/redux/modules/discovery/slice";
import {
  compact,
  every,
  find,
  flatten,
  get,
  getOr,
  has,
  head,
  isEmpty,
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
  sum,
  values,
} from "lodash/fp";
import deepEqual from "fast-deep-equal";

import {
  getBackgrounds,
  getCoverageVizSummary,
  getSample,
  getSampleReportData,
  getSamples,
  kickoffConsensusGenome,
} from "~/api";
import { getAmrData } from "~/api/amr";
import { UserContext } from "~/components/common/UserContext";
import {
  AMR_TABLE_FEATURE,
  MERGED_NT_NR_FEATURE,
} from "~/components/utils/features";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import {
  MASS_NORMALIZED_FEATURE,
  COVERAGE_VIZ_FEATURE,
  isPipelineFeatureAvailable,
} from "~/components/utils/pipeline_versions";
import { sampleErrorInfo } from "~/components/utils/sample";
import { getGeneraPathogenCounts } from "~/helpers/taxon";
import { IconAlert, IconLoading } from "~ui/icons";
import { showToast } from "~/components/utils/toast";
import { sanitizeCSVRow, createCSVObjectURL } from "~/components/utils/csv";
import { diff } from "~/components/utils/objectUtil";
import { logError } from "~/components/utils/logUtil";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import Notification from "~ui/notifications/Notification";
import StatusLabel from "~ui/labels/StatusLabel";
import AMRView from "~/components/AMRView";
import CoverageVizBottomSidebar from "~/components/common/CoverageVizBottomSidebar";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PropTypes from "~/components/utils/propTypes";
import SampleViewHeader from "./SampleViewHeader";
import Tabs from "~/components/ui/controls/Tabs";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { WORKFLOWS } from "~/components/utils/workflows";
import ConsensusGenomeView from "~/components/views/SampleView/ConsensusGenomeView";
import SampleMessage from "~/components/views/SampleView/SampleMessage";
import ConsensusGenomeCreationModal from "~/components/views/consensus_genome/ConsensusGenomeCreationModal";

import {
  GENUS_LEVEL_INDEX,
  LOCAL_STORAGE_FIELDS,
  METRIC_DECIMAL_PLACES,
  NOTIFICATION_TYPES,
  PIPELINE_RUN_TABS,
  SPECIES_LEVEL_INDEX,
  TAXON_COUNT_TYPE_METRICS,
  TAXON_GENERAL_FIELDS,
  TABS,
  TREE_METRICS,
  URL_FIELDS,
} from "./constants";
import ReportViewSelector from "./ReportViewSelector";
import ReportFilters from "./ReportFilters";
import ReportTable from "./ReportTable";
import TaxonTreeVis from "./TaxonTreeVis";
import cs from "./sample_view.scss";
import csSampleMessage from "./sample_message.scss";

const mapValuesWithKey = mapValues.convert({ cap: false });

class SampleView extends React.Component {
  constructor(props) {
    super(props);

    this.urlParser = new UrlQueryParser(URL_FIELDS);
    // remove nested options to be merge separately
    const {
      selectedOptions: selectedOptionsFromUrl,
      tempSelectedOptions,
      ...nonNestedUrlState
    } = this.urlParser.parse(location.search);
    const {
      selectedOptions: selectedOptionsFromLocal,
      ...nonNestedLocalState
    } = this.loadState(localStorage, "SampleViewOptions");

    this.state = Object.assign(
      {
        amrData: null,
        backgrounds: [],
        consensusGenomeParams: {},
        consensusGenomeCreationModalVisible: false,
        coverageVizDataByTaxon: {},
        coverageVizParams: {},
        coverageVizVisible: false,
        currentTab: TABS.SHORT_READ_MNGS,
        filteredReportData: [],
        loadingReport: false,
        pipelineRun: null,
        pipelineVersion: null,
        previousSelectedOptions: this.getDefaultSelectedOptions(),
        project: null,
        projectSamples: [],
        reportData: [],
        reportMetadata: {},
        sample: null,
        selectedInvalidBackground: false,
        selectedOptions: Object.assign(
          this.getDefaultSelectedOptions(),
          !isEmpty(tempSelectedOptions)
            ? tempSelectedOptions
            : Object.assign(
                {},
                selectedOptionsFromLocal,
                selectedOptionsFromUrl
              )
        ),
        sidebarMode: null,
        sidebarVisible: false,
        sidebarTaxonData: null,
        view: "table",
      },
      nonNestedLocalState,
      nonNestedUrlState
    );
  }

  componentDidMount = () => {
    // fetchBackgrounds will subsequently call fetchSample and fetchSampleReportData.
    this.fetchBackgrounds();
  };

  componentDidUpdate() {
    const { amrData, currentTab } = this.state;

    if (currentTab === TABS.AMR && !amrData) {
      this.fetchAmrData();
    }
  }

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
      background: null,
      categories: { categories: [], subcategories: { Viruses: [] } },
      metric: TREE_METRICS[0].value,
      nameType: "Scientific name",
      readSpecificity: 0,
      taxon: null,
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
    const { backgrounds, pipelineVersion, selectedOptions } = this.state;
    const sample = await getSample({ snapshotShareId, sampleId });

    sample.id = sampleId;

    const pipelineRun = find(
      pipelineVersion
        ? { pipeline_version: pipelineVersion }
        : { id: sample.default_pipeline_run_id },
      sample.pipeline_runs
    );

    const enableMassNormalizedBackgrounds =
      pipelineRun &&
      pipelineRun.total_ercc_reads > 0 &&
      isPipelineFeatureAvailable(
        MASS_NORMALIZED_FEATURE,
        pipelineRun.pipeline_version
      );
    // If the currently selected background is mass normalized and the sample is incompatible,
    // then load the report with the default background instead.
    let newSelectedOptions = { ...selectedOptions };
    const selectedBackground = backgrounds.find(
      background => selectedOptions.background === background.id
    );
    if (
      isEmpty(selectedBackground) ||
      (!enableMassNormalizedBackgrounds && selectedBackground.mass_normalized)
    ) {
      newSelectedOptions.background = sample.default_background_id;
    }
    const workflowCount = this.getWorkflowCount(sample);
    this.setState(
      {
        currentTab: this.determineInitialTab({
          initialWorkflow: sample.initial_workflow,
          workflowCount,
        }),
        sample,
        pipelineRun,
        project: sample.project,
        enableMassNormalizedBackgrounds,
        selectedOptions: newSelectedOptions,
      },
      () => {
        // Updates the projectId in the Redux store to add global context in our analytic events
        updateDiscoveryProjectId(sample.project.id);
        this.fetchSampleReportData();
        this.fetchProjectSamples();
        this.fetchCoverageVizData();
      }
    );
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
        rawReportData.counts[SPECIES_LEVEL_INDEX]
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
            speciesInfo
          );
          return merge(speciesWithAdjustedMetricPrecision, {
            highlighted: isHighlighted,
            taxId: speciesTaxId,
            taxLevel: "species",
          });
        });
        reportData.push(
          merge(rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId], {
            highlightedChildren: hasHighlightedChildren,
            pathogens: generaPathogenCounts[genusTaxId],
            taxId: genusTaxId,
            taxLevel: "genus",
            species: speciesData,
          })
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
      prevousSelectedOptions: selectedOptions,
      selectedOptions: Object.assign({}, selectedOptions, {
        background: rawReportData.metadata.backgroundId,
      }),
    });
  };

  handleInvalidBackgroundSelection = () => {
    const {
      backgrounds,
      selectedOptions,
      sample,
      previousSelectedOptions,
    } = this.state;
    // If Internal Server Error caused by invalid background selection:
    //   1. Render invalidBackgroundError modal
    //   2. Revert selectedOptions to previous selectedOptions
    //   3. Pass prop erred={true} to BackgroundModalFilter

    const invalidBackground = backgrounds.find(
      background => selectedOptions.background === background.id
    );

    // if there was no previously selected background and the current is the default, we do not load the report,
    // and show a normal report error message
    if (
      !previousSelectedOptions.background &&
      invalidBackground.id === sample.default_background_id
    ) {
      this.setState({ loadingReport: false });
      return;
    }

    this.setState(
      {
        selectedOptions: previousSelectedOptions,
        selectedInvalidBackground: true,
      },
      () => {
        this.updateHistoryAndPersistOptions();
        this.refreshDataFromOptionsChange({
          key: "background",
          newSelectedOptions: previousSelectedOptions,
        });
      }
    );

    this.showNotification(NOTIFICATION_TYPES.invalidBackground, {
      background: invalidBackground.name,
      useDefault: !!selectedOptions.background,
    });
  };

  fetchSampleReportData = async () => {
    const { snapshotShareId, sampleId } = this.props;
    const { allowedFeatures = [] } = this.context || {};
    const {
      currentTab,
      pipelineVersion,
      previousSelectedOptions,
      selectedOptions,
    } = this.state;

    const mergeNtNr =
      allowedFeatures.includes(MERGED_NT_NR_FEATURE) &&
      (currentTab === TABS.MERGED_NT_NR || currentTab === TABS.SHORT_READ_MNGS);
    this.setState({ loadingReport: true });
    await getSampleReportData({
      snapshotShareId,
      sampleId,
      background: selectedOptions.background,
      pipelineVersion,
      mergeNtNr,
    })
      .then(rawReportData => {
        if (rawReportData) this.processRawSampleReportData(rawReportData);
        this.setState({ loadingReport: false });
      })
      .catch(err => {
        if (
          err.status === 500 &&
          selectedOptions.background !== previousSelectedOptions.background
        ) {
          // This function must update loadingReport if and only if it does not request
          // a new report with fallback settings
          this.handleInvalidBackgroundSelection();
        } else {
          this.setState({ loadingReport: false });
        }
      });

    logAnalyticsEvent("PipelineSampleReport_sample_viewed", {
      sampleId,
    });
  };

  fetchAmrData = async () => {
    const { sample } = this.state;
    const amrData = await getAmrData(sample.id);
    this.setState({ amrData });
  };

  fetchBackgrounds = async () => {
    const { snapshotShareId } = this.props;
    this.setState({ loadingReport: true });
    const backgrounds = await getBackgrounds({ snapshotShareId });
    this.setState(
      {
        backgrounds,
      },
      () => {
        this.fetchSample();
      }
    );
  };

  fetchCoverageVizData = async () => {
    const { snapshotShareId } = this.props;
    const { sample, pipelineRun } = this.state;

    if (
      isPipelineFeatureAvailable(
        COVERAGE_VIZ_FEATURE,
        get("pipeline_version", pipelineRun)
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
    taxon,
  }) => {
    // When adding filters consider their order based on filter complexity (more complex later)
    // and effeciency (filters more likely to filter out more taxa earlier)
    return (
      this.filterTaxon({ row, taxon }) &&
      this.filterCategories({ row, categories, subcategories }) &&
      this.filterReadSpecificity({ row, readSpecificity }) &&
      this.filterThresholds({ row, thresholds })
    );
  };

  filterTaxon = ({ row, taxon }) => {
    return (
      !taxon || row.taxId === taxon.taxId || row.genus_tax_id === taxon.taxId
    );
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
        row.subcategories || []
      )
    ) {
      return true;
    }

    // taxon's category was selected and its subcategories were not excluded
    if (
      (categories.has(row.category) &&
        !some(
          subcategory => subcategories.has(subcategory),
          row.subcategories || []
        )) ||
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
      if (key in METRIC_DECIMAL_PLACES) {
        species[key] = parseFloat(
          metricValue.toFixed(METRIC_DECIMAL_PLACES[key])
        );
      } else if (["nt", "nr", "merged_nt_nr"].includes(key)) {
        Object.entries(species[key]).forEach(([metricKey, metricValue]) => {
          if (metricKey in METRIC_DECIMAL_PLACES) {
            species[key][metricKey] = parseFloat(
              metricValue.toFixed(METRIC_DECIMAL_PLACES[metricKey])
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
    filters: { categories, thresholds, readSpecificity, taxon },
  }) => {
    const categoriesSet = new Set(
      map(c => c.toLowerCase(), categories.categories || [])
    );
    const subcategoriesSet = new Set(
      map(sc => sc.toLowerCase(), flatten(values(categories.subcategories)))
    );

    const filteredData = [];
    reportData.forEach(genusRow => {
      genusRow.passedFilters = this.applyFilters({
        row: genusRow,
        categories: categoriesSet,
        subcategories: subcategoriesSet,
        thresholds,
        readSpecificity,
        taxon,
      });

      genusRow.filteredSpecies = genusRow.species.filter(speciesRow =>
        this.applyFilters({
          row: speciesRow,
          categories: categoriesSet,
          subcategories: subcategoriesSet,
          thresholds,
          readSpecificity,
          taxon,
        })
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
        sample.pipeline_runs
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
        }
      );
    } else if (currentTab === TABS.CONSENSUS_GENOME) {
      this.setState(
        {
          pipelineVersion: newPipelineVersion,
        },
        () => this.updateHistoryAndPersistOptions()
      );
    }
  };

  handleTabChange = tab => {
    this.setState({ currentTab: tab });
    const name = tab.replace(/\W+/g, "-").toLowerCase();
    logAnalyticsEvent(`SampleView_tab-${name}_clicked`, {
      tab: tab,
    });
  };

  updateHistoryAndPersistOptions = () => {
    const urlState = pick(keys(URL_FIELDS), this.state);
    let localState = mapValuesWithKey((options, key) => {
      return omit(options.excludePaths || [], this.state[key]);
    }, LOCAL_STORAGE_FIELDS);

    // Saving on URL enables sharing current view with other users
    let urlQuery = this.urlParser.stringify(urlState);
    if (urlQuery) {
      urlQuery = `?${urlQuery}`;
    }
    history.replaceState(urlState, `SampleView`, `${urlQuery}`);

    localStorage.setItem("SampleViewOptions", JSON.stringify(localState));
  };

  handleOptionChanged = ({ key, value }) => {
    const { selectedOptions } = this.state;
    if (deepEqual(selectedOptions[key], value)) {
      return;
    }

    const newSelectedOptions = Object.assign({}, selectedOptions, {
      [key]: value,
    });

    this.refreshDataFromOptionsChange({ key, newSelectedOptions });
  };

  handleFilterRemoved = ({ key, subpath, value }) => {
    const { selectedOptions } = this.state;

    let newSelectedOptions = { ...selectedOptions };
    switch (key) {
      case "categories":
        newSelectedOptions.categories = set(
          subpath,
          pull(value, get(subpath, newSelectedOptions.categories)),
          newSelectedOptions.categories
        );
        break;
      case "taxon":
        newSelectedOptions.taxon = null;
        break;
      case "thresholds":
        newSelectedOptions.thresholds = pull(
          value,
          newSelectedOptions.thresholds
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
        coverageVizDataByTaxon
      );
      // Add the species taxon name to each accession.
      return map(
        accession => ({
          ...accession,
          // Use snake_case for consistency with other fields.
          taxon_name: taxon.name,
          taxon_common_name: taxon.commonName,
        }),
        speciesBestAccessions
      );
    };

    const speciesTaxIds = map("taxId", speciesTaxons);

    return {
      best_accessions: flatten(
        compact(map(getSpeciesBestAccessions, speciesTaxons))
      ),
      num_accessions: sum(
        map(
          taxId => get([taxId, "num_accessions"], coverageVizDataByTaxon),
          speciesTaxIds
        )
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
        coverageVizParams.taxSpecies
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
    const { reportData, selectedOptions } = this.state;

    // different behavior given type of option
    switch (key) {
      // - name type: reset table to force a rerender
      case "nameType":
        this.setDisplayName({ reportData, ...newSelectedOptions });
        this.setState({ reportData: [...reportData] });
        break;

      // - background: requires a new reload from server
      case "background":
        this.setState({ reportData: [] }, this.fetchSampleReportData);
        break;

      // - taxon: refresh filtered data
      // - categories: refresh filtered data
      // - threshold filters: refresh filtered data
      // - read specificity: refresh filtered data
      case "taxon":
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

    // save options in state and persist in local storage
    this.setState(
      {
        previousSelectedOptions: selectedOptions,
        selectedOptions: newSelectedOptions,
      },
      () => {
        this.updateHistoryAndPersistOptions();
      }
    );
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

  handleConsensusGenomeClick = ({ percentIdentity, taxId, taxName }) => {
    const { coverageVizDataByTaxon } = this.state;
    const accessionData = get(taxId, coverageVizDataByTaxon);
    this.setState({
      consensusGenomeParams: {
        accessionData,
        percentIdentity,
        taxId,
        taxName,
      },
      consensusGenomeCreationModalVisible: true,
    });
  };

  onConsensusGenomeCreation = ({
    accessionId,
    accessionName,
    taxonId,
    taxonName,
  }) => {
    const { sample } = this.state;
    kickoffConsensusGenome({
      sampleId: sample.id,
      workflow: WORKFLOWS.CONSENSUS_GENOME.value,
      accessionId,
      accessionName,
      taxonId,
      taxonName,
    });

    this.showNotification(NOTIFICATION_TYPES.consensusGenomeCreated);
    this.handleCloseConsensusGenomeCreationModal();
  };

  handleCloseConsensusGenomeCreationModal = () => {
    this.setState({
      consensusGenomeCreationModalVisible: false,
    });
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
      pipelineRun,
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
      return {
        sampleId: sample.id,
        snapshotShareId: snapshotShareId,
        pipelineVersion: pipelineRun ? pipelineRun.pipeline_version : null,
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
      ? `${filtered} rows passing the above filters, out of ${total} total rows.`
      : `${total} total rows.`;
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
      `Report values are computed from ${subsampledReadsCount} reads subsampled \
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
    newSelectedOptions.thresholds = [];
    newSelectedOptions.categories = {};

    this.setState(
      {
        previousSelectedOptions: selectedOptions,
        selectedOptions: newSelectedOptions,
        filteredReportData: this.filterReportData({
          reportData,
          filters: newSelectedOptions,
        }),
      },
      () => {
        this.updateHistoryAndPersistOptions();
      }
    );
    logAnalyticsEvent("PipelineSampleReport_clear-filters-link_clicked");
  };

  countFilters = () => {
    const {
      selectedOptions: { categories, thresholds, taxon },
    } = this.state;

    let numFilters = taxon ? 1 : 0;
    numFilters += thresholds.length;
    numFilters += (categories.categories || []).length;
    numFilters += sum(
      map(v => v.length, values(categories.subcategories || {}))
    );
    return numFilters;
  };

  getCurrentRun = () => {
    const { currentTab, pipelineRun, pipelineVersion, sample } = this.state;

    if (PIPELINE_RUN_TABS.includes(currentTab)) {
      return pipelineRun;
    }

    if (sample.workflow_runs.length > 0) {
      const workflowType = Object.values(WORKFLOWS).find(
        workflow => workflow.label === currentTab
      ).value;

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
          sample.workflow_runs.filter(run => run.workflow === workflowType)
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
        <React.Fragment>
          {TABS.MERGED_NT_NR}
          <StatusLabel
            className={cs.statusLabel}
            inline
            status="Prototype"
            type="beta"
          />
        </React.Fragment>
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
    let status, message, linkText, type, link, icon;
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
        ({ status, message, linkText, type, link, icon } = sampleErrorInfo({
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
        status={status}
        type={type}
      />
    );
  };

  handleViewClick = ({ view }) => {
    logAnalyticsEvent(`PipelineSampleReport_${view}-view-menu_clicked`);
    this.setState({ view }, () => {
      this.updateHistoryAndPersistOptions();
    });
  };

  showNotification = (notification, params = {}) => {
    switch (notification) {
      case NOTIFICATION_TYPES.invalidBackground: {
        showToast(
          ({ closeToast }) =>
            this.renderInvalidBackgroundError(closeToast, params),
          {
            autoClose: 12000,
            onClose: () =>
              this.setState({
                selectedInvalidBackground: false,
              }),
          }
        );
        break;
      }
      case NOTIFICATION_TYPES.consensusGenomeCreated: {
        showToast(
          ({ closeToast }) => this.renderConsensusGenomeCreated(closeToast),
          {
            autoClose: 12000,
          }
        );
        break;
      }
    }
  };

  renderInvalidBackgroundError = (closeToast, { background, useDefault }) => {
    const handleOnClose = () => {
      this.setState({
        selectedInvalidBackground: false,
      });
      closeToast();
    };

    const email = "help@idseq.net";
    const header = (
      <div>
        <span className={cs.highlight}>
          It was not possible to load the report with background &quot;
          {background}&quot;.
        </span>

        <span className={cs.notificationBody}>
          {" "}
          The report has reverted to the {useDefault
            ? "default"
            : "previous"}{" "}
          background model. For more information,{" "}
          <ExternalLink
            href={`mailto:${email}?Subject=Background%20"${background}"%20failed%20to%20load`}
            analyticsEventName={
              "InvalidBackgroundError_accordion-notification_link_clicked"
            }
            className={cs.externalLink}
          >
            contact our help team.
          </ExternalLink>
        </span>
      </div>
    );

    return (
      <AccordionNotification
        header={header}
        toggleable={false}
        type={"error"}
        displayStyle={"elevated"}
        onClose={handleOnClose}
      />
    );
  };

  renderConsensusGenomeCreated = closeToast => {
    return (
      <Notification
        className={cs.notificationBody}
        closeWithDismiss={false}
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
        >
          View Consensus Genomes
        </div>
      </Notification>
    );
  };

  hasAppliedFilters = () => {
    const { selectedOptions } = this.state;
    const { categories, readSpecificity, taxon, thresholds } = selectedOptions;

    const hasCategoryFilters =
      !isEmpty(getOr([], "categories", categories)) ||
      !isEmpty(getOr([], "subcategories.Viruses", categories));
    const hasReadSpecificityFilters = readSpecificity !== 0;
    const hasTaxonFilter = !isEmpty(taxon);
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
      diff(selectedOptions, this.getDefaultSelectedOptions())
    );
  };

  createCSVRowForAppliedFilters = appliedFilters => {
    const { backgrounds, selectedOptions } = this.state;

    const selectedBackgroundName = find(
      { id: selectedOptions.background },
      backgrounds
    ).name;
    const filterRow = [`\nBackground:, "${selectedBackgroundName}"`];

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
              get("subcategories", optionVal)
            )) {
              if (!isEmpty(subcategoryVal)) {
                subcategories.push(
                  `${subcategoryName} - ${subcategoryVal.join()}`
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
        case "taxon": {
          filterRow.push(`Taxon Name:, ${get("name", optionVal)}`);
          numberOfFilters += 1;
          break;
        }
        case "thresholds": {
          const thresholdFilters = optionVal.reduce((result, threshold) => {
            result.push(
              `${threshold["metricDisplay"]} ${threshold["operator"]} ${threshold["value"]}`
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
            `Read Specificity:, "${readSpecificityOptions[optionVal]}"`
          );
          numberOfFilters += 1;
          break;
        }
        default:
          logError({
            msg:
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
      `${numberOfFilters} Filter${numberOfFilters > 1 ? "s" : ""} Applied:`
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
        this.createCSVRowForAppliedFilters(this.getAppliedFilters())
      );
    }

    return [[csvHeaders.join()], csvRows];
  };

  getDownloadReportTableWithAppliedFiltersLink = () => {
    const [csvHeaders, csvRows] = this.computeReportTableValuesForCSV();

    return createCSVObjectURL(csvHeaders, csvRows);
  };

  renderReport = ({ displayMergedNtNrValue = false } = {}) => {
    const {
      backgrounds,
      enableMassNormalizedBackgrounds,
      filteredReportData,
      lineageData,
      pipelineRun,
      project,
      reportMetadata,
      sample,
      selectedInvalidBackground,
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
              shouldDisableFilters={displayMergedNtNrValue}
              selectedInvalidBackground={selectedInvalidBackground}
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
                <span
                  className={cs.clearAllFilters}
                  onClick={this.clearAllFilters}
                >
                  Clear All Filters
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
                data={filteredReportData}
                onConsensusGenomeClick={this.handleConsensusGenomeClick}
                onCoverageVizClick={this.handleCoverageVizClick}
                onTaxonNameClick={withAnalytics(
                  this.handleTaxonClick,
                  "PipelineSampleReport_taxon-sidebar-link_clicked"
                )}
                fastaDownloadEnabled={
                  !!(reportMetadata && reportMetadata.hasByteRanges)
                }
                displayMergedNtNrValue={displayMergedNtNrValue}
                initialDbType={displayMergedNtNrValue ? "merged_nt_nr" : "nt"}
                phyloTreeAllowed={sample ? sample.editable : false}
                pipelineVersion={pipelineRun && pipelineRun.pipeline_version}
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

  render = () => {
    const {
      amrData,
      consensusGenomeParams,
      consensusGenomeCreationModalVisible,
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
              currentTab={currentTab}
              deletable={sample ? sample.deletable : false}
              editable={sample ? sample.editable : false}
              getDownloadReportTableWithAppliedFiltersLink={
                this.getDownloadReportTableWithAppliedFiltersLink
              }
              hasAppliedFilters={this.hasAppliedFilters()}
              onDetailsClick={this.toggleSampleDetailsSidebar}
              onPipelineVersionChange={this.handlePipelineVersionSelect}
              currentRun={currentRun}
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
          {currentTab === TABS.CONSENSUS_GENOME && (
            <ConsensusGenomeView sample={sample} workflow={currentRun} />
          )}
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
              }
            )}
            params={this.getSidebarParams()}
          />
        )}
        {isPipelineFeatureAvailable(
          COVERAGE_VIZ_FEATURE,
          get("pipeline_version", pipelineRun)
        ) && (
          <CoverageVizBottomSidebar
            nameType={selectedOptions.nameType}
            onClose={withAnalytics(
              this.closeCoverageViz,
              "SampleView_coverage-viz-sidebar_closed",
              {
                sampleId: sample.id,
                sampleName: sample.name,
              }
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
            consensusGenomeData={consensusGenomeParams}
            onClose={this.handleCloseConsensusGenomeCreationModal}
            onCreation={this.onConsensusGenomeCreation}
            open={consensusGenomeCreationModalVisible}
            sample={sample}
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

const mapDispatchToProps = { updateDiscoveryProjectId: updateProjectId };

// Don't need mapStateToProps yet so pass in null
const connectedComponent = connect(null, mapDispatchToProps)(SampleView);

connectedComponent.name = "SampleView";

export default connectedComponent;
