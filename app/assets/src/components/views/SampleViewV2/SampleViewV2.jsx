import React from "react";
import {
  entries,
  every,
  find,
  flatten,
  flow,
  get,
  keys,
  map,
  merge,
  pull,
  set,
  some,
  values,
} from "lodash/fp";
import deepEqual from "fast-deep-equal";

import {
  getBackgrounds,
  getSample,
  getSampleReportData,
  getSamples,
} from "~/api";
import { getAmrData } from "~/api/amr";
import { UserContext } from "~/components/common/UserContext";
import { AMR_TABLE_FEATURE } from "~/components/utils/features";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PropTypes from "~/components/utils/propTypes";
import ReportTable from "./ReportTable";
import SampleViewHeader from "./SampleViewHeader";
import Tabs from "~/components/ui/controls/Tabs";
import AMRView from "~/components/AMRView";

import ReportFilters from "./ReportFilters";
import cs from "./sample_view_v2.scss";

const SPECIES_LEVEL_INDEX = 1;
const GENUS_LEVEL_INDEX = 2;

export default class SampleViewV2 extends React.Component {
  constructor(props) {
    super(props);

    let localState = this.loadState(localStorage, "SampleViewOptions");

    this.state = Object.assign(
      {
        amrData: null,
        backgrounds: [],
        currentTab: "Report",
        filteredReportData: [],
        pipelineRun: null,
        project: null,
        projectSamples: [],
        reportData: [],
        sample: null,
        sidebarMode: null,
        sidebarVisible: false,
        sidebarTaxonData: null,
        view: "table",
        selectedOptions: this.defaultSelectedOptions(),
      },
      localState
    );
  }

  componentDidMount = () => {
    this.fetchSample();
    this.fetchBackgrounds();
    this.fetchSampleReportData();
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
      nameType: "Scientific name",
      readSpecificity: 0,
      minContigSize: 4,
      categories: {},
      thresholds: [],
    };
  };

  fetchSample = async () => {
    const { sampleId } = this.props;
    const sample = await getSample({ sampleId });
    sample.id = sampleId;
    this.setState(
      {
        sample: sample,
        pipelineRun: find(
          { id: sample.last_pipeline_run },
          sample.pipeline_runs
        ),
        project: sample.project,
      },
      this.fetchProjectSamples
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
    const { selectedOptions } = this.state;

    const rawReportData = await getSampleReportData({
      sampleId,
      background: selectedOptions.background,
    });

    const reportData = [];
    const highlightedTaxIds = new Set(rawReportData.highlightedTaxIds);
    rawReportData.sortedGenus.forEach(genusTaxId => {
      let hasHighlightedChildren = false;
      const childrenSpecies =
        rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId].children;
      const speciesData = childrenSpecies.map(speciesTaxId => {
        const isHighlighted = highlightedTaxIds.has(speciesTaxId);
        hasHighlightedChildren = hasHighlightedChildren || isHighlighted;
        return merge(rawReportData.counts[SPECIES_LEVEL_INDEX][speciesTaxId], {
          highlighted: isHighlighted,
          taxId: speciesTaxId,
          taxLevel: "species",
        });
      });
      reportData.push(
        merge(rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId], {
          highlighted:
            hasHighlightedChildren || highlightedTaxIds.has(genusTaxId),
          taxId: genusTaxId,
          taxLevel: "genus",
          species: speciesData,
        })
      );
    });

    this.setDisplayName({ reportData, ...selectedOptions });
    this.computeContigStats({ reportData, ...selectedOptions });
    const filteredReportData = this.filterReportData({
      reportData,
      filters: selectedOptions,
    });

    this.setState({
      reportData,
      filteredReportData,
      selectedOptions: Object.assign({}, selectedOptions, {
        background: rawReportData.backgroundId,
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
      categories.has(row.category) &&
      !some(
        subcategory => subcategories.has(subcategory),
        row.subcategories || []
      )
    ) {
      return true;
    }

    return false;
  };

  getTaxonMetricValue = (row, metric) => {
    return get(metric.split(":"), row);
  };

  filterThresholds = ({ row, thresholds }) => {
    if (thresholds && thresholds.length) {
      const res = every(threshold => {
        const { metric, operator, value } = threshold;
        const parsedThresholdValue = parseFloat(value);
        const parsedValue = this.getTaxonMetricValue(row, metric);

        switch (operator) {
          case ">=":
            return parsedThresholdValue < parsedValue;
          case "<=":
            return parsedThresholdValue > parsedValue;
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
            { id: sample.last_pipeline_run },
            sample.pipeline_runs
          ),
          reportData: [],
        },
        this.fetchSampleReportData()
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

  persistReportOptions = () => {
    // save new options to local storage
    const { selectedOptions } = this.state;
    // remove exceptions to persistent options
    const { taxon, ...persistentReportOptions } = selectedOptions;
    localStorage.setItem(
      "SampleViewOptions",
      JSON.stringify({
        selectedOptions: persistentReportOptions,
      })
    );
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
      default:
        return;
    }

    // save options in state and persist in local storage
    this.setState(
      {
        selectedOptions: newSelectedOptions,
      },
      () => {
        this.persistReportOptions();
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
        pipelineVersion: pipelineRun.pipeline_version,
        onMetadataUpdate: this.handleMetadataUpdate,
      };
    }
    return {};
  };

  render = () => {
    const {
      amrData,
      backgrounds,
      currentTab,
      filteredReportData,
      pipelineRun,
      project,
      projectSamples,
      reportData,
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
              editable={sample ? sample.editable : false}
              onDetailsClick={this.toggleSampleDetailsSidebar}
              onPipelineVersionChange={this.handlePipelineVersionSelect}
              pipelineRun={pipelineRun}
              project={project}
              projectSamples={projectSamples}
              reportPresent={!!reportData.length}
              sample={sample}
              view={view}
            />
          </div>
          <div className={cs.tabsContainer}>
            <UserContext.Consumer>
              {currentUser =>
                currentUser.allowedFeatures.includes(AMR_TABLE_FEATURE) ? (
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
          {currentTab === "Report" && (
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
              <div className={cs.reportTable}>
                <ReportTable
                  data={filteredReportData}
                  onTaxonNameClick={this.handleTaxonClick}
                />
              </div>
            </div>
          )}
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
      </React.Fragment>
    );
  };
}

SampleViewV2.propTypes = {
  sampleId: PropTypes.number,
};
