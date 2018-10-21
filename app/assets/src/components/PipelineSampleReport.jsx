import cx from "classnames";
import React from "react";
import axios from "axios";
import Cookies from "js-cookie";
import $ from "jquery";
import { Label, Menu, Icon, Popup } from "semantic-ui-react";
import numberWithCommas from "../helpers/strings";
import { getTaxonName, getGeneraContainingTags } from "../helpers/taxon";
import ThresholdMap from "./utils/ThresholdMap";
import {
  computeThresholdedTaxons,
  isTaxonIncluded,
  getTaxonSortComparator,
  getCategoryAdjective
} from "./views/report/utils";
import Nanobar from "nanobar";
import BasicPopup from "./BasicPopup";
import ThresholdFilterDropdown from "./ui/controls/dropdowns/ThresholdFilterDropdown";
import BetaLabel from "./ui/labels/BetaLabel";
import PathogenLabel from "./ui/labels/PathogenLabel";
import PathogenPreview from "./views/report/PathogenPreview";
import ReportInsightIcon from "./views/report/ReportInsightIcon";
import ReportTable from "./views/report/ReportTable";
import BackgroundModelFilter from "./views/report/filters/BackgroundModelFilter";
import CategoryFilter from "./views/report/filters/CategoryFilter";
import MetricPicker from "./views/report/filters/MetricPicker";
import SpecificityFilter from "./views/report/filters/SpecificityFilter";
import NameTypeFilter from "./views/report/filters/NameTypeFilter";
import ReportSearchBox from "./views/report/filters/ReportSearchBox";
import PhyloTreeCreationModal from "./views/phylo_tree/PhyloTreeCreationModal";
import PhyloTreeChecks from "./views/phylo_tree/PhyloTreeChecks";
import TaxonTreeVis from "./views/TaxonTreeVis";
import LoadingLabel from "./ui/labels/LoadingLabel";

