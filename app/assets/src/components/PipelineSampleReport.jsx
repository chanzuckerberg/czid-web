import React from "react";
import axios from "axios";
import Cookies from "js-cookie";
import $ from "jquery";
import Tipsy from "react-tipsy";
import ReactAutocomplete from "react-autocomplete";
import { Dropdown, Label, Menu, Icon, Popup } from "semantic-ui-react";
import numberWithCommas from "../helpers/strings";
import LabeledDropdown from './LabeledDropdown';
import StringHelper from "../helpers/StringHelper";
import TaxonTooltip from './TaxonTooltip';
import Nanobar from "nanobar";
import d3, {event as currentEvent} from 'd3';

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

    this.all_categories = props.all_categories;
    this.report_details = props.report_details;
    this.report_page_params = props.report_page_params;
    this.all_backgrounds = props.all_backgrounds;
    this.max_rows_to_render = props.max_rows || 1500;
    this.default_sort_by = this.report_page_params.sort_by.replace(
      "highest_",
      ""
    );
    const cached_cats = Cookies.get("excluded_categories");
    const cached_exclude_subcats = Cookies.get('exclude_subcats');
    const cached_name_type = Cookies.get("name_type");
    const savedThresholdFilters = this.getSavedThresholdFilters();
    this.category_child_parent = { Phage: 'Viruses' };
    this.showConcordance = false;
    this.allThresholds = ThresholdMap(this.showConcordance);
    this.genus_map = {};

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

    this.defaultThresholdValues = savedThresholdFilters.length
      ? savedThresholdFilters
      : [Object.assign({}, this.defaultThreshold)]; // all taxons will pass this default filter

    // we should only keep dynamic data in the state
    this.state = {
      taxonomy_details: [],
      backgroundName:
        Cookies.get("background_name") ||
        this.report_details.default_background.name,
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
      exclude_subcats: (cached_exclude_subcats) ? JSON.parse(cached_exclude_subcats) : [],
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
    this.expandGenus = this.expandGenus.bind(this);
    this.expandTable = this.expandTable.bind(this);
    this.collapseTable = this.collapseTable.bind(this);
    this.downloadFastaUrl = this.downloadFastaUrl.bind(this);
    this.gotoAlignmentVizLink = this.gotoAlignmentVizLink.bind(this);
    this.handleThresholdEnter = this.handleThresholdEnter.bind(this);
    this.renderMore = this.renderMore.bind(this);
    this.initializeTooltip();
  }

  componentWillUpdate(nextProps, nextState) {
    this.state.rendering = true;
  }

  componentDidUpdate(prevProps, prevState) {
    this.state.rendering = false;
  }

  componentWillMount() {
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
        search_list.splice(0, 0, ["All", 0]);
        this.setState({
          lineage_map: res.data.lineage_map,
          search_keys_in_sample: search_list
        });
      });
  }

  fetchReportData() {
    this.nanobar.go(30);
    let params = `?${window.location.search.replace("?", "")}&report_ts=${
      this.report_ts
    }&version=${this.gitVersion}`;
    const cached_background_id = Cookies.get("background_id");
    if (cached_background_id) {
      params =
        params.indexOf("background_id=") < 0
          ? `${params}&background_id=${cached_background_id}`
          : params;
    }
    axios.get(`/samples/${this.sample_id}/report_info${params}`).then(res => {
      this.nanobar.go(100);
      const genus_map = {};
      for (let i = 0; i < res.data.taxonomy_details[2].length; i++) {
        const taxon = res.data.taxonomy_details[2][i];
        if (taxon.genus_taxid == taxon.tax_id) {
          genus_map[taxon.genus_taxid] = taxon;
        }
      }
      // the genus_map never changes, so we move it out from the react state, to reduce perfomance cost
      this.genus_map = genus_map;
      this.setState(
        {
          rows_passing_filters: res.data.taxonomy_details[0],
          rows_total: res.data.taxonomy_details[1],
          taxonomy_details: res.data.taxonomy_details[2]
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
        this.isThresholdValid(this.state.activeThresholds[0]))
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
        Cookies.set('exclude_subcats', '[]');
        this.flash();
      }
    );
  }

  applySearchFilter(searchTaxonId, excludedCategories, input_taxons, excludeSubcats=[]) {
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
      let displayed_subcat_indicator_columns = this.displayedSubcats(excludeSubcats).map((subcat) => {
        return `is_${subcat.toLowerCase()}`
      })
      for (var i = 0; i < thresholded_taxons.length; i++) {
        let taxon = thresholded_taxons[i];
        if (excludedCategories.indexOf(taxon.category_name) < 0) {
          // not in the excluded categories
          selected_taxons.push(taxon);
        } else if (displayed_subcat_indicator_columns.some((column) => { return taxon[column] == 1; })) {
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
        let column = `is_${excludeSubcats[i].toLowerCase()}`
        selected_taxons = selected_taxons.filter((x) => { return x[column] == 0 })
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
      let isGenus = (res[i].genus_taxid == res[i].tax_id);
      if (isGenus) {
        // Find a genus entry and count the number of species entries after it.
        let count = 0;
        for (let j = i + 1; j < res.length && res[j].genus_taxid != res[j].tax_id; j++) {
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
      let parent = this.category_child_parent[subcat]
      let parent_excluded = (excluded_categories.indexOf(parent) >= 0);
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
        Cookies.set('exclude_subcats', JSON.stringify(new_exclude_subcats));
        this.applySearchFilter(0, excluded_categories, undefined, new_exclude_subcats);
        this.flash();
      }
    );
  }

  applyExcludeSubcats(e) {
    let new_exclude_subcats = this.state.exclude_subcats;
    let x_tag_subcat = e.target.getAttribute('data-exclude-subcat')
    let subcat = (x_tag_subcat && x_tag_subcat.length > 0) ? x_tag_subcat : e.target.value
    let i_subcat = new_exclude_subcats.indexOf(subcat)
    if (i_subcat == -1) {
      new_exclude_subcats.push(subcat)
    } else {
      new_exclude_subcats.splice(i_subcat, 1)
    }
    this.setState({
      exclude_subcats: new_exclude_subcats,
      searchId: 0,
      searchKey: ''
    }, () => {
      Cookies.set('exclude_subcats', JSON.stringify(new_exclude_subcats));
      this.applySearchFilter(0, this.state.excluded_categories, undefined, new_exclude_subcats);
      this.flash();
    });
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
      if (this.isThresholdValid(thresholds[i])) {
        cnt += 1;
      }
    }
    return cnt;
  }

  isThresholdValid(threshold) {
    if (
      threshold.hasOwnProperty("label") &&
      threshold.hasOwnProperty("operator") &&
      threshold.hasOwnProperty("value")
    ) {
      return (
        threshold.label.length > 0 &&
        threshold.operator.length > 0 &&
        (threshold.value != "" && !isNaN(threshold.value))
      );
    }
    return false;
  }

  saveThresholdFilters(closeWindow = true) {
    this.applyThresholdFilters(this.state.taxonomy_details, true);
    // prevent saving threshold with invalid values
    const activeThresholds = this.state.activeThresholds.filter(threshold => {
      return this.isThresholdValid(threshold);
    });
    window.localStorage.setItem(
      "activeThresholds",
      JSON.stringify(activeThresholds)
    );
    if (closeWindow) {
      $(".advanced-filters-modal").slideUp(300);
    }
  }

  getSavedThresholdFilters() {
    const activeThresholds = window.localStorage.getItem("activeThresholds");
    return activeThresholds ? JSON.parse(activeThresholds) : [];
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
          this.taxonPassThresholdFilter(
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
        if (this.taxonPassThresholdFilter(taxon, this.state.activeThresholds)) {
          matched_taxons.push(taxon);
        }
      }
    }

    if (matched_taxons.length > 0) {
      thresholded_taxons.push(genus_taxon);
      thresholded_taxons = thresholded_taxons.concat(matched_taxons);
    } else if (
      this.taxonPassThresholdFilter(genus_taxon, this.state.activeThresholds)
    ) {
      thresholded_taxons.push(genus_taxon);
    }

    this.applySearchFilter(0, this.state.excluded_categories, thresholded_taxons, this.state.exclude_subcats);

    if (play_animation) {
      this.flash();
    }
  }

  taxonPassThresholdFilter(taxon, rules) {
    if (Object.keys(taxon).length <= 0) {
      return false;
    }

    for (let i = 0; i < rules.length; i += 1) {
      let rule = rules[i];
      if (this.isThresholdValid(rule)) {
        let { label, operator, value } = rule;
        let threshold = parseFloat(value);
        const [fieldType, fieldTitle] = label.split("_");
        const taxonValue = (taxon[fieldType] || {})[fieldTitle];
        switch (operator) {
          case ">=":
            if (taxonValue < threshold) {
              return false;
            }
            break;
          case "<=":
            if (taxonValue > threshold) {
              return false;
            }
            break;
          default:
            // '>='
            if (taxonValue < threshold) {
              return false;
            }
        }
      }
    }
    return true;
  }

  handleThresholdEnter(event) {
    if (event.keyCode === 13) {
      this.applyThresholdFilters(this.state.taxonomy_details, true);
    }
  }

  // only for background model
  refreshPage(overrides) {
    this.nanobar.go(100);
    const new_params = Object.assign(
      {},
      this.props.report_page_params,
      overrides
    );
    window.location =
      location.protocol +
      "//" +
      location.host +
      location.pathname +
      "?" +
      $.param(new_params);
  }

  handleBackgroundModelChange(backgroundName, backgroundParams) {
    this.setState(
      {
        backgroundName,
        backgroundParams
      },
      () => {
        Cookies.set("background_name", backgroundName);
        Cookies.set("background_id", backgroundParams);
        this.refreshPage({ background_id: backgroundParams });
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
    const ncbiLink = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${taxId}`;
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
      `/samples/${this.sample_id}/alignment/nt_${taxLevel}_${taxId}`,
      "_blank"
    );
  }

  displayTags(taxInfo, reportDetails) {
    const tax_level_str = taxInfo.tax_level == 1 ? "species" : "genus";
    return (
      <span className="link-tag">
        {taxInfo.tax_id > 0 ? (
          <i
            data-tax-id={taxInfo.tax_id}
            onClick={this.gotoNCBI}
            className="fa fa-link cloud"
            aria-hidden="true"
          />
        ) : null}
        {reportDetails.taxon_fasta_flag ? (
          <i
            data-tax-level={taxInfo.tax_level}
            data-tax-id={taxInfo.tax_id}
            onClick={this.downloadFastaUrl}
            className="fa fa-download cloud"
            aria-hidden="true"
          />
        ) : null}
        {this.canSeeAlignViz && taxInfo.tax_id > 0 && taxInfo.NT.r > 0 ? (
          <i
            data-tax-level={tax_level_str}
            data-tax-id={taxInfo.tax_id}
            onClick={this.gotoAlignmentVizLink}
            className="fa fa-bars fa-1"
            aria-hidden="true"
          />
        ) : null}
      </span>
    );
  }

  category_to_adjective(category) {
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
    let tax_name =
      this.state.name_type.toLowerCase() == "common name" ? (
        !tax_common_name || tax_common_name.trim() == "" ? (
          <span className="count-info">{tax_scientific_name}</span>
        ) : (
          <span>{StringHelper.capitalizeFirstLetter(tax_common_name)}</span>
        )
      ) : (
        <span>{tax_scientific_name}</span>
      );
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
      const category_name =
        tax_info.tax_id == -200 ? "" : tax_info.category_name;
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
            {this.category_to_adjective(category_name)} species)
          </i>
          {this.displayTags(tax_info, report_details)}
        </div>
      );
    }
    return foo;
  }

  render_number(ntCount, nrCount, num_decimals, isAggregate = false, visible_flag = true) {
    if (!visible_flag) { return null; }
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

  render_column_header(visible_metric, column_name, tooltip_message, visible_flag=true) {
    return ( !visible_flag ? null :
      <th>
        <Tipsy content={tooltip_message} placement="top">
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
        </Tipsy>
      </th>
    );
  }

  row_class(tax_info) {
    if (tax_info.tax_level == 2) {
      if (tax_info.tax_id < 0) {
        return `report-row-genus ${tax_info.genus_taxid} fake-genus`;
      }
      return `report-row-genus ${tax_info.genus_taxid} real-genus`;
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
      } fake-genus ${initial_visibility}`;
    }
    return `report-row-species ${
      tax_info.genus_taxid
    } real-genus ${initial_visibility}`;
  }

  expandGenus(e) {
    const className = e.target.attributes.class.nodeValue;
    const attr = className.split(" ");
    const taxId = attr[2];
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
    $(".report-row-species.real-genus").removeClass("hidden");
    $(".report-arrow-down.real-genus").removeClass("hidden");
    $(".report-arrow-right.real-genus").addClass("hidden");
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

  render() {
    const filter_stats = `${
      this.state.rows_passing_filters
    } rows passing filters, out of ${this.state.rows_total} total rows.`;
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
          {filter_stats} {subsampling_stats} {disable_filter}
        </span>
      </div>
    );

    const advanced_filter_tag_list = this.state.activeThresholds.map(
      (threshold, i) => (
        <AdvancedFilterTagList threshold={threshold} key={i} i={i} parent={this} />
      )
    );

    const categories_filter_tag_list = this.displayedCategories(
      this.state.excluded_categories
    ).map((category, i) => {
      return (
        <Label className="label-tags" size="tiny" key={`category_tag_${i}`}>
          {category}
          <Icon name='close' data-exclude-category={category} onClick= { (e) => { this.applyExcludedCategories(e);} }/>
        </Label>
      );
    });

    const subcats_filter_tag_list = this.displayedSubcats(this.state.exclude_subcats).map((subcat, i) => {
      return (
        <Label className="label-tags" size="tiny" key={`subcat_tag_${i}`}>
          {subcat}
          <Icon name='close' data-exclude-subcat={subcat} onClick= { (e) => { this.applyExcludeSubcats(e);} }/>
        </Label>
      );
    });

    return (
      <RenderMarkup
        filter_row_stats={filter_row_stats}
        advanced_filter_tag_list={advanced_filter_tag_list}
        categories_filter_tag_list={categories_filter_tag_list}
        subcats_filter_tag_list={subcats_filter_tag_list}
        parent={this}
      />
    );
  }
}

function ThresholdMap(show_concordance) {
  let result = [
    {
      name: "Score",
      value: "NT_aggregatescore"
    },
    {
      name: "NT Z Score",
      value: "NT_zscore"
    },
    {
      name: "NT rPM",
      value: "NT_rpm"
    },
    {
      name: "NT r (total reads)",
      value: "NT_r"
    },
    {
      name: "NT %id",
      value: "NT_percentidentity"
    },
    {
      name: "NT log(1/e)",
      value: "NT_neglogevalue"
    },
    {
      name: "NR Z Score",
      value: "NR_zscore"
    },
    {
      name: "NR r (total reads)",
      value: "NR_r"
    },
    {
      name: "NR rPM",
      value: "NR_rpm"
    },
    {
      name: "NR %id",
      value: "NR_percentidentity"
    },
    {
      name: "R log(1/e)",
      value: "NR_neglogevalue"
    }
  ];
  if (show_concordance) {
    result = result.concat([
      {
        name: "NT %conc",
        value: "NT_percentconcordant"
      },
      {
        name: "NR %conc",
        value: "NR_percentconcordant"
      }
    ]);
  }
  return result;
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
          onClick={parent.expandGenus}
        />
      </span>
    </span>
  );
}

