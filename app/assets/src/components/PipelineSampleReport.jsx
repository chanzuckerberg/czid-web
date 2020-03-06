import cx from "classnames";
import React from "react";
import Cookies from "js-cookie";
import $ from "jquery";
import { Menu, Icon, Popup } from "semantic-ui-react";
import {
  omit,
  partition,
  keyBy,
  groupBy,
  map,
  mapValues,
  get,
  find,
} from "lodash/fp";
import Nanobar from "nanobar";
import PropTypes from "prop-types";

import { getSampleReportInfo, getSummaryContigCounts } from "~/api";
import { parseUrlParams } from "~/helpers/url";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import ThresholdFilterTag from "~/components/common/ThresholdFilterTag";
import FilterTag from "~ui/controls/FilterTag";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";

import {
  computeThresholdedTaxons,
  isTaxonIncluded,
  getTaxonSortComparator,
  getCategoryAdjective,
  addContigCountsToTaxonomyDetails,
} from "./views/report/utils/taxon";
import ColumnHeaderTooltip from "./ui/containers/ColumnHeaderTooltip";
import ThresholdFilterDropdown from "./ui/controls/dropdowns/ThresholdFilterDropdown";
import PathogenLabel from "./ui/labels/PathogenLabel";
import PathogenPreview from "./views/report/PathogenPreview";
import ReportInsightIcon from "./views/report/ReportInsightIcon";
import ReportTable from "./views/report/ReportTable";
import BackgroundModelFilter from "./views/report/filters/BackgroundModelFilter";
import CategoryFilter from "./views/report/filters/CategoryFilter";
import MetricPicker from "./views/report/filters/MetricPicker";
import SpecificityFilter from "./views/report/filters/SpecificityFilter";
import NameTypeFilter from "./views/report/filters/NameTypeFilter";
import SearchBox from "./ui/controls/SearchBox";
import PhyloTreeChecks from "./views/phylo_tree/PhyloTreeChecks";
import TaxonTreeVis from "./views/TaxonTreeVis";
import LoadingLabel from "./ui/labels/LoadingLabel";
import HoverActions from "./views/report/ReportTable/HoverActions";
import { numberWithCommas } from "../helpers/strings";
import { getTaxonName, getGeneraContainingTags } from "../helpers/taxon";
import ThresholdMap from "./utils/ThresholdMap";
import {
  pipelineVersionHasAssembly,
  pipelineVersionHasCoverageViz,
} from "./utils/sample";

// NOTE: this used to be available as a filter. It is also enforced upstream in
// the loader. See MIN_CONTIG_READS in pipeline_run.rb
const MIN_CONTIG_READS = 4;
const HUMAN_TAX_IDS = [9605, 9606];

class PipelineSampleReport extends React.Component {
  constructor(props) {
    super(props);
    this.nanobar = new Nanobar({
      id: "prog-bar",
      class: "prog-bar",
    });
    this.admin = props.admin;
    this.allowedFeatures = props.allowedFeatures;
    this.allowPhyloTree = props.can_edit;
    this.report_ts = props.report_ts;
    this.sampleId = props.sample_id;
    this.projectId = props.projectId;
    this.projectName = props.projectName;
    this.gitVersion = props.git_version;
    this.canSeeAlignViz = props.can_see_align_viz;
    this.can_edit = props.can_edit;
    this.csrf = props.csrf;
    this.taxon_row_refs = {};
    this.all_categories = props.all_categories;
    this.report_details = props.report_details;
    this.all_backgrounds = props.all_backgrounds;
    this.max_rows_to_render = props.max_rows || 1500;
    this.default_sort_by = "nt_aggregatescore";

    const allCategorySet = new Set(
      this.all_categories.map(categoryOption => {
        return categoryOption.name;
      })
    );
    const cachedIncludedCategories = Cookies.get("includedCategories");
    const cachedIncludedSubcategories = Cookies.get("includedSubcategories");

    const cachedReadSpecificity = Cookies.get("readSpecificity");
    const cachedTreeMetric = Cookies.get("treeMetric");

    this.allThresholds = [
      { text: "Score", value: "NT_aggregatescore" },
      { text: "NT Z Score", value: "NT_zscore" },
      { text: "NT rPM", value: "NT_rpm" },
      { text: "NT r (total reads)", value: "NT_r" },
      { text: "NT contigs", value: "NT_contigs" },
      { text: "NT contig reads", value: "NT_contigreads" },
      { text: "NT %id", value: "NT_percentidentity" },
      { text: "NT L (alignment length in bp)", value: "NT_alignmentlength" },
      { text: "NT log(1/e)", value: "NT_neglogevalue" },
      { text: "NR Z Score", value: "NR_zscore" },
      { text: "NR rPM", value: "NR_rpm" },
      { text: "NR r (total reads)", value: "NR_r" },
      { text: "NR contigs", value: "NR_contigs" },
      { text: "NR contig reads", value: "NR_contigreads" },
      { text: "NR %id", value: "NR_percentidentity" },
      { text: "NR L (alignment length in bp)", value: "NR_alignmentlength" },
      { text: "NR log(1/e)", value: "NR_neglogevalue" },
    ];

    // If the saved threshold object doesn't have metricDisplay, add it. For backwards compatibility.
    const savedThresholdFilters = map(
      threshold => ({
        metricDisplay: get(
          "text",
          find(["value", threshold.metric], this.allThresholds)
        ),
        ...threshold,
      }),
      ThresholdMap.getSavedThresholdFilters()
    );

    this.treeMetrics = [
      { text: "Aggregate Score", value: "aggregatescore" },
      { text: "NT r (total reads)", value: "nt_r" },
      { text: "NT rPM", value: "nt_rpm" },
      { text: "NR r (total reads)", value: "nr_r" },
      { text: "NR rPM", value: "nr_rpm" },
    ];

    this.categoryChildParent = { Phage: "Viruses" };
    this.categoryParentChild = { Viruses: ["Phage"] };
    this.genusMap = {};

    this.INVALID_CALL_BASE_TAXID = -1e8;

    this.thresholdTextByValue = this.allThresholds.reduce(
      (metrics, threshold) => {
        metrics[threshold.value] = threshold.text;
        return metrics;
      },
      {}
    );

    let defaultBackgroundId = parseInt(this.fetchParams("background_id")) || -1;
    // we should only keep dynamic data in the state
    // Starting state is default values which are to be set later.
    this.state = {
      taxonomy_details: [],
      topScoringTaxa: [],
      backgroundData: {
        id: defaultBackgroundId,
        name: "",
      },
      search_taxon_id: 0,
      lineage_map: {},
      rows_passing_filters: 0,
      rows_total: 0,
      selected_taxons: [],
      selected_taxons_top: [],
      pagesRendered: 0,
      sort_by: this.default_sort_by,
      includedCategories: cachedIncludedCategories
        ? JSON.parse(cachedIncludedCategories).filter(category => {
            return allCategorySet.has(category);
          })
        : [],
      includedSubcategories: cachedIncludedSubcategories
        ? JSON.parse(cachedIncludedSubcategories).filter(category => {
            return category in this.categoryChildParent;
          })
        : [],
      rendering: false,
      loading: true,
      activeThresholds: savedThresholdFilters,
      countType: "NT",
      readSpecificity: cachedReadSpecificity
        ? parseInt(cachedReadSpecificity)
        : 0,
      treeMetric: cachedTreeMetric || this.treeMetrics[0].value,
      phyloTreeModalOpen: true,
      contigTaxidList: [],
      minContigReads: MIN_CONTIG_READS,
      hoverRowId: null,
      phyloTreeModalParams: null,
    };

    this.state = {
      ...this.state,
      // Override from explicit save
      ...props.savedParamValues,
      // Override from the URL
      ...parseUrlParams(),
    };

    this.expandAll = false;
    this.expandedGenera = [];
    this.thresholded_taxons = [];
    this.initializeTooltip();
  }

