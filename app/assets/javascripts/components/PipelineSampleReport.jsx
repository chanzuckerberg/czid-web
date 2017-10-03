class PipelineSampleReport extends React.Component {

  constructor(props) {
    super(props);
    this.report_details = props.report_details;
    this.taxonomy_details = props.taxonomy_details;
    this.view_level = props.view_level;
    this.highest_tax_counts = props.highest_tax_counts;
    console.log(props);

  }

  uppCaseFirst(name) {

    return (name)? name.charAt(0).toUpperCase() + name.slice(1) : name;
  }

  componentDidMount() {
    $('ul.tabs').tabs();
  }

  render() {
    return (
      <div>
        <div id="reports" className="reports-screen tab-screen col s12">
          <div className="container tab-screen-content">
            <div className="row">
              <div className="col s3">
                <ReportFilter view_level={this.uppCaseFirst(this.view_level)}
                              highest_tax_counts={this.highest_tax_counts}/>
              </div>
              <div className="col s9 reports-main ">
                <table className='bordered report-table'>
                  <thead>
                  <tr>
                    <th>{this.uppCaseFirst(this.view_level)}</th>
                    <th>NT {this.uppCaseFirst(this.view_level)} Z</th>
                    <th>NT {this.uppCaseFirst(this.view_level)} rM</th>
                    <th>NR {this.uppCaseFirst(this.view_level)} Z</th>
                    <th>NR {this.uppCaseFirst(this.view_level)} rM</th>
                  </tr>
                  </thead>
                  <tbody>
                  { this.taxonomy_details.map((genus_detail, i) => {
                    return (
                      <tr key={i}>
                        <td>
                          <span className="link">
                            <a href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${
                              genus_detail.nt_ele.tax_id}`}>{ genus_detail.nt_ele.name }
                          </a>
                          </span>
                        </td>
                        <td>{ (!genus_detail.nt_ele.zscore) ? '': genus_detail.nt_ele.zscore }</td>
                        <td>{ genus_detail.nt_ele.rpm }</td>
                        <td>
                          { (!genus_detail.nr_ele) ? '': genus_detail.nr_ele.zscore }
                          </td>
                        <td>
                          { (!genus_detail.nr_ele) ? '': genus_detail.nr_ele.rpm }
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
