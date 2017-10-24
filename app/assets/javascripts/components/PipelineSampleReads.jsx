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
    this.sampleId = this.sampleInfo.id
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
    this.listenNoteChanges();
  }

  listenNoteChanges() {
    let currentText = '';
    $('.sample-notes').focusin((e) => {
      currentText = e.target.innerText.trim();
      if (currentText === 'Type here...') {
        e.target.innerText = '';
      }
    });

    $('.sample-notes').focusout((e) => {
      const newText = e.target.innerText.trim();
      if (newText.trim() === '') {
        e.target.innerText = 'Type here...';
      } else if (newText !== currentText) {
        axios.post('/samples/save_note.json', {
          sample_id: this.sampleInfo.id,
          sample_notes: newText
        })
        .then((response) => {
          if (response.data.status === 'success') {
            $('.note-saved-success')
            .html(`<i class='fa fa-check-circle'></i> ${response.data.message}`)
            .css('display', 'inline-block')
            .delay(1000)
            .slideUp(200);
          } else {
            $('.note-save-failed')
            .html(`<i class='fa fa-frown-o'></i> ${response.data.message}`)
            .css('display', 'inline-block')
            .delay(1000)
            .slideUp(200);
          }
        }).catch((error) => {
          $('.note-save-failed')
          .html(`<i class='fa fa-frown-o'></i> Something went wrong!`)
          .css('display', 'inline-block')
          .delay(1000)
          .slideUp(200);
        });
      }
    });
  }

  render() {
    let d_report = null;
    if(this.reportInfo) {
      d_report = <PipelineSampleReport
        all_categories = { this.reportInfo.all_categories }
        checked_categories = {this.reportInfo.checked_categories || this.reportInfo.all_categories }
        genus_info = {this.reportInfo.genus_info}
        report_details={this.reportInfo.report_details}
        taxonomy_details={this.reportInfo.taxonomy_details} view_level={this.reportInfo.view_level}
        highest_tax_counts={this.reportInfo.highest_tax_counts}
        sample_id = {this.sampleId}
        />;
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
              <table>
                <tbody>
                <tr>
                  <td>Total reads</td>
                  <td>{ numberWithCommas(this.pipelineOutput.total_reads) }</td>
                </tr>
                <tr>
                  <td>Passed Quality Control</td>
                  <td>{ !this.summary_stats.qc_percent ? 'NA' : this.summary_stats.qc_percent.toFixed(2) }%</td>
                </tr>
                </tbody>
              </table>
            </div>
            <div className="col s6">
              <table>
                <tbody>
                <tr>
                  <td>Remaining Reads</td>
                  <td>{ !this.summary_stats.remaining_reads ? 'NA' : numberWithCommas(this.summary_stats.remaining_reads) } ({ !this.summary_stats.percent_remaining ? 'NA' : this.summary_stats.percent_remaining.toFixed(2) }%)</td>
                </tr>
                <tr>
                  <td>Compression Ratio</td>
                  <td>{ !this.summary_stats.compression_ratio ? 'NA' : this.summary_stats.compression_ratio.toFixed(2) }</td>
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
          <i className="fa fa-cloud-download left"></i> DOWNLOAD NON HOST READS
        </a>
        <a className="custom-button" href= { this.sampleInfo.sample_unidentified_fasta_url }>
          <i className="fa fa-cloud-download left"></i> DOWNLOAD UNIDENTIFIED READS
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
              <a href={`/?project_id=${this.projectInfo.id}`}> {this.projectInfo.name} </a> > { this.sampleInfo.name }
            </div>

            <div className="sub-header-navigation">
              <div className="nav-content">
                <ul className="tabs tabs-transparent">
                  <li className="tab">
                    <a href="#details" className=''>Details</a>
                  </li>
                  <li className="tab">
                    <a href="#reports" className='active'>Report</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </SubHeader>
        <div id="details" className="tab-screen col s12">
          <div className='center'>
            <span className='note-action-feedback note-saved-success'>
            </span>
            <span className='note-action-feedback note-save-failed'>
            </span>
          </div>

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
                          <table>
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
                          <table className="responsive-table">
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
                              <td className="sample-notes" >
                               <pre suppressContentEditableWarning={true} contentEditable={true}>
                                { this.sampleInfo.sample_notes ? this.sampleInfo.sample_notes : 'Type here...'}
                               </pre>
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