  UNSAFE_componentWillMount() {
    // Fill in URL parameters for usability and specifying data to fetch.
    this.fillUrlParams();
    // Fetch the actual report data via axios calls to fill in the page.
    this.fetchReportData();
  }

  componentDidMount() {
    this.scrollDown();
  }

  componentDidUpdate(prevProps, prevState) {
    // Set the state in the URL
    // Omit contigTaxidList and taxonomy_details, which are large arrays that shouldn't be put into the URL.
    this.props.refreshPage(
      omit(["contigTaxidList", "taxonomy_details"], this.state),
      false
    );
  }

  // fetchReportData loads the actual report information with another call to
  // the API endpoint.
  fetchReportData = async () => {
    this.nanobar.go(30);
    this.setState({
      loading: true,
    });
    let params = `?${window.location.search.replace("?", "")}&report_ts=${
      this.report_ts
    }&git_version=${this.gitVersion}&format=json`;

    const [sampleReportInfo, summaryContigCounts] = await Promise.all([
      getSampleReportInfo(this.sampleId, params),
      getSummaryContigCounts(this.sampleId, this.state.minContigReads),
    ]);

    this.nanobar.go(100);

    const taxonomyDetails = addContigCountsToTaxonomyDetails(
      sampleReportInfo.taxonomy_details[2],
      summaryContigCounts.contig_counts
    );

    const [genusTaxons, speciesTaxons] = partition(
      ["tax_level", 2],
      taxonomyDetails
    );

    const genusMap = keyBy("genus_taxid", genusTaxons);
    const genusToSpeciesMap = mapValues(
      map(taxon => ({
        taxonId: taxon.tax_id,
        taxonName: taxon.name,
        taxonCommonName: taxon.common_name,
      })),
      groupBy("genus_taxid", speciesTaxons)
    );

    this.genusMap = genusMap;
    this.genusToSpeciesMap = genusToSpeciesMap;

    this.setState(
      {
        loading: false,
        rows_passing_filters: sampleReportInfo.taxonomy_details[0],
        rows_total: sampleReportInfo.taxonomy_details[1],
        taxonomy_details: taxonomyDetails,
        generaContainingTags: getGeneraContainingTags(
          sampleReportInfo.taxonomy_details[2]
        ),
        topScoringTaxa: sampleReportInfo.topScoringTaxa,
        backgroundData: {
          id: sampleReportInfo.background_info.id,
          name: sampleReportInfo.background_info.name,
        },
        contigTaxidList: sampleReportInfo.contig_taxid_list,
      },
      () => {
        this.applyFilters(true);
      }
    );
  };

  anyFilterSet = () => {
    return (
      this.state.search_taxon_id > 0 ||
      this.state.includedCategories.length > 0 ||
      this.state.includedSubcategories.length > 0 ||
      (this.state.activeThresholds.length > 0 &&
        ThresholdMap.isThresholdValid(this.state.activeThresholds[0]))
    );
  };

  resetAllFilters = () => {
    this.setState(
      {
        activeThresholds: [],
        includedCategories: [],
        includedSubcategories: [],
        search_taxon_id: 0,
        selected_taxons: this.state.taxonomy_details,
        selected_taxons_top: this.state.taxonomy_details.slice(
          0,
          this.max_rows_to_render
        ),
        pagesRendered: 1,
        rows_passing_filters: this.state.taxonomy_details.length,
        readSpecificity: 0,
      },
      () => {
        ThresholdMap.saveThresholdFilters([]);
        Cookies.set("includedCategories", "[]");
        Cookies.set("includedSubcategories", "[]");
      }
    );
  };

