import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import $ from 'jquery';
import Tipsy from 'react-tipsy';
import ReactAutocomplete from 'react-autocomplete';
import Samples from './Samples';
import ReportFilter from './ReportFilter';
import numberWithCommas from '../helpers/strings';
import StringHelper from '../helpers/StringHelper';

class PipelineSampleReport extends React.Component {
  constructor(props) {
    super(props);
    this.report_ts = props.report_ts;
    this.sample_id = props.sample_id;
    this.gitVersion = props.git_version
    this.canSeeAlignViz = props.can_see_align_viz

    this.all_categories = props.all_categories;
    this.report_details = props.report_details;
    this.report_page_params = props.report_page_params;
    this.all_backgrounds = props.all_backgrounds;
    this.max_rows_to_render = props.max_rows || 1500;
    this.default_sort_by = this.report_page_params.sort_by.replace('highest_', '');
    this.sort_params = {};
    const cached_cats = Cookies.get('excluded_categories');
    const cached_name_type = Cookies.get('name_type');
    const savedThresholdFilters = this.getSavedThresholdFilters();
    this.allThresholds = [
      {
        name: 'Score',
        value: 'NT_aggregatescore'
      }, {
        name: 'NT Z Score',
        value: 'NT_zscore'
      }, {
        name: 'NT rPM',
        value: 'NT_rpm'
      }, {
        name: 'NT r (total reads)',
        value: 'NT_r'
      }, {
        name: 'NT %id',
        value: 'NT_percentidentity'
      }, {
        name: 'NT log(1/e)',
        value: 'NT_neglogevalue'
      }, {
        name: 'NT %conc',
        value: 'NT_percentconcordant'
      }, {
        name: 'NR Z Score',
        value: 'NR_zscore'
      }, {
        name: 'NR r (total reads)',
        value: 'NR_r'
      }, {
        name: 'NR rPM',
        value: 'NR_rpm'
      }, {
        name: 'NR %id',
        value: 'NR_percentidentity'
      }, {
        name: 'R log(1/e)',
        value: 'NR_neglogevalue'
      }, {
        name: 'NR %conc',
        value: 'NR_percentconcordant'
      }
    ];
    this.genus_map = {};

    this.defaultThresholdValues = (savedThresholdFilters.length)
      ? savedThresholdFilters : [{
        label: '',
        operator: '>=',
        value: ''
      }]; // all taxons will pass this default filter

    // we should only keep dynamic data in the state
    this.state = {
      taxonomy_details: [],
      backgroundName: Cookies.get('background_name') || this.report_details.default_background.name,
      searchId: 0,
      searchKey: '',
      search_keys_in_sample: [],
      lineage_map: {},
      rows_passing_filters: 0,
      rows_total: 0,
      thresholded_taxons: [],
      selected_taxons: [],
      selected_taxons_top: [],
      pagesRendered: 0,
      sort_by: this.default_sort_by,
      excluded_categories: (cached_cats) ? JSON.parse(cached_cats) : [],
      name_type: cached_name_type ? cached_name_type : 'Scientific Name',
      search_taxon_id: 0,
      rendering: false,
      loading: true,
      activeThresholds: this.defaultThresholdValues
    };
    this.expandAll = false;
    this.expandedGenera = [];
    this.applySearchFilter = this.applySearchFilter.bind(this);
    this.anyFilterSet = this.anyFilterSet.bind(this);
    this.resetAllFilters = this.resetAllFilters.bind(this);
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
    this.renderMore = this.renderMore.bind(this)
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
    this.listenThresholdChanges();
    this.scrollDown();
    const topFilterHandler = $('.top-filter-dropdown');
    topFilterHandler.dropdown({
      belowOrigin: true,
      constrainWidth: true,
      stopPropagation: false
    });

    this.setupFilterModal('.advanced-filters-activate', '.advanced-filters-modal')
    this.setupFilterModal('.categories-filters-activate', '.categories-filters-modal')
  }

  setupFilterModal(activateDiv, modalDiv) {
    const filtersModal = $(modalDiv);
    const filtersActivate = $(activateDiv);

    filtersActivate.on('click', (e) => {
      e.stopPropagation();
      filtersModal.slideToggle(200);
    });
  }

