import React from "react";
import {
  compact,
  entries,
  every,
  find,
  flatten,
  flow,
  get,
  keys,
  map,
  mapValues,
  merge,
  omit,
  pick,
  pull,
  set,
  some,
  sum,
  values,
} from "lodash/fp";
import deepEqual from "fast-deep-equal";
import cx from "classnames";

import {
  getBackgrounds,
  getCoverageVizSummary,
  getSample,
  getSampleReportData,
  getSamples,
} from "~/api";
import { getAmrData } from "~/api/amr";
import { UserContext } from "~/components/common/UserContext";
import { AMR_TABLE_FEATURE } from "~/components/utils/features";
import {
  logAnalyticsEvent,
  withAnalytics,
  ANALYTICS_EVENT_NAMES,
} from "~/api/analytics";
import {
  pipelineVersionHasCoverageViz,
  sampleErrorInfo,
} from "~/components/utils/sample";
import { getGeneraPathogenCounts } from "~/helpers/taxon";
import AlertIcon from "~ui/icons/AlertIcon";
import AMRView from "~/components/AMRView";
import BacteriaIcon from "~ui/icons/BacteriaIcon";
import CoverageVizBottomSidebar from "~/components/common/CoverageVizBottomSidebar";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import LoadingIcon from "~ui/icons/LoadingIcon";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PropTypes from "~/components/utils/propTypes";
import SampleViewHeader from "./SampleViewHeader";
import Tabs from "~/components/ui/controls/Tabs";
import UrlQueryParser from "~/components/utils/UrlQueryParser";

import { TREE_METRICS } from "./constants";
import ReportViewSelector from "./ReportViewSelector";
import ReportFilters from "./ReportFilters";
import ReportTable from "./ReportTable";
import TaxonTreeVis from "./TaxonTreeVis";
import cs from "./sample_view_v2.scss";

const mapValuesWithKey = mapValues.convert({ cap: false });

const SPECIES_LEVEL_INDEX = 1;
const GENUS_LEVEL_INDEX = 2;

const URL_FIELDS = {
  pipelineVersion: "string",
  selectedOptions: "object",
  view: "string",
};

const LOCAL_STORAGE_FIELDS = {
  selectedOptions: { excludePaths: ["taxon"] },
};