  applyFilters = (recomputeThresholdedTaxons = false) => {
    //
    // Threshold filters
    //
    if (recomputeThresholdedTaxons) {
      this.thresholded_taxons = computeThresholdedTaxons(
        this.state.taxonomy_details,
        this.state.activeThresholds
      );
    }

    let input_taxons = this.thresholded_taxons;
    let searchTaxonId = this.state.search_taxon_id;
    let includedCategories = this.state.includedCategories;
    let includedSubcategories = this.state.includedSubcategories;

    let selected_taxons = [];
    const specificOnly = this.state.readSpecificity === 1;

    //
    // Search filters
    //
    if (searchTaxonId > 0) {
      let genus_taxon = {};
      let matched_taxons = [];
      let new_input_taxons = [];
      for (let i = 0; i < input_taxons.length; i++) {
        const taxon = input_taxons[i];
        if (taxon.genus_taxid == taxon.tax_id) {
          if (matched_taxons.length > 0) {
            new_input_taxons.push(genus_taxon);
            new_input_taxons = new_input_taxons.concat(matched_taxons);
          }
          genus_taxon = taxon;
          matched_taxons = [];
        } else {
          // species
          const match_keys = new Set([
            taxon.tax_id,
            taxon.lineage.species_taxid,
            taxon.lineage.genus_taxid,
            taxon.lineage.family_taxid,
            taxon.lineage.order_taxid,
            taxon.lineage.class_taxid,
            taxon.lineage.phylum_taxid,
            taxon.lineage.kingdom_taxid,
            taxon.lineage.superkingdom_taxid,
          ]);
          if (match_keys && match_keys.has(searchTaxonId)) {
            matched_taxons.push(taxon);
          }
        }
      }
      if (matched_taxons.length > 0) {
        new_input_taxons.push(genus_taxon);
        new_input_taxons = new_input_taxons.concat(matched_taxons);
      }

      input_taxons = new_input_taxons;
    }

    //
    // Category filters
    //
    if (includedCategories.length > 0 || includedSubcategories.length > 0) {
      // prepare some variables used by isTaxonIncluded
      const excludedSubcategories = [];
      Object.keys(this.categoryChildParent).forEach(subcat => {
        const parent = this.categoryChildParent[subcat];
        if (
          includedCategories.includes(parent) &&
          includedSubcategories.indexOf(subcat) < 0
        ) {
          excludedSubcategories.push(subcat);
        }
      });
      const includedSubcategoryColumns = includedSubcategories.map(subcat => {
        return `is_${subcat.toLowerCase()}`;
      });
      const excludedSubcategoryColumns = excludedSubcategories.map(subcat => {
        return `is_${subcat.toLowerCase()}`;
      });

      for (var i = 0; i < input_taxons.length; i++) {
        let taxon = input_taxons[i];
        if (
          isTaxonIncluded(
            taxon,
            includedCategories,
            includedSubcategoryColumns,
            excludedSubcategoryColumns
          )
        ) {
          // In the included categories or subcategories
          selected_taxons.push(taxon);
        } else if (
          taxon.category_name == "Uncategorized" &&
          parseInt(taxon.tax_id) == -200
        ) {
          // the 'all taxa without genus classification' taxon
          const uncat_taxon = taxon;
          const filtered_children = [];
          i++;
          taxon = input_taxons[i];
          while (taxon && taxon.genus_taxid == -200) {
            if (
              isTaxonIncluded(
                taxon,
                includedCategories,
                includedSubcategoryColumns,
                excludedSubcategoryColumns
              )
            ) {
              filtered_children.push(taxon);
            }
            i++;
            taxon = input_taxons[i];
          }
          if (filtered_children.length > 0) {
            selected_taxons.push(uncat_taxon);
            selected_taxons = selected_taxons.concat(filtered_children);
          }
          i--;
        }
      }
    } else {
      selected_taxons = input_taxons;
    }

    //
    // Non-specific reads filter
    //
    if (specificOnly) {
      selected_taxons = this.filterNonSpecific(selected_taxons);
    }
    selected_taxons = this.updateSpeciesCount(selected_taxons);
    if (specificOnly) {
      selected_taxons = this.removeEmptyGenusRows(selected_taxons);
    }

    this.setState({
      loading: false,
      selected_taxons,
      selected_taxons_top: selected_taxons.slice(0, this.max_rows_to_render),
      pagesRendered: 1,
      rows_passing_filters: selected_taxons.length,
    });
  };

  updateSpeciesCount = res => {
    for (let i = 0; i < res.length; i++) {
      let isGenus = res[i].genus_taxid == res[i].tax_id;
      if (isGenus) {
        // Find a genus entry and count the number of species entries after it.
        let count = 0;
        for (
          let j = i + 1;
          j < res.length &&
          res[j].genus_taxid != res[j].tax_id &&
          res[j].genus_taxid === res[i].genus_taxid;
          j++
        ) {
          count++;
        }
        res[i].species_count = count;
      }
    }
    return res;
  };

  filterNonSpecific = rows => {
    let filtered = [];
    for (let i = 0; i < rows.length; i++) {
      let cur = rows[i];
      if (cur.tax_id < 0) {
        // Leave it off if non-specific.
        if (cur.tax_level === 2) {
          // If it was a non-specific genus row, remove species rows under it.
          let j = i + 1;
          while (j < rows.length && rows[j].genus_taxid === cur.tax_id) {
            j++;
          }
          i = j - 1; // -1 at the end because you increment j and i.
        }
      } else {
        filtered.push(cur);
      }
    }
    return filtered;
  };

  removeEmptyGenusRows = rows => {
    // Remove rows unless they have a species tax level or a species count
    // under them of greater than 0.
    return rows.filter(r => r.tax_level === 1 || r.species_count > 0);
  };

  //Load more samples on scroll
  scrollDown = () => {
    var that = this;
    $(window).scroll(function() {
      if (
        $(window).scrollTop() >
        $(document).height() - $(window).height() - 6000
      ) {
        {
          that.state.rows_total > 0 && !that.state.rendering
            ? that.renderMore()
            : null;
        }
        return false;
      }
    });
  };

  renderMore = () => {
    let selected_taxons = this.state.selected_taxons;
    let currentPage = this.state.pagesRendered;
    let rowsPerPage = this.max_rows_to_render;
    if (selected_taxons.length > currentPage * this.max_rows_to_render) {
      let next_page = selected_taxons.slice(
        currentPage * rowsPerPage,
        rowsPerPage * (currentPage + 1)
      );
      this.setState(prevState => ({
        selected_taxons_top: [...prevState.selected_taxons_top, ...next_page],
        pagesRendered: currentPage + 1,
      }));
    }
  };

  initializeTooltip = () => {
    // only updating the tooltip offset when the component is loaded
    $(() => {
      const tooltipIdentifier = $("[rel='tooltip']");
      tooltipIdentifier.tooltip({
        delay: 0,
        html: true,
        placement: "top",
        offset: "0px 50px",
      });
      $(".sort-controls").hover(() => {
        const selectTooltip = $(".tooltip");
        const leftOffset = parseInt(selectTooltip.css("left"));
        if (!isNaN(leftOffset)) {
          selectTooltip.css("left", leftOffset - 15);
        }
      });
    });
  };

