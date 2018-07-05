import React from "react";
import axios from "axios";
import Cookies from "js-cookie";
import $ from "jquery";
import Tipsy from "react-tipsy";
import ReactAutocomplete from "react-autocomplete";
import { Dropdown, Label, Menu, Icon, Popup } from "semantic-ui-react";
import numberWithCommas from "../helpers/strings";
import LabeledDropdown from "./LabeledDropdown";
import AdvancedThresholdFilterDropdown from "./AdvancedThresholdFilter";
import StringHelper from "../helpers/StringHelper";
import ThresholdMap from "./ThresholdMap";
import PipelineSampleTree from "./PipelineSampleTree";
import Nanobar from "nanobar";
import d3, { event as currentEvent } from "d3";
import BasicPopup from "./BasicPopup";

class PipelineSampleReport extends React.Component {
  constructor(props) {
    super(props);
    this.nanobar = new Nanobar({
      id: "prog-bar",
      class: "prog-bar"
    });
    this.report_ts = props.report_ts;
    this.sample_id = props.sample_id;
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
    const cached_cats = Cookies.get("excluded_categories");
    const cached_exclude_subcats = Cookies.get("exclude_subcats");
    const cached_name_type = Cookies.get("name_type");
    const savedThresholdFilters = ThresholdMap.getSavedThresholdFilters();
    this.category_child_parent = { Phage: "Viruses" };
    this.showConcordance = false;
    this.allThresholds = ThresholdMap(this.showConcordance);
    this.genus_map = {};

    this.INVALID_CALL_BASE_TAXID = -1e8;

    this.thresholdLabel2Name = {};
    for (let i = 0; i < this.allThresholds.length; i += 1) {
      const threshold = this.allThresholds[i];
      this.thresholdLabel2Name[threshold["value"]] = threshold["name"];
    }

    this.defaultThreshold = {
      label: this.allThresholds[0]["value"],
      operator: ">=",
      value: ""
    };

    // all taxons will pass this default filter
    this.defaultThresholdValues = savedThresholdFilters.length
      ? savedThresholdFilters
      : [Object.assign({}, this.defaultThreshold)];

    // we should only keep dynamic data in the state
    // Starting state is default values which are to be set later.
    this.state = {
      taxonomy_details: [],
      backgroundId: 0,
      backgroundName: "",
      searchId: 0,
      searchKey: "",
      search_keys_in_sample: [],
      lineage_map: {},
      rows_passing_filters: 0,
      rows_total: 0,
      thresholded_taxons: [],
      selected_taxons: [],
      selected_taxons_top: [],
      pagesRendered: 0,
      sort_by: this.default_sort_by,
      excluded_categories: cached_cats ? JSON.parse(cached_cats) : [],
      exclude_subcats: cached_exclude_subcats
        ? JSON.parse(cached_exclude_subcats)
        : [],
      name_type: cached_name_type ? cached_name_type : "Scientific Name",
      search_taxon_id: 0,
      rendering: false,
      loading: true,
      activeThresholds: this.defaultThresholdValues,
      countType: "NT"
    };

    this.expandAll = false;
    this.expandedGenera = [];
    this.applySearchFilter = this.applySearchFilter.bind(this);
    this.anyFilterSet = this.anyFilterSet.bind(this);
    this.resetAllFilters = this.resetAllFilters.bind(this);
    this.displayedCategories = this.displayedCategories.bind(this);
    this.sortResults = this.sortResults.bind(this);
    this.sortCompareFunction = this.sortCompareFunction.bind(this);
    this.setSortParams = this.setSortParams.bind(this);
    this.flash = this.flash.bind(this);
    this.collapseGenus = this.collapseGenus.bind(this);
    this.expandGenusClick = this.expandGenusClick.bind(this);
    this.expandTable = this.expandTable.bind(this);
    this.collapseTable = this.collapseTable.bind(this);
    this.downloadFastaUrl = this.downloadFastaUrl.bind(this);
    this.gotoAlignmentVizLink = this.gotoAlignmentVizLink.bind(this);
    this.downloadAssemblyLink = this.downloadAssemblyLink.bind(this);
    this.handleThresholdEnter = this.handleThresholdEnter.bind(this);
    this.renderMore = this.renderMore.bind(this);
    this.initializeTooltip();
    this.displayHighlightTags = this.displayHighlightTags.bind(this);
    this.fillUrlParams = this.fillUrlParams.bind(this);
    this.getBackgroundIdByName = this.getBackgroundIdByName.bind(this);
  }

  componentWillUpdate(nextProps, nextState) {
    this.state.rendering = true;
  }

  componentDidUpdate(prevProps, prevState) {
    this.state.rendering = false;
  }

  componentWillMount() {
    // Fill in URL parameters for usability and specifying data to fetch.
    this.fillUrlParams();
    // Fetch the actual report data via axios calls to fill in the page.
    this.fetchReportData();
    this.fetchSearchList();
  }

  componentDidMount() {
    this.scrollDown();
    const topFilterHandler = $(".top-filter-dropdown");
    topFilterHandler.dropdown({
      belowOrigin: true,
      constrainWidth: true,
      stopPropagation: false
    });

    this.setupFilterModal(
      ".advanced-filters-activate",
      ".advanced-filters-modal"
    );
    this.setupFilterModal(
      ".categories-filters-activate",
      ".categories-filters-modal"
    );
  }

  setupFilterModal(activateDiv, modalDiv) {
    const filtersModal = $(modalDiv);
    const filtersActivate = $(activateDiv);

    filtersActivate.on("click", e => {
      filtersModal.slideToggle(200);
    });
  }

  fetchSearchList() {
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
  }

