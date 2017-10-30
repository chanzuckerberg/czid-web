class PipelineSampleReport extends React.Component {

  constructor(props) {
    super(props);
    this.report_details = props.report_details;
    this.real_length = props.taxonomy_details[0];
    this.taxonomy_details = props.taxonomy_details[1];
    this.all_categories = props.all_categories;
    this.applyViewLevel = this.applyViewLevel.bind(this);
    this.applyNewFilterThresholds = this.applyNewFilterThresholds.bind(this);
  }

  refreshPage(overrides) {
    new_params = Object.assign({}, this.props.report_page_params, overrides);
    window.location = location.protocol + '//' + location.host + location.pathname + '?' + jQuery.param(new_params);
  }

  applyViewLevel(view_level) {
    this.refreshPage({view_level});
  }

  // applySort needs to be bound at time of use, not in constructor above
  applySort(sort_by) {
    this.refreshPage({sort_by});
  }

  applyNewFilterThresholds(new_filter_thresholds) {
    this.refreshPage(new_filter_thresholds);
  }

  render_name(tax_info) {
    foo = <i>{tax_info.name}</i>;
    if (tax_info.tax_id > 0) {
      foo = (
        <span className="link">
          <a href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${tax_info.tax_id}`}>
            {tax_info.name}
          </a>
        </span>
      );
    }
    if (tax_info.tax_level == 1) {
      // indent species rows
      foo = <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{foo}</span>
    } else {
      // emphasize genus, soften category and species count
      category_name = tax_info.tax_id == -200 ? 'Miscellaneous' : tax_info.category_name;
      foo = <span><b>{foo}</b>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{'color':'#A0A0A0'}}><i>({tax_info.species_count}&nbsp;{category_name}&nbsp;species)</i></span></span>
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
    current_sort = this.props.report_page_params.sort_by;
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

  render_column_header(visible_type, visible_metric, column_name) {
    var style = { 'textAlign': 'right' };
    return (
      <th style={style}>
        <div className='sort-controls right'>
          {this.render_sort_arrow(column_name, 'lowest', 'up')}
          {this.render_sort_arrow(column_name, 'highest', 'down')}
          {visible_type}<br/>
          {visible_metric}
        </div>
      </th>
    );
  }

  row_class(tax_info) {
    return tax_info.tax_level == 2 ? 'report-row-genus' : 'report-row-species';
  }

  render() {
    const parts = this.props.report_page_params.sort_by.split("_")
    const sort_column = parts[1] + "_" + parts[2];
    var t0 = Date.now();
    report_filter =
      <ReportFilter
        all_categories = { this.all_categories }
        background_model = { this.report_details.background_model.name }
        report_title = { this.report_details.report_info.name }
        report_page_params = { this.props.report_page_params }
        applyViewLevel = { this.applyViewLevel }
        applyNewFilterThresholds = { this.applyNewFilterThresholds }
      />;
    result = (
      <div>
        <div id="reports" className="reports-screen tab-screen col s12">
          <div className="tab-screen-content">
            <div className="row">
              <div className="col s2">
                {report_filter}
              </div>
              <div className="col s10 reports-main ">
                <table id="report-table" className='bordered report-table'>
                  <thead>
                  <tr>
                    <th>Taxonomy</th>
                    { this.render_column_header('NT+NR', 'ZZRPM',  'nt_aggregatescore') }
                    { this.render_column_header('NT', 'Z',   'nt_zscore') }
                    { this.render_column_header('NT', 'rPM', 'nt_rpm')    }
                    { this.render_column_header('NT', 'r',   'nt_r')      }
                    { this.render_column_header('NT', '%id', 'nt_percentidentity')    }
                    { this.render_column_header('NT', 'AL',   'nt_alignmentlength')    }
                    { this.render_column_header('NT', 'Lg1/E',  'nt_neglogevalue')    }
                    { this.render_column_header('NR', 'Z',   'nr_zscore') }
                    { this.render_column_header('NR', 'rPM', 'nr_rpm')    }
                    { this.render_column_header('NR', 'r',   'nr_r')      }
                    { this.render_column_header('NR', '%id', 'nr_percentidentity')    }
                    { this.render_column_header('NR', 'AL',   'nr_alignmentlength')    }
                    { this.render_column_header('NR', 'Lg1/E',  'nr_neglogevalue')    }
                  </tr>
                  </thead>
                  <tbody>
                  { this.taxonomy_details.map((tax_info, i) => {
                    return (
                      <tr key={tax_info.tax_id} className={this.row_class(tax_info)}>
                        <td>
                          { this.render_name(tax_info) }
                        </td>
                        { this.render_number(tax_info.NT.aggregatescore, sort_column == 'nt_aggregatescore', 0) }
                        { this.render_number(tax_info.NT.zscore, sort_column == 'nt_zscore', 1) }
                        { this.render_number(tax_info.NT.rpm, sort_column == 'nt_rpm', 1)       }
                        { this.render_number(tax_info.NT.r, sort_column == 'nt_r', 0)           }
                        { this.render_number(tax_info.NT.percentidentity, sort_column == 'nt_zscore', 1) }
                        { this.render_number(tax_info.NT.alignmentlength, sort_column == 'nt_rpm', 1)       }
                        { this.render_number(tax_info.NT.neglogevalue, sort_column == 'nt_neglogevalue', 0) }
                        { this.render_number(tax_info.NR.zscore, sort_column == 'nr_zscore', 1) }
                        { this.render_number(tax_info.NR.rpm, sort_column == 'nr_rpm', 1)       }
                        { this.render_number(tax_info.NR.r, sort_column == 'nr_r', 0)           }
                        { this.render_number(tax_info.NR.percentidentity, sort_column == 'nr_zscore', 1) }
                        { this.render_number(tax_info.NR.alignmentlength, sort_column == 'nr_rpm', 1)       }
                        { this.render_number(tax_info.NR.neglogevalue, sort_column == 'nr_neglogevalue', 0) }
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
    // console.log(`Table render took ${t1 - t0} milliseconds.`);
    return result;
  }
}