  applySort = sort_by => {
    if (sort_by.toLowerCase() != this.state.sort_by) {
      this.state.sort_by = sort_by.toLowerCase();
      this.sortResults();
    }
  };

  setSortParams = () => {
    const primary_sort = this.state.sort_by.split("_");
    primary_sort[0] = primary_sort[0].toUpperCase();
    const secondary_sort = this.default_sort_by.split("_");
    secondary_sort[0] = secondary_sort[0].toUpperCase();
    this.sortParams = {
      primary: primary_sort,
      secondary: secondary_sort,
    };
  };

  handleIncludedCategoriesChange = (
    newIncludedCategories,
    newIncludedSubcategories
  ) => {
    let includedSubcategories = [];
    for (let category in newIncludedSubcategories) {
      if (newIncludedSubcategories.hasOwnProperty(category)) {
        includedSubcategories = includedSubcategories.concat(
          newIncludedSubcategories[category]
        );
      }
    }

    this.setState(
      {
        includedCategories: newIncludedCategories,
        includedSubcategories,
      },
      () => {
        Cookies.set(
          "includedCategories",
          JSON.stringify(newIncludedCategories)
        );
        Cookies.set(
          "includedSubcategories",
          JSON.stringify(includedSubcategories)
        );
        this.applyFilters();
        logAnalyticsEvent("PipelineSampleReport_included-categories_changed", {
          includedCategories: this.state.includedCategories.length,
          includedSubcategories: includedSubcategories.length,
        });
      }
    );
  };

  handleRemoveCategory = categoryToRemove => {
    let newIncludedCategories = this.state.includedCategories.filter(
      category => {
        return category != categoryToRemove;
      }
    );
    this.handleIncludedCategoriesChange(
      newIncludedCategories,
      this.state.includedSubcategories
    );
  };

  handleRemoveSubcategory = subcategoryToRemove => {
    let newIncludedSubcategories = this.state.includedSubcategories.filter(
      subcategory => {
        return subcategory != subcategoryToRemove;
      }
    );
    this.handleIncludedCategoriesChange(
      this.state.includedCategories,
      newIncludedSubcategories
    );
  };

  sortResults = () => {
    this.setSortParams();
    let selected_taxons = this.state.selected_taxons;
    const taxonSortComparator = getTaxonSortComparator(
      this.sortParams.primary,
      this.sortParams.secondary,
      this.genusMap
    );
    selected_taxons = selected_taxons.sort(taxonSortComparator);
    this.setState({
      selected_taxons: selected_taxons,
      selected_taxons_top: selected_taxons.slice(0, this.max_rows_to_render),
      pagesRendered: 1,
    });
    this.thresholded_taxons = this.thresholded_taxons.sort(taxonSortComparator);
    this.state.taxonomy_details = this.state.taxonomy_details.sort(
      taxonSortComparator
    );
  };

  handleThresholdFiltersChange = activeThresholds => {
    ThresholdMap.saveThresholdFilters(activeThresholds);
    this.setState({ activeThresholds }, () => {
      this.applyFilters(true);
    });
  };

  handleRemoveThresholdFilter = pos => {
    const activeThresholds = Object.assign([], this.state.activeThresholds);
    activeThresholds.splice(pos, 1);
    this.handleThresholdFiltersChange(activeThresholds);
  };

  handleBackgroundModelChange = (backgroundId, backgroundName) => {
    if (backgroundId === this.state.backgroundData.id) {
      // Skip if no change
      return;
    }

    Cookies.set("background_id", backgroundId);
    this.setState(
      {
        backgroundData: {
          name: backgroundName,
          id: backgroundId,
        },
      },
      () => {
        logAnalyticsEvent(
          "PipelineSampleReport_background-model-filter_changed",
          {
            backgroundName,
            backgroundId,
          }
        );
        // TODO (gdingle): do we really want to reload the page here?
        this.props.refreshPage({ background_id: backgroundId });
      }
    );
  };

  handleNameTypeChange = nameType => {
    this.props.onNameTypeChange(nameType);
    logAnalyticsEvent("PipelineSampleReport_name-type-filter_changed", {
      nameType,
    });
  };

  handleSpecificityChange = readSpecificity => {
    Cookies.set("readSpecificity", readSpecificity);
    this.setState({ readSpecificity }, () => {
      this.applyFilters();
      logAnalyticsEvent("PipelineSampleReport_specificity-filter_changed", {
        readSpecificity,
      });
    });
  };

  handleTreeMetricChange = treeMetric => {
    Cookies.set("treeMetric", treeMetric);
    this.setState({ treeMetric }, () => {
      logAnalyticsEvent("PipelineSampleReport_tree-metric-picker_changed", {
        treeMetric,
      });
    });
  };