export default class SampleViewV2 extends React.Component {
  constructor(props) {
    super(props);

    this.urlParser = new UrlQueryParser(URL_FIELDS);
    // remove nested options to be merge separately
    const {
      selectedOptions: selectedOptionsFromUrl,
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
        coverageVizDataByTaxon: {},
        coverageVizParams: {},
        coverageVizVisible: false,
        currentTab: "Report",
        filteredReportData: [],
        loadingReport: false,
        pipelineRun: null,
        pipelineVersion: null,
        project: null,
        projectSamples: [],
        reportData: [],
        reportMetadata: {},
        sample: null,
        sidebarMode: null,
        sidebarVisible: false,
        sidebarTaxonData: null,
        view: "table",
        selectedOptions: Object.assign(
          this.defaultSelectedOptions(),
          selectedOptionsFromLocal,
          selectedOptionsFromUrl
        ),
      },
      nonNestedLocalState,
      nonNestedUrlState
    );
  }

  componentDidMount = () => {
    this.fetchSample();
    this.fetchBackgrounds();
    this.fetchSampleReportData();

    logAnalyticsEvent("PipelineSampleReport_sample_viewed", {
      sampleId: this.props.sampleId,
    });
    // DEPRECATED: kept temporarily for continuity
    // TODO (written 12/2/19): remove after v2 of the report page has been active for 3 months.
    logAnalyticsEvent(ANALYTICS_EVENT_NAMES.sampleViewed, {
      sampleId: this.props.sampleId,
    });
  };

  componentDidUpdate() {
    const { amrData, currentTab } = this.state;
    if (currentTab === "Antimicrobial Resistance" && !amrData) {
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

  defaultSelectedOptions = () => {
    return {
      categories: {},
      metric: TREE_METRICS[0].value,
      minContigSize: 4,
      nameType: "Scientific name",
      readSpecificity: 0,
      thresholds: [],
    };
  };

  fetchSample = async () => {
    const { sampleId } = this.props;
    const { pipelineVersion } = this.state;
    const sample = await getSample({ sampleId });
    sample.id = sampleId;
    this.setState(
      {
        sample: sample,
        pipelineRun: find(
          pipelineVersion
            ? { pipeline_version: pipelineVersion }
            : { id: sample.default_pipeline_run_id },
          sample.pipeline_runs
        ),
        project: sample.project,
      },
      () => {
        this.fetchProjectSamples();
        this.fetchCoverageVizData();
      }
    );
  };

  fetchProjectSamples = async () => {
    const { project } = this.state;

    if (project) {
      const projectSamples = await getSamples({
        projectId: project.id,
      });

      this.setState({ projectSamples: projectSamples.samples });
    }
  };

  fetchSampleReportData = async () => {
    const { sampleId } = this.props;
    const { pipelineVersion, selectedOptions } = this.state;

    this.setState({ loadingReport: true });
    const rawReportData = await getSampleReportData({
      sampleId,
      background: selectedOptions.background,
      pipelineVersion,
    });

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
          return merge(
            rawReportData.counts[SPECIES_LEVEL_INDEX][speciesTaxId],
            {
              highlighted: isHighlighted,
              taxId: speciesTaxId,
              taxLevel: "species",
            }
          );
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
    this.computeContigStats({ reportData, ...selectedOptions });
    const filteredReportData = this.filterReportData({
      reportData,
      filters: selectedOptions,
    });

    this.setState({
      filteredReportData,
      lineageData: rawReportData.lineage,
      loadingReport: false,
      reportData,
      reportMetadata: rawReportData.metadata,
      selectedOptions: Object.assign({}, selectedOptions, {
        background: rawReportData.metadata.backgroundId,
      }),
    });
  };

  fetchAmrData = async () => {
    const { sample } = this.state;
    const amrData = await getAmrData(sample.id);
    this.setState({ amrData });
  };

  fetchBackgrounds = async () => {
    const backgrounds = await getBackgrounds();
    this.setState({ backgrounds });
  };

  fetchCoverageVizData = async () => {
    const { sample } = this.state;
    if (this.coverageVizEnabled()) {
      const coverageVizSummary = await getCoverageVizSummary(sample.id);

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

    // Contigs/contig_reads are stored in the format {length of contig: count},
    // so some extra processing is needed to extract the value.
    if (parsedMetric.includes("contigs") && parsedValue) {
      // To get the total number of contigs, sum up all the values (counts) in the object.
      parsedValue = sum(Object.values(parsedValue));
    } else if (parsedMetric.includes("contig_reads")) {
      // If the metric is contig_reads, need to extract the contig data.
      parsedValue = get([parsedMetric[0], "contigs"], row);
      // To get the total number of contig reads, multiply the keys (length of each contig) by
      // the values (number of times a contig of that length appears) and sum them all up.
      // Default to 0 if there are no contigs.
      parsedValue = parsedValue
        ? sum(
            Object.entries(parsedValue).map(([reads, count]) => reads * count)
          )
        : 0;
    }
    return parsedValue;
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

  computeRowContigStats = ({ row, minContigSize }) => {
    ["nr", "nt"].forEach(dbType => {
      const contigDetails = get([dbType, "contigs"], row);
      if (contigDetails && keys(contigDetails).length) {
        const dbTypeRow = row[dbType];
        dbTypeRow.contigCount = 0;
        dbTypeRow.readsCount = 0;

        flow(
          entries,
          map(([readsPerContig, count]) => {
            if (readsPerContig >= minContigSize) {
              dbTypeRow.contigCount += count;
              dbTypeRow.readsCount += count * readsPerContig;
            }
          })
        )(contigDetails);
      }
    });
  };

  computeContigStats = ({ reportData, minContigSize }) => {
    reportData.forEach(genus => {
      this.computeRowContigStats({ row: genus, minContigSize });
      genus.species.forEach(species => {
        this.computeRowContigStats({ row: species, minContigSize });
      });
    });
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
    const { pipelineRun, sample } = this.state;
    if (newPipelineVersion != pipelineRun.version) {
      this.setState(
        {
          pipelineRun: find(
            { pipeline_version: newPipelineVersion },
            sample.pipeline_runs
          ),
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

  coverageVizEnabled = () => {
    const { pipelineRun } = this.state;
    return pipelineVersionHasCoverageViz(get("pipeline_version", pipelineRun));
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
    const { reportData } = this.state;

    // different behavior given type of option
    switch (key) {
      // - min contig size: recompute contig statistics with new size and refresh display
      case "minContigSize":
        this.computeContigStats({ reportData, ...newSelectedOptions });
        this.setState({ reportData: [...reportData] });
        break;
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
        pipelineVersion: pipelineRun ? pipelineRun.pipeline_version : null,
        onMetadataUpdate: this.handleMetadataUpdate,
      };
    }
    return {};
  };

  countReportRows = () => {
    const { filteredReportData, reportData } = this.state;

    let total = reportData.length;
    let filtered = filteredReportData.length;
    reportData.forEach(genusRow => {
      total += genusRow.species.length;
      filtered += genusRow.filteredSpecies.length;
    });

    return { total, filtered };
  };

  filteredMessage = () => {
    const { total, filtered } = this.countReportRows();
    return filtered != total
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
      subsampledReadsCount != adjustedRemainingReadsCount &&
      `Report values are computed from ${subsampledReadsCount} reads subsampled \
        randomly from the ${adjustedRemainingReadsCount} reads passing host and quality filters.`
    );
  };

  renderReportInfo = () => {
    return compact([
      this.truncatedMessage(),
      this.subsamplingMessage(),
      this.filteredMessage(),
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

  renderSampleMessage = () => {
    const { loadingReport, pipelineRun, reportMetadata, sample } = this.state;
    const {
      errorMessage,
      knownUserError,
      pipelineRunStatus,
      jobStatus,
    } = reportMetadata;
    let status, message, linkText, type, link, icon;

    if (loadingReport) {
      status = "Loading";
      message = "Loading report data.";
      icon = <LoadingIcon className={cs.icon} />;
      type = "inProgress";
    } else if (
      pipelineRunStatus === "WAITING" &&
      (sample && !sample.upload_error)
    ) {
      status = "IN PROGRESS";
      message = jobStatus;
      icon = <LoadingIcon className={cs.icon} />;
      type = "inProgress";
      if (pipelineRun && pipelineRun.pipeline_version) {
        linkText = "View Pipeline Visualization";
        link = `/samples/${sample.id}/pipeline_viz/${
          pipelineRun.pipeline_version
        }`;
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
        ({ status, message, linkText, type, link, icon } = sampleErrorInfo(
          sample,
          pipelineRun
        ));
      }
      icon = <AlertIcon className={cs.icon} />;
    }

    return (
      <div className={cs.sampleMessage}>
        <div className={cs.textContainer}>
          <div className={cx(cs.reportStatus, cs[type])}>
            {icon}
            <span className={cs.text}>{status}</span>
          </div>
          <div className={cs.message}>{message}</div>
          <a className={cs.actionLink} href={link}>
            {linkText}
            {linkText && (
              <i className={cx("fa fa-chevron-right", cs.rightArrow)} />
            )}
          </a>
        </div>
        <BacteriaIcon className={cs.bacteriaIcon} />
      </div>
    );
  };

  handleViewClick = ({ view }) => {
    logAnalyticsEvent(`PipelineSampleReport_${view}-view-menu_clicked`);
    this.setState({ view }, () => {
      this.updateHistoryAndPersistOptions();
    });
  };

  renderReport = () => {
    const {
      backgrounds,
      filteredReportData,
      lineageData,
      pipelineRun,
      project,
      reportMetadata,
      sample,
      selectedOptions,
      view,
    } = this.state;
    // reportReady is true if the pipeline run hasn't failed and is report-ready
    // (might still be running Experimental, but at least taxon_counts has been loaded).
    // pipelineRunReportAvailable was renamed to reportReady, but we check both in case the old variable
    // name was cached.
    // TODO(julie): remove pipelineRunReportAvailable during cleanup.
    if (
      reportMetadata.reportReady ||
      reportMetadata.pipelineRunReportAvailable
    ) {
      return (
        <div className={cs.reportViewContainer}>
          <div className={cs.reportFilters}>
            <ReportFilters
              backgrounds={backgrounds}
              onFilterChanged={this.handleOptionChanged}
              onFilterRemoved={this.handleFilterRemoved}
              sampleId={sample && sample.id}
              selected={selectedOptions}
              view={view}
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
                onCoverageVizClick={this.handleCoverageVizClick}
                onTaxonNameClick={withAnalytics(
                  this.handleTaxonClick,
                  "PipelineSampleReport_taxon-sidebar-link_clicked"
                )}
                fastaDownloadEnabled={
                  !!(reportMetadata && reportMetadata.hasByteRanges)
                }
                phyloTreeAllowed={sample ? sample.editable : false}
                pipelineVersion={pipelineRun && pipelineRun.pipeline_version}
                projectId={project && project.id}
                projectName={project && project.name}
                sampleId={sample && sample.id}
              />
            </div>
          )}
          {view == "tree" &&
            filteredReportData.length > 0 && (
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

    return (
      <React.Fragment>
        <NarrowContainer className={cs.sampleViewContainer}>
          <div className={cs.sampleViewHeader}>
            <SampleViewHeader
              backgroundId={selectedOptions.background}
              deletable={sample ? sample.deletable : false}
              editable={sample ? sample.editable : false}
              onDetailsClick={this.toggleSampleDetailsSidebar}
              onPipelineVersionChange={this.handlePipelineVersionSelect}
              pipelineRun={pipelineRun}
              project={project}
              projectSamples={projectSamples}
              reportPresent={!!reportMetadata.reportReady}
              sample={sample}
              view={view}
              minContigSize={selectedOptions.minContigSize}
            />
          </div>
          <div className={cs.tabsContainer}>
            <UserContext.Consumer>
              {currentUser =>
                currentUser.allowedFeatures.includes(AMR_TABLE_FEATURE) &&
                reportMetadata.pipelineRunStatus === "SUCCEEDED" ? (
                  <Tabs
                    className={cs.tabs}
                    tabs={["Report", "Antimicrobial Resistance"]}
                    value={currentTab}
                    onChange={this.handleTabChange}
                  />
                ) : (
                  <div className={cs.dividerContainer}>
                    <div className={cs.divider} />
                  </div>
                )
              }
            </UserContext.Consumer>
          </div>
          {currentTab === "Report" && this.renderReport()}
          {currentTab === "Antimicrobial Resistance" &&
            amrData && <AMRView amr={amrData} />}
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
        {this.coverageVizEnabled() && (
          <CoverageVizBottomSidebar
            visible={coverageVizVisible}
            onClose={withAnalytics(
              this.closeCoverageViz,
              "SampleView_coverage-viz-sidebar_closed",
              {
                sampleId: sample.id,
                sampleName: sample.name,
              }
            )}
            params={this.getCoverageVizParams()}
            sampleId={sample.id}
            pipelineVersion={pipelineRun.pipeline_version}
            nameType={selectedOptions.nameType}
          />
        )}
      </React.Fragment>
    );
  };
}

SampleViewV2.propTypes = {
  sampleId: PropTypes.number,
};
