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
        <Header />
        <SubHeader>
          <div className="sub-header">
            <div className="title">
              PIPELINE
            </div>

            <div className="sub-title">
              <a href="/"> { this.report_details.project_info.name } </a> > { this.report_details.sample_info.name }
            </div>

            <div className="sub-header-navigation">
              <div className="nav-content">
                <ul className="tabs tabs-transparent">
                  <li className="tab">
                    <a href="/pipeline_outputs/57">Details</a>
                  </li>
                  <li className="tab">
                    <a href="/reports/30" className="active">Reports</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </SubHeader>
        <div id="reports" className="reports-screen tab-screen col s12">
          <div className="container tab-screen-content">
            <div className="row">
              <div className="col s3">
                <ReportFilter view_level={this.uppCaseFirst(this.view_level)}
                              highest_tax_counts={this.highest_tax_counts}/>
              </div>
              <div className="col s9 reports-main ">
                <table className='bordered'>
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
                          <a href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${
                            genus_detail.nt_ele.tax_id}`}>{ genus_detail.nt_ele.name }
                          </a>
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
