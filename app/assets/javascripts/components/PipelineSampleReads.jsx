class PipelineSampleReads extends React.Component {

  constructor(props) {
    super(props);
    this.pipelineOutput = this.props.pipelineOutput;
    this.sampleInfo = this.props.sampleInfo;
    this.projectInfo = this.props.projectInfo;
    this.reportInfo =  (Object.keys(this.props.reportInfo).length > 0) ? this.props.reportInfo : null;

    this.gotoReport = this.gotoReport.bind(this);
    this.getActive = this.getActive.bind(this);
    this.setTab = this.setTab.bind(this);

  }

  gotoReport() {
    $(document).ready(() => {
      $('ul.tabs').tabs('select_tab', 'reports');
      this.setTab('reports');
    });
  }

  getActive(tab) {
    return (window.localStorage.getItem('active_tab') === tab) ? 'active' : '';
  }

  setTab(tab) {
    window.localStorage.setItem('active_tab', tab);
  }

  componentDidMount() {
    $('ul.tabs').tabs();
  }

  render() {
    let d_report = null;
    if(this.reportInfo) {
      d_report = <PipelineSampleReport
        report_details={this.reportInfo.report_details}
        taxonomy_details={this.reportInfo.taxonomy_details} view_level={this.reportInfo.view_level}
        highest_tax_counts={this.reportInfo.highest_tax_counts} />;
    } else {
      d_report = <p className="center-align text-grey text-lighten-2 no-report">No report found for this sample</p>
    }
    return (
      <div>
        <Header />
        <SubHeader>
          <div className="sub-header">
            <div className="title">
              PIPELINE
            </div>

            <div className="sub-title">
              <a href="/"> {this.projectInfo.name} </a> > { this.sampleInfo.name }
            </div>

            <div className="sub-header-navigation">
              <div className="nav-content">
                <ul className="tabs tabs-transparent">
                  <li className="tab" onClick={() => {this.setTab('details')}} >
                    <a href="#details" className={this.getActive('details')}>Details</a>
                  </li>
                  <li className="tab" onClick={() => {this.setTab('reports')}}>
                    <a href="#reports" className={this.getActive('reports')}>Report</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </SubHeader>
        <div id="details" className="tab-screen col s12">
          <div className="container tab-screen-content">
            <div className="row">
              <div className="col s9">

                <div className="row">
                  <div className="col s12">
                    <div className="content-title">
                      SAMPLE INFO
                    </div>

                    <div className="data">
                      <div className="row">
                        <div className="col s6">
                          <table className="highlight">
                            <tbody>
                              <tr>
                                <td>Host</td>
                                 <td> { (!this.sampleInfo.host) ? 'N/A' : this.sampleInfo.host } </td>
                              </tr>
                              <tr>
                                <td>Entry Date</td>
                                <td>{moment(this.sampleInfo.created_at).format('L, h:mm a')}</td>
                              </tr>
                              <tr>
                                <td>Location</td>
                                <td>{ (!this.sampleInfo.sample_location) ? 'N/A' : this.sampleInfo.sample_location }</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="col s6">
                          <table className="highlight responsive-table">
                            <tbody>
                              <tr>
                                <td>Tissue Type</td>
                                 <td>{ (!this.sampleInfo.sample_tissue) ? 'N/A' : this.sampleInfo.sample_tissue }</td>
                              </tr>
                              <tr>
                                <td>Library Prep Protocol</td>
                                <td>{ (!this.sampleInfo.sample_library) ? 'N/A' : this.sampleInfo.sample_library }</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col s12">
                          <table>
                            <tbody>
                            <tr>
                              <td className="notes">Notes</td>
                              <td className="sample-notes">
                                Subject 2
                                <br/>
                                248 6204  Taenia solium
                                <br/>
                                827 60517 Taenia asiatica
                                <br/>
                                -- Ignored pairs: 2787
                                <br/>
                                -- Retained pairs: 569 (16.95 percent of total non-host sequence)
                                <br/>
                              </td>
                            </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="data-divider"/>

                <div className="row">
                  <div className="col s12">
                    <div className="content-title">
                      PIPELINE OUTPUT
                    </div>

                    <div className="data">
                      <div className="row">
                        <div className="col s6">
                          <table className="highlight">
                            <tbody>
                              <tr>
                                <td>Total reads</td>
                                 <td>{ this.pipelineOutput.total_reads }</td>
                              </tr>
                              <tr>
                                <td>Passed Quality Control</td>
                                <td>{(this.pipelineOutput.remaining_reads /
                                  this.pipelineOutput.total_reads * 100).toFixed(2) }%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="col s6">
                          <table className="highlight">
                            <tbody>
                              <tr>
                                <td>Remaining Reads</td>
                                 <td>{ this.pipelineOutput.remaining_reads }</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col s3 download-area">
                <a className="custom-button">
                  <i className="fa fa-cloud-download left"></i> DOWNLOAD ALL READS
                </a>

                <a className="custom-button">
                  <i className="fa fa-user-times left"></i> DOWNLOAD NON HUMAN READS
                </a>
                <a onClick={this.gotoReport}  className="custom-button">
                  <i className="fa fa-file-text-o left"></i> GENERATE REPORT
                </a>
              </div>

            </div>
          </div>
        </div>
        <div id="reports" className="reports-screen tab-screen col s12">
          { d_report }
        </div>
      </div>
    )
  }
}