  // fetchReportData loads the actual report information with another call to
  // the API endpoint.
  fetchReportData() {
    this.nanobar.go(30);
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
      // The genus_map never changes, so we move it out from the react state,
      // to reduce performance cost.
      this.genus_map = genus_map;
      this.setState(
        {
          rows_passing_filters: res.data.taxonomy_details[0],
          rows_total: res.data.taxonomy_details[1],
          taxonomy_details: res.data.taxonomy_details[2],
          backgroundId: res.data.background_info.id,
          backgroundName: res.data.background_info.name
        },
        () => {
          this.applyThresholdFilters(this.state.taxonomy_details, false);
        }
      );
    });
  }

  anyFilterSet() {
    if (
      this.state.search_taxon_id > 0 ||
      this.state.excluded_categories.length > 0 ||
      this.state.exclude_subcats.length > 0 ||
      (this.state.activeThresholds.length > 0 &&
        ThresholdMap.isThresholdValid(this.state.activeThresholds[0]))
    ) {
      return true;
    }
    return false;
  }

  resetAllFilters() {
    this.setState(
      {
        activeThresholds: [Object.assign({}, this.defaultThreshold)],
        excluded_categories: [],
        exclude_subcats: [],
        searchId: 0,
        searchKey: "",
        search_taxon_id: 0,
        thresholded_taxons: this.state.taxonomy_details,
        selected_taxons: this.state.taxonomy_details,
        selected_taxons_top: this.state.taxonomy_details.slice(
          0,
          this.max_rows_to_render
        ),
        pagesRendered: 1,
        rows_passing_filters: this.state.taxonomy_details.length
      },
      () => {
        this.saveThresholdFilters();
        Cookies.set("excluded_categories", "[]");
        Cookies.set("exclude_subcats", "[]");
      }
    );
  }

  applySearchFilter(
    searchTaxonId,
    excludedCategories,
    input_taxons,
    excludeSubcats = []
  ) {
    let selected_taxons = [];
    const thresholded_taxons = input_taxons || this.state.thresholded_taxons;
    const active_thresholds = this.state.activeThresholds;
    if (searchTaxonId > 0) {
      // ignore all the thresholds
      let genus_taxon = {};
      let matched_taxons = [];
      for (let i = 0; i < this.state.taxonomy_details.length; i++) {
        const taxon = this.state.taxonomy_details[i];
        if (taxon.genus_taxid == taxon.tax_id) {
          if (matched_taxons.length > 0) {
            selected_taxons.push(genus_taxon);
            selected_taxons = selected_taxons.concat(matched_taxons);
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
        selected_taxons.push(genus_taxon);
        selected_taxons = selected_taxons.concat(matched_taxons);
      }
    } else if (excludedCategories.length > 0) {
      let displayed_subcat_indicator_columns = this.displayedSubcats(
        excludeSubcats
      ).map(subcat => {
        return `is_${subcat.toLowerCase()}`;
      });
      for (var i = 0; i < thresholded_taxons.length; i++) {
        let taxon = thresholded_taxons[i];
        if (excludedCategories.indexOf(taxon.category_name) < 0) {
          // not in the excluded categories
          selected_taxons.push(taxon);
        } else if (
          displayed_subcat_indicator_columns.some(column => {
            return taxon[column] == 1;
          })
        ) {
          // even if category is excluded, include checked subcategories
          selected_taxons.push(taxon);
        } else if (
          taxon.category_name == "Uncategorized" &&
          parseInt(taxon.tax_id) == -200
        ) {
          // the 'All taxa without genus classification' taxon
          const uncat_taxon = taxon;
          const filtered_children = [];
          i++;
          taxon = thresholded_taxons[i];
          while (taxon && taxon.genus_taxid == -200) {
            if (excludedCategories.indexOf(taxon.category_name) < 0) {
              filtered_children.push(taxon);
            }
            i++;
            taxon = thresholded_taxons[i];
          }
          if (filtered_children.length > 0) {
            selected_taxons.push(uncat_taxon);
            selected_taxons = selected_taxons.concat(filtered_children);
          }
          i--;
        }
      }
    } else {
      selected_taxons = thresholded_taxons;
    }
    if (searchTaxonId <= 0) {
      // only apply subcategory filter if user is not doing a search
      for (let i = 0; i < excludeSubcats.length; i++) {
        let column = `is_${excludeSubcats[i].toLowerCase()}`;
        selected_taxons = selected_taxons.filter(x => {
          return x[column] == 0;
        });
      }
    }

    let searchKey = this.state.searchKey;
    if (searchTaxonId <= 0) {
      searchKey = "";
    }

    selected_taxons = this.updateSpeciesCount(selected_taxons);

    this.setState({
      loading: false,
      excluded_categories: excludedCategories,
      exclude_subcats: excludeSubcats,
      search_taxon_id: searchTaxonId,
      activeThresholds: active_thresholds,
      searchKey,
      thresholded_taxons,
      selected_taxons,
      selected_taxons_top: selected_taxons.slice(0, this.max_rows_to_render),
      pagesRendered: 1,
      rows_passing_filters: selected_taxons.length
    });
  }

  updateSpeciesCount(res) {
    for (let i = 0; i < res.length; i++) {
      let isGenus = res[i].genus_taxid == res[i].tax_id;
      if (isGenus) {
        // Find a genus entry and count the number of species entries after it.
        let count = 0;
        for (
          let j = i + 1;
          j < res.length && res[j].genus_taxid != res[j].tax_id;
          j++
        ) {
          count++;
        }
        res[i].species_count = count;
      }
    }
    return res;
  }

  //Load more samples on scroll
  scrollDown() {
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
  }

  scrollToTaxon(taxon_id) {
    // Find the taxon
    let taxon;
    for (let ttaxon of this.state.selected_taxons) {
      if (ttaxon.tax_id == taxon_id) {
        taxon = ttaxon;
        break;
      }
    }

    if (!taxon) {
      return;
    }
    // Make sure the taxon is rendered
    if (this.state.selected_taxons_top.indexOf(taxon) == -1) {
      this.renderMore();
      this.setState({}, () => {
        this.scrollToTaxon(taxon_id);
      });
    }

    // set view to table and scoll into view
    this.setState(
      {
        view: "table",
        highlight_taxon: taxon.tax_id
      },
      () => {
        if (taxon.tax_level == 1) {
          this.expandGenus(taxon.genus_taxid);
        }
        this.taxon_row_refs[taxon.tax_id].scrollIntoView({
          block: "center"
        });
      }
    );
  }

  renderMore() {
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
  }

  flash() {
    let sel = $(".filter-message");
    sel.removeClass("flash");
    const el = document.getElementById("filter-message");
    if (el) {
      el.offsetHeight;
      /* trigger reflow */
    }
    sel.addClass("flash");
  }

  initializeTooltip() {
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
  }

  // applySort needs to be bound at time of use, not in constructor above
  // TODO(yf): fix this
  applySort(sort_by) {
    if (sort_by.toLowerCase() != this.state.sort_by) {
      this.state.sort_by = sort_by.toLowerCase();
      this.sortResults();
    }
  }

  sortCompareFunction(a, b) {
    const [ptype, pmetric] = this.sortParams.primary;
    const [stype, smetric] = this.sortParams.secondary;
    const genus_a = this.genus_map[a.genus_taxid];
    const genus_b = this.genus_map[b.genus_taxid];

    const genus_a_p_val = parseFloat(genus_a[ptype][pmetric]);
    const genus_a_s_val = parseFloat(genus_a[stype][smetric]);
    const a_p_val = parseFloat(a[ptype][pmetric]);
    const a_s_val = parseFloat(a[stype][smetric]);

    const genus_b_p_val = parseFloat(genus_b[ptype][pmetric]);
    const genus_b_s_val = parseFloat(genus_b[stype][smetric]);
    const b_p_val = parseFloat(b[ptype][pmetric]);
    const b_s_val = parseFloat(b[stype][smetric]);
    // compared at genus level descending and then species level descending
    //
    //
    if (a.genus_taxid == b.genus_taxid) {
      // same genus
      if (a.tax_level > b.tax_level) {
        return -1;
      } else if (a.tax_level < b.tax_level) {
        return 1;
      }
      if (a_p_val > b_p_val) {
        return -1;
      } else if (a_p_val < b_p_val) {
        return 1;
      }
      if (a_s_val > b_s_val) {
        return -1;
      } else if (a_s_val < b_s_val) {
        return 1;
      }
      return 0;
    }
    if (genus_a_p_val > genus_b_p_val) {
      return -1;
    } else if (genus_a_p_val < genus_b_p_val) {
      return 1;
    }
    if (genus_a_s_val > genus_b_s_val) {
      return -1;
    } else if (genus_a_s_val < genus_b_s_val) {
      return 1;
    }
    if (a.genus_taxid < b.genus_taxid) {
      return -1;
    } else if (a.genus_taxid > b.genus_taxid) {
      return 1;
    }
  }

  setSortParams() {
    const primary_sort = this.state.sort_by.split("_");
    primary_sort[0] = primary_sort[0].toUpperCase();
    const secondary_sort = this.default_sort_by.split("_");
    secondary_sort[0] = secondary_sort[0].toUpperCase();
    this.sortParams = {
      primary: primary_sort,
      secondary: secondary_sort
    };
  }

  displayedCategories(excludedCategories) {
    let displayed_categories = [];
    for (let i = 0; i < this.all_categories.length; i += 1) {
      if (excludedCategories.indexOf(this.all_categories[i]["name"]) < 0) {
        displayed_categories.push(this.all_categories[i]["name"]);
      }
    }
    return displayed_categories;
  }

  displayedSubcats(excludeSubcats) {
    let displayed_subcats = [];
    let all_subcats = Object.keys(this.category_child_parent);
    for (let subcat of all_subcats) {
      if (excludeSubcats.indexOf(subcat) == -1) {
        displayed_subcats.push(subcat);
      }
    }
    return displayed_subcats;
  }

  applyExcludedCategories(e) {
    let excluded_categories = this.state.excluded_categories;
    const category = e.target.getAttribute("data-exclude-category");
    if (category && category.length > 0) {
      //trigger through the tag X click
      excluded_categories.push(category);
    } else if (e.target.checked) {
      const ridx = excluded_categories.indexOf(e.target.value);
      if (ridx > -1) {
        excluded_categories.splice(ridx, 1);
      }
    } else {
      excluded_categories.push(e.target.value);
    }
    // Also update subcategory to match category
    let new_exclude_subcats = this.state.exclude_subcats;
    let subcats = Object.keys(this.category_child_parent);
    for (let i = 0; i < subcats.length; i++) {
      let subcat = subcats[i];
      let parent = this.category_child_parent[subcat];
      let parent_excluded = excluded_categories.indexOf(parent) >= 0;
      if (parent_excluded) {
        //subcat should be excluded
        if (new_exclude_subcats.indexOf(subcat) < 0) {
          new_exclude_subcats.push(subcat);
        }
      } else {
        let idx = new_exclude_subcats.indexOf(subcat);
        if (idx >= 0) {
          new_exclude_subcats.splice(idx, 1);
        }
      }
    }
    this.setState(
      {
        excluded_categories: excluded_categories,
        exclude_subcats: new_exclude_subcats,
        searchId: 0,
        searchKey: ""
      },
      () => {
        Cookies.set("excluded_categories", JSON.stringify(excluded_categories));
        Cookies.set("exclude_subcats", JSON.stringify(new_exclude_subcats));
        this.applySearchFilter(
          0,
          excluded_categories,
          undefined,
          new_exclude_subcats
        );
      }
    );
  }

  applyExcludeSubcats(e) {
    let new_exclude_subcats = this.state.exclude_subcats;
    let x_tag_subcat = e.target.getAttribute("data-exclude-subcat");
    let subcat =
      x_tag_subcat && x_tag_subcat.length > 0 ? x_tag_subcat : e.target.value;
    let i_subcat = new_exclude_subcats.indexOf(subcat);
    if (i_subcat == -1) {
      new_exclude_subcats.push(subcat);
    } else {
      new_exclude_subcats.splice(i_subcat, 1);
    }
    this.setState(
      {
        exclude_subcats: new_exclude_subcats,
        searchId: 0,
        searchKey: ""
      },
      () => {
        Cookies.set("exclude_subcats", JSON.stringify(new_exclude_subcats));
        this.applySearchFilter(
          0,
          this.state.excluded_categories,
          undefined,
          new_exclude_subcats
        );
      }
    );
  }

  sortResults() {
    this.setSortParams();
    let selected_taxons = this.state.selected_taxons;
    selected_taxons = selected_taxons.sort(this.sortCompareFunction);
    this.setState({
      selected_taxons: selected_taxons,
      selected_taxons_top: selected_taxons.slice(0, this.max_rows_to_render),
      pagesRendered: 1
    });
    this.state.thresholded_taxons = this.state.thresholded_taxons.sort(
      this.sortCompareFunction
    );
    this.state.taxonomy_details = this.state.taxonomy_details.sort(
      this.sortCompareFunction
    );
  }

  setThresholdProperty(index, property, value) {
    const stateCopy = Object.assign([], this.state.activeThresholds);
    stateCopy[index][property] = value;
    this.setState({ activeThresholds: stateCopy });
  }

  appendThresholdFilter() {
    const stateCopy = Object.assign([], this.state.activeThresholds);
    stateCopy.push(Object.assign({}, this.defaultThreshold));
    this.setState({
      activeThresholds: stateCopy
    });
  }

  removeThresholdFilter(pos) {
    const stateCopy = Object.assign([], this.state.activeThresholds);
    stateCopy.splice(pos, 1);
    let closeWindow = true;
    if (stateCopy.length > 0) {
      closeWindow = false;
    }
    this.setState(
      {
        activeThresholds: stateCopy
      },
      () => {
        this.saveThresholdFilters(closeWindow);
      }
    );
  }

  validThresholdCount(thresholds) {
    let cnt = 0;
    for (let i = 0; i < thresholds.length; i += 1) {
      if (ThresholdMap.isThresholdValid(thresholds[i])) {
        cnt += 1;
      }
    }
    return cnt;
  }

  saveThresholdFilters(closeWindow = true) {
    this.applyThresholdFilters(this.state.taxonomy_details, true);

    ThresholdMap.saveThresholdFilters(this.state.activeThresholds);

    if (closeWindow) {
      $(".advanced-filters-modal").slideUp(300);
    }
  }

  applyThresholdFilters(candidate_taxons, play_animation = true) {
    let thresholded_taxons = [];
    let genus_taxon = {};
    let matched_taxons = [];
    for (let i = 0; i < candidate_taxons.length; i++) {
      const taxon = candidate_taxons[i];
      if (taxon.genus_taxid == taxon.tax_id) {
        // genus
        if (matched_taxons.length > 0) {
          thresholded_taxons.push(genus_taxon);
          thresholded_taxons = thresholded_taxons.concat(matched_taxons);
        } else if (
          ThresholdMap.taxonPassThresholdFilter(
            genus_taxon,
            this.state.activeThresholds
          )
        ) {
          thresholded_taxons.push(genus_taxon);
        }
        genus_taxon = taxon;
        matched_taxons = [];
      } else {
        // species
        if (
          ThresholdMap.taxonPassThresholdFilter(
            taxon,
            this.state.activeThresholds
          )
        ) {
          matched_taxons.push(taxon);
        }
      }
    }

    if (matched_taxons.length > 0) {
      thresholded_taxons.push(genus_taxon);
      thresholded_taxons = thresholded_taxons.concat(matched_taxons);
    } else if (
      ThresholdMap.taxonPassThresholdFilter(
        genus_taxon,
        this.state.activeThresholds
      )
    ) {
      thresholded_taxons.push(genus_taxon);
    }

    this.applySearchFilter(
      0,
      this.state.excluded_categories,
      thresholded_taxons,
      this.state.exclude_subcats
    );
  }

  handleThresholdEnter(event) {
    if (event.keyCode === 13) {
      this.applyThresholdFilters(this.state.taxonomy_details, true);
    }
  }

  handleBackgroundModelChange(backgroundName, backgroundParams) {
    this.setState(
      {
        backgroundName,
        backgroundParams
      },
      () => {
        Cookies.set("background_name", backgroundName);
        this.props.refreshPage({ background_id: backgroundParams });
      }
    );
  }

  handleNameTypeChange(name_type) {
    this.setState({ name_type: name_type }, () => {
      Cookies.set("name_type", name_type);
    });
  }

  // path to NCBI
  gotoNCBI(e) {
    const taxId = e.target.getAttribute("data-tax-id");
    let num = parseInt(taxId);
    if (num < -1e8) {
      num = -num % -1e8;
    }
    num = num.toString();
    const ncbiLink = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${num}`;
    window.open(ncbiLink, "_blank");
  }

  // download Fasta
  downloadFastaUrl(e) {
    const taxLevel = e.target.getAttribute("data-tax-level");
    const taxId = e.target.getAttribute("data-tax-id");
    location.href = `/samples/${
      this.sample_id
    }/fasta/${taxLevel}/${taxId}/NT_or_NR`;
  }

  gotoAlignmentVizLink(e) {
    const taxId = e.target.getAttribute("data-tax-id");
    const taxLevel = e.target.getAttribute("data-tax-level");
    window.open(
      `/samples/${this.sample_id}/alignment_viz/nt_${taxLevel}_${taxId}`,
      "_blank"
    );
  }

  downloadAssemblyLink(e) {
    const taxId = e.target.getAttribute("data-tax-id");
    location.href = `/samples/${this.sample_id}/assembly/${taxId}`;
  }

  displayTags(taxInfo, reportDetails) {
    let tax_level_str = "";
    let ncbiDot, fastaDot, alignmentVizDot, assemblyDot;
    if (taxInfo.tax_level == 1) tax_level_str = "species";
    else tax_level_str = "genus";

    let valid_tax_id =
      taxInfo.tax_id < this.INVALID_CALL_BASE_TAXID || taxInfo.tax_id > 0;
    if (valid_tax_id)
      ncbiDot = (
        <i
          data-tax-id={taxInfo.tax_id}
          onClick={this.gotoNCBI}
          className="fa fa-link cloud"
          aria-hidden="true"
        />
      );
    if (reportDetails.taxon_fasta_flag)
      fastaDot = (
        <i
          data-tax-level={taxInfo.tax_level}
          data-tax-id={taxInfo.tax_id}
          onClick={this.downloadFastaUrl}
          className="fa fa-download cloud"
          aria-hidden="true"
        />
      );
    if (this.canSeeAlignViz && valid_tax_id && taxInfo.NT.r > 0)
      alignmentVizDot = (
        <i
          data-tax-level={tax_level_str}
          data-tax-id={taxInfo.tax_id}
          onClick={this.gotoAlignmentVizLink}
          className="fa fa-bars"
          aria-hidden="true"
        />
      );
    if (reportDetails.assembled_taxids.indexOf(taxInfo.tax_id.toString()) >= 0)
      assemblyDot = (
        <i
          data-tax-id={taxInfo.tax_id}
          onClick={this.downloadAssemblyLink}
          className="fa fa-gg"
          aria-hidden="true"
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
        <BasicPopup trigger={assemblyDot} content={"Assembly Download"} />
      </span>
    );
  }

  displayHighlightTags(taxInfo) {
    const watchDot = (
      <i
        data-tax-id={taxInfo.tax_id}
        data-tax-name={taxInfo.name}
        data-confirmation-strength="watched"
        onClick={this.props.toggleHighlightTaxon}
        className="fa fa-eye"
        aria-hidden="true"
      />
    );
    const confirmedHitDot = (
      <i
        data-tax-id={taxInfo.tax_id}
        data-tax-name={taxInfo.name}
        data-confirmation-strength="confirmed"
        onClick={this.props.toggleHighlightTaxon}
        className="fa fa-check"
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
  }

  static category_to_adjective(category) {
    const category_lowercase = category.toLowerCase();
    switch (category_lowercase) {
      case "bacteria":
        return "bacterial";
      case "archaea":
        return "archaeal";
      case "eukaryota":
        return "eukaryotic";
      case "viruses":
        return "viral";
      case "viroids":
        return "viroidal";
      case "uncategorized":
        return "uncategorized";
    }
    return category_lowercase;
  }

  render_name(tax_info, report_details) {
    let tax_scientific_name = tax_info["name"];
    let tax_common_name = tax_info["common_name"];
    let tax_name;

    if (this.state.name_type.toLowerCase() == "common name") {
      if (!tax_common_name || tax_common_name.trim() == "")
        tax_name = <span className="count-info">{tax_scientific_name}</span>;
      else
        tax_name = (
          <span>{StringHelper.capitalizeFirstLetter(tax_common_name)}</span>
        );
    } else {
      tax_name = <span>{tax_scientific_name}</span>;
    }

    let foo = <i>{tax_name}</i>;

    if (tax_info.tax_id > 0) {
      if (report_details.taxon_fasta_flag) {
        foo = (
          <span>
            <a>{tax_name}</a>
          </span>
        );
      } else {
        foo = <span>{tax_name}</span>;
      }
    }
    if (tax_info.tax_level == 1) {
      // indent species rows
      foo = (
        <div className="hover-wrapper">
          <div className="species-name">
            {foo}
            {this.displayTags(tax_info, report_details)}
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
      foo = (
        <div className="hover-wrapper">
          <div className="genus-name">
            {" "}
            {collapseExpand} {foo}
          </div>
          <i className="count-info">
            ({tax_info.species_count}{" "}
            {PipelineSampleReport.category_to_adjective(category_name)} species)
          </i>
          {this.displayTags(tax_info, report_details)}
        </div>
      );
    }
    return foo;
  }

  render_number(
    ntCount,
    nrCount,
    num_decimals,
    isAggregate = false,
    visible_flag = true
  ) {
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
        {ntCountStr}
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
  }

  switchClassName(countType, countValue) {
    const isCountBlank = countValue === 0 || countValue === -100 ? "blank" : "";
    const isActive = this.state.countType === countType ? "active" : "";
    return `${isActive} ${isCountBlank} count-type`;
  }

  isSortedActive(columnName) {
    const desiredSort = columnName.toLowerCase();
    return this.state.sort_by == desiredSort ? "active" : "";
  }

  render_sort_arrow(column, desired_sort_direction, arrow_direction) {
    let className = `${this.isSortedActive(
      column
    )} fa fa-chevron-${arrow_direction}`;
    return (
      <i
        onClick={this.applySort.bind(this, column)}
        className={className}
        key={column.toLowerCase()}
      />
    );
  }

  render_column_header(
    visible_metric,
    column_name,
    tooltip_message,
    visible_flag = true
  ) {
    let element = (
      <div
        className="sort-controls"
        onClick={this.applySort.bind(this, column_name)}
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
  }

  row_class(tax_info, confirmed_taxids, watched_taxids) {
    let highlighted =
      this.state.highlight_taxon == tax_info.tax_id ? "highlighted" : "";
    let taxon_status = "";
    if (confirmed_taxids.indexOf(tax_info.tax_id) >= 0)
      taxon_status = "confirmed";
    else if (watched_taxids.indexOf(tax_info.tax_id) >= 0)
      taxon_status = "watched";
    if (tax_info.tax_level == 2) {
      if (tax_info.tax_id < 0) {
        return `report-row-genus ${
          tax_info.genus_taxid
        } fake-genus ${taxon_status} ${highlighted}`;
      }
      return `report-row-genus ${
        tax_info.genus_taxid
      } real-genus ${taxon_status} ${highlighted}`;
    }
    let initial_visibility = "hidden";
    if (
      (this.expandAll && tax_info.genus_taxid > 0) ||
      this.expandedGenera.indexOf(tax_info.genus_taxid.toString()) >= 0
    ) {
      initial_visibility = "";
    }
    if (tax_info.genus_taxid < 0) {
      return `report-row-species ${
        tax_info.genus_taxid
      } fake-genus ${initial_visibility} ${taxon_status} ${highlighted}`;
    }
    return `report-row-species ${
      tax_info.genus_taxid
    } real-genus ${initial_visibility} ${taxon_status} ${highlighted}`;
  }

  expandGenusClick(e) {
    const className = e.target.attributes.class.nodeValue;
    const attr = className.split(" ");
    const taxId = attr[2];
    this.expandGenus(taxId);
  }

  expandGenus(taxId) {
    const taxIdIdx = this.expandedGenera.indexOf(taxId);
    if (taxIdIdx < 0) {
      this.expandedGenera.push(taxId);
    }
    $(`.report-row-species.${taxId}`).removeClass("hidden");
    $(`.report-arrow.${taxId}`).toggleClass("hidden");
  }

  collapseGenus(e) {
    const className = e.target.attributes.class.nodeValue;
    const attr = className.split(" ");
    const taxId = attr[2];
    const taxIdIdx = this.expandedGenera.indexOf(taxId);
    if (taxIdIdx >= 0) {
      this.expandedGenera.splice(taxIdIdx, 1);
    }
    $(`.report-row-species.${taxId}`).addClass("hidden");
    $(`.report-arrow.${taxId}`).toggleClass("hidden");
  }

  expandTable(e) {
    // expand all real genera
    this.expandAll = true;
    this.expandedGenera = [];
    $(".report-row-species").removeClass("hidden");
    $(".report-arrow-down").removeClass("hidden");
    $(".report-arrow-right").addClass("hidden");
    $(".table-arrow").toggleClass("hidden");
  }

  collapseTable(e) {
    // collapse all genera (real or negative)
    this.expandAll = false;
    this.expandedGenera = [];
    $(".report-row-species").addClass("hidden");
    $(".report-arrow-down").addClass("hidden");
    $(".report-arrow-right").removeClass("hidden");
    $(".table-arrow").toggleClass("hidden");
  }

  handleSearch(e) {
    this.setState({
      searchKey: e.target.value
    });
  }

  searchSelectedTaxon(value, item) {
    let searchId = item[1];
    this.setState(
      {
        searchId,
        excluded_categories: [],
        exclude_subcats: [],
        searchKey: item[0],
        activeThresholds: []
      },
      () => {
        this.applySearchFilter(searchId, []);
      }
    );
  }

  // Fill in desired URL parameters so user's can copy and paste URLs.
  // Ex: Add ?pipeline_version=1.7&background_id=4 to /samples/545
  // This way links can still be to '/samples/545' in the rest of the app
  // but the URL will be filled in without triggering another page reload.
  //
  // Order of precedence for background_id is:
  // (1) URL parameter specified
  // (2) saved background name in frontend cookie
  // (3) the default background
  fillUrlParams() {
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
  }

  fetchParams(param) {
    let url = new URL(window.location);
    return url.searchParams.get(param);
  }

  // Select the background ID with the matching name.
  getBackgroundIdByName(name) {
    let match = this.all_backgrounds.filter(b => b["name"] === name);
    if (match && match[0] && match[0]["id"]) {
      return match[0]["id"];
    }
  }

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
      subsampled_reads < this.report_details.pipeline_info.remaining_reads
        ? "Randomly subsampled to " +
          subsampled_reads +
          " out of " +
          this.report_details.pipeline_info.remaining_reads +
          " non-host reads."
        : "";
    const disable_filter = this.anyFilterSet() ? (
      <span className="disable" onClick={e => this.resetAllFilters()}>
        Clear All
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

    const categories_filter_tag_list = this.displayedCategories(
      this.state.excluded_categories
    ).map((category, i) => {
      return (
        <Label className="label-tags" size="tiny" key={`category_tag_${i}`}>
          {category}
          <Icon
            name="close"
            data-exclude-category={category}
            onClick={e => {
              this.applyExcludedCategories(e);
            }}
          />
        </Label>
      );
    });

    const subcats_filter_tag_list = this.displayedSubcats(
      this.state.exclude_subcats
    ).map((subcat, i) => {
      return (
        <Label className="label-tags" size="tiny" key={`subcat_tag_${i}`}>
          {subcat}
          <Icon
            name="close"
            data-exclude-subcat={subcat}
            onClick={e => {
              this.applyExcludeSubcats(e);
            }}
          />
        </Label>
      );
    });

    return (
      <RenderMarkup
        filter_row_stats={filter_row_stats}
        advanced_filter_tag_list={advanced_filter_tag_list}
        categories_filter_tag_list={categories_filter_tag_list}
        subcats_filter_tag_list={subcats_filter_tag_list}
        view={this.state.view}
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
        {parent.thresholdLabel2Name[threshold["label"]]} {threshold["operator"]}{" "}
        {threshold["value"]}
        <Icon
          name="close"
          onClick={() => {
            parent.removeThresholdFilter(i);
          }}
        />
      </Label>
    );
  } else {
    return null;
  }
}

function DetailCells({ parent }) {
  return parent.state.selected_taxons_top.map((tax_info, i) => (
    <tr
      key={tax_info.tax_id}
      id={`taxon-${tax_info.tax_id}`}
      ref={elm => {
        parent.taxon_row_refs[tax_info.tax_id] = elm;
      }}
      className={parent.row_class(
        tax_info,
        parent.props.confirmed_taxids,
        parent.props.watched_taxids
      )}
    >
      <td>{parent.render_name(tax_info, parent.report_details)}</td>
      {parent.render_number(tax_info.NT.aggregatescore, null, 0, true)}
      {parent.render_number(tax_info.NT.zscore, tax_info.NR.zscore, 1)}
      {parent.render_number(tax_info.NT.rpm, tax_info.NR.rpm, 1)}
      {parent.render_number(tax_info.NT.r, tax_info.NR.r, 0)}
      {parent.render_number(
        tax_info.NT.percentidentity,
        tax_info.NR.percentidentity,
        1
      )}
      {parent.render_number(
        tax_info.NT.neglogevalue,
        tax_info.NR.neglogevalue,
        0
      )}
      {parent.render_number(
        tax_info.NT.percentconcordant,
        tax_info.NR.percentconcordant,
        1,
        undefined,
        parent.showConcordance
      )}
      <td>{parent.displayHighlightTags(tax_info)}</td>
    </tr>
  ));
}

function ReportTableHeader({ parent }) {
  return (
    <div className="reports-main">
      <table id="report-table" className="bordered report-table">
        <thead>
          <tr>
            <th>
              <span className={`table-arrow ""`}>
                <i className="fa fa-angle-right" onClick={parent.expandTable} />
              </span>
              <span className="table-arrow hidden">
                <i
                  className="fa fa-angle-down"
                  onClick={parent.collapseTable}
                />
              </span>
              Taxonomy
            </th>
            {parent.render_column_header(
              "Score",
              `NT_aggregatescore`,
              "Aggregate score: ( |genus.NT.Z| * species.NT.Z * species.NT.rPM ) + ( |genus.NR.Z| * species.NR.Z * species.NR.rPM )"
            )}
            {parent.render_column_header(
              "Z",
              `${parent.state.countType}_zscore`,
              `Z-score relative to background model for alignments to NCBI NT/NR`
            )}
            {parent.render_column_header(
              "rPM",
              `${parent.state.countType}_rpm`,
              `Number of reads aligning to the taxon in the NCBI NT/NR database per million total input reads`
            )}
            {parent.render_column_header(
              "r",
              `${parent.state.countType}_r`,
              `Number of reads aligning to the taxon in the NCBI NT/NR database`
            )}
            {parent.render_column_header(
              "%id",
              `${parent.state.countType}_percentidentity`,
              `Average percent-identity of alignments to NCBI NT/NR`
            )}
            {parent.render_column_header(
              "log(1/E)",
              `${parent.state.countType}_neglogevalue`,
              `Average log-10-transformed expect value for alignments to NCBI NT/NR`
            )}
            {parent.render_column_header(
              "%conc",
              `${parent.state.countType}_percentconcordant`,
              `Percentage of aligned reads belonging to a concordantly mappped pair (NCBI NT/NR)`,
              parent.showConcordance
            )}
            <th>
              <Tipsy content="Switch count type" placement="top">
                <div className="sort-controls center left">
                  <div
                    className={
                      parent.state.countType === "NT"
                        ? "active column-switcher"
                        : "column-switcher"
                    }
                    onClick={() => {
                      parent.setState({ countType: "NT" });
                    }}
                  >
                    NT
                  </div>
                  <div
                    className={
                      parent.state.countType === "NR"
                        ? "active column-switcher"
                        : "column-switcher"
                    }
                    onClick={() => {
                      parent.setState({ countType: "NR" });
                    }}
                  >
                    NR
                  </div>
                </div>
              </Tipsy>
            </th>
          </tr>
        </thead>
        <tbody>
          <DetailCells parent={parent} />
        </tbody>
      </table>
    </div>
  );
}
function CategoryFilter({ parent }) {
  let count =
    parent.all_categories.length -
    parent.state.excluded_categories.length +
    Object.keys(parent.category_child_parent).length -
    parent.state.exclude_subcats.length;
  return (
    <Dropdown
      className="filter-btn category-filter-dropdown"
      text={
        <span>
          Categories <Label>{count}</Label>
        </span>
      }
    >
      <Dropdown.Menu>
        <div className="category-filter-menu">
          <ul>
            {parent.all_categories.map((category, i) => {
              return (
                <li key={i}>
                  <input
                    type="checkbox"
                    className="filled-in cat-filter"
                    id={category.name}
                    value={category.name}
                    onChange={e => {}}
                    onClick={e => {
                      parent.applyExcludedCategories(e);
                    }}
                    checked={
                      parent.state.excluded_categories.indexOf(category.name) <
                      0
                    }
                  />
                  <label htmlFor={category.name}>{category.name}</label>
                </li>
              );
            })}

            <br />
            <div className="divider" />
            <br />

            {Object.keys(parent.category_child_parent).map((subcat, i) => {
              return (
                <li key={`subcat_check_${i}`}>
                  <input
                    type="checkbox"
                    className="filled-in cat-filter"
                    id={subcat}
                    value={subcat}
                    onChange={e => {}}
                    onClick={e => {
                      parent.applyExcludeSubcats(e);
                    }}
                    checked={parent.state.exclude_subcats.indexOf(subcat) == -1}
                  />
                  <label htmlFor={subcat}>
                    {subcat} (part of {parent.category_child_parent[subcat]})
                  </label>
                </li>
              );
            })}
          </ul>
          {parent.all_categories.length +
            Object.keys(parent.category_child_parent).length <
          1 ? (
            <p>None found</p>
          ) : null}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
}

function ReportSearchBox({ parent }) {
  return (
    <li className="search-box genus-autocomplete-container">
      <ReactAutocomplete
        inputProps={{ placeholder: "Search" }}
        items={parent.state.search_keys_in_sample}
        shouldItemRender={(item, value) =>
          item[0] == "Show All" ||
          (value.length > 2 &&
            item[0].toLowerCase().indexOf(value.toLowerCase()) > -1)
        }
        getItemValue={item => item[0]}
        renderItem={(item, highlighted) => (
          <div
            key={item[1]}
            style={{
              backgroundColor: highlighted ? "#eee" : "transparent",
              fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif",
              fontSize: "1rem",
              overflow: "hidden"
            }}
          >
            {item[0]}
          </div>
        )}
        value={parent.state.searchKey}
        onChange={e => parent.handleSearch(e)}
        onSelect={(value, item) => parent.searchSelectedTaxon(value, item)}
      />
      <i className="fa fa-search" />
    </li>
  );
}

function NameTypeFilter({ parent }) {
  return (
    <Dropdown
      text={
        parent.state.name_type ? parent.state.name_type : "Select name type"
      }
      className="filter-btn"
    >
      <Dropdown.Menu>
        <Dropdown.Item
          text="Scientific Name"
          onClick={() => parent.handleNameTypeChange("Scientific name")}
        />
        <Dropdown.Item
          text="Common Name"
          onClick={() => parent.handleNameTypeChange("Common name")}
        />
      </Dropdown.Menu>
    </Dropdown>
  );
}

function BackgroundModelFilter({ parent }) {
  return (
    <Dropdown
      text={
        parent.state.backgroundName
          ? parent.state.backgroundName
          : "Background model"
      }
      className={"filter-btn"}
    >
      <Dropdown.Menu>
        {parent.all_backgrounds.length ? (
          parent.all_backgrounds.map((background, i) => {
            return (
              <Dropdown.Item
                text={background.name}
                key={i}
                onClick={() =>
                  parent.handleBackgroundModelChange(
                    background.name,
                    background.id
                  )
                }
              />
            );
          })
        ) : (
          <Dropdown.Item text="No background models to display" />
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}

class RenderMarkup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: this.props.view || "table"
    };
    this._onViewClicked = this.onViewClicked.bind(this);
    this._nodeTextClicked = this.nodeTextClicked.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.view && this.state.view != newProps.view) {
      this.setState({ view: newProps.view });
    }
  }

  nodeTextClicked(d) {
    this.props.parent.scrollToTaxon(d.id);
  }

  onViewClicked(e, f) {
    this.setState({ view: f.name });
  }
  renderMenu() {
    return (
      <Menu icon floated="right">
        <Popup
          trigger={
            <Menu.Item
              name="table"
              active={this.state.view == "table"}
              onClick={this._onViewClicked}
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
              onClick={this._onViewClicked}
            >
              <Icon name="fork" />
            </Menu.Item>
          }
          content={
            <div>
              Phylogenetic Tree View{" "}
              <Label color="purple" size="mini" floating>
                beta
              </Label>
            </div>
          }
          inverted
        />
      </Menu>
    );
  }
  renderTree() {
    let parent = this.props.parent;
    if (!(parent.state.selected_taxons.length && this.state.view == "tree")) {
      return;
    }
    return (
      <PipelineSampleTree
        taxons={parent.state.selected_taxons}
        sample={parent.report_details.sample_info}
        nameType={parent.state.name_type}
        onNodeTextClicked={this._nodeTextClicked}
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
      <div>
        <div id="reports" className="reports-screen tab-screen col s12">
          <div className="tab-screen-content">
            <div className="row reports-container">
              <div className="col s12 reports-section">
                <div className="reports-count">
                  <div className="report-top-filters">
                    <ul className="filter-lists">
                      <ReportSearchBox parent={parent} />
                      <NameTypeFilter parent={parent} />
                      <BackgroundModelFilter parent={parent} />
                      <CategoryFilter parent={parent} />
                      <AdvancedThresholdFilterDropdown
                        labels={parent.allThresholds}
                        operators={[">=", "<="]}
                        filters={parent.state.activeThresholds}
                        onChange={filters => {
                          parent.setState({ activeThresholds: filters });
                        }}
                        onApply={() => {
                          parent.saveThresholdFilters(false);
                        }}
                      />
                    </ul>
                  </div>
                  {this.renderMenu()}
                  <div className="filter-tags-list">
                    {advanced_filter_tag_list} {categories_filter_tag_list}{" "}
                    {subcats_filter_tag_list}
                  </div>
                  {filter_row_stats}
                </div>
                {this.state.view == "table" && (
                  <ReportTableHeader parent={parent} />
                )}
                {this.renderTree()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PipelineSampleReport;