class PipelineSampleReport extends React.Component {
  constructor(props) {
    super(props);
    this.nanobar = new Nanobar({
      id: "prog-bar",
      class: "prog-bar"
    });
    this.admin = props.admin;
    this.allowedFeatures = props.allowedFeatures;
    this.allowPhyloTree = props.can_edit;
    this.report_ts = props.report_ts;
    this.sample_id = props.sample_id;
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

    const cached_name_type = Cookies.get("name_type");
    const cachedReadSpecificity = Cookies.get("readSpecificity");
    const cachedTreeMetric = Cookies.get("treeMetric");

    const savedThresholdFilters = ThresholdMap.getSavedThresholdFilters();

    this.showConcordance = false;

    this.treeMetrics = [
      { text: "Aggregate Score", value: "aggregatescore" },
      { text: "NT r (total reads)", value: "nt_r" },
      { text: "NT rPM", value: "nt_rpm" },
      { text: "NR r (total reads)", value: "nr_r" },
      { text: "NR rPM", value: "nr_rpm" }
    ];

    this.allThresholds = [
      { text: "Score", value: "NT_aggregatescore" },
      { text: "NT Z Score", value: "NT_zscore" },
      { text: "NT rPM", value: "NT_rpm" },
      { text: "NT r (total reads)", value: "NT_r" },
      { text: "NT %id", value: "NT_percentidentity" },
      { text: "NT log(1/e)", value: "NT_neglogevalue" },
      { text: "NR Z Score", value: "NR_zscore" },
      { text: "NR r (total reads)", value: "NR_r" },
      { text: "NR rPM", value: "NR_rpm" },
      { text: "NR %id", value: "NR_percentidentity" },
      { text: "R log(1/e)", value: "NR_neglogevalue" }
    ];
    this.categoryChildParent = { Phage: "Viruses" };
    this.categoryParentChild = { Viruses: ["Phage"] };
    this.genus_map = {};

    this.INVALID_CALL_BASE_TAXID = -1e8;

    this.thresholdTextByValue = this.allThresholds.reduce(
      (metrics, threshold) => {
        metrics[threshold.value] = threshold.text;
        return metrics;
      },
      {}
    );
    this.defaultThreshold = {
      metric: this.allThresholds[0]["value"],
      operator: ">=",
      value: ""
    };

    // all taxons will pass this default filter
    this.defaultThresholdValues = savedThresholdFilters.length
      ? savedThresholdFilters
      : [Object.assign({}, this.defaultThreshold)];

    let defaultBackgroundId = parseInt(this.fetchParams("background_id"));
    // we should only keep dynamic data in the state
    // Starting state is default values which are to be set later.
    this.state = {
      taxonomy_details: [],
      topScoringTaxa: [],
      backgroundData: {
        id: defaultBackgroundId,
        name: ""
      },
      search_taxon_id: 0,
      searchKey: "",
      search_keys_in_sample: [],
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
      name_type: cached_name_type ? cached_name_type : "Scientific Name",
      rendering: false,
      loading: true,
      activeThresholds: this.defaultThresholdValues,
      countType: "NT",
      readSpecificity: cachedReadSpecificity
        ? parseInt(cachedReadSpecificity)
        : 0,
      treeMetric: cachedTreeMetric || this.treeMetrics[0].value,
      phyloTreeModalOpen: true
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
    this.fetchSearchList();
  }

  componentDidMount() {
    this.scrollDown();
  }

  fetchSearchList = () => {
    axios
      .get(
        `/samples/${this.sample_id}/search_list?report_ts=${
          this.report_ts
        }&version=${this.gitVersion}`
      )
      .then(res => {
        const search_list = res.data.search_list;
        search_list.splice(0, 0, ["Show All", 0]);
        this.setState({
          lineage_map: res.data.lineage_map,
          search_keys_in_sample: search_list
        });
      });
  };

  // fetchReportData loads the actual report information with another call to
  // the API endpoint.
  fetchReportData = () => {
    this.nanobar.go(30);
    this.setState({
      loading: true
    });
    let params = `?${window.location.search.replace("?", "")}&report_ts=${
      this.report_ts
    }&version=${this.gitVersion}`;
    axios.get(`/samples/${this.sample_id}/report_info${params}`).then(res => {
      this.nanobar.go(100);
      const genus_map = {};
      for (let i = 0; i < res.data.taxonomy_details[2].length; i++) {
        const taxon = res.data.taxonomy_details[2][i];
        if (taxon.genus_taxid == taxon.tax_id) {
          genus_map[taxon.genus_taxid] = taxon;
        }
      }
      this.genus_map = genus_map;
      this.setState(
        {
          loading: false,
          rows_passing_filters: res.data.taxonomy_details[0],
          rows_total: res.data.taxonomy_details[1],
          taxonomy_details: res.data.taxonomy_details[2],
          generaContainingTags: getGeneraContainingTags(
            res.data.taxonomy_details[2]
          ),
          topScoringTaxa: res.data.topScoringTaxa,
          backgroundData: {
            id: res.data.background_info.id,
            name: res.data.background_info.name
          }
        },
        () => {
          this.applyFilters(true);
        }
      );
    });
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
        activeThresholds: [Object.assign({}, this.defaultThreshold)],
        includedCategories: [],
        includedSubcategories: [],
        searchKey: "",
        search_taxon_id: 0,
        selected_taxons: this.state.taxonomy_details,
        selected_taxons_top: this.state.taxonomy_details.slice(
          0,
          this.max_rows_to_render
        ),
        pagesRendered: 1,
        rows_passing_filters: this.state.taxonomy_details.length,
        readSpecificity: 0
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
          const match_keys = this.state.lineage_map[taxon.tax_id.toString()];
          if (match_keys && match_keys.indexOf(searchTaxonId) > -1) {
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
          // the 'All taxa without genus classification' taxon
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
      rows_passing_filters: selected_taxons.length
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
        pagesRendered: currentPage + 1
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
        offset: "0px 50px"
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
      secondary: secondary_sort
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
        includedSubcategories
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
      this.genus_map
    );
    selected_taxons = selected_taxons.sort(taxonSortComparator);
    this.setState({
      selected_taxons: selected_taxons,
      selected_taxons_top: selected_taxons.slice(0, this.max_rows_to_render),
      pagesRendered: 1
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

  handleBackgroundModelChange = (_, data) => {
    if (data.value === this.state.backgroundData.id) {
      // Skip if no change
      return;
    }

    const backgroundName = data.options.find(function(option) {
      return option.value === data.value;
    }).text;

    Cookies.set("background_name", backgroundName);
    this.setState(
      {
        backgroundData: {
          name: backgroundName,
          id: data.value
        }
      },
      () => {
        this.props.refreshPage({ background_id: data.value });
      }
    );
  };

  handleNameTypeChange = (_, data) => {
    Cookies.set("name_type", data.value);
    this.setState({ name_type: data.value });
  };

  handleSpecificityChange = (_, data) => {
    Cookies.set("readSpecificity", data.value);
    this.setState({ readSpecificity: data.value }, () => {
      this.applyFilters();
    });
  };

  handleTreeMetricChange = (_, data) => {
    Cookies.set("treeMetric", data.value);
    this.setState({ treeMetric: data.value });
  };

  handleViewClicked = (_, data) => {
    this.setState({ view: data.name });
  };

  // path to NCBI
  gotoNCBI = e => {
    const taxId = e.target.getAttribute("data-tax-id");
    let num = parseInt(taxId);
    if (num < -1e8) {
      num = -num % -1e8;
    }
    num = num.toString();
    const ncbiLink = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${num}`;
    window.open(ncbiLink, "hide_referrer");
  };

  // download Fasta
  downloadFastaUrl = e => {
    const taxLevel = e.target.getAttribute("data-tax-level");
    const taxId = e.target.getAttribute("data-tax-id");
    location.href = `/samples/${
      this.sample_id
    }/fasta/${taxLevel}/${taxId}/NT_or_NR`;
  };

  gotoAlignmentVizLink = e => {
    const taxId = e.target.getAttribute("data-tax-id");
    const taxLevel = e.target.getAttribute("data-tax-level");
    const pipeline_version = this.props.reportPageParams.pipeline_version;
    window.open(
      `/samples/${
        this.sample_id
      }/alignment_viz/nt_${taxLevel}_${taxId}?pipeline_version=${pipeline_version}`
    );
  };

  displayHoverActions = (taxInfo, reportDetails) => {
    let tax_level_str = "";
    let ncbiDot, fastaDot, alignmentVizDot, phyloTreeDot;
    if (taxInfo.tax_level == 1) tax_level_str = "species";
    else tax_level_str = "genus";

    let valid_tax_id =
      taxInfo.tax_id < this.INVALID_CALL_BASE_TAXID || taxInfo.tax_id > 0;
    if (valid_tax_id)
      ncbiDot = (
        <i
          data-tax-id={taxInfo.tax_id}
          onClick={this.gotoNCBI}
          className="fa fa-link action-dot"
          aria-hidden="true"
        />
      );
    if (reportDetails.taxon_fasta_flag)
      fastaDot = (
        <i
          data-tax-level={taxInfo.tax_level}
          data-tax-id={taxInfo.tax_id}
          onClick={this.downloadFastaUrl}
          className="fa fa-download action-dot"
          aria-hidden="true"
        />
      );
    if (this.canSeeAlignViz && valid_tax_id && taxInfo.NT.r > 0)
      alignmentVizDot = (
        <i
          data-tax-level={tax_level_str}
          data-tax-id={taxInfo.tax_id}
          onClick={this.gotoAlignmentVizLink}
          className="fa fa-bars action-dot"
          aria-hidden="true"
        />
      );
    if (
      this.allowPhyloTree &&
      taxInfo.tax_id > 0 &&
      PhyloTreeChecks.passesCreateCondition(taxInfo.NT.r, taxInfo.NR.r)
    )
      phyloTreeDot = (
        <PhyloTreeCreationModal
          admin={parseInt(this.admin)}
          csrf={this.csrf}
          trigger={
            <i className="fa fa-code-fork action-dot" aria-hidden="true" />
          }
          taxonId={taxInfo.tax_id}
          taxonName={taxInfo.name}
          projectId={this.projectId}
          projectName={this.projectName}
        />
      );
    return (
      <span className="link-tag">
        <BasicPopup trigger={ncbiDot} content={"NCBI Taxonomy Browser"} />
        <BasicPopup trigger={fastaDot} content={"FASTA Download"} />
        <BasicPopup
          trigger={alignmentVizDot}
          content={"Alignment Visualization"}
        />
        <BasicPopup
          trigger={phyloTreeDot}
          content={
            <div>
              Phylogenetic Analysis <BetaLabel />
            </div>
          }
        />
      </span>
    );
  };

  displayHighlightTags = taxInfo => {
    const watchDot = (
      <i
        data-tax-id={taxInfo.tax_id}
        data-tax-name={taxInfo.name}
        data-confirmation-strength="watched"
        onClick={this.props.toggleHighlightTaxon}
        className="fa fa-eye action-dot"
        aria-hidden="true"
      />
    );
    const confirmedHitDot = (
      <i
        data-tax-id={taxInfo.tax_id}
        data-tax-name={taxInfo.name}
        data-confirmation-strength="confirmed"
        onClick={this.props.toggleHighlightTaxon}
        className="fa fa-check action-dot"
        aria-hidden="true"
      />
    );
    return (
      <div className="hover-wrapper">
        {this.can_edit ? (
          <span className="link-tag">
            <BasicPopup trigger={watchDot} content={"Toggle Watching"} />
            <BasicPopup
              trigger={confirmedHitDot}
              content={"Toggle Confirmed Hit"}
            />
          </span>
        ) : null}
      </div>
    );
  };

  renderName = (tax_info, report_details, backgroundData, openTaxonModal) => {
    let taxCommonName = tax_info["common_name"];
    const taxonName = getTaxonName(tax_info, this.state.name_type);

    const grayOut =
      this.state.name_type.toLowerCase() == "common name" &&
      (!taxCommonName || taxCommonName.trim() == "");
    let taxonNameDisplay = (
      <span className={grayOut ? "count-info" : ""}>{taxonName}</span>
    );

    const openTaxonModalHandler = () =>
      openTaxonModal({
        taxInfo: tax_info,
        backgroundData,
        taxonName
      });

    if (tax_info.tax_id > 0) {
      if (report_details.taxon_fasta_flag) {
        taxonNameDisplay = (
          <span className="taxon-modal-link" onClick={openTaxonModalHandler}>
            <a>{taxonNameDisplay}</a>
          </span>
        );
      } else {
        taxonNameDisplay = (
          <span className="taxon-modal-link" onClick={openTaxonModalHandler}>
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
        {this.displayHoverActions(tax_info, report_details)}
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

  renderNumber = (
    ntCount,
    nrCount,
    num_decimals,
    isAggregate = false,
    visible_flag = true,
    showInsight = false
  ) => {
    if (!visible_flag) {
      return null;
    }
    let ntCountStr = numberWithCommas(Number(ntCount).toFixed(num_decimals));
    let nrCountStr =
      nrCount !== null
        ? numberWithCommas(Number(nrCount).toFixed(num_decimals))
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
      <td className="report-number">
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

  render_sort_arrow = (column, desired_sort_direction, arrow_direction) => {
    let className = `${this.isSortedActive(
      column
    )} fa fa-chevron-${arrow_direction}`;
    return (
      <i
        onClick={() => this.applySort(column)}
        className={className}
        key={column.toLowerCase()}
      />
    );
  };

  renderColumnHeader = (
    visible_metric,
    column_name,
    tooltip_message,
    visible_flag = true
  ) => {
    let element = (
      <div
        className="sort-controls"
        onClick={() => this.applySort(column_name)}
      >
        <span
          className={`${this.isSortedActive(column_name)} table-head-label`}
        >
          {visible_metric}
        </span>
        {this.render_sort_arrow(column_name, "highest", "up")}
      </div>
    );
    if (!visible_flag) return null;
    return (
      <th>
        <BasicPopup trigger={element} content={tooltip_message} />
      </th>
    );
  };

  isTaxonExpanded = taxInfo => {
    return (
      (this.expandAll && taxInfo.genus_taxid > 0) ||
      this.expandedGenera.indexOf(taxInfo.genus_taxid.toString()) >= 0
    );
  };

  getRowClass = (taxInfo, confirmedTaxIds, watchedTaxIds) => {
    const topScoringRow = taxInfo.topScoring === 1;

    let taxonStatusClass = "";
    if (confirmedTaxIds.indexOf(taxInfo.tax_id) >= 0) {
      taxonStatusClass = "confirmed";
    } else if (watchedTaxIds.indexOf(taxInfo.tax_id) >= 0) {
      taxonStatusClass = "watched";
    }

    if (taxInfo.tax_level == 2) {
      return cx(
        "report-row-genus",
        taxInfo.genus_taxid, // TODO(mark): remove non-styling-related class.
        taxonStatusClass,
        topScoringRow && "top-scoring-row"
      );
    }

    return cx(
      "report-row-species",
      taxInfo.genus_taxid, // TODO(mark): remove non-styling-related class.
      !this.isTaxonExpanded(taxInfo) && "hidden",
      taxonStatusClass,
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

  handleSearch = e => {
    this.setState({
      searchKey: e.target.value
    });
  };

  searchSelectedTaxon = (value, item) => {
    let searchId = item[1];
    this.setState(
      {
        searchKey: searchId > 0 ? item[0] : "",
        search_taxon_id: searchId
      },
      () => {
        this.applyFilters();
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

    // If a background name is set in Cookies, get its ID from allBackgrounds.
    // This is necessary because soon we may show different backgrounds IDs
    // as the same name to the users.
    if (!this.fetchParams("background_id") && Cookies.get("background_name")) {
      const bg_id = this.getBackgroundIdByName(Cookies.get("background_name"));
      if (bg_id) this.props.reportPageParams.background_id = bg_id;
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

  // Select the background ID with the matching name.
  getBackgroundIdByName = name => {
    let match = this.all_backgrounds.filter(b => b["name"] === name);
    if (match && match[0] && match[0]["id"]) {
      return match[0]["id"];
    }
  };

  render() {
    const filter_stats = `${
      this.state.rows_passing_filters
    } rows passing filters, out of ${this.state.rows_total} total rows.`;

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
        ? "Randomly subsampled to " +
          subsampled_reads +
          " out of " +
          this.report_details.pipeline_info.adjusted_remaining_reads +
          " non-host reads."
        : "";
    const disable_filter = this.anyFilterSet() ? (
      <span className="disable" onClick={e => this.resetAllFilters()}>
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
        <AdvancedFilterTagList
          threshold={threshold}
          key={i}
          i={i}
          parent={this}
        />
      )
    );

    const categories_filter_tag_list = this.state.includedCategories.map(
      (category, i) => {
        return (
          <Label className="label-tags" size="tiny" key={`category_tag_${i}`}>
            {category}
            <Icon
              name="close"
              onClick={e => {
                this.handleRemoveCategory(category);
              }}
            />
          </Label>
        );
      }
    );

    const subcats_filter_tag_list = this.state.includedSubcategories.map(
      (subcat, i) => {
        return (
          <Label className="label-tags" size="tiny" key={`subcat_tag_${i}`}>
            {subcat}
            <Icon
              name="close"
              onClick={e => {
                this.handleRemoveSubcategory(subcat);
              }}
            />
          </Label>
        );
      }
    );

    return (
      <RenderMarkup
        filter_row_stats={filter_row_stats}
        advanced_filter_tag_list={advanced_filter_tag_list}
        categories_filter_tag_list={categories_filter_tag_list}
        subcats_filter_tag_list={subcats_filter_tag_list}
        view={this.state.view}
        onViewClicked={this.handleViewClicked}
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
          onClick={parent.collapseGenus}
        />
      </span>
      <span
        className={`report-arrow-right report-arrow ${
          tax_info.tax_id
        } ${fake_or_real} ${""}`}
      >
        <i
          className={`fa fa-angle-right ${tax_info.tax_id}`}
          onClick={parent.expandGenusClick}
        />
      </span>
    </span>
  );
}

function AdvancedFilterTagList({ threshold, i, parent }) {
  if (ThresholdMap.isThresholdValid(threshold)) {
    return (
      <Label
        className="label-tags"
        size="tiny"
        key={`advanced_filter_tag_${i}`}
      >
        {parent.thresholdTextByValue[threshold["metric"]]}{" "}
        {threshold["operator"]} {threshold["value"]}
        <Icon
          name="close"
          onClick={() => {
            parent.handleRemoveThresholdFilter(i);
          }}
        />
      </Label>
    );
  } else {
    return null;
  }
}

class RenderMarkup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: this.props.view || "table"
    };
  }

  componentWillReceiveProps(newProps) {
    if (newProps.view && this.state.view != newProps.view) {
      this.setState({ view: newProps.view });
    }
  }

  renderMenu() {
    return (
      <Menu icon floated="right">
        <Popup
          trigger={
            <Menu.Item
              name="table"
              active={this.state.view == "table"}
              onClick={this.props.onViewClicked}
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
              active={this.state.view == "tree"}
              onClick={this.props.onViewClicked}
            >
              <Icon name="fork" />
            </Menu.Item>
          }
          content={
            <div>
              Taxonomic Tree View <BetaLabel />
            </div>
          }
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
          metric={parent.state.treeMetric}
          nameType={parent.state.name_type}
          backgroundData={parent.state.backgroundData}
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
            <ReportSearchBox
              searchKeysInSample={parent.state.search_keys_in_sample}
              searchKey={parent.state.searchKey}
              onSelect={(value, item) =>
                parent.searchSelectedTaxon(value, item)
              }
              onChange={parent.handleSearch}
            />
          </div>
          <div className="filter-lists-element">
            <NameTypeFilter
              value={parent.state.name_type}
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
                operators: [">=", "<="]
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
          {this.state.view == "tree" && (
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
        confirmedTaxIds={parent.props.confirmed_taxids}
        watchedTaxIds={parent.props.watched_taxids}
        renderName={parent.renderName}
        renderNumber={parent.renderNumber}
        displayHighlightTags={parent.displayHighlightTags}
        showConcordance={parent.showConcordance}
        getRowClass={parent.getRowClass}
        reportDetails={parent.report_details}
        backgroundData={parent.state.backgroundData}
        expandTable={parent.expandTable}
        collapseTable={parent.collapseTable}
        renderColumnHeader={parent.renderColumnHeader}
        countType={parent.state.countType}
        setCountType={countType => parent.setState({ countType })}
      />
    );
  }

  render() {
    const {
      filter_row_stats,
      advanced_filter_tag_list,
      categories_filter_tag_list,
      subcats_filter_tag_list,
      parent
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
                  {advanced_filter_tag_list} {categories_filter_tag_list}{" "}
                  {subcats_filter_tag_list}
                </div>
                {filter_row_stats}
              </div>
              {this.state.view == "table" && this.renderTable()}
              {this.state.view == "tree" && this.renderTree()}
              {parent.state.loading && (
                <div className="loading-container">
                  <LoadingLabel />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PipelineSampleReport;
