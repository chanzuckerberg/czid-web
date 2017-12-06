class PipelineSampleReads extends React.Component {
  constructor(props) {
    super(props);
    this.pipelineOutput = props.pipelineOutput;
    this.csrf = props.csrf;
    this.rerunPath = props.rerun_path;
    this.sampleInfo = props.sampleInfo;
    this.projectInfo = props.projectInfo;
    this.reportInfo =  (Object.keys(props.reportInfo).length > 0) ? props.reportInfo : null;
    this.jobStatistics = props.jobStatistics;
    this.summary_stats = props.summary_stats;
    this.gotoReport = this.gotoReport.bind(this);
    this.sampleId = this.sampleInfo.id;
    this.pipelineStatus = props.sample_status
    this.pipelineRun = props.pipelineRun
    this.rerunPipeline = this.rerunPipeline.bind(this);
    this.state = {
      rerun: false,
      failureText: 'Sample run failed'
    };
    this.TYPE_PROMPT = "Type here..."
  }

  gotoReport() {
    $('ul.tabs').tabs('select_tab', 'reports');
    PipelineSampleReads.setTab('pipeline_display','reports');
  }

  pipelineInProgress() {
    if (this.pipelineRun === null) {
      return true;
    } else if (this.pipelineRun.finalized === 1) {
      return false;
    }
    return true;
  }

  rerunPipeline() {
    this.setState({
      rerun: true
    })
    axios.put(`${this.rerunPath}.json`, {
      authenticity_token: this.csrf
    }).then((response) => {
    // this should set status to UPLOADING/IN PROGRESS after rerun
    }).catch((error) => {
      this.setState({
        rerun: false,
        failureText: 'Failed to re-run Pipeline'
      })
    })
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
      if (currentText === this.TYPE_PROMPT) {
        e.target.innerText = '';
      }
    });

    $('.sample-notes').focusout((e) => {
      const newText = e.target.innerText.trim();
      const field = e.target.id;
      if (newText !== currentText) {
        axios.post('/samples/' + this.sampleInfo.id + '/save_metadata.json', {
          field: field,
          value: newText
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
      };
      if (newText.trim() === '') {
        e.target.innerText = this.TYPE_PROMPT;
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
        taxonomy_details={this.reportInfo.taxonomy_details}
        report_page_params={this.reportInfo.report_page_params}
        all_genera_in_sample={this.reportInfo.all_genera_in_sample}
        sample_id = {this.sampleId}
      />;
    } else {
      d_report = <div className="center-align text-grey text-lighten-2 no-report">{ this.pipelineInProgress() ? <div>Processing Sample...<p><i className='fa fa-spinner fa-spin fa-3x'></i></p></div> :
        <div>
          <h6 className="failed"><i className="fa fa-frown-o"></i>  {this.state.failureText}  </h6>
          <p>
           { !this.state.rerun ? <a onClick={ this.rerunPipeline }className="custom-button small"><i className="fa fa-repeat left"></i>RERUN PIPELINE</a>
            : null }
            </p>
        </div> }
      </div>
    }

    let pipeline_run = null;
    let download_section = null;
    var BLANK_TEXT = 'unknown'
    if (this.pipelineOutput) {
      pipeline_run = (
        <div className="data">
          <div className="row">
            <div className="col s5">
              <table>
                <tbody>
                <tr>
                  <td>Total reads</td>
                  <td>{ numberWithCommas(this.pipelineOutput.total_reads) }</td>
                </tr>
                <tr>
                  <td>Non-host reads</td>
                  <td>{ !this.summary_stats.remaining_reads ? BLANK_TEXT : numberWithCommas(this.summary_stats.remaining_reads) } { !this.summary_stats.percent_remaining ? '' : `(${this.summary_stats.percent_remaining.toFixed(2)}%)` }</td>
                </tr>
                </tbody>
              </table>
            </div>
            <div className="col s7">
              <table>
                <tbody>
                <tr>
                  <td>Passed quality control</td>
                  <td>{ !this.summary_stats.qc_percent ? BLANK_TEXT : `${this.summary_stats.qc_percent.toFixed(2)}%` }</td>
                </tr>
                <tr>
                  <td>Duplicate compression ratio</td>
                  <td>{ !this.summary_stats.compression_ratio ? BLANK_TEXT : this.summary_stats.compression_ratio.toFixed(2) }</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
    );

    download_section = (
      <div>
        <a className="custom-button" href= { `/pipeline_outputs/${this.pipelineOutput.id}/nonhost_fasta` }>
          <i className="fa fa-cloud-download left"></i> DOWNLOAD NON HOST READS
        </a>
        <a className="custom-button" href= { `/pipeline_outputs/${this.pipelineOutput.id}/unidentified_fasta` }>
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
                                <td> { (!this.sampleInfo.host_genome_name) ? BLANK_TEXT : this.sampleInfo.host_genome_name } </td>
                              </tr>
                              <tr>
                                <td>Entry date</td>
                                <td>{moment(this.sampleInfo.created_at).startOf('second').fromNow()}</td>
                              </tr>
                              <tr>
                                <td>Location</td>
                                <td className="sample-notes">
                                 <pre suppressContentEditableWarning={true} contentEditable={true} id="sample_location">
                                  { this.sampleInfo.sample_location && this.sampleInfo.sample_location.trim() !== "" ? this.sampleInfo.sample_location : this.TYPE_PROMPT}
                                 </pre>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="col s6">
                          <table className="responsive-table">
                            <tbody>
                              <tr>
                                <td>Tissue type</td>
                                <td className="sample-notes">
                                 <pre suppressContentEditableWarning={true} contentEditable={true} id="sample_tissue">
                                  { this.sampleInfo.sample_tissue && this.sampleInfo.sample_tissue.trim() !== "" ? this.sampleInfo.sample_tissue : this.TYPE_PROMPT}
                                 </pre>
                                </td>
                              </tr>
                              <tr>
                                <td>Library prep protocol</td>
                                <td className="sample-notes">
                                 <pre suppressContentEditableWarning={true} contentEditable={true} id="sample_library">
                                  { this.sampleInfo.sample_library && this.sampleInfo.sample_library.trim() !== "" ? this.sampleInfo.sample_library : this.TYPE_PROMPT}
                                 </pre>
                                </td>
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
                               <pre suppressContentEditableWarning={true} contentEditable={true} id="sample_notes">
                                { this.sampleInfo.sample_notes && this.sampleInfo.sample_notes.trim() !== "" ? this.sampleInfo.sample_notes : this.TYPE_PROMPT}
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
