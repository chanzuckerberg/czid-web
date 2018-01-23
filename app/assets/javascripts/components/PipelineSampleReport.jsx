class PipelineSampleReport extends React.Component {

  constructor(props) {
    super(props);
    this.report_ts = props.report_ts
    this.sample_id = props.sample_id

    this.all_categories = props.all_categories
    this.report_details = props.report_details
    this.report_page_params = props.report_page_params
    this.all_backgrounds = props.all_backgrounds;
    this.max_rows_to_render = props.max_rows || 2000
    this.default_sort_by = this.report_page_params.sort_by.replace('highest_', '')
    this.sort_params = {}
    const filter_thresholds = Cookies.get('filter_thresholds')
    const cached_cats = Cookies.get('excluded_categories');

    this.state = {
      taxonomy_details:  [],
      search_keys_in_sample: [],
      lineage_map: {},
      genus_map: {},
      rows_passing_filters: 0,
      rows_total: 0,
      thresholded_taxons: [],
      selected_taxons: [],

      sort_by: this.default_sort_by,
      new_filter_thresholds: (filter_thresholds) ? JSON.parse(filter_thresholds) : { NT_aggregatescore: 0.0 },
        /*
        NT_zscore: 0.0,
        NT_rpm: 0.0,
        NT_r: 0.0,
        NT_percentidentity: 0.0,
        NT_neglogevalue: 0.0,
        NT_percentconcordant: 0.0,
        NR_zscore: 0.0,
        NR_rpm: 0.0,
        NR_r: 0.0,
        NR_percentidentity: 0.0,
        NR_neglogevalue: 0.0,
        NR_percentconcordant: 0.0,
      }
      */
      excluded_categories: (cached_cats) ? JSON.parse(cached_cats) : [],
      search_taxon_id: 0,
      loading: true
    };

    this.applySearchFilter = this.applySearchFilter.bind(this);
    this.applyThresholdFilters = this.applyThresholdFilters.bind(this);
    this.anyFilterSet = this.anyFilterSet.bind(this)
    this.resetAllFilters = this.resetAllFilters.bind(this)
    this.sortResults = this.sortResults.bind(this);
    this.sortCompareFunction = this.sortCompareFunction.bind(this);
    this.setSortParams = this.setSortParams.bind(this);
    this.flash = this.flash.bind(this);

    this.taxonPassThresholdFilter = this.taxonPassThresholdFilter.bind(this);
    this.expandOrCollapseGenus = this.expandOrCollapseGenus.bind(this);
    this.expandTable = this.expandTable.bind(this);
    this.collapseTable = this.collapseTable.bind(this);
    this.downloadFastaUrl = this.downloadFastaUrl.bind(this)

    this.handleThresholdEnter = this.handleThresholdEnter.bind(this);
    this.initializeTooltip();
  }

  componentWillMount() {
    this.fetchReportData();
    this.fetchSearchList();
  }

  componentDidMount() {
    this.listenThresholdChanges();
  }

  fetchSearchList() {
    axios.get(`/samples/${this.sample_id}/search_list?report_ts=${this.report_ts}`).then((res) => {
      let search_list = res.data.search_list
      search_list.splice(0, 0, ['All', 0])
      this.setState({
        lineage_map: res.data.lineage_map,
        search_keys_in_sample: search_list
       })
    });
  }

  fetchReportData() {
    Samples.showLoading('Loading results...');
    let params = `?${window.location.search.replace("?", "")}&report_ts=${this.report_ts}`;
    const cached_background_id = Cookies.get('background_id');
    if(cached_background_id) {
      params = params.indexOf('background_id=')
      < 0 ? `${params}&background_id=${cached_background_id}` : params;
    }
    axios.get(`/samples/${this.sample_id}/report_info${params}`).then((res) => {
      Samples.hideLoader();
      let genus_map = {}
      for (var i = 0; i < res.data.taxonomy_details[2].length; i++) {
        let taxon = res.data.taxonomy_details[2][i]
        if (taxon.genus_taxid == taxon.tax_id) {
          genus_map[taxon.genus_taxid] = taxon
        }
      }

      this.setState({
        rows_passing_filters: res.data.taxonomy_details[0],
        rows_total:  res.data.taxonomy_details[1],
        taxonomy_details: res.data.taxonomy_details[2],
        genus_map: genus_map
      });
      this.applyThresholdFilters(res.data.taxonomy_details[2], false)
    });
  }

  anyFilterSet() {
    if (this.state.search_taxon_id > 0 || this.state.excluded_categories.length > 0 || Object.keys(this.state.new_filter_thresholds).length > 0) {
      return true
    }
    return false
  }

  resetAllFilters() {
    this.setState({
      new_filter_thresholds: { },
      excluded_categories: [],
      search_taxon_id: 0,
      thresholded_taxons: this.state.taxonomy_details,
      selected_taxons: this.state.taxonomy_details,
      rows_passing_filters: this.state.taxonomy_details.length
    })
    Cookies.set('filter_thresholds', "{}")
    Cookies.set('excluded_categories', "[]")
    $(".metric-thresholds").val("");
    this.flash();
  }

  applySearchFilter(searchTaxonId, excludedCategories, input_taxons) {
    let selected_taxons = []
    let thresholded_taxons = input_taxons || this.state.thresholded_taxons
    if (searchTaxonId > 0) {
      //ignore all the thresholds
      genus_taxon = {}
      matched_taxons = []
      for (var i = 0; i < this.state.taxonomy_details.length; i++) {
        let taxon = this.state.taxonomy_details[i]
        if (taxon.genus_taxid == taxon.tax_id) {
          if (matched_taxons.length > 0) {
            selected_taxons.push(genus_taxon)
            selected_taxons = selected_taxons.concat(matched_taxons)
          }
          genus_taxon = taxon
          matched_taxons = []
        } else {
          // species
          match_keys = this.state.lineage_map[taxon.tax_id.toString()]
          if (match_keys && match_keys.indexOf(searchTaxonId) > -1) {
            matched_taxons.push(taxon)
          }
        }
      }
      if (matched_taxons.length > 0) {
        selected_taxons.push(genus_taxon)
        selected_taxons = selected_taxons.concat(matched_taxons)
      }
    } else if (excludedCategories.length > 0) {
      for (var i = 0; i < thresholded_taxons.length; i++) {
        let taxon = thresholded_taxons[i]
        if (excludedCategories.indexOf(taxon.category_name) < 0 ) {
          // not in the excluded categories
          selected_taxons.push(taxon)
        } else if (taxon.category_name == 'Uncategorized' && parseInt(taxon.tax_id) == -200) {
          //the 'All taxa without genus classification' taxon
          let uncat_taxon = taxon
          let filtered_children = []
          i++
          taxon = thresholded_taxons[i]
          while(taxon && taxon.genus_taxid == -200) {
            if (excludedCategories.indexOf(taxon.category_name) < 0 ) {
              filtered_children.push(taxon)
            }
            i++
            taxon = thresholded_taxons[i]
          }
          if (filtered_children.length  > 0) {
            selected_taxons.push(uncat_taxon)
            selected_taxons = selected_taxons.concat(filtered_children)
          }
          i--
        }
      }
    } else {
      selected_taxons = thresholded_taxons
    }

    //console.log(excludedCategories)
    this.setState({
      loading: false,
      excluded_categories: excludedCategories,
      search_taxon_id: searchTaxonId,
      thresholded_taxons: thresholded_taxons,
      selected_taxons: selected_taxons,
      rows_passing_filters: selected_taxons.length
    })
  }

  flash() {
    $(`.filter-message`).removeClass('flash')
    let el = document.getElementById('filter-message')
    if (el) {
      el.offsetHeight; /* trigger reflow */
    }
    $(`.filter-message`).addClass('flash')
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
        if(!isNaN(leftOffset)) {
          selectTooltip.css('left', leftOffset - 15);
        }
      });
    });
  }

  // applySort needs to be bound at time of use, not in constructor above
  // TODO(yf): fix this
  applySort(sort_by) {
    console.log(sort_by)
    if (sort_by.toLowerCase() != this.state.sort_by) {
      this.state.sort_by = sort_by.toLowerCase()
      this.sortResults();
    }
  }

  sortCompareFunction(a, b) {
    let [ptype, pmetric] = this.sortParams["primary"]
    let [stype, smetric] = this.sortParams["secondary"]
    genus_a = this.state.genus_map[a.genus_taxid]
    genus_b = this.state.genus_map[b.genus_taxid]

    genus_a_p_val = parseFloat(genus_a[ptype][pmetric])
    genus_a_s_val = parseFloat(genus_a[stype][smetric])
    a_p_val = parseFloat(a[ptype][pmetric])
    a_s_val = parseFloat(a[stype][smetric])

    genus_b_p_val = parseFloat(genus_b[ptype][pmetric])
    genus_b_s_val = parseFloat(genus_b[stype][smetric])
    b_p_val = parseFloat(b[ptype][pmetric])
    b_s_val = parseFloat(b[stype][smetric])
    // compared at genus level descending and then species level descending
    //
    //
    if (a.genus_taxid == b.genus_taxid) {
      //same genus
      if (a.tax_level > b.tax_level) {
        return -1
      } else if (a.tax_level < b.tax_level) {
        return 1
      } else {
        if (a_p_val > b_p_val) {
          return -1
        } else if (a_p_val < b_p_val ) {
          return 1
        } else {
          if (a_s_val > b_s_val) {
            return -1
          } else if (a_s_val < b_s_val) {
            return 1
          } else {
            return 0
          }
        }
      }
    } else {
      if (genus_a_p_val > genus_b_p_val) {
        return -1
      } else if (genus_a_p_val < genus_b_p_val ) {
        return 1
      } else {
        if (genus_a_s_val > genus_b_s_val) {
          return -1
        } else if (genus_a_s_val < genus_b_s_val) {
          return 1
        } else {
          if (a.genus_taxid < b.genus_taxid) {
            return -1
          } else if (a.genus_taxid > b.genus_taxid) {
            return 1
          }
        }
      }
    }
  }

  setSortParams() {
    let primary_sort = this.state.sort_by.split("_")
    primary_sort[0] = primary_sort[0].toUpperCase()
    let secondary_sort = this.default_sort_by.split("_")
    secondary_sort[0] = secondary_sort[0].toUpperCase()
    this.sortParams = {
      primary: primary_sort,
      secondary: secondary_sort
    }
  }

  sortResults() {
    this.setSortParams();
    let selected_taxons = this.state.selected_taxons
    selected_taxons = selected_taxons.sort(this.sortCompareFunction)
    this.setState({
      selecte_taxons: selected_taxons
    })
    this.state.thresholded_taxons = this.state.thresholded_taxons.sort(this.sortCompareFunction)
    this.state.taxonomy_details = this.state.taxonomy_details.sort(this.sortCompareFunction)
  }

  setFilterThreshold(e) {
    const threshold_name = e.target.id;
    const val = parseFloat(e.target.value.trim());
    if (isNaN(val)) {
      delete this.state.new_filter_thresholds[threshold_name]
    } else {
      this.state.new_filter_thresholds[threshold_name] = val;
    }
    Cookies.set('filter_thresholds', JSON.stringify(this.state.new_filter_thresholds))
  }

  taxonPassThresholdFilter(taxon) {
    //console.log(taxon)
    if (Object.keys(taxon).length <= 0) {
      return false;
    }
    for (var filter_key in this.state.new_filter_thresholds) {
      const threshold = this.state.new_filter_thresholds[filter_key]
      const key_parts = filter_key.split("_")
      val = (taxon[key_parts[0]] || {})[key_parts[1]]
      if (val < threshold) {
        //console.log([val, threshold, filter_key])
        return false;
      }
    }
    return true;
  }

  applyThresholdFilters(candidate_taxons, play_animation = true) {
    let thresholded_taxons = []
    genus_taxon = {}
    matched_taxons = []
    for (var i = 0; i < candidate_taxons.length; i++) {
      let taxon = candidate_taxons[i]
      if (taxon.genus_taxid == taxon.tax_id) {
        // genus
        if (matched_taxons.length > 0) {
          thresholded_taxons.push(genus_taxon)
          thresholded_taxons = thresholded_taxons.concat(matched_taxons)
        } else if (this.taxonPassThresholdFilter(genus_taxon)) {
          thresholded_taxons.push(genus_taxon)
        }
        genus_taxon = taxon
        matched_taxons = []
      } else {
        // species
        if (this.taxonPassThresholdFilter(taxon)) {
          matched_taxons.push(taxon)
        }
      }
    }

    if (matched_taxons.length > 0) {
      thresholded_taxons.push(genus_taxon)
      thresholded_taxons = thresholded_taxons.concat(matched_taxons)
    } else if (this.taxonPassThresholdFilter(genus_taxon)) {
      thresholded_taxons.push(genus_taxon)
    }

    this.applySearchFilter(0, this.state.excluded_categories, thresholded_taxons);

    if (play_animation) {
      this.flash()
    }
  }

  handleThresholdEnter(event) {
    if (event.keyCode == 13) {
      this.applyThresholdFilters(this.state.taxonomy_details);
    }
  }

  listenThresholdChanges() {
    $('.metric-thresholds').focusout((e) => {
      this.applyThresholdFilters(this.state.taxonomy_details);
    })
  }

  // Remove this after fix sorting
  refreshPage(overrides) {
    new_params = Object.assign({}, this.report_page_params, overrides);
    window.location = location.protocol + '//' + location.host + location.pathname + '?' + jQuery.param(new_params);
  }

  thresholdInputColumn(metric_token) {
    return (
      <input
        className='browser-default metric-thresholds'
        onChange={this.setFilterThreshold.bind(this)}
        onKeyDown={this.handleThresholdEnter}
        name="group2"
        defaultValue={this.state.new_filter_thresholds[metric_token]}
        id={metric_token}
        type="number" />
    );
  }


  //path to NCBI
  gotoNCBI(e) {
    const taxId = e.target.getAttribute('data-tax-id');
    const ncbiLink = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${taxId}`;
    window.open(ncbiLink, '_blank');
  }

  //download Fasta
  downloadFastaUrl(e) {
    const taxLevel = e.target.getAttribute('data-tax-level');
    const taxId = e.target.getAttribute('data-tax-id');
    location.href = `/samples/${this.sample_id}/fasta/${taxLevel}/${taxId}/NT_or_NR`;
  }

  displayTags(taxInfo, reportDetails) {
    return (
      <span className="link-tag">
        { taxInfo.tax_id > 0 ? <i data-tax-id={taxInfo.tax_id} onClick={this.gotoNCBI} className="fa fa-link cloud" aria-hidden="true"></i> : null }
        { reportDetails.taxon_fasta_flag ? <i data-tax-level={taxInfo.tax_level} data-tax-id={taxInfo.tax_id}
                                              onClick={this.downloadFastaUrl} className="fa fa-download cloud" aria-hidden="true"></i> : null }
      </span>
    )
  }

  category_to_adjective(category) {
    category_lowercase = category.toLowerCase()
    switch(category_lowercase) {
      case "bacteria":
        return "bacterial"
      case "archaea":
        return "archaeal"
      case "eukaryota":
        return "eukaryotic"
      case "viruses":
        return "viral"
      case "viroids":
        return "viroidal"
      case "uncategorized":
        return "uncategorized"
    }
    return category_lowercase
  }

  render_name(tax_info, report_details) {
    let foo = <i>{tax_info.name}</i>;
    if (tax_info.tax_id > 0) {
      if (report_details.taxon_fasta_flag) {
        foo = <span className="link"><a>{tax_info.name}</a></span>
      } else {
        foo = <span>{tax_info.name}</span>
      }
    }
    if (tax_info.tax_level == 1) {
      // indent species rows
      foo = <div className="hover-wrapper">
        <div className='species-name'>{foo}
          { this.displayTags(tax_info, report_details) }
        </div>
      </div>;
    } else {
      // emphasize genus, soften category and species count
      category_name = tax_info.tax_id == -200 ? '' : tax_info.category_name;
      fake_or_real = tax_info.genus_taxid < 0 ? 'fake-genus' : 'real-genus';
      right_arrow_initial_visibility = '';
      down_arrow_initial_visibility = 'hidden';
      plus_or_minus = <span>
        <span className={`report-arrow-down report-arrow ${tax_info.tax_id} ${fake_or_real} ${down_arrow_initial_visibility}`}>
          <i className={`fa fa-angle-down ${tax_info.tax_id}`} onClick={this.expandOrCollapseGenus}></i>
        </span>
        <span className={`report-arrow-right report-arrow ${tax_info.tax_id} ${fake_or_real} ${right_arrow_initial_visibility}`}>
          <i className={`fa fa-angle-right ${tax_info.tax_id}`} onClick={this.expandOrCollapseGenus}></i>
        </span>
      </span>;
      foo = <div className="hover-wrapper">
        <div className='genus-name'> {plus_or_minus} {foo}</div>
        <i className='count-info'>({tax_info.species_count} {this.category_to_adjective(category_name)} species)</i>
        { this.displayTags(tax_info, report_details) }
      </div>;
    }
    return foo;
  }

  render_number(x, emphasize, num_decimals) {
    const is_blank = (x == 0) || (x == -100);
    y = Number(x);
    y = y.toFixed(num_decimals);
    y = numberWithCommas(y);
    if (emphasize) {
      y = <b>{y}</b>;
    }
    className = is_blank ? 'report-number-blank' : 'report-number';
    return ( <td className={className}>{y}</td> );
  }

  render_sort_arrow(column, desired_sort_direction, arrow_direction) {
    desired_sort = column.toLowerCase();
    className = `fa fa-caret-${arrow_direction}`;
    current_sort = this.state.sort_by;
    if (current_sort == desired_sort) {
      className = 'active ' + className;
    }
    return (
      <i onClick={this.applySort.bind(this, column)}
         className={className}
         key = {desired_sort}>
      </i>
    );
  }

  render_column_header(visible_type, visible_metric, column_name, tooltip_message) {
    const style = { 'textAlign': 'left', 'cursor': 'pointer' };
    const report_column_threshold = this.thresholdInputColumn(column_name);
    return (
      <th style={style}>
        <div className='sort-controls left' rel='tooltip' title={tooltip_message}>
          {this.render_sort_arrow(column_name, 'highest', 'down')}
          {`${visible_type} `}
          {visible_metric}
        </div>
        <div className='sort-controls left' rel='tooltip' data-placement='bottom' title='Threshold'>
          {report_column_threshold}
        </div>
      </th>
    );
  }

  row_class(tax_info) {
    if (tax_info.tax_level == 2) {
      if (tax_info.tax_id < 0) {
        return `report-row-genus ${tax_info.genus_taxid} fake-genus`;
      } else {
        return `report-row-genus ${tax_info.genus_taxid} real-genus`;
      }
    }
    initial_visibility = 'hidden';
    if (tax_info.genus_taxid < 0) {
      return `report-row-species ${tax_info.genus_taxid} fake-genus ${initial_visibility}`;
    }
    return `report-row-species ${tax_info.genus_taxid} real-genus ${initial_visibility}`;
  }

  expandOrCollapseGenus(e) {
    // className as set in render_name() is like 'fa fa-angle-right ${taxId}'
    const className = e.target.attributes.class.nodeValue;
    const attr = className.split(' ');
    const taxId = attr[2];
    $(`.report-row-species.${taxId}`).toggleClass('hidden');
    $(`.report-arrow.${taxId}`).toggleClass('hidden');
  }

  expandTable(e) {
    // expand all real genera
    $(`.report-row-species.real-genus`).removeClass('hidden');
    $(`.report-arrow-down.real-genus`).removeClass('hidden');
    $(`.report-arrow-right.real-genus`).addClass('hidden');
    $(`.table-arrow`).toggleClass('hidden');
  }

  collapseTable(e) {
    // collapse all genera (real or negative)
    $(`.report-row-species`).addClass('hidden');
    $(`.report-arrow-down`).addClass('hidden');
    $(`.report-arrow-right`).removeClass('hidden');
    $(`.table-arrow`).toggleClass('hidden');
  }

  //Download report in csv
  downloadReport(id) {
    location.href = `/reports/${id}/csv`
  }

  render() {
    const parts = this.report_page_params.sort_by.split("_")
    const sort_column = parts[1] + "_" + parts[2];
    var t0 = Date.now();

    filter_stats = this.state.rows_passing_filters + ' rows passing filters, out of ' + this.state.rows_total + ' total rows.';
    disable_filter = this.anyFilterSet() ? (<span className="disable" onClick={(e) => this.refs.report_filter.resetAllFilters()}><b> Disable all filters</b></span> ) : null;
    filter_row_stats = this.state.loading ? null : (
      <div id="filter-message" className="filter-message">
        <span className="count">
          {filter_stats} {disable_filter}
        </span>
      </div>
    );
    report_filter =
      <ReportFilter ref="report_filter"
        all_categories = { this.all_categories }
        all_backgrounds = { this.all_backgrounds }
        search_keys_in_sample = {  this.state.search_keys_in_sample }
        background_model = { this.report_details.background_model }
        report_title = { this.report_details.sample_info.name }
        report_page_params = { this.report_page_params }
        applyExcludedCategories = { this.applyExcludedCategories }
        applySearchFilter = {this.applySearchFilter }
        flash = { this.flash }
        filter_row_stats = { filter_row_stats }
        enableFilters = { this.enableFilters }
        resetAllFilters = { this.resetAllFilters }
      />;
    download_button = (
      <a href={`/samples/${this.sample_id}/report_csv?background_id=${this.report_details.background_model.id}`} className="download-report right">
        <div className="fa fa-cloud-download"/>
        <div>Download report</div>
      </a>
    );
    right_arrow_initial_visibility = '';
    result = (
      <div>
        <div id="reports" className="reports-screen tab-screen col s12">
          <div className="tab-screen-content">
            <div className="row reports-container">
              <div className="col s2 reports-sidebar">
                {report_filter}
              </div>
              <div className="col s10 reports-section">
                <div className="reports-count">
                  { download_button }
                  { filter_row_stats }
                </div>
                <div className="reports-main">
                  <table id="report-table" className='bordered report-table'>
                    <thead>
                    <tr>
                      <th>
                        <span className={`table-arrow ${right_arrow_initial_visibility}`}>
                          <i className={`fa fa-angle-right`} onClick={this.expandTable}></i>
                        </span>
                        <span className={`table-arrow hidden`}>
                          <i className={`fa fa-angle-down`} onClick={this.collapseTable}></i>
                        </span>
                        Taxonomy
                      </th>
                        {this.render_column_header('', 'Score',  'NT_aggregatescore', 'Aggregate score') }
                        {this.render_column_header('NT', 'Z',   'NT_zscore', 'Z-score relative to background model for alignments to NCBI NT') }
                        {this.render_column_header('NT', 'rPM', 'NT_rpm', 'Number of reads aligning to the taxon in the NCBI NT database per million total input reads')}
                        {this.render_column_header('NT', 'r',   'NT_r', 'Number of reads aligning to the taxon in the NCBI NT database')}
                        {this.render_column_header('NT', '%id', 'NT_percentidentity', 'Average percent-identity of alignments to NCBI NT')}
                        {this.render_column_header('NT', 'log(1/E)',  'NT_neglogevalue', 'Average log-10-transformed expect value for alignments to NCBI NT')}
                        {this.render_column_header('NT', '%conc',  'NT_percentconcordant', 'Percentage of aligned reads belonging to a concordantly mappped pair (NCBI NT)')}
                        {this.render_column_header('NR', 'Z',   'NR_zscore', 'Z-score relative to background model for alignments to NCBI NR') }
                        {this.render_column_header('NR', 'rPM', 'NR_rpm', 'Number of reads aligning to the taxon in the NCBI NR database per million total input reads')}
                        {this.render_column_header('NR', 'r',   'NR_r', 'Number of reads aligning to the taxon in the NCBI NR database')}
                        {this.render_column_header('NR', '%id', 'NR_percentidentity', 'Average percent-identity of alignments to NCBI NR')}
                        {this.render_column_header('NR', 'log(1/E)',  'NR_neglogevalue', 'Average log-10-transformed expect value for alignments to NCBI NR')}
                        {this.render_column_header('NR', '%conc',  'NR_percentconcordant', 'Percentage of aligned reads belonging to a concordantly mappped pair (NCBI NR)')}
                    </tr>
                    </thead>
                    <tbody>
                    { this.state.selected_taxons.slice(0, this.max_rows_to_render).map((tax_info, i) => {
                      return (
                        <tr key={tax_info.tax_id} className={this.row_class(tax_info)}>
                          <td>
                            { this.render_name(tax_info, this.report_details) }
                          </td>
                          { this.render_number(tax_info.NT.aggregatescore, sort_column == 'nt_aggregatescore', 0) }
                          { this.render_number(tax_info.NT.zscore, sort_column == 'nt_zscore', 1) }
                          { this.render_number(tax_info.NT.rpm, sort_column == 'nt_rpm', 1)       }
                          { this.render_number(tax_info.NT.r, sort_column == 'nt_r', 0)           }
                          { this.render_number(tax_info.NT.percentidentity, sort_column == 'nt_percentidentity', 1) }
                          { this.render_number(tax_info.NT.neglogevalue, sort_column == 'nt_neglogevalue', 0) }
                          { this.render_number(tax_info.NT.percentconcordant, sort_column == 'nt_percentconcordant', 1) }
                          { this.render_number(tax_info.NR.zscore, sort_column == 'nr_zscore', 1) }
                          { this.render_number(tax_info.NR.rpm, sort_column == 'nr_rpm', 1)       }
                          { this.render_number(tax_info.NR.r, sort_column == 'nr_r', 0)           }
                          { this.render_number(tax_info.NR.percentidentity, sort_column == 'nr_percentidentity', 1) }
                          { this.render_number(tax_info.NR.neglogevalue, sort_column == 'nr_neglogevalue', 0) }
                          { this.render_number(tax_info.NR.percentconcordant, sort_column == 'nr_percentconcordant', 1) }
                        </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    t1 = Date.now();
    // console.log(`Table render took ${t1 - t0} milliseconds.`);
    return result;
  }
}
