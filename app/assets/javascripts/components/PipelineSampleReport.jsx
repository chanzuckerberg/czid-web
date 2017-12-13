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
    this.state = {
      taxonomy_details:  [],
      all_genera_in_sample: [],
      rows_passing_filters: 0,
      rows_total: 0,
      loading: true
    };

    this.fetchReportData();
    this.applyNewFilterThresholds = this.applyNewFilterThresholds.bind(this);
    this.applyExcludedCategories = this.applyExcludedCategories.bind(this);
    this.applyGenusFilter = this.applyGenusFilter.bind(this);
    this.expandOrCollapseGenus = this.expandOrCollapseGenus.bind(this);
    this.expandTable = this.expandTable.bind(this);
    this.collapseTable = this.collapseTable.bind(this);
    this.disableFilters = this.disableFilters.bind(this);
    this.enableFilters = this.enableFilters.bind(this);
    this.new_filter_thresholds = {};
    this.applyFilters = this.applyFilters.bind(this);
    this.handleThresholdEnter = this.handleThresholdEnter.bind(this);
    this.initializeTooltip();
  }

  fetchReportData() {
    const params = `?${window.location.search.replace("?", "")}&report_ts=${this.report_ts}`
    console.log(params)
    axios.get(`/samples/${this.sample_id}/report_info${params}`).then((res) => {

      let all_genera_in_sample = res.data.all_genera_in_sample
      all_genera_in_sample.splice(0, 0, 'None')
      this.setState({
        rows_passing_filters: res.data.taxonomy_details[0],
        rows_total:  res.data.taxonomy_details[1],
        taxonomy_details:  res.data.taxonomy_details[2],
        all_genera_in_sample: all_genera_in_sample,
        loading: false
      });
    });
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

  refreshPage(overrides) {
    new_params = Object.assign({}, this.report_page_params, overrides);
    window.location = location.protocol + '//' + location.host + location.pathname + '?' + jQuery.param(new_params);
  }

  disableFilters() {
    disable_filters = 1;
    ReportFilter.showLoading('Disabling filters...');
    this.refreshPage({disable_filters});
  }

  enableFilters() {
    disable_filters = 0;
    ReportFilter.showLoading('Enabling filters...');
    this.refreshPage({disable_filters});
  }

  // applySort needs to be bound at time of use, not in constructor above
  applySort(sort_by) {
    const regex = new RegExp('_', 'g');
    ReportFilter.showLoading(`Sorting the table by ${sort_by.replace(regex, ' ')}...`);
    this.refreshPage({sort_by});
  }

  setFilterThreshold(threshold_name, event) {
    this.new_filter_thresholds[threshold_name] = event.target.value.trim();
    $('.apply-filter-button a').addClass('changed');
  }

  applyFilters(event) {
    ReportFilter.showLoading('Applying thresholds...');
    this.applyNewFilterThresholds(this.new_filter_thresholds);
  }

  handleThresholdEnter(event) {
    if (event.keyCode == 13) {
      this.applyFilters();
    }
  }

  applyNewFilterThresholds(new_filter_thresholds) {
    this.refreshPage(new_filter_thresholds);
  }

  thresholdInputColumn(metric_token) {
    return (
      <input
        className='browser-default'
        onChange={this.setFilterThreshold.bind(this, `threshold_${metric_token}`)}
        onKeyDown={this.handleThresholdEnter}
        name="group2"
        defaultValue={this.props.report_page_params[`threshold_${metric_token}`]}
        id={`threshold_${metric_token}`}
        type="number" />
    );
  }

  thresholdFilterButton() {
    return (
      <td>
        <a onClick={this.applyFilters}
           className="btn btn-flat waves-effect grey text-grey text-lighten-5 waves-light apply-filter-button">
        Apply threshold
        </a>
      </td>
    );
  }

  applyExcludedCategories(category, checked) {
    excluded_categories = "" + this.report_page_params.excluded_categories;
    if (checked) {
      // remove from excluded_categories
      excluded_categories = excluded_categories.split(",").filter(c => c != category).join(",");
    } else {
      // add to excluded_categories
      excluded_categories = excluded_categories + "," + category;
    }
    this.refreshPage({excluded_categories});
  }

  applyGenusFilter(selected_genus) {
    this.refreshPage({selected_genus});
  }

  isGenusSearch() {
    params = this.report_page_params;
    return params.selected_genus != 'None' && params.disable_filters != 1;
  }

  //path to NCBI
  gotoNCBI(e) {
    const taxId = e.target.getAttribute('data-tax-id');
    const ncbiLink = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${taxId}`;
    window.open(ncbiLink, '_blank');
  }

  //download Fasta
  downloadFastaUrl(e) {
    const pipelineId = e.target.getAttribute('data-pipeline-id');
    const taxLevel = e.target.getAttribute('data-tax-level');
    const taxId = e.target.getAttribute('data-tax-id');
    location.href = `/pipeline_outputs/${pipelineId}/fasta/${taxLevel}/${taxId}/NT_or_NR`;
  }

  displayTags(taxInfo, reportDetails) {
    return (
      <span className="link-tag">
        { taxInfo.tax_id > 0 ? <i data-tax-id={taxInfo.tax_id} onClick={this.gotoNCBI} className="fa fa-link cloud" aria-hidden="true"></i> : null }
        { reportDetails.taxon_fasta_flag ? <i data-pipeline-id={reportDetails.pipeline_info.id}
                                              data-tax-level={taxInfo.tax_level} data-tax-id={taxInfo.tax_id}
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
      // Most groups are initially expanded, so they get a toggle with fa-minus initial state.
      fake_or_real = tax_info.genus_taxid < 0 ? 'fake-genus' : 'real-genus';
      right_arrow_initial_visibility = this.isGenusSearch() ? 'hidden' : '';
      down_arrow_initial_visibility = this.isGenusSearch() ? '' : 'hidden';
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
    desired_sort = desired_sort_direction + "_" + column;
    className = `fa fa-caret-${arrow_direction}`;
    current_sort = this.report_page_params.sort_by;
    if (current_sort == desired_sort) {
      className = 'active ' + className;
    }
    return (
      <i onClick={this.applySort.bind(this, desired_sort)}
         className={className}
         key = {desired_sort}>
      </i>
    );
  }

  render_column_header(visible_type, visible_metric, column_name, tooltip_message) {
    var style = { 'textAlign': 'right', 'cursor': 'pointer' };
    report_column_threshold = this.thresholdInputColumn(column_name)
    return (
      <th style={style}>
        <div className='sort-controls right' rel='tooltip' title={tooltip_message}>
          {this.render_sort_arrow(column_name, 'lowest', 'up')}
          {this.render_sort_arrow(column_name, 'highest', 'down')}
          {visible_type}<br/>
          {visible_metric}<br/>
        </div>
        <div className='sort-controls right' rel='tooltip' data-placement='bottom' title='Threshold'>
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
    initial_visibility = this.isGenusSearch() ? '' : 'hidden';
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
    if (this.report_page_params.disable_filters == 1) {
      filter_stats = this.state.rows_total + ' unfiltered rows.';
    }
    filter_row_stats = this.state.loading ? null : (
      <div>
        <span className="count">
          {this.state.rows_passing_filters == this.state.taxonomy_details.length ?
            (filter_stats) :
            ('Due to resource limits, showing only ' + this.state.taxonomy_details.length + ' of the ' + filter_stats)}
        </span>
      </div>
    );
    report_filter =
      <ReportFilter
        all_categories = { this.all_categories }
        all_backgrounds = { this.all_backgrounds }
        all_genera_in_sample = {  this.state.all_genera_in_sample }
        background_model = { this.report_details.background_model }
        report_title = { this.report_details.report_info.name }
        report_page_params = { this.report_page_params }
        applyExcludedCategories = { this.applyExcludedCategories }
        applyGenusFilter = { this.applyGenusFilter }
        enableFilters = { this.enableFilters }
      />;
    // To do: improve presentation and place download_button somewhere on report page
    download_button = (
      <a href={`/reports/${this.report_details.report_info.id}/csv`} className="download-report right">
        <div className="fa fa-cloud-download"/>
        <div>Download report</div>
      </a>
    );
    right_arrow_initial_visibility = this.isGenusSearch() ? 'hidden' : '';
    result = (
      <div>
        <div id="reports" className="reports-screen tab-screen col s12">
          <div className="tab-screen-content">
            <div className="row">
              <div className="col s2 reports-sidebar">
                {report_filter}
              </div>
              <div className="col s10 reports-section">
                <div className="reports-count">
                  { download_button }
                  { filter_row_stats }
                </div>
                <div className="row reports-main ">
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
                        {this.render_column_header('NT+NR', 'ZZRPM',  'nt_aggregatescore', 'Aggregate score') }
                        {this.render_column_header('NT', 'Z',   'nt_zscore', 'Z-score relative to background model for alignments to NCBI NT') }
                        {this.render_column_header('NT', 'rPM', 'nt_rpm', 'Number of reads aligning to the taxon in the NCBI NT database per million total input reads')}
                        {this.render_column_header('NT', 'r',   'nt_r', 'Number of reads aligning to the taxon in the NCBI NT database')}
                        {this.render_column_header('NT', '%id', 'nt_percentidentity', 'Average percent-identity of alignments to NCBI NT')}
                        {this.render_column_header('NT', 'Log(1/E)',  'nt_neglogevalue', 'Average log-10-transformed expect value for alignments to NCBI NT')}
                        {this.render_column_header('NT', '%conc',  'nt_percentconcordant', 'Percentage of aligned reads belonging to a concordantly mappped pair (NCBI NT)')}
                        {this.render_column_header('NR', 'Z',   'nr_zscore', 'Z-score relative to background model for alignments to NCBI NR') }
                        {this.render_column_header('NR', 'rPM', 'nr_rpm', 'Number of reads aligning to the taxon in the NCBI NR database per million total input reads')}
                        {this.render_column_header('NR', 'r',   'nr_r', 'Number of reads aligning to the taxon in the NCBI NR database')}
                        {this.render_column_header('NR', '%id', 'nr_percentidentity', 'Average percent-identity of alignments to NCBI NR')}
                        {this.render_column_header('NR', 'Log(1/E)',  'nr_neglogevalue', 'Average log-10-transformed expect value for alignments to NCBI NR')}
                        {this.render_column_header('NR', '%conc',  'nr_percentconcordant', 'Percentage of aligned reads belonging to a concordantly mappped pair (NCBI NR)')}
                    </tr>
                    </thead>
                    <tbody>
                    { this.state.loading ? (<div>Loading results.. </div>) : (this.state.taxonomy_details.slice(0, this.max_rows_to_render).map((tax_info, i) => {
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
                    }))}
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