function AdvancedFilterTagList({ threshold, i, parent }) {
  if (parent.isThresholdValid(threshold)) {
    return (
      <Label className="label-tags" size="tiny" key={`advanced_filter_tag_${i}`}>
          {parent.thresholdLabel2Name[threshold["label"]]}{" "}
          {threshold["operator"]} {threshold["value"]}
          <Icon name='close' onClick= { () => {  parent.removeThresholdFilter(i); } }/>
      </Label>
    );
  } else {
    return null;
  }
}

function DetailCells({ parent }) {
  return parent.state.selected_taxons_top.map((tax_info, i) => (
    <tr key={tax_info.tax_id} className={parent.row_class(tax_info)}>
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
      <td>&nbsp;</td>
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

function AdvancedFilters({ parent }) {
  return (
    <li className="advanced-filter-top top-filter ui dropdown custom-dropdown filter-btn">
      <div
        className="advanced-filters-activate"
        onClick={() => {
          parent.saveThresholdFilters(false);
        }}
      >
        <span className="filter-label">Advanced Filters</span>
        <span className="filter-label-count">
          {parent.validThresholdCount(parent.state.activeThresholds)}{" "}
        </span>
        <i className="fa fa-angle-down right down-box" />
      </div>
      <div className="advanced-filters-modal round-me">
        <div className="filter-inputs">
          {parent.state.activeThresholds.map((activeThreshold, index) => {
            return (
              <ActiveThresholdRows
                activeThreshold={activeThreshold}
                key={index}
                index={index}
                parent={parent}
              />
            );
          })}
        </div>
        <div
          className="add-threshold-filter inner-menus"
          onClick={() => parent.appendThresholdFilter()}
        >
          <i className="fa fa-plus-circle" /> Add threshold
        </div>
        <br />
        <div className="">
          <button
            className="inner-menus save-btn"
            onClick={() => parent.saveThresholdFilters()}
          >
            Save
          </button>
        </div>
      </div>
    </li>
  );
}

function CategoryFilter({ parent }) {
  return (
    <li className="categories-dropdown top-filter ui dropdown custom-dropdown filter-btn">
      <div className="categories-filters-activate">
        <span className="filter-label">Categories</span>
        <span className="filter-label-count">
          {parent.all_categories.length
            - parent.state.excluded_categories.length
            + Object.keys(parent.category_child_parent).length
            - parent.state.exclude_subcats.length}{" "}
        </span>
        <i className="fa fa-angle-down right down-box" />
      </div>
      <div className="categories-filters-modal">
        <div className="categories">
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

            <br /><div className="divider" /><br />

            { Object.keys(parent.category_child_parent).map((subcat, i) => {
                return (
                  <li key={`subcat_check_${i}`}>
                    <input type="checkbox"
                      className="filled-in cat-filter"
                      id={subcat}
                      value={subcat}
                      onChange={(e) => {}}
                      onClick={(e) =>{parent.applyExcludeSubcats(e);}}
                      checked={parent.state.exclude_subcats.indexOf(subcat) == -1}/>
                      <label htmlFor={subcat}>{subcat} (part of {parent.category_child_parent[subcat]})</label>
                  </li>
                )
            })}
          </ul>
          {parent.all_categories.length + Object.keys(parent.category_child_parent).length < 1 ? <p>None found</p> : null}
        </div>
      </div>
    </li>
  );
}

function ReportSearchBox({ parent }) {
  return (
    <li className="search-box genus-autocomplete-container">
      <ReactAutocomplete
        inputProps={{ placeholder: "Search" }}
        items={parent.state.search_keys_in_sample}
        shouldItemRender={(item, value) =>
          item[0] == "All" ||
          (value.length > 2 &&
            item[0].toLowerCase().indexOf(value.toLowerCase()) > -1)
        }
        getItemValue={item => item[0]}
        renderItem={(item, highlighted) => (
          <div
            key={item[1]}
            style={{
              backgroundColor: highlighted ? "#eee" : "transparent"
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
  constructor (props) {
    super(props);
    this.state = {
      view: 'table',
    };
    this._onViewClicked = this.onViewClicked.bind(this);
  }

  onViewClicked (e, f) {
    this.setState({ view: f.name });
  }
  renderMenu () {
    return (
      <Menu icon floated="right">
        <Popup
          trigger={
            <Menu.Item name="table" active={this.state.view == 'table'} onClick={this._onViewClicked}>
              <Icon name="table"/>
            </Menu.Item>
          }
          content='Table View'
          inverted
         />

        <Popup
          trigger={
            <Menu.Item name="tree" active={this.state.view == 'tree'} onClick={this._onViewClicked}>
              <Icon name="fork" />
            </Menu.Item>
          }
          content='Phylogenetic Tree View'
          inverted
        />
      </Menu>
    );
  }
  render () {
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
                      <AdvancedFilters parent={parent} />
                    </ul>
                  </div>
                  {this.renderMenu()}
                  <div className="filter-tags-list">
                    {advanced_filter_tag_list} {categories_filter_tag_list} {subcats_filter_tag_list}
                  </div>
                  {filter_row_stats}
                </div>
                {this.state.view == "table" && <ReportTableHeader parent={parent} />}
                {parent.state.selected_taxons.length && this.state.view == "tree" && <PipelineSampleTree taxons={parent.state.selected_taxons} sample={parent.report_details.sample_info} nameType={parent.state.name_type} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function ActiveThresholdRows({ activeThreshold, index, parent }) {
  return (
    <div key={index} className="row">
      <div className=" col s5">
        <select
          value={activeThreshold.label}
          onChange={e =>
            parent.setThresholdProperty(index, "label", e.target.value)
          }
          className="browser-default inner-menus"
        >
          {parent.allThresholds.map(thresholdObject => {
            return (
              <option key={thresholdObject.value} value={thresholdObject.value}>
                {thresholdObject.name}
              </option>
            );
          })}
        </select>
      </div>
      <div className="col s3">
        <select
          value={activeThreshold.operator}
          onChange={e =>
            parent.setThresholdProperty(index, "operator", e.target.value)
          }
          className="browser-default inner-menus"
        >
          <option value=">=">>=</option>
          <option value="<=">&lt;=</option>
        </select>
      </div>
      <div className="col s3">
        <input
          className="browser-default metric-thresholds inner-menus"
          onChange={e =>
            parent.setThresholdProperty(index, "value", e.target.value)
          }
          onKeyDown={e => parent.handleThresholdEnter(e, index)}
          name="group2"
          value={activeThreshold.value}
          id={activeThreshold.label}
          type="number"
        />
      </div>
      <div
        className="col s1"
        onClick={() => parent.removeThresholdFilter(index)}
      >
        <i className="fa fa-close " data-ng={index} />
      </div>
    </div>
  );
}

class PipelineSampleTree extends React.PureComponent {
  constructor(props) {
    super(props);
    this._getTooltip = this.getTooltip.bind(this);
    this.dataTypes = ["NT.aggregatescore", "NT.r", "NT.rpm"];
    this.state = {
      dataType: this.dataTypes[0],
    };
    this._updateDataType = this.updateDataType.bind(this);
  }
  makeTree () {
		function make_node(name, level) {
			return {
				name: name,
				level: level,
				children: [],
        weight: 0,
			}
		}

		let rows = this.props.taxons;
		let nodes_by_name = {};

		let root = {
			name: '',
			children: [],
      weight: 0,
		};

		let tree = root;

		let order = [
			"species",
			"genus",
			"family",
			"order",
			"class",
			"phylum",
			"superkingdom",
		].reverse();

    let getValue = (row) => {
      let parts = this.state.dataType.split(".");
      return row[parts[0]][parts[1]];
    };
		for (let i=0; i < rows.length; i += 1) {
			tree = root;
			let row = rows[i];
			for (let j = 0; j < order.length; j+= 1) {
				if (!row.lineage) {
					break;
				}
				let level = order[j],
            name;

        if (this.props.nameType == "Common name") {
          name = row.lineage[level + "_common_name"];
        }

        if (!name) {
				  name = row.lineage[level + "_name"];
        }

				if (!name) {
					continue;
				}

				if(!nodes_by_name[name]) {
					let node = make_node(name, level);
					tree.children.push(node);
					nodes_by_name[name] = node;
				}
        tree.weight += getValue(row);
				tree = nodes_by_name[name];
			}
      tree.weight += getValue(row);
		}
    return root;
  }
  getTooltip (node) {
    if (!node) {
      return null;
    }
    return <div>{node.weight}</div>
    //return <TaxonTooltip taxon={node} sample={this.props.sample} />
  }

  updateDataType (e, d) {
    this.setState({dataType: d.value});
  }

  renderWeightDataTypeChooser () {
    let options = [];
    for (let dataType of this.dataTypes) {
      options.push({
        value: dataType,
        text: dataType,
      });
    }

    return (
      <LabeledDropdown
        options={options}
        onChange={this._updateDataType}
        value={this.state.dataType}
        label="Data Type:"
      />
    );

  }
  render () {
    let tree = this.makeTree();
    return (
      <div>
        {this.renderWeightDataTypeChooser()}
        <TreeStructure tree={tree} getTooltip={this._getTooltip} />
      </div>
    );
  }
}

class TreeStructure extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = {};
    this.autoCollapsed = false;
    this.i = 0;
    this.duration = 0;
  }
  componentWillReceiveProps (nextProps) {
    this.duration = 0;
    this.autoCollapsed = false;
    this.update(nextProps, nextProps.tree);
  }
  componentDidMount () {
    this.create();
    this.update(this.props, this.props.tree);
  }
  create () {
    this.svg = d3.select(this.container).append("svg")
    this.pathContainer = this.svg.append("g");
    this.nodeContainer = this.svg.append("g");
  }
  update (props, source) {
    let circleScale = d3.scale.linear()
              .domain([0, props.tree.weight])
              .range([3, 15]);

    let linkScale = d3.scale.linear()
              .domain([0, props.tree.weight])
              .range([1, 20]);

    let leaf_count = 0;
    let to_visit = [props.tree];
    let min_weight = 999999999;

    while(to_visit.length) {
      let node = to_visit.pop();
      min_weight = Math.min(min_weight, node.weight);
      if (!this.autoCollapsed && circleScale(node.weight) < 10 && node.children && node.children.length) {
        node._children = node.children;
        node.children = null;
      }
      if (!(node.children && node.children.length)) {
        leaf_count += 1;
      } else {
        to_visit = to_visit.concat(node.children);
      }
    }

    circleScale.domain([min_weight, props.tree.weight]);
    linkScale.domain([min_weight, props.tree.weight]);

		this.autoCollapsed = true;
    let width = 1000,
        height = Math.max(300, 35 * leaf_count);

    let margin = {
      top: 20,
      right: 200,
      left: 40,
      bottom: 20,
    };

		props.tree.x0 = height / 2;
  	props.tree.y0 = 0;

    this.svg
				.transition()
				.duration(this.duration)
        .attr("width", Math.max(this.svg.attr("width"), width + margin.left + margin.right))
        .attr("height", Math.max(this.svg.attr("height"), height + margin.top + margin.bottom));

    this.pathContainer.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    this.nodeContainer.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let tree = d3.layout.tree().size([height, width]);
    let nodes = tree.nodes(props.tree);
    let links = tree.links(nodes);

    let diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

    var node = this.nodeContainer.selectAll("g.node")
				.data(nodes, (d) => { return d.id || (d.id = ++this.i); });

		let paths = this.pathContainer.selectAll("path.link")
			.data(links, function(d) { return d.target.id; });

    let pathsEnter = paths.enter().append("path")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      })
      .attr("stroke-width", (d) => {
        return linkScale(d.target.weight);
      });

    let pathsExit = paths.exit().transition()
        .duration(this.duration)
        .attr("d", function(d) {
          let o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          })
          .remove();

		let pathsUpdate = paths.transition()
      .duration(this.duration)
      .attr("d", (d) => {
      	var source = {x: d.source.x - linkScale(this.calculateLinkSourcePosition(d)), y: d.source.y};
      	var target = {x: d.target.x, y: d.target.y};
      	return diagonal({source: source, target: target});
      })
      .attr("stroke-width", function(d){
      	return linkScale(d.target.weight);
      });


	  let nodeEnter = node.enter().append("g")
				.attr("class", (d) => {
          let cls = "node";
          if(d._children) {
            cls += " collapsed";
          }
          return cls;
        })
				.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", (d) => {
          let t = d.children;
          d.children = d._children;
          d._children = t;
          this.update(this.props, d);
        })
        .on("mouseover", (d) => {
          this.setState({hoverNode: d});

          d3.select(this.tooltip)
           .style("left", (currentEvent.pageX+10) + "px")
           .style("top", (currentEvent.pageY-10) + "px")
          d3.select(this.tooltip).classed("hidden", false);
        })
        .on("mouseout", (d) => {
          d3.select(this.tooltip).classed("hidden", true);
        });


		nodeEnter.append("circle")
      .attr("r", 1e-6)

  	nodeEnter.append("text")
      .attr("dy", 3)
      .attr("x", function(d) { return d.children || d._children ? -1 * circleScale(d.weight) - 5 : circleScale(d.weight) + 5; })
      .style("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) {
        return d.name;
			})
      .style("fill-opacity", 1e-6);

    let nodeExit = node.exit().transition()
        .duration(this.duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

  	nodeExit.select("circle")
      .attr("r", 1e-6);

	  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

    let nodeUpdate = node.transition()
        .duration(this.duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
				.attr("class", (d) => {
          let cls = "node";
          if(d._children) {
            cls += " collapsed";
          }
          return cls;
        });

	  nodeUpdate.select("circle")
      .attr("r", function(d){ return circleScale(d.weight);})

	  nodeUpdate.select("text")
      .style("fill-opacity", 1);

		nodes.forEach(function(d) {
    	d.x0 = d.x;
    	d.y0 = d.y;
  	});
    this.duration = 750;
  }

	calculateLinkSourcePosition (link) {
		let targetID = link.target.id;
		let childrenNumber = link.source.children.length;
		let widthAbove = 0;
		for (var i = 0; i < childrenNumber; i++)
		{
			if (link.source.children[i].id == targetID)
			{
				// we are done
				widthAbove = widthAbove + link.source.children[i].weight/2;
				break;
			}else {
				// keep adding
				widthAbove = widthAbove + link.source.children[i].weight
			}
		}
		return link.source.weight/2 - widthAbove;
	}

  renderTooltip () {
    if (this.state.hoverNode === undefined) {
      return;
    }

    return (
      <div className="d3-tree-tooltip hidden" ref={(tooltip) => { this.tooltip = tooltip; }} >
        {this.props.getTooltip(this.state.hoverNode)}
      </div>)
  }

  render () {
    return (
      <div className="d3-tree">
        {this.renderTooltip()}
        <div ref={(container) => { this.container = container; }} />
      </div>
    );
  }
};
export default PipelineSampleReport;
