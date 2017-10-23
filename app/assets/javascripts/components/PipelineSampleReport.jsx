class PipelineSampleReport extends React.Component {

  constructor(props) {
    super(props);
    this.report_details = props.report_details;
    this.taxonomy_details = props.taxonomy_details;
    this.all_categories = props.all_categories || [];

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
    $('ul.tabs').tabs();
    $('.sort-report').dropdown();
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

  render_name(tax_info) {
    foo = (tax_info.tax_id > 0)
      ? <span className="link">
          <a href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${
            tax_info.tax_id}`}>{tax_info.name || tax_info.tax_id}
          </a>
        </span>
      : <span>
          {tax_info.name || 'Placeholder ' + tax_info.tax_id}
        </span>;
        /*
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{tax_info.genus_name || (tax_info.genus_taxid > 0 ? tax_info.genus_taxid : '-')}] <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        */
    foo = (tax_info.tax_id == tax_info.genus_taxid) ? <b>{foo}</b> : <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{foo}</span>
    return foo;
  }

  render_count(x) {
    return numberWithCommas(Number(x))
  }

  render_float(x) {
    return numberWithCommas(Number(x).toFixed(3))
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
                  background_model = {this.report_details.background_model.name}
                  report_title = { this.report_details.report_info.name }
                  view_level={this.view_level}
                  highest_tax_counts={this.highest_tax_counts}/>
              </div>
              <div className="col s10 reports-main ">
                <table id="report-table" className='bordered report-table'>
                  <thead>
                  <tr>
                    <th>Category</th>
                    <th>Taxonomy</th>
                    <th></th>
                    <th>
                    NT Z
                    <div className='sort-controls  left'>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_genus_nt_zscore')} fa fa-caret-up sort_by=lowest_genus_nt_zscore` }></i>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_genus_nt_zscore')} fa fa-caret-down sort_by=highest_genus_nt_zscore` }></i>
                    </div>

                    </th>
                    <th>
                    NT rM
                     <div className='sort-controls left'>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_genus_nt_rpm')} fa fa-caret-up sort_by=lowest_genus_nt_rpm` }></i>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_genus_nt_rpm')} fa fa-caret-down sort_by=highest_genus_nt_rpm` }></i>
                    </div>
                    </th>
                    <th>
                     NT r
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th>
                    <th>
                    NR Z
                     <div className='sort-controls left'>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_genus_nr_zscore')} fa fa-caret-up sort_by=lowest_genus_nr_zscore` }></i>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_genus_nr_zscore')} fa fa-caret-down sort_by=highest_genus_nr_zscore` }></i>
                    </div>
                    </th>
                    <th>
                    NR rM
                     <div className='sort-controls left'>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('lowest_genus_nr_rpm')} fa fa-caret-up sort_by=lowest_genus_nr_rpm` }></i>
                      <i onClick={ this.columnSorting } className={ `${this.getActiveSort('highest_genus_nr_rpm')} fa fa-caret-down sort_by=highest_genus_nr_rpm` }></i>
                    </div>
                    </th>
                    <th>
                     NR r
                      <div className='sort-controls left'>
                        <i className='fa fa-caret-up'></i>
                        <i className='fa fa-caret-down'></i>
                      </div>
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                  { this.taxonomy_details.map((tax_info, i) => {
                    return (
                      <tr key={i}>
                        <td>
                          {  tax_info.category_name || '-' }
                        </td>

                        <td>
                          { this.render_name(tax_info) }
                        </td>
                        <td>
                        </td>

                        {/* The genus scores */}

                        <td>{ this.render_float(tax_info.NT.zscore) }</td>
                        <td>{ this.render_float(tax_info.NT.rpm)    }</td>
                        <td>{ this.render_count(tax_info.NT.r)      }</td>
                        <td>{ this.render_float(tax_info.NR.zscore) }</td>
                        <td>{ this.render_float(tax_info.NR.rpm)    }</td>
                        <td>{ this.render_count(tax_info.NR.r)      }</td>

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