  fetchSearchList() {
    axios.get(`/samples/${this.sample_id}/search_list?report_ts=${this.report_ts}&version=${this.gitVersion}`).then((res) => {
      const search_list = res.data.search_list;
      search_list.splice(0, 0, ['All', 0]);
      this.setState({
        lineage_map: res.data.lineage_map,
        search_keys_in_sample: search_list
      });
    });
  }

  fetchReportData() {
    Samples.showLoading('Loading results...');
    let params = `?${window.location.search.replace('?', '')}&report_ts=${this.report_ts}&version=${this.gitVersion}`;
    const cached_background_id = Cookies.get('background_id');
    if (cached_background_id) {
      params = params.indexOf('background_id=')
      < 0 ? `${params}&background_id=${cached_background_id}` : params;
    }
    axios.get(`/samples/${this.sample_id}/report_info${params}`).then((res) => {
      Samples.hideLoader();
      const genus_map = {};
      for (let i = 0; i < res.data.taxonomy_details[2].length; i++) {
        const taxon = res.data.taxonomy_details[2][i];
        if (taxon.genus_taxid == taxon.tax_id) {
          genus_map[taxon.genus_taxid] = taxon;
        }
      }
      // the genus_map never changes, so we move it out from the react state, to reduce perfomance cost
      this.genus_map = genus_map;
      this.setState({
        rows_passing_filters: res.data.taxonomy_details[0],
        rows_total: res.data.taxonomy_details[1],
        taxonomy_details: res.data.taxonomy_details[2]
      },
      () => {
        this.applyThresholdFilters(this.state.taxonomy_details, false);
      });
    });
  }


  anyFilterSet() {
    if (this.state.search_taxon_id > 0
      || this.state.excluded_categories.length > 0
      || (this.state.activeThresholds.length > 0 && this.isThresholdValid(this.state.activeThresholds[0]))) {
      return true;
    }
    return false;
  }

  resetAllFilters() {
    this.setState({
      activeThresholds: [{
        label: '',
        operator: '>=',
        value: ''
      }],
      excluded_categories: [],
      searchId: 0,
      searchKey: '',
      search_taxon_id: 0,
      thresholded_taxons: this.state.taxonomy_details,
      selected_taxons: this.state.taxonomy_details,
      selected_taxons_top: this.state.taxonomy_details.slice(0,  this.max_rows_to_render),
      pagesRendered: 1,
      rows_passing_filters: this.state.taxonomy_details.length,
    }, () => {
      this.saveThresholdFilters();
      Cookies.set('excluded_categories', '[]');
      this.flash();
    });
  }

