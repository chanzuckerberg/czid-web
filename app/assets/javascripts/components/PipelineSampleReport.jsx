class PipelineSampleReport extends React.Component {

  constructor(props) {
    super(props);
    this.report_details = props.report_details;
    this.taxonomy_details = props.taxonomy_details;
    this.all_categories = props.all_categories || [];
    this.checked_categories = props.checked_categories || props.all_categories
    this.pipeline_output_id = props.report_details.pipeline_info.id;
    this.genus_info = props.genus_info
    this.sample_id = props.sample_id

    this.view_level = ReportFilter.getFilter('view_level') || 'species';
    this.highest_tax_counts = props.highest_tax_counts;
    this.defaultSortBy = 'highest_species_nt_zscore';
    const current_sort = PipelineSampleReport.currentSort();
    this.state = {
      sort_query: current_sort.sort_query
        ? current_sort.sort_query  : `sort_by=${this.defaultSortBy}`
    };
    this.applySort = this.applySort.bind(this);
    this.columnSorting = this.columnSorting.bind(this);
  }

  static uppCaseFirst(name) {
    return (name)? name.charAt(0).toUpperCase() + name.slice(1) : name;
  }

  static currentSort() {
   const sort_by = ReportFilter.getFilter('sort_by');
   let current_sort = {};
   if(sort_by) {
     current_sort = {
       sort_query: `sort_by=${sort_by}`
     }
   }
   return current_sort;
  }

  applySort(sort_query) {
    this.setState({ sort_query });
    const url = PipelineSampleReport.deleteUrlParam(window.location.href, 'sort_by');
    window.location = (PipelineSampleReport.hasQuery(url))
      ? `${url}&${sort_query}` : `${url}?${sort_query}`;
  }

  static deleteUrlParam(url, parameter) {
    const queryString = url.split('?');
    if (queryString.length >= 2) {
      const prefix = encodeURIComponent(parameter)+'=';
      const pars = queryString[1].split(/[&;]/g);
      for (let i = pars.length; i--; i > 0) {
        if (pars[i].lastIndexOf(prefix, 0) !== -1) {
          pars.splice(i, 1);
        }
      }
      url = queryString[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
      return url;
    } else {
      return url;
    }
  }

  static hasQuery(url) {
    return (url.split('?').length >= 2);
  }

  componentDidMount() {
    // temporal hack to adjust the width of the table, better to use flexbox in the future
    if (this.view_level === 'species') {
      $('#report-table thead tr th').css('width', '9%');
    } else {
       $('#report-table thead tr th').css('width', 'inherit');
    }
    $('ul.tabs').tabs();
  }

  getActiveSort(className) {
    if(className) {
      const sort = ReportFilter.getFilter('sort_by');
      if (sort === className) {
        return 'active';
      } else if (className === this.defaultSortBy && !sort) {
        return 'active';
      }
    }
  }

  columnSorting(e) {
    const className = e.target.className;
    const pos = className.indexOf('sort_by');
    const sort_query = className.substr(pos);
    this.applySort(sort_query);
  }

  render() {
    return (
      <div>
        <div id="reports" className="reports-screen tab-screen col s12">
          <div className="tab-screen-content">
            <div className="row">
              <div className="col s2">
                <ReportFilter
                  all_categories = { this.all_categories }
                  checked_categories = { this.checked_categories }
                  background_model = {this.report_details.background_model.name}
                  report_title = { this.report_details.report_info.name }
                  view_level={this.view_level}
                  highest_tax_counts={this.highest_tax_counts}
                  sample_id = {this.sample_id}
                  genus_info = {this.genus_info} />
              </div>
              <div className="col s10 reports-main ">
                <table id="report-table" className='bordered report-table'>
                  <thead>
                  <tr>
                    <th>Category</th>
                    <th>Genus</th>
                    <th>{ (this.view_level==='species') ? 'Species' : '' }</th>
                    <th>
                    NT Genus Z
                    <div className='sort-controls  left'>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_genus_nt_zscore')} fa fa-caret-up sort_by=lowest_genus_nt_zscore` }></i>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_genus_nt_zscore')} fa fa-caret-down sort_by=highest_genus_nt_zscore` }></i>
                    </div>

                    </th>
                    <th>
                    NT Genus rM
                     <div className='sort-controls left'>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_genus_nt_rpm')} fa fa-caret-up sort_by=lowest_genus_nt_rpm` }></i>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_genus_nt_rpm')} fa fa-caret-down sort_by=highest_genus_nt_rpm` }></i>
                    </div>
                    </th>
                    <th>
                     NT Genus r
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th>
                    <th>
                     NT Genus %id
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th>
                    <th>
                     NT Genus L
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th>
                    <th>
                     NT Genus e
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th>
                    <th>
                    NR Genus Z
                     <div className='sort-controls left'>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_genus_nr_zscore')} fa fa-caret-up sort_by=lowest_genus_nr_zscore` }></i>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_genus_nr_zscore')} fa fa-caret-down sort_by=highest_genus_nr_zscore` }></i>
                    </div>
                    </th>
                    <th>
                    NR Genus rM
                     <div className='sort-controls left'>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_genus_nr_rpm')} fa fa-caret-up sort_by=lowest_genus_nr_rpm` }></i>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_genus_nr_rpm')} fa fa-caret-down sort_by=highest_genus_nr_rpm` }></i>
                    </div>
                    </th>
                    <th>
                     NR Genus r
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th>

                    {/*The Genus and Species diff*/}
                    { (this.view_level === 'species') ?
                    <th>
                      NT Species Z
                      <div className='sort-controls left'>
                        <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_species_nt_zscore')} fa fa-caret-up sort_by=lowest_species_nt_zscore` }></i>
                        <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_species_nt_zscore')} fa fa-caret-down sort_by=highest_species_nt_zscore` }></i>
                      </div>
                    </th> : '' }
                    { (this.view_level === 'species') ?
                    <th>
                      NT Species rM
                      <div className='sort-controls left'>
                        <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_species_nt_rpm')} fa fa-caret-up sort_by=lowest_species_nt_rpm` }></i>
                        <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_species_nt_rpm')} fa fa-caret-down sort_by=highest_species_nt_rpm` }></i>
                      </div>
                    </th> : '' }

                    { (this.view_level === 'species') ?
                    <th>NT Species r
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th> : '' }

                    { (this.view_level === 'species') ?
                    <th>
                     NT Species %id
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th> : '' }
                    { (this.view_level === 'species') ?
                    <th>
                     NT Species L
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th> : '' }
                    { (this.view_level === 'species') ?
                    <th>
                     NT Species e
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th> : '' }


                    { (this.view_level === 'species') ?
                    <th>NR Species Z
                      <div className='sort-controls left'>
                        <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_species_nr_zscore')} fa fa-caret-up sort_by=lowest_species_nr_zscore` }></i>
                        <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_species_nr_zscore')} fa fa-caret-down sort_by=highest_species_nr_zscore` }></i>
                      </div>
                    </th> : '' }
                    { (this.view_level === 'species') ?
                    <th>NR Species rM
                      <div className='sort-controls left'>
                        <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_species_nr_rpm')} fa fa-caret-up sort_by=lowest_species_nr_rpm` }></i>
                        <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_species_nr_rpm')} fa fa-caret-down sort_by=highest_species_nr_rpm` }></i>
                      </div>
                    </th> : '' }

                    { (this.view_level === 'species') ?
                    <th>NR Species r
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th> : '' }
 
                    { (this.view_level === 'species') ?
                    <th>Aggregate Score
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th> : '' }

                  </tr>
                  </thead>
                  <tbody>
                  { this.taxonomy_details.map((taxon, i) => {
                    return (
                      <tr key={i}>
                        <td>
                          {  taxon.category || '-' }
                        </td>

                        <td>
                          { (taxon.genus_nt_ele) ?
                             <span className="link">
                               <a href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${
                                 taxon.genus_nt_ele.tax_id}`}>{ taxon.genus_nt_ele.name }
                               </a>
                             </span> : 'N/A'
                          }
                        </td>
                        <td>
                          { (this.view_level==='species' && taxon.nt_ele) ?
                            <span className="link">
                              <a href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${
                                 taxon.nt_ele.tax_id}`}>{ taxon.nt_ele.name }</a>
                            </span> : ''
                          }
                        </td>

                        {/* The genus scores */}

                        <td>{ (!taxon.genus_nt_ele) ? '-': numberWithCommas(Number(taxon.genus_nt_ele.zscore).toFixed(3))}</td>
                        <td>{ (!taxon.genus_nt_ele) ? '-': numberWithCommas(Number(taxon.genus_nt_ele.rpm).toFixed(3))}</td>
                        <td>{ (!taxon.genus_nt_ele) ? '-': numberWithCommas(taxon.genus_nt_ele.count)}</td>
                        <td>{ (!taxon.genus_nt_ele) ? '-': numberWithCommas(Number(taxon.genus_nt_ele.percent_identity).toFixed(3))}</td>
                        <td>{ (!taxon.genus_nt_ele) ? '-': numberWithCommas(Number(taxon.genus_nt_ele.alignment_length).toFixed(3))}</td>
                        <td>{ (!taxon.genus_nt_ele) ? '-': numberWithCommas(Number(taxon.genus_nt_ele.e_value).toFixed(3))}</td>
                        <td>{ (!taxon.genus_nr_ele) ? '-': numberWithCommas(Number(taxon.genus_nr_ele.zscore).toFixed(3))}</td>
                        <td>{ (!taxon.genus_nr_ele) ? '-': numberWithCommas(Number(taxon.genus_nr_ele.rpm).toFixed(3))}</td>
                        <td>{ (!taxon.genus_nr_ele) ? '-': numberWithCommas(taxon.genus_nr_ele.count)}</td>

                        {/*The species scores*/}

                        <td>
                          { (this.view_level=== 'species' && (taxon.nt_ele && taxon.nt_ele.hasOwnProperty('zscore'))) ? numberWithCommas(Number(taxon.nt_ele.zscore).toFixed(3)) : '' }
                        </td>

                        <td>
                          { (this.view_level==='species' && (taxon.nt_ele && taxon.nt_ele.hasOwnProperty('rpm'))) ? numberWithCommas(Number(taxon.nt_ele.rpm).toFixed(3)) : '' }
                        </td>

                        <td>
                          { (this.view_level==='species' && (taxon.nt_ele && taxon.nt_ele.hasOwnProperty('count')) ) ? 
                            <span className="link">
                              <a href={`/pipeline_outputs/${this.pipeline_output_id}/${taxon.nt_ele.tax_id}/fasta/NT`}>{ numberWithCommas(taxon.nt_ele.count) }</a>
                            </span> : '' }
                        </td>

                        <td>
                          { (this.view_level==='species' && (taxon.nt_ele && taxon.nt_ele.hasOwnProperty('percent_identity'))) ? numberWithCommas(Number(taxon.nt_ele.percent_identity).toFixed(3)) : '' }
                        </td>

                        <td>
                          { (this.view_level==='species' && (taxon.nt_ele && taxon.nt_ele.hasOwnProperty('alignment_length')) ) ? numberWithCommas(Number(taxon.nt_ele.alignment_length).toFixed(3)) : '' }
                        </td>

                        <td>
                          { (this.view_level==='species' && (taxon.nt_ele && taxon.nt_ele.hasOwnProperty('e_value')) ) ? numberWithCommas(Number(taxon.nt_ele.e_value).toFixed(3)) : '' }
                        </td>

                        <td>
                          { (this.view_level==='species' && (taxon.nr_ele && taxon.nr_ele.hasOwnProperty('zscore'))) ? numberWithCommas(Number(taxon.nr_ele.zscore).toFixed(3)) : '' }
                        </td>

                        <td>
                          { (this.view_level==='species' && (taxon.nr_ele && taxon.nr_ele.hasOwnProperty('rpm')) ) ? numberWithCommas(Number(taxon.nr_ele.rpm).toFixed(3)) : '' }
                        </td>

                        <td>
                          { (this.view_level==='species' && (taxon.nr_ele && taxon.nr_ele.hasOwnProperty('count')) ) ?
                            <span className="link">
                              <a href={`/pipeline_outputs/${this.pipeline_output_id}/${taxon.nr_ele.tax_id}/fasta/NR`}>{ numberWithCommas(taxon.nr_ele.count) }</a>
                            </span> : '' }
                        </td>

                        <td>
                          { (this.view_level==='species' && taxon.aggregate_score) ?
                            <span className="link">
                              <a href={`/pipeline_outputs/${this.pipeline_output_id}/${taxon.nr_ele.tax_id}/fasta/NT_or_NR`}>{ numberWithCommas(Number(taxon.aggregate_score).toFixed(3)) }</a>
                            </span> : '' }
                        </td>

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
    )
  }
}