  // path to NCBI
  gotoNCBI = params => {
    const { taxId } = params;
    let num = parseInt(taxId);
    if (num < -1e8) {
      num = -num % -1e8;
    }
    num = num.toString();
    const ncbiLink = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${num}`;
    window.open(ncbiLink, "hide_referrer");
  };

  // download Fasta
  downloadFastaUrl = params => {
    const { taxLevel, taxId } = params;
    const pipelineVersion = this.props.reportPageParams.pipeline_version;
    const taxLevelIdx = taxLevel === "species" ? 1 : 2;
    location.href = `/samples/${
      this.sampleId
    }/fasta/${taxLevelIdx}/${taxId}/NT_or_NR?pipeline_version=${pipelineVersion}`;
  };

  // download Contig
  downloadContigUrl = params => {
    const { taxId } = params;
    const pipelineVersion = this.props.reportPageParams.pipeline_version;
    location.href = `/samples/${
      this.sampleId
    }/taxid_contigs?taxid=${taxId}&pipeline_version=${pipelineVersion}`;
  };

  handleCoverageVizClick = params => {
    const { taxId, taxLevel, taxName, taxCommonName } = params;
    const pipelineVersion = this.props.reportPageParams.pipeline_version;

    const alignmentVizUrl = `/samples/${
      this.sampleId
    }/alignment_viz/nt_${taxLevel}_${taxId}?pipeline_version=${pipelineVersion}`;

    const speciesTaxons =
      taxLevel === "genus" ? this.genusToSpeciesMap[taxId] : [];

    if (pipelineVersionHasCoverageViz(pipelineVersion)) {
      this.props.onCoverageVizClick({
        taxId,
        taxName,
        taxCommonName,
        taxLevel,
        alignmentVizUrl,
        speciesTaxons,
      });
    } else {
      window.open(alignmentVizUrl);
    }
  };

  handlePhyloTreeModalOpen = phyloTreeModalParams => {
    this.setState({
      phyloTreeModalParams,
    });
  };

  handlePhyloTreeModalClose = () => {
    this.setState({
      phyloTreeModalParams: null,
    });
  };

  displayHoverActions = (taxInfo, reportDetails) => {
    const { reportPageParams } = this.props;
    const validTaxId =
      taxInfo.tax_id < this.INVALID_CALL_BASE_TAXID || taxInfo.tax_id > 0;
    const ncbiEnabled = validTaxId;
    const fastaEnabled =
      !HUMAN_TAX_IDS.includes(taxInfo.tax_id) && reportDetails.taxon_fasta_flag;
    const contigVizEnabled =
      !HUMAN_TAX_IDS.includes(taxInfo.tax_id) &&
      this.state.contigTaxidList.indexOf(taxInfo.tax_id) >= 0;
    const coverageVizEnabled =
      !HUMAN_TAX_IDS.includes(taxInfo.tax_id) &&
      this.canSeeAlignViz &&
      validTaxId &&
      taxInfo.NT.r > 0;
    const phyloTreeEnabled =
      !HUMAN_TAX_IDS.includes(taxInfo.tax_id) &&
      this.allowPhyloTree &&
      taxInfo.tax_id > 0 &&
      PhyloTreeChecks.passesCreateCondition(taxInfo.NT.r, taxInfo.NR.r);

    const analyticsContext = {
      projectId: this.projectId,
      projectName: this.projectName,
      sampleId: this.sampleId,
      taxId: taxInfo.tax_id,
      taxLevel: taxInfo.tax_level,
      taxName: taxInfo.name,
    };
    return (
      <HoverActions
        className="link-tag"
        taxId={taxInfo.tax_id}
        taxLevel={taxInfo.tax_level}
        taxName={taxInfo.name}
        taxCommonName={taxInfo.common_name}
        ncbiEnabled={ncbiEnabled}
        onNcbiActionClick={withAnalytics(
          this.gotoNCBI,
          "PipelineSampleReport_ncbi-link_clicked",
          analyticsContext
        )}
        fastaEnabled={fastaEnabled}
        onFastaActionClick={withAnalytics(
          this.downloadFastaUrl,
          "PipelineSampleReport_taxon-fasta-link_clicked",
          analyticsContext
        )}
        coverageVizEnabled={coverageVizEnabled}
        onCoverageVizClick={withAnalytics(
          this.handleCoverageVizClick,
          "PipelineSampleReport_coverage-viz-link_clicked",
          analyticsContext
        )}
        contigVizEnabled={contigVizEnabled}
        onContigVizClick={withAnalytics(
          this.downloadContigUrl,
          "PipelineSampleReport_contig-download-link_clicked",
          analyticsContext
        )}
        phyloTreeEnabled={phyloTreeEnabled}
        onPhyloTreeModalOpened={withAnalytics(
          this.handlePhyloTreeModalOpen,
          "PipelineSampleReport_phylotree-link_clicked",
          analyticsContext
        )}
        pipelineVersion={reportPageParams.pipeline_version}
      />
    );
  };

  renderName = (tax_info, report_details, backgroundData, onTaxonClick) => {
    let taxCommonName = tax_info["common_name"];
    const taxonName = getTaxonName(
      tax_info["name"],
      taxCommonName,
      this.props.nameType
    );

    const grayOut =
      this.props.nameType.toLowerCase() == "common name" &&
      (!taxCommonName || taxCommonName.trim() == "");
    let taxonNameDisplay = (
      <span className={grayOut ? "count-info" : ""}>{taxonName}</span>
    );

    const onTaxonClickHandler = () =>
      onTaxonClick({
        taxInfo: tax_info,
        backgroundData,
        taxonName,
      });

    if (tax_info.tax_id > 0) {
      if (report_details.taxon_fasta_flag) {
        taxonNameDisplay = (
          <span
            className="taxon-sidebar-link"
            onClick={withAnalytics(
              onTaxonClickHandler,
              "PipelineSampleReport_taxon-sidebar-link_clicked"
            )}
          >
            <a>{taxonNameDisplay}</a>
          </span>
        );
      } else {
        taxonNameDisplay = (
          <span
            className="taxon-sidebar-link"
            onClick={withAnalytics(
              onTaxonClickHandler,
              "PipelineSampleReport_taxon-sidebar-link_clicked"
            )}
          >
            {taxonNameDisplay}
          </span>
        );
      }
    } else {
      taxonNameDisplay = <i>{taxonNameDisplay}</i>;
    }
    let secondaryTaxonDisplay = (
      <span>
        {this.state.generaContainingTags[tax_info.tax_id] && (
          <PathogenPreview
            tag2Count={this.state.generaContainingTags[tax_info.tax_id]}
          />
        )}
        {tax_info.pathogenTag && <PathogenLabel type={tax_info.pathogenTag} />}
        {this.isRowHovered(tax_info) &&
          this.displayHoverActions(tax_info, report_details)}
      </span>
    );
    let taxonDescription;
    if (tax_info.tax_level == 1) {
      // indent species rows
      taxonDescription = (
        <div className="hover-wrapper">
          <div className="species-name">
            {taxonNameDisplay}
            {secondaryTaxonDisplay}
          </div>
        </div>
      );
    } else {
      // emphasize genus, soften category and species count
      let category_name = "";
      if (tax_info.tax_id != -200) category_name = tax_info.category_name;
      const collapseExpand = (
        <CollapseExpand tax_info={tax_info} parent={this} />
      );
      taxonDescription = (
        <div className="hover-wrapper">
          <div className="genus-name">
            {" "}
            {collapseExpand} {taxonNameDisplay}
          </div>
          <i className="count-info">
            ({tax_info.species_count} {getCategoryAdjective(category_name)}{" "}
            species)
          </i>
          {secondaryTaxonDisplay}
        </div>
      );
    }
    return taxonDescription;
  };

  // Use JS events for hover state to so we can avoid rendering many hidden
  // elements which was taking >500ms.
  isRowHovered = taxInfo => {
    return this.state.hoverRowId === taxInfo.tax_id;
  };

  handleMouseEnter = taxID => {
    this.setState({ hoverRowId: taxID });
  };

  handleMouseLeave = () => {
    this.setState({ hoverRowId: null });
  };

  renderNumber = (
    ntCount,
    nrCount,
    numDecimals,
    isAggregate = false,
    visibleFlag = true,
    showInsight = false,
    className = ""
  ) => {
    if (!visibleFlag) {
      return null;
    }
    let ntCountStr = numberWithCommas(Number(ntCount).toFixed(numDecimals));
    let nrCountStr =
      nrCount !== null
        ? numberWithCommas(Number(nrCount).toFixed(numDecimals))
        : null;
    const ntCountLabel = isAggregate ? (
      <div className={`active ${this.switchClassName("NT", ntCount)}`}>
        {showInsight ? <ReportInsightIcon /> : null} {ntCountStr}
      </div>
    ) : (
      <div className={`${this.switchClassName("NT", ntCount)}`}>
        {ntCountStr}
      </div>
    );
    const nrCountLabel = nrCountStr ? (
      <div className={`${this.switchClassName("NR", nrCount)}`}>
        {nrCountStr}
      </div>
    ) : null;

    return (
      <td className={cx("report-number", className)}>
        {ntCountLabel}
        {nrCountLabel}
      </td>
    );
  };

  switchClassName = (countType, countValue) => {
    const isCountBlank = countValue === 0 || countValue === -100 ? "blank" : "";
    const isActive = this.state.countType === countType ? "active" : "";
    return `${isActive} ${isCountBlank} count-type`;
  };

  isSortedActive = columnName => {
    const desiredSort = columnName.toLowerCase();
    return this.state.sort_by == desiredSort ? "active" : "";
  };

  render_sort_arrow = (column, desiredSortDirection, arrowDirection) => {
    let className = `${this.isSortedActive(
      column
    )} fa fa-chevron-${arrowDirection}`;
    return (
      <i
        onClick={() => {
          this.applySort(column);
          logAnalyticsEvent("PipelineSampleReport_column-sort-arrow_clicked", {
            column,
            desiredSortDirection,
            arrowDirection,
          });
        }}
        className={className}
        key={column.toLowerCase()}
      />
    );
  };

  renderColumnHeader = (
    visibleMetric,
    columnName,
    tooltipData,
    visibleFlag = true
  ) => {
    let element = (
      <div
        className="sort-controls"
        onClick={() => {
          this.applySort(columnName);
          logAnalyticsEvent("PipelineSampleReport_column-header_clicked", {
            columnName,
          });
        }}
      >
        <span className={`${this.isSortedActive(columnName)} table-head-label`}>
          {visibleMetric}
        </span>
        {this.render_sort_arrow(columnName, "highest", "up")}
      </div>
    );
    const className = columnName === "NT_aggregatescore" && "score-column";

    if (!visibleFlag) return null;
    return (
      <th className={cx(className)}>
        <ColumnHeaderTooltip
          position="top right"
          trigger={element}
          content={tooltipData.tooltip}
          title={tooltipData.title ? tooltipData.title : visibleMetric}
          link={tooltipData.link}
        />
      </th>
    );
  };

  isTaxonExpanded = taxInfo => {
    return (
      (this.expandAll && taxInfo.genus_taxid > 0) ||
      this.expandedGenera.indexOf(taxInfo.genus_taxid.toString()) >= 0
    );
  };

  getRowClass = taxInfo => {
    const topScoringRow = taxInfo.topScoring === 1;

    if (taxInfo.tax_level == 2) {
      return cx(
        "report-row-genus",
        taxInfo.genus_taxid, // TODO(mark): remove non-styling-related class.
        topScoringRow && "top-scoring-row"
      );
    }

    return cx(
      "report-row-species",
      taxInfo.genus_taxid, // TODO(mark): remove non-styling-related class.
      !this.isTaxonExpanded(taxInfo) && "hidden",
      topScoringRow && "top-scoring-row"
    );
  };

  expandGenusClick = e => {
    const className = e.target.attributes.class.nodeValue;
    const attr = className.split(" ");
    const taxId = attr[2];
    this.expandGenus(taxId);
  };

  expandGenus = taxId => {
    const taxIdIdx = this.expandedGenera.indexOf(taxId);
    if (taxIdIdx < 0) {
      this.expandedGenera.push(taxId);
    }
    $(`.report-row-species.${taxId}`).removeClass("hidden");
    $(`.report-arrow.${taxId}`).toggleClass("hidden");
  };

  collapseGenus = e => {
    const className = e.target.attributes.class.nodeValue;
    const attr = className.split(" ");
    const taxId = attr[2];
    const taxIdIdx = this.expandedGenera.indexOf(taxId);
    if (taxIdIdx >= 0) {
      this.expandedGenera.splice(taxIdIdx, 1);
    }
    $(`.report-row-species.${taxId}`).addClass("hidden");
    $(`.report-arrow.${taxId}`).toggleClass("hidden");
  };

  expandTable = e => {
    // expand all real genera
    this.expandAll = true;
    this.expandedGenera = [];
    $(".report-row-species").removeClass("hidden");
    $(".report-arrow-down").removeClass("hidden");
    $(".report-arrow-right").addClass("hidden");
    $(".table-arrow").toggleClass("hidden");
  };

  collapseTable = e => {
    // collapse all genera (real or negative)
    this.expandAll = false;
    this.expandedGenera = [];
    $(".report-row-species").addClass("hidden");
    $(".report-arrow-down").addClass("hidden");
    $(".report-arrow-right").removeClass("hidden");
    $(".table-arrow").toggleClass("hidden");
  };

  searchSelectedTaxon = (e, { result }) => {
    this.setState(
      {
        search_taxon_id: result.taxid,
      },
      () => {
        this.applyFilters();
        logAnalyticsEvent("PipelineSampleReport_taxon-search_returned", {
          search_taxon_id: result.taxid,
        });
      }
    );
  };

  // Fill in desired URL parameters so user's can copy and paste URLs.
  // Ex: Add ?pipeline_version=1.7&background_id=4 to /samples/545
  // This way links can still be to '/samples/545' in the rest of the app
  // but the URL will be filled in without triggering another page reload.
  //
  // Order of precedence for background_id is:
  // (1) URL parameter specified
  // (2) saved background name in frontend cookie
  // (3) the default background
  fillUrlParams = () => {
    // Skip if report is not present or a background ID and pipeline version
    // are explicitly specified in the URL.
    if (
      !this.props.reportPageParams ||
      (this.fetchParams("pipeline_version") &&
        this.fetchParams("background_id"))
    ) {
      return;
    }

    // Setup
    let params = new URLSearchParams(window.href);
    const stringer = require("querystring");

    if (!this.fetchParams("background_id") && Cookies.get("background_id")) {
      const cookie_bgid = Cookies.get("background_id");
      let match = this.all_backgrounds.filter(b => b["id"] == cookie_bgid);
      if (match.length > 0) {
        this.props.reportPageParams.background_id = cookie_bgid;
      } else {
        Cookies.remove("background_id");
      }
    }

    // Set pipeline_version and background_id from reportPageParams.
    params["pipeline_version"] = this.props.reportPageParams.pipeline_version;
    params["background_id"] = this.props.reportPageParams.background_id;
    // Modify the URL in place without triggering a page reload.
    history.replaceState(null, null, `?${stringer.stringify(params)}`);
  };

  fetchParams = param => {
    let url = new URL(window.location);
    return url.searchParams.get(param);
  };

  render() {
    const filter_stats = `${
      this.state.rows_passing_filters
    } rows passing the above filters, out of ${
      this.state.rows_total
    } total rows.`;

    let truncation_stats =
      this.report_details && this.report_details.pipeline_info.truncated
        ? "Overly large input was truncated to " +
          this.report_details.pipeline_info.truncated +
          " reads."
        : "";
    let subsampled_reads = this.report_details
      ? this.report_details.subsampled_reads
      : null;
    let subsampling_stats =
      subsampled_reads &&
      subsampled_reads <
        this.report_details.pipeline_info.adjusted_remaining_reads
        ? `Report values are computed from ${subsampled_reads} reads subsampled randomly from the ${
            this.report_details.pipeline_info.adjusted_remaining_reads
          } reads passing host and quality filters.`
        : "";
    const disable_filter = this.anyFilterSet() ? (
      <span
        className="disable"
        onClick={e => {
          this.resetAllFilters();
          logAnalyticsEvent("PipelineSampleReport_clear-filters-link_clicked");
        }}
      >
        Clear all filters
      </span>
    ) : null;
    const filter_row_stats = this.state.loading ? null : (
      <div id="filter-message" className="filter-message">
        <span className="count">
          {filter_stats} {truncation_stats} {subsampling_stats}{" "}
          {this.props.gsnapFilterStatus} {disable_filter}
        </span>
      </div>
    );

    const advanced_filter_tag_list = this.state.activeThresholds.map(
      (threshold, i) => (
        <ThresholdFilterTag
          className="filter-tag"
          key={`threshold_filter_tag_${i}`}
          threshold={threshold}
          onClose={() => {
            this.handleRemoveThresholdFilter(i);
            logAnalyticsEvent("PipelineSampleReport_threshold-filter_removed", {
              value: threshold.value,
              operator: threshold.operator,
              metric: threshold.metric,
            });
          }}
        />
      )
    );

    const categories_filter_tag_list = this.state.includedCategories.map(
      (category, i) => {
        return (
          <FilterTag
            className="filter-tag"
            key={`category_filter_tag_${i}`}
            text={category}
            onClose={() => {
              this.handleRemoveCategory(category);
              logAnalyticsEvent(
                "PipelineSampleReport_categories-filter_removed",
                {
                  category,
                }
              );
            }}
          />
        );
      }
    );

    const subcats_filter_tag_list = this.state.includedSubcategories.map(
      (subcat, i) => {
        return (
          <FilterTag
            className="filter-tag"
            key={`subcat_filter_tag_${i}`}
            text={subcat}
            onClose={() => {
              this.handleRemoveSubcategory(subcat);
              logAnalyticsEvent(
                "PipelineSampleReport_subcategories-filter_removed",
                {
                  subcat,
                }
              );
            }}
          />
        );
      }
    );

    return (
      <RenderMarkup
        filter_row_stats={filter_row_stats}
        advanced_filter_tag_list={advanced_filter_tag_list}
        categories_filter_tag_list={categories_filter_tag_list}
        subcats_filter_tag_list={subcats_filter_tag_list}
        view={this.props.view}
        onViewClick={(_, data) => {
          this.props.onViewClick(data);
          const friendlyName = data.name.replace(/_/g, "-");
          logAnalyticsEvent(
            `PipelineSampleReport_${friendlyName}-view-menu_clicked`
          );
        }}
        parent={this}
      />
    );
  }
}

function CollapseExpand({ tax_info, parent }) {
  const fake_or_real = tax_info.genus_taxid < 0 ? "fake-genus" : "real-genus";
  return (
    <span>
      <span
        className={`report-arrow-down report-arrow ${
          tax_info.tax_id
        } ${fake_or_real} ${"hidden"}`}
      >
        <i
          className={`fa fa-angle-down ${tax_info.tax_id}`}
          onClick={withAnalytics(
            parent.collapseGenus,
            "PipelineSampleReport_collapse-genus_clicked",
            {
              tax_id: tax_info.tax_id,
            }
          )}
        />
      </span>
      <span
        className={`report-arrow-right report-arrow ${
          tax_info.tax_id
        } ${fake_or_real} ${""}`}
      >
        <i
          className={`fa fa-angle-right ${tax_info.tax_id}`}
          onClick={withAnalytics(
            parent.expandGenusClick,
            "PipelineSampleReport_expand-genus_clicked",
            {
              tax_id: tax_info.tax_id,
            }
          )}
        />
      </span>
    </span>
  );
}

class RenderMarkup extends React.Component {
  renderMenu() {
    return (
      <Menu icon floated="right" className="report-top-menu">
        <Popup
          trigger={
            <Menu.Item
              name="table"
              active={this.props.view == "table"}
              onClick={this.props.onViewClick}
            >
              <Icon name="table" />
            </Menu.Item>
          }
          content="Table View"
          inverted
        />

        <Popup
          trigger={
            <Menu.Item
              name="tree"
              active={this.props.view == "tree"}
              onClick={this.props.onViewClick}
            >
              <Icon name="fork" />
            </Menu.Item>
          }
          content={<div>Taxonomic Tree View</div>}
          inverted
        />
      </Menu>
    );
  }
  renderTree() {
    const parent = this.props.parent;
    if (!parent.state.selected_taxons.length) {
      return;
    }
    return (
      <div>
        <TaxonTreeVis
          taxa={parent.state.selected_taxons}
          topTaxa={parent.state.topScoringTaxa}
          sample={parent.report_details.sample_info}
          metric={parent.state.treeMetric || "aggregatescore"}
          nameType={parent.props.nameType}
          backgroundData={parent.state.backgroundData}
          onTaxonClick={parent.props.onTaxonClick}
        />
      </div>
    );
  }

  renderFilters() {
    const parent = this.props.parent;
    return (
      <div className="report-top-filters">
        <div className="filter-lists">
          <div className="filter-lists-element">
            <SearchBox
              rounded
              levelLabel
              serverSearchAction="choose_taxon"
              serverSearchActionArgs={{
                // TODO (gdingle): change backend to support filter by sampleId
                args: "species,genus",
                project_id: parent.projectId,
              }}
              onResultSelect={parent.searchSelectedTaxon}
              placeholder="Taxon name"
            />
          </div>
          <div className="filter-lists-element">
            <NameTypeFilter
              value={parent.props.nameType}
              onChange={parent.handleNameTypeChange}
            />
          </div>
          <div className="filter-lists-element">
            <BackgroundModelFilter
              allBackgrounds={parent.all_backgrounds}
              value={parent.state.backgroundData.id}
              onChange={parent.handleBackgroundModelChange}
            />
          </div>
          <div className="filter-lists-element">
            <CategoryFilter
              parent={parent}
              allCategories={parent.all_categories}
              categoryParentChild={parent.categoryParentChild}
              categoryChildParent={parent.categoryChildParent}
              selectedCategories={parent.state.includedCategories}
              selectedSubcategories={parent.state.includedSubcategories}
              onChange={parent.handleIncludedCategoriesChange}
            />
          </div>
          <div className="filter-lists-element">
            <ThresholdFilterDropdown
              options={{
                targets: parent.allThresholds,
                operators: [">=", "<="],
              }}
              thresholds={parent.state.activeThresholds}
              onApply={parent.handleThresholdFiltersChange}
            />
          </div>
          <div className="filter-lists-element">
            <SpecificityFilter
              value={parent.state.readSpecificity}
              onChange={parent.handleSpecificityChange}
            />
          </div>
          {this.props.view == "tree" && (
            <div className="filter-lists-element">
              <MetricPicker
                options={parent.treeMetrics}
                value={parent.state.treeMetric}
                onChange={parent.handleTreeMetricChange}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  renderTable() {
    const parent = this.props.parent;
    return (
      <ReportTable
        taxons={parent.state.selected_taxons_top}
        taxonRowRefs={parent.taxon_row_refs}
        renderName={parent.renderName}
        renderNumber={parent.renderNumber}
        getRowClass={parent.getRowClass}
        reportDetails={parent.report_details}
        backgroundData={parent.state.backgroundData}
        expandTable={withAnalytics(
          parent.expandTable,
          "PipelineSampleReport_expand-table_clicked"
        )}
        collapseTable={withAnalytics(
          parent.collapseTable,
          "PipelineSampleReport_collapse-table_clicked"
        )}
        renderColumnHeader={parent.renderColumnHeader}
        countType={parent.state.countType}
        setCountType={countType => parent.setState({ countType })}
        showAssemblyColumns={pipelineVersionHasAssembly(
          parent.props.reportPageParams.pipeline_version
        )}
        onTaxonClick={parent.props.onTaxonClick}
        handleMouseEnter={parent.handleMouseEnter}
        handleMouseLeave={parent.handleMouseLeave}
      />
    );
  }

  render() {
    const {
      filter_row_stats,
      advanced_filter_tag_list,
      categories_filter_tag_list,
      subcats_filter_tag_list,
      parent,
    } = this.props;

    return (
      <div id="reports" className="reports-screen tab-screen col s12">
        <div className="tab-screen-content">
          <div className="row reports-container">
            <div className="col s12 reports-section">
              <div className="reports-count">
                {this.renderFilters()}
                {this.renderMenu()}
                <div className="filter-tags-list">
                  {advanced_filter_tag_list}
                  {categories_filter_tag_list}
                  {subcats_filter_tag_list}
                </div>
                {filter_row_stats}
              </div>
              {this.props.view == "table" && this.renderTable()}
              {this.props.view == "tree" && this.renderTree()}
              {parent.state.loading && (
                <div className="loading-container">
                  <LoadingLabel />
                </div>
              )}
              {parent.state.phyloTreeModalParams && (
                <PhyloTreeCreationModal
                  admin={parent.admin}
                  csrf={parent.csrf}
                  taxonId={parent.state.phyloTreeModalParams.taxId}
                  taxonName={parent.state.phyloTreeModalParams.taxName}
                  projectId={parent.projectId}
                  projectName={parent.projectName}
                  onClose={parent.handlePhyloTreeModalClose}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// TODO(mark): Add other propType signatures.
PipelineSampleReport.propTypes = {
  nameType: PropTypes.oneOf(["Scientific name", "Common name"]),
  onNameTypeChange: PropTypes.func.isRequired,
};

export default PipelineSampleReport;