  applySearchFilter(searchTaxonId, excludedCategories, input_taxons) {
    let selected_taxons = [];
    const thresholded_taxons = input_taxons || this.state.thresholded_taxons;
    const active_thresholds = this.state.activeThresholds
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
      for (var i = 0; i < thresholded_taxons.length; i++) {
        let taxon = thresholded_taxons[i];
        if (excludedCategories.indexOf(taxon.category_name) < 0) {
          // not in the excluded categories
          selected_taxons.push(taxon);
        } else if (taxon.category_name == 'Uncategorized' && parseInt(taxon.tax_id) == -200) {
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

    let searchKey = this.state.searchKey
    if (searchTaxonId <= 0) {
      searchKey = ""
    }

    // console.log(excludedCategories)
    this.setState({
      loading: false,
      excluded_categories: excludedCategories,
      search_taxon_id: searchTaxonId,
      activeThresholds: active_thresholds,
      searchKey,
      thresholded_taxons,
      selected_taxons,
      selected_taxons_top: selected_taxons.slice(0,  this.max_rows_to_render),
      pagesRendered: 1,
      rows_passing_filters: selected_taxons.length
    });
  }

  //Load more samples on scroll
  scrollDown() {
    var that = this;
    $(window).scroll(function() {
      if ($(window).scrollTop() > $(document).height() - $(window).height() - 6000) {
        {that.state.rows_total > 0 && !that.state.rendering ? that.renderMore() : null }
        return false;
      }
    });
  }


  renderMore() {
    let selected_taxons = this.state.selected_taxons
    let currentPage = this.state.pagesRendered
    let rowsPerPage = this.max_rows_to_render
    if (selected_taxons.length > currentPage * this.max_rows_to_render) {
      let next_page = selected_taxons.slice(currentPage * rowsPerPage, rowsPerPage * (currentPage +1))
      this.setState((prevState) => ({
        selected_taxons_top: [...prevState.selected_taxons_top, ...next_page],
        pagesRendered: (currentPage + 1),
      })
      )
    }
  }

  flash() {
    $('.filter-message').removeClass('flash');
    const el = document.getElementById('filter-message');
    if (el) {
      el.offsetHeight; /* trigger reflow */
    }
    $('.filter-message').addClass('flash');
  }

  initializeTooltip() {
    // only updating the tooltip offset when the component is loaded
    $(() => {
      const tooltipIdentifier = $("[rel='tooltip']");
      tooltipIdentifier.tooltip({
        delay: 0,
        html: true,
        placement: 'top',
        offset: '0px 50px'
      });
      $('.sort-controls').hover(() => {
        const selectTooltip = $('.tooltip');
        const leftOffset = parseInt(selectTooltip.css('left'));
        if (!isNaN(leftOffset)) {
          selectTooltip.css('left', leftOffset - 15);
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
    const primary_sort = this.state.sort_by.split('_');
    primary_sort[0] = primary_sort[0].toUpperCase();
    const secondary_sort = this.default_sort_by.split('_');
    secondary_sort[0] = secondary_sort[0].toUpperCase();
    this.sortParams = {
      primary: primary_sort,
      secondary: secondary_sort
    };
  }

  applyExcludedCategories(e) {
    let excluded_categories = this.state.excluded_categories;
    if (e.target.checked) {
      const ridx = excluded_categories.indexOf(e.target.value);
      if (ridx > -1) {
        excluded_categories.splice(ridx, 1);
      }
    } else {
      excluded_categories.push(e.target.value);
    }
    this.setState({
      excluded_categories: excluded_categories,
      searchId: 0,
      searchKey: ''
    }, () => {
      Cookies.set('excluded_categories', JSON.stringify(excluded_categories));
      this.applySearchFilter(0, excluded_categories);
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
      pagesRendered: 1,
    });
    this.state.thresholded_taxons = this.state.thresholded_taxons.sort(this.sortCompareFunction);
    this.state.taxonomy_details = this.state.taxonomy_details.sort(this.sortCompareFunction);
  }

  setThresholdProperty(index, property, value) {
    const stateCopy = Object.assign([], this.state.activeThresholds);
    stateCopy[index][property] = value;
    this.setState({ activeThresholds: stateCopy });
  }

  appendThresholdFilter() {
    const stateCopy = Object.assign([], this.state.activeThresholds);
    const firstThreshold = this.allThresholds[0]
    stateCopy.push({ label: firstThreshold['value'], operator: '>=', value: '' });
    this.setState({
      activeThresholds: stateCopy
    });
  }

  removeThresholdFilter(pos) {
    const stateCopy = Object.assign([], this.state.activeThresholds);
    stateCopy.splice(pos, 1);
    let closeWindow = true
    if (stateCopy.length > 0) {
      closeWindow = false
    }
    this.setState({
      activeThresholds: stateCopy
    }, () => { this.saveThresholdFilters(closeWindow); } )
  }

  isThresholdValid(threshold) {
    if (threshold.hasOwnProperty('label')
      && threshold.hasOwnProperty('operator')
      && threshold.hasOwnProperty('value')) {
        return ((threshold.label.length > 0)
        && (threshold.operator.length > 0)
        && (threshold.value != '' && !isNaN(threshold.value)));
    }
    return false;
  }

  saveThresholdFilters(closeWindow = true) {
    this.applyThresholdFilters(this.state.taxonomy_details, true);
    // prevent saving threshold with invalid values
    const activeThresholds = this.state.activeThresholds.filter((threshold) => {
      return this.isThresholdValid(threshold);
    });
    window.localStorage.setItem('activeThresholds', JSON.stringify(activeThresholds));
    if (closeWindow) {
      $('.advanced-filters-modal').slideUp(300);
    }
  }

  getSavedThresholdFilters() {
    const activeThresholds = window.localStorage.getItem('activeThresholds');
    return (activeThresholds) ? JSON.parse(activeThresholds) : [];
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
        } else if (this.taxonPassThresholdFilter(genus_taxon, this.state.activeThresholds)) {
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
    } else if (this.taxonPassThresholdFilter(genus_taxon, this.state.activeThresholds)) {
      thresholded_taxons.push(genus_taxon);
    }

    this.applySearchFilter(0, this.state.excluded_categories, thresholded_taxons);

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
		const [fieldType, fieldTitle] = label.split('_');
		const taxonValue = (taxon[fieldType] || {})[fieldTitle];
		switch (operator) {
		  case '>=':
			if (taxonValue < threshold) {
			  return false;
			}
            break;
		  case '<=':
			if (taxonValue > threshold) {
			  return false;
			}
            break;
		  default: // '>='
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

  listenThresholdChanges() {
    $('.metric-thresholds').focusout((e) => {
      this.applyThresholdFilters(this.state.taxonomy_details, true);
    });
  }

  // only for background model
  refreshPage(overrides) {
    ReportFilter.showLoading('Fetching results for new background...');
    const new_params = Object.assign({}, this.props.report_page_params, overrides);
    window.location = location.protocol + '//' + location.host + location.pathname + '?' + $.param(new_params);
  }

  handleBackgroundModelChange(backgroundName, backgroundParams) {
    this.setState({ backgroundName, backgroundParams }, () => {
      Cookies.set('background_name', backgroundName);
      Cookies.set('background_id', backgroundParams);
      this.refreshPage({background_id: backgroundParams});
    });
  }

  handleNameTypeChange(name_type) {
    this.setState({ name_type: name_type }, () => {
      Cookies.set('name_type', name_type);
    });
  }

  // path to NCBI
  gotoNCBI(e) {
    const taxId = e.target.getAttribute('data-tax-id');
    const ncbiLink = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${taxId}`;
    window.open(ncbiLink, '_blank');
  }

  // download Fasta
  downloadFastaUrl(e) {
    const taxLevel = e.target.getAttribute('data-tax-level');
    const taxId = e.target.getAttribute('data-tax-id');
    location.href = `/samples/${this.sample_id}/fasta/${taxLevel}/${taxId}/NT_or_NR`;
  }

  gotoAlignmentVizLink(e) {
    const taxId = e.target.getAttribute('data-tax-id');
    const taxLevel = e.target.getAttribute('data-tax-level');
    window.open(`/samples/${this.sample_id}/alignment/nt_${taxLevel}_${taxId}`, '_blank');
  }

  displayTags(taxInfo, reportDetails) {
    const tax_level_str = (taxInfo.tax_level == 1) ? 'species' : 'genus';
    return (
      <span className="link-tag">
        { taxInfo.tax_id > 0 ? <i data-tax-id={taxInfo.tax_id} onClick={this.gotoNCBI} className="fa fa-link cloud" aria-hidden="true" /> : null }
        { reportDetails.taxon_fasta_flag ? <i
          data-tax-level={taxInfo.tax_level}
          data-tax-id={taxInfo.tax_id}
          onClick={this.downloadFastaUrl}
          className="fa fa-download cloud"
          aria-hidden="true"
        /> : null }
        {
          this.canSeeAlignViz && taxInfo.tax_id > 0 && taxInfo.NT.r > 0 ?  <i
          data-tax-level={tax_level_str}
          data-tax-id={taxInfo.tax_id}
          onClick={this.gotoAlignmentVizLink}
          className="fa fa-bars fa-1"
          aria-hidden="true"
        /> : null }
      </span>
    );
  }

  category_to_adjective(category) {
    const category_lowercase = category.toLowerCase();
    switch (category_lowercase) {
      case 'bacteria':
        return 'bacterial';
      case 'archaea':
        return 'archaeal';
      case 'eukaryota':
        return 'eukaryotic';
      case 'viruses':
        return 'viral';
      case 'viroids':
        return 'viroidal';
      case 'uncategorized':
        return 'uncategorized';
    }
    return category_lowercase;
  }

  render_name(tax_info, report_details) {
    let tax_scientific_name = tax_info['name']
    let tax_common_name = tax_info['common_name']
    let tax_name = this.state.name_type.toLowerCase() == 'common name' ?
                     !tax_common_name || tax_common_name.trim() == "" ? <span className="count-info">{tax_scientific_name}</span> : <span>{StringHelper.capitalizeFirstLetter(tax_common_name)}</span>
                     : <span>{tax_scientific_name}</span>
    let foo = <i>{tax_name}</i>;

    if (tax_info.tax_id > 0) {
      if (report_details.taxon_fasta_flag) {
        foo = <span className="link"><a>{tax_name}</a></span>;
      } else {
        foo = <span>{tax_name}</span>;
      }
    }
    if (tax_info.tax_level == 1) {
      // indent species rows
      foo = (<div className="hover-wrapper">
        <div className="species-name">{foo}
          { this.displayTags(tax_info, report_details) }
        </div>
             </div>);
    } else {
      // emphasize genus, soften category and species count
      const category_name = tax_info.tax_id == -200 ? '' : tax_info.category_name;
      const fake_or_real = tax_info.genus_taxid < 0 ? 'fake-genus' : 'real-genus';
      const right_arrow_initial_visibility = '';
      const down_arrow_initial_visibility = 'hidden';
      const plus_or_minus = (<span>
        <span className={`report-arrow-down report-arrow ${tax_info.tax_id} ${fake_or_real} ${down_arrow_initial_visibility}`}>
          <i className={`fa fa-angle-down ${tax_info.tax_id}`} onClick={this.collapseGenus} />
        </span>
        <span className={`report-arrow-right report-arrow ${tax_info.tax_id} ${fake_or_real} ${right_arrow_initial_visibility}`}>
          <i className={`fa fa-angle-right ${tax_info.tax_id}`} onClick={this.expandGenus} />
        </span>
      </span>);
       foo = (<div className="hover-wrapper">
        <div className="genus-name"> {plus_or_minus} {foo}</div>
        <i className="count-info">({tax_info.species_count} {this.category_to_adjective(category_name)} species)</i>
        { this.displayTags(tax_info, report_details) }
             </div>);
    }
    return foo;
  }

  render_number(x, emphasize, num_decimals) {
    const is_blank = (x == 0) || (x == -100);
    let y = Number(x);
    y = y.toFixed(num_decimals);
    y = numberWithCommas(y);
    if (emphasize) {
      y = <b>{y}</b>;
    }
    const className = is_blank ? 'report-number-blank' : 'report-number';
    return (<td className={className}>{y}</td>);
  }

  isSortedActive(columnName) {
    const desiredSort = columnName.toLowerCase();
    return (this.state.sort_by == desiredSort) ? 'active' : '';
  }

  render_sort_arrow(column, desired_sort_direction, arrow_direction) {
    let className = ` ${this.isSortedActive(column)} fa fa-caret-${arrow_direction}`;
    return (
      <i
        onClick={this.applySort.bind(this, column)}
        className={className}
        key={column.toLowerCase()}
      />
    );
  }

  render_column_header(visible_type, visible_metric, column_name, tooltip_message) {
    const style = { textAlign: 'left', cursor: 'pointer' };
    return (
      <th style={style}>
        <Tipsy content={tooltip_message} placement="top">
          <div className='sort-controls center left'>
            {this.render_sort_arrow(column_name, 'highest', 'down')}
            {`${visible_type} `}
            {visible_metric}
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
    let initial_visibility = 'hidden';
    if ((this.expandAll && tax_info.genus_taxid > 0) || this.expandedGenera.indexOf(tax_info.genus_taxid.toString()) >= 0) {
      initial_visibility = '';
    }
    if (tax_info.genus_taxid < 0) {
      return `report-row-species ${tax_info.genus_taxid} fake-genus ${initial_visibility}`;
    }
    return `report-row-species ${tax_info.genus_taxid} real-genus ${initial_visibility}`;
  }

  expandGenus(e) {
    const className = e.target.attributes.class.nodeValue;
    const attr = className.split(' ');
    const taxId = attr[2];
    const taxIdIdx = this.expandedGenera.indexOf(taxId)
    if (taxIdIdx < 0) {
      this.expandedGenera.push(taxId)
    }
    $(`.report-row-species.${taxId}`).removeClass('hidden');
    $(`.report-arrow.${taxId}`).toggleClass('hidden');
  }

  collapseGenus(e) {
    const className = e.target.attributes.class.nodeValue;
    const attr = className.split(' ');
    const taxId = attr[2];
    const taxIdIdx = this.expandedGenera.indexOf(taxId)
    if (taxIdIdx >= 0) {
       this.expandedGenera.splice(taxIdIdx, 1)
    }
    $(`.report-row-species.${taxId}`).addClass('hidden');
    $(`.report-arrow.${taxId}`).toggleClass('hidden');

  }

  expandTable(e) {
    // expand all real genera
    this.expandAll = true;
    this.expandedGenera = [];
    $('.report-row-species.real-genus').removeClass('hidden');
    $('.report-arrow-down.real-genus').removeClass('hidden');
    $('.report-arrow-right.real-genus').addClass('hidden');
    $('.table-arrow').toggleClass('hidden');
  }

  collapseTable(e) {
    // collapse all genera (real or negative)
    this.expandAll = false;
    this.expandedGenera = [];
    $('.report-row-species').addClass('hidden');
    $('.report-arrow-down').addClass('hidden');
    $('.report-arrow-right').removeClass('hidden');
    $('.table-arrow').toggleClass('hidden');
  }

  // Download report in csv
  downloadReport(id) {
    _satellite.track('downloadreport')
    location.href = `/reports/${id}/csv`
  }

  handleSearch(e) {
    this.setState({
      searchKey: e.target.value,
    })
  }

  searchSelectedTaxon(value, item) {
    //ReportFilter.showLoading(`Filtering for '${value}'...`);
    let searchId = item[1];
    this.setState({
      searchId,
      excluded_categories: [],
      searchKey: item[0],
      activeThresholds: []

    }, () => {
      this.applySearchFilter(searchId, []);
    });
  }



  render() {
    const parts = this.report_page_params.sort_by.split('_');
    const sort_column = `${parts[1]}_${parts[2]}`;
    const t0 = Date.now();

    const filter_stats = `${this.state.rows_passing_filters} rows passing filters, out of ${this.state.rows_total} total rows.`;
    let subsampled_reads = this.report_details ? this.report_details.subsampled_reads : null
    let subsampling_stats = subsampled_reads && subsampled_reads < this.report_details.pipeline_info.remaining_reads ?
                              'Randomly subsampled to ' + subsampled_reads
                              + ' out of ' + this.report_details.pipeline_info.remaining_reads
                              + ' non-host reads.'
                              : '';
    const disable_filter = this.anyFilterSet() ? (<span className="disable" onClick={e => this.resetAllFilters()}><b> Disable all filters</b></span>) : null;
    const filter_row_stats = this.state.loading ? null : (
      <div id="filter-message" className="filter-message">
        <span className="count">
          {filter_stats} {subsampling_stats} {disable_filter}
        </span>
      </div>
    );

    const right_arrow_initial_visibility = '';
    const result = (
      <div>
        <div id="reports" className="reports-screen tab-screen col s12">
          <div className="tab-screen-content">
            <div className="row reports-container">
              <div className="col s12 reports-section">
                <div className="reports-count">
                  { filter_row_stats }
                  <div className='report-top-filters'>
                    <ul className='filter-lists'>
                      <li className='search-box genus-autocomplete-container'>
                         <ReactAutocomplete
                          inputProps={{ placeholder: 'Search' }}
                          items={this.state.search_keys_in_sample}
                          shouldItemRender={(item, value) => (item[0] == 'All') || (value.length > 2 && item[0].toLowerCase().indexOf(value.toLowerCase()) > -1)}
                          getItemValue={item => item[0]}
                          renderItem={(item, highlighted) =>
                            <div
                              key={item[1]}
                              style={{ backgroundColor: highlighted ? '#eee' : 'transparent'}}
                            >
                              {item[0]}
                            </div>
                          }
                          value={ this.state.searchKey }
                          onChange={(e) => this.handleSearch(e)}
                          onSelect={(value, item) => this.searchSelectedTaxon(value, item)}
                        />
                        <i className='fa fa-search'></i>
                      </li>

                      <li className='name-type-dropdown top-filter-dropdown'
                        data-activates='name-type-dropdown'>
                        <span className='filter-label'>
                          {
                            this.state.name_type ? this.state.name_type : 'Select name type'
                          }
                        </span>
                        <i className='fa fa-angle-down right'></i>
                        <div id='name-type-dropdown' className='dropdown-content'>
                          <ul>
                          <li
                              onClick={() => this.handleNameTypeChange('')}
                              ref= "name_type">
                              Select name type
                            </li>
                            <li
                              onClick={() => this.handleNameTypeChange('Scientific name')}
                              ref= "name_type">
                              Scientific Name
                            </li>
                            <li
                              onClick={() => this.handleNameTypeChange('Common name')}
                              ref= "name_type">
                              Common Name
                            </li>
                          </ul>
                        </div>
                      </li>
                      <li className='background-model-dropdown top-filter-dropdown'
                        data-activates='background-model-dropdown'>
                        <span className='filter-label'>
                          {
                            this.state.backgroundName ? this.state.backgroundName : 'Background model'
                          }
                        </span>
                        <i className='fa fa-angle-down right'></i>
                        <div id='background-model-dropdown' className='dropdown-content'>
                          <ul>
                            {
                              this.all_backgrounds.length ?
                              this.all_backgrounds.map((background, i) => {
                                return (
                                  <li
                                  onClick={() => this.handleBackgroundModelChange(background.name, background.id)}
                                  ref= "background" key={i}>
                                    {background.name}
                                  </li>);
                                })
                                : <li>No background models to display</li>
                            }
                          </ul>
                        </div>
                      </li>
                      <li className='categories-dropdown top-filter' >
                        <div className="categories-filters-activate">
                          <span className='filter-label'>Categories</span>
                          <i className='fa fa-angle-down right'></i>
                        </div>
                        <div className='categories-filters-modal'>
                          <div className="categories">
                            <ul>
                            { this.all_categories.map((category, i) => {
                              return (
                                <li key={i}>
                                  <input type="checkbox"
                                  className="filled-in cat-filter"
                                  id={category.name}
                                  value={category.name}
                                  onChange={(e) => {}}
                                  onClick={(e) =>{this.applyExcludedCategories(e);}}
                                  checked={this.state.excluded_categories.indexOf(category.name) < 0}/>
                                  <label htmlFor={ category.name }>{ category.name }</label>
                                </li>
                              )
                            })}
                            </ul>
                            { this.all_categories.length < 1 ? <p>None found</p> : null }
                          </div>
                        </div>
                      </li>
                      <li className="top-filter ">
                        <div className="advanced-filters-activate">
                          <span className="filter-label">
                            Advanced Filtering
                          </span>
                          <i className="fa fa-angle-down right" />
                        </div>
                        <div className="advanced-filters-modal">
                          <div className="filter-inputs">
                            {
                              this.state.activeThresholds.map((activeThreshold, index) => {
                                return (
                                  <div key={index} className="row">
                                    <div className=" col s5">
                                      <select
                                        value={activeThreshold.label}
                                        onChange={(e) => this.setThresholdProperty(index, 'label', e.target.value) }
                                        className="browser-default">
                                        {
                                          this.allThresholds.map((thresholdObject) => {
                                            return (
                                              <option
                                                key={thresholdObject.value}
                                                value={thresholdObject.value}>
                                                {thresholdObject.name}
                                              </option>
                                            )
                                          })
                                        }
                                      </select>
                                    </div>
                                    <div className="col s3">
                                      <select
                                        value={activeThreshold.operator}
                                        onChange={(e) => this.setThresholdProperty(index, 'operator', e.target.value)}
                                        className="browser-default">
                                        <option value=">=">
                                          >=
                                        </option>
                                        <option value="<=">
                                          &lt;=
                                        </option>
                                      </select>
                                    </div>
                                    <div className="col s3">
                                      <input
                                        className="metric-thresholds browser-default"
                                        onChange={(e) => this.setThresholdProperty(index, 'value', e.target.value)}
                                        onKeyDown={(e) => this.handleThresholdEnter(e, index)}
                                        name="group2"
                                        value={ activeThreshold.value }
                                        id={activeThreshold.label}
                                        type="number"
                                      />
                                    </div>
                                    <div className="col s1" onClick={() => this.removeThresholdFilter(index)}>
                                      <i className="fa fa-close " data-ng={index} />
                                    </div>
                                  </div>
                                )
                              })
                            }
                          </div>
                          <div className="add-threshold-filter" onClick={ () => this.appendThresholdFilter() }>
                            <i className="fa fa-plus-circle" /> Add threshold
                          </div>
                          <br/>
                          <div className="" >
                            <button className="btn" onClick={ () => this.saveThresholdFilters()}>
                              Save
                            </button>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  {/* { filter_row_stats } */}
                </div>

                <div className="reports-main">
                  <table id="report-table" className="bordered report-table">
                    <thead>
                      <tr>
                        <th>
                          <span className={`table-arrow ${right_arrow_initial_visibility}`}>
                            <i className="fa fa-angle-right" onClick={this.expandTable} />
                          </span>
                          <span className="table-arrow hidden">
                            <i className="fa fa-angle-down" onClick={this.collapseTable} />
                          </span>
                        Taxonomy
                        </th>
                        {this.render_column_header('', 'Score', 'NT_aggregatescore', 'Aggregate score: ( |genus.NT.Z| * species.NT.Z * species.NT.rPM ) + ( |genus.NR.Z| * species.NR.Z * species.NR.rPM )') }
                        {this.render_column_header('NT', 'Z', 'NT_zscore', 'Z-score relative to background model for alignments to NCBI NT') }
                        {this.render_column_header('NT', 'rPM', 'NT_rpm', 'Number of reads aligning to the taxon in the NCBI NT database per million total input reads')}
                        {this.render_column_header('NT', 'r', 'NT_r', 'Number of reads aligning to the taxon in the NCBI NT database')}
                        {this.render_column_header('NT', '%id', 'NT_percentidentity', 'Average percent-identity of alignments to NCBI NT')}
                        {this.render_column_header('NT', 'log(1/E)', 'NT_neglogevalue', 'Average log-10-transformed expect value for alignments to NCBI NT')}
                        {this.render_column_header('NT', '%conc', 'NT_percentconcordant', 'Percentage of aligned reads belonging to a concordantly mappped pair (NCBI NT)')}
                        {this.render_column_header('NR', 'Z', 'NR_zscore', 'Z-score relative to background model for alignments to NCBI NR') }
                        {this.render_column_header('NR', 'rPM', 'NR_rpm', 'Number of reads aligning to the taxon in the NCBI NR database per million total input reads')}
                        {this.render_column_header('NR', 'r', 'NR_r', 'Number of reads aligning to the taxon in the NCBI NR database')}
                        {this.render_column_header('NR', '%id', 'NR_percentidentity', 'Average percent-identity of alignments to NCBI NR')}
                        {this.render_column_header('NR', 'log(1/E)', 'NR_neglogevalue', 'Average log-10-transformed expect value for alignments to NCBI NR')}
                        {this.render_column_header('NR', '%conc', 'NR_percentconcordant', 'Percentage of aligned reads belonging to a concordantly mappped pair (NCBI NR)')}
                      </tr>
                    </thead>
                    <tbody>
                      { this.state.selected_taxons_top.map((tax_info, i) => (
                        <tr key={tax_info.tax_id} className={this.row_class(tax_info)}>
                          <td>
                            { this.render_name(tax_info, this.report_details) }
                          </td>
                          { this.render_number(tax_info.NT.aggregatescore, this.isSortedActive('nt_aggregatescore'), 0) }
                          { this.render_number(tax_info.NT.zscore, this.isSortedActive('nt_zscore'), 1) }
                          { this.render_number(tax_info.NT.rpm, this.isSortedActive('nt_rpm'), 1) }
                          { this.render_number(tax_info.NT.r, this.isSortedActive('nt_r'), 0) }
                          { this.render_number(tax_info.NT.percentidentity, this.isSortedActive('nt_percentidentity'), 1) }
                          { this.render_number(tax_info.NT.neglogevalue, this.isSortedActive('nt_neglogevalue'), 0) }
                          { this.render_number(tax_info.NT.percentconcordant, this.isSortedActive('nt_percentconcordant'), 1) }
                          { this.render_number(tax_info.NR.zscore, this.isSortedActive('nr_zscore'), 1) }
                          { this.render_number(tax_info.NR.rpm, this.isSortedActive('nr_rpm'), 1) }
                          { this.render_number(tax_info.NR.r, this.isSortedActive('nr_r'), 0) }
                          { this.render_number(tax_info.NR.percentidentity, this.isSortedActive('nr_percentidentity'), 1) }
                          { this.render_number(tax_info.NR.neglogevalue, this.isSortedActive('nr_neglogevalue'), 0) }
                          { this.render_number(tax_info.NR.percentconcordant, this.isSortedActive('nr_percentconcordant'), 1) }
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    const t1 = Date.now();
    return result;
  }
}
export default PipelineSampleReport;
