class PipelineSampleReport extends React.Component {

  constructor(props) {
    super(props);
    this.report_details = props.report_details;
    this.real_length = props.taxonomy_details[0];
    this.report_page_params = props.report_page_params;
    this.taxonomy_details = props.taxonomy_details[1];
    this.all_categories = props.all_categories;
    this.applySort = this.applySort.bind(this);
    this.report_filter = null;
  }

  applySort(sort_by) {
    this.report_filter.refetchReportPage({ sort_by });
  }

  render_name(tax_info) {
    indent = <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>;
    name = <span><i>{tax_info.name}</i></span>;
    if (tax_info.tax_id > 0) {
      ncbi_url = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${tax_info.tax_id}`;
      name =
        <span className="link">
          <a href={ncbi_url}>
            {tax_info.name}
          </a>
        </span>;
    }
    if (tax_info.tax_level == 1) {
      // indent species rows
      name = <span>{indent}{indent}{name}</span>
    } else {
      // emphasize genus, soften category and species count
      name = <span><b>{name}</b>{indent}<span style={{'color':'#A0A0A0'}}><i>({tax_info.species_count}&nbsp;{tax_info.category_name}&nbsp;species)</i></span></span>
    }
    return name;
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
    return ( <td className={className}>{y}<b>{units}</b></td> );
  }

  render_sort_arrow(column, desired_sort_direction, arrow_direction) {
    desired_sort = desired_sort_direction + "_" + column;
    applyDesiredSort = this.applySort.bind(desired_sort);
    className = `fa fa-caret-${arrow_direction}`;
    current_sort = this.report_page_params.sort_by;
    if (current_sort == desired_sort) {
      className = 'active ' + className;
    }
    return (
      <i onClick={applyDesiredSort}
         className={className}>
      </i>
    );
  }

  render_column_header(visible_type, visible_metric, column_name) {
    var style = { 'textAlign': 'right' };
    return (
      <th style={style}>
        <div className='sort-controls right'>
          {this.render_sort_arrow(column_name, this.report_page_params.sort_by, 'lowest', 'up')}
          {this.render_sort_arrow(column_name, this.report_page_params.sort_by, 'highest', 'down')}
          {visible_type}&nbsp;{visible_metric}
        </div>
      </th>
    );
  }

  row_class(tax_info) {
    return tax_info.tax_level == 2 ? 'report-row-genus' : 'report-row-species';
  }

  render() {
    const parts = this.report_page_params.sort_by.split("_")
    const sort_column = parts[1] + "_" + parts[2];
    console.log("Start table render.");
    var t0 = Date.now();
    this.report_filter =
      <ReportFilter
        all_categories = { this.all_categories }
        background_model = { this.report_details.background_model.name }
        report_title = { this.report_details.report_info.name }
        report_page_params = { this.report_page_params }
      />;
    result = (
      <div>
        <div id="reports" className="reports-screen tab-screen col s12">
          <div className="tab-screen-content">
            <div className="row">
              <div className="col s2">
                {this.report_filter}
              </div>
              <div className="col s10 reports-main ">
                <table id="report-table" className='bordered report-table'>
                  <thead>
                  <tr>
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
                      <tr key={tax_info['tax_id']} className={this.row_class(tax_info)}>
                        <td>
                          { this.render_name(tax_info) }
                        </td>
                        { this.render_number(tax_info.NT.zscore, sort_column == 'nt_zscore', 1) }
                        { this.render_number(tax_info.NT.rpm, sort_column == 'nt_rpm', 1)       }
                        { this.render_number(tax_info.NT.r, sort_column == 'nt_r', 0)           }
                        { this.render_number(tax_info.NR.zscore, sort_column == 'nr_zscore', 1) }
                        { this.render_number(tax_info.NR.rpm, sort_column == 'nr_rpm', 1)       }
                        { this.render_number(tax_info.NR.r, sort_column == 'nr_r', 0)           }
                      </tr>
                    )
                  })}
                  </tbody>
                </table>
                <span>
                {this.real_length == this.taxonomy_details.length ?
                  ('Showing all ' + this.real_length + ' rows passing filters.') :
                  ('Due to resource limits, showing only ' + this.taxonomy_details.length + ' of the ' + this.real_length + ' rows passing filters.')}
                </span>
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
