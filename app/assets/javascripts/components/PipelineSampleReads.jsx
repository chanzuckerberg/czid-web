class PipelineSampleReads extends React.Component {

  constructor(props) {
    super(props);
    this.pipelineOutput = this.props.pipelineOutput;
    this.sampleInfo = this.props.sampleInfo;
    this.projectInfo = this.props.projectInfo;
    this.reportInfo =  (Object.keys(this.props.reportInfo).length > 0) ? this.props.reportInfo : null;
    this.jobStatistics = this.props.jobStatistics;
    this.summary_stats = this.props.summary_stats;
    this.gotoReport = this.gotoReport.bind(this);
    console.log(props);
    }

  gotoReport() {
    $('ul.tabs').tabs('select_tab', 'reports');
    PipelineSampleReads.setTab('pipeline_display','reports');
  }

  static getActive(section, tab) {
    return (window.localStorage.getItem(section) === tab) ? 'active' : '';
  }

  static setTab(section, tab) {
    window.localStorage.setItem(section, tab);
  }

  componentDidMount() {
    $('ul.tabs').tabs();
    $('.sample-notes').focusin(function() {
      $('.save-note-button button').fadeIn(1000);
    });
    $('.save-note-button button').click(function() {
      $('.save-note-button button').fadeOut(1000);
    });
  }

  render() {
    let d_report = null;
    if(this.reportInfo) {
      d_report = <PipelineSampleReport
        all_categories = { this.reportInfo.all_categories }
        report_details={this.reportInfo.report_details}
        taxonomy_details={this.reportInfo.taxonomy_details} view_level={this.reportInfo.view_level}
        highest_tax_counts={this.reportInfo.highest_tax_counts} />;
    } else {
      d_report = <p className="center-align text-grey text-lighten-2 no-report">No report found for this sample</p>
    }

    let pipeline_run = null;
    let download_section = null;
    if (this.pipelineOutput) {
      pipeline_run = (
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
                  <td>{ !this.summary_stats ? 'NA' : this.summary_stats.qc_percent.toFixed(2) }%</td>
                </tr>
                </tbody>
              </table>
            </div>
            <div className="col s6">
              <table className="highlight">
                <tbody>
                <tr>
                  <td>Remaining Reads</td>
                  <td>{ this.summary_stats.remaining_reads }</td>
                </tr>
                <tr>
                  <td>Compression Ratio</td>
                  <td>{ !this.summary_stats ? 'NA' : this.summary_stats.compression_ratio.toFixed(2) }</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
    );

    download_section = (
      <div>
        <a className="custom-button" href= { this.sampleInfo.sample_annotated_fasta_url }>
          <i className="fa fa-cloud-download left"></i> DOWNLOAD NON HUMAN READS
        </a>
        <a className="custom-button" href= { this.sampleInfo.sample_output_folder_url }>
          <i className="fa fa-cloud-download left"></i> GO TO RESULTS FOLDER
        </a>
      </div>
    );

    } else {
      pipeline_run = (
        <div className="center">
          There is no pipeline output for this sample
        </div>
      );
    }
    return (
      <div>
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
                  <li className="tab" onClick={() => {PipelineSampleReads.setTab('pipeline_display','details')}} >
                    <a href="#details" className={PipelineSampleReads.getActive('pipeline_display','details')}>Details</a>
                  </li>
                  <li className="tab" onClick={() => {PipelineSampleReads.setTab('pipeline_display', 'reports')}}>
                    <a href="#reports" className={PipelineSampleReads.getActive('pipeline_display','reports')}>Report</a>
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
                                 <td> { (!this.sampleInfo.host_genome_name) ? 'N/A' : this.sampleInfo.host_genome_name } </td>
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
                              <td className="sample-notes" suppressContentEditableWarning={true} contentEditable={true}>
                                Type here ...
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
                    { pipeline_run }
                  </div>
                </div>
              </div>

              <div className="col s3 download-area">
                <a className="custom-button" href={ this.sampleInfo.sample_input_folder_url }>
                  <i className="fa fa-cloud-download left"></i> DOWNLOAD ALL READS
                </a>
                { download_section }

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
