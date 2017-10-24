class PipelineSampleReport extends React.Component {

  constructor(props) {
    super(props);
    this.report_details = props.report_details;
    this.taxonomy_details = props.taxonomy_details;
    this.all_categories = props.all_categories || [];

    this.view_level = ReportFilter.getFilter('view_level') || 'species';
    this.highest_tax_counts = props.highest_tax_counts;
    this.defaultSortBy = 'highest_nt_zscore';
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
    if (tax_info.tax_level == 1) {
      // indent species rows
      foo = <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{foo}</span>
    } else {
      // boldface genus
      foo = <b>{foo}</b>
    }
    return foo;
  }

  render_number(x, emphasize) {
    const is_blank = (x == 0) || (x == -100);
    y = numberWithCommas(x);
    if (emphasize) {
      y = <b>{y}</b>;
    }
    className = is_blank ? 'report-number-blank' : 'report-number';
    return ( <td className={className}>{y}</td> );
  }

  render_sort_arrow(column, sort_column, sort_direction, arrow_direction) {
    sort_by_this = sort_direction + "_" + column;
    sort_by_this_active = (sort_column == sort_by_this) ? 'active' : '';
    return (
      <i onClick={ this.columnSorting }
         className={ `${sort_by_this_active} fa fa-caret-${arrow_direction} sort_by=${sort_by_this}` }>
      </i>
    );
  }

  render_column_header(visible_type, visible_metric, column_name) {
    var sort_column = this.sort_column();
    var style = { 'textAlign': 'right' };
    return (
      <th style={style}>
        <div className='sort-controls right'>
          {this.render_sort_arrow(column_name, sort_column, 'lowest', 'up')}
          {this.render_sort_arrow(column_name, sort_column, 'highest', 'down')}
          {visible_type}&nbsp;{visible_metric}
        </div>
      </th>
    );
  }

  row_class(tax_info) {
    return tax_info.tax_level == 2 ? 'report-row-genus' : 'report-row-species';
  }

  sort_column() {
    return (ReportFilter.getFilter('sort_by') || this.defaultSortBy);
  }

  render() {
    const sort_column = this.sort_column()
    const parts = sort_column.split("_")
    const sort_by = parts[1] + "_" + parts[2];
    console.log("Start table render.");
    var t0 = Date.now();
    result = (
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
                    <th></th>
                    <th>Taxonomy</th>
                    { this.render_column_header('NT', 'Z',   'nt_zscore') }
                    { this.render_column_header('NT', 'rPM', 'nt_rpm')    }
                    { this.render_column_header('NT', 'r',   'nt_r')      }
                    { this.render_column_header('NR', 'Z',   'nr_zscore') }
                    { this.render_column_header('NR', 'rPM', 'nr_rpm')    }
                    { this.render_column_header('NR', 'r',   'nr_r')      }
                  </tr>
                  </thead>
                  <tbody>
                  { this.taxonomy_details.map((tax_info, i) => {
                    return (
                      <tr key={i} className={this.row_class(tax_info)}>
                        <td>
                          {  tax_info.category_name }
                        </td>
                        <td>
                        </td>
                        <td>
                          { this.render_name(tax_info) }
                        </td>
                        { this.render_number(tax_info.NT.zscore, sort_by == 'nt_zscore') }
                        { this.render_number(tax_info.NT.rpm, sort_by == 'nt_rpm')       }
                        { this.render_number(tax_info.NT.r, sort_by == 'nt_r')           }
                        { this.render_number(tax_info.NR.zscore, sort_by == 'nr_zscore') }
                        { this.render_number(tax_info.NR.rpm, sort_by == 'nr_rpm')       }
                        { this.render_number(tax_info.NR.r, sort_by == 'nr_r')           }
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
    );
    t1 = Date.now();
    console.log(`End table render after ${t1 - t0} milliseconds.`);
    return result;
  }
}
