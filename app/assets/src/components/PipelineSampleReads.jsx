import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import $ from 'jquery';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Button, Icon, Divider } from 'semantic-ui-react'
import numberWithCommas from '../helpers/strings';
import SubHeader from './SubHeader';
import PipelineSampleReport from './PipelineSampleReport';

class PipelineSampleReads extends React.Component {
  constructor(props) {
    super(props);
    this.can_edit = props.can_edit;
    this.csrf = props.csrf;
    this.gitVersion = props.gitVersion
    this.allBackgrounds = props.all_backgrounds;
    this.rerunPath = props.rerun_path;
    this.sampleInfo = props.sampleInfo;
    this.projectInfo = props.projectInfo;
    this.sample_map = props.project_sample_ids_names;

    this.reportPresent =  props.reportPresent;
    this.reportTime = props.reportTime;
    this.allCategories  = props.allCategories;
    this.reportDetails  = props.reportDetails;
    this.reportPageParams  = props.reportPageParams;
    this.pipelineRunRetriable = props.pipelineRunRetriable;

    this.jobStatistics = props.jobStatistics;
    this.summary_stats = props.summary_stats;
    this.gotoReport = this.gotoReport.bind(this);
    this.sampleId = this.sampleInfo.id;
    this.host_genome = props.host_genome;
    this.pipelineStatus = props.sample_status;
    this.pipelineRun = props.pipelineRun;
    this.rerunPipeline = this.rerunPipeline.bind(this);
    this.canSeeAlignViz = props.can_see_align_viz;
    this.state = {
      rerunStatus: 'failed',
      rerunStatusMessage: 'Sample run failed'
    };
    this.TYPE_PROMPT = this.can_edit ? "Type here..." : "-" ;
    this.NUCLEOTIDE_TYPES = ['-',"DNA", "RNA"];
    this.DROPDOWN_OPTIONS = { sample_tissue: PipelineSampleReads.fetchTissueTypes(),
                              sample_template: this.NUCLEOTIDE_TYPES };
    this.DROPDOWN_METADATA_FIELDS = Object.keys(this.DROPDOWN_OPTIONS);
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.deleteSample = this.deleteSample.bind(this);
  }

  deleteSample() {
    axios
      .delete(`/samples/${this.sampleInfo.id}.json`, {
        data: { authenticity_token: this.csrf }
      })
      .then((res) => {
        location.href=`/?project_id=${this.projectInfo.id}`
      }).catch((err) => {
    })
  }

  render_metadata_dropdown(label, field) {
    let dropdown_options = this.DROPDOWN_OPTIONS[field];
    let display_value = this.sampleInfo[field] ? this.sampleInfo[field] : '-';
    return (
      <div className='row detail-row no-padding'>
        <div className='col s5 label'>
          {label}
        </div>
        <div className='col s7 no-padding'>
          <div className="sample-notes">
            <div className='details-value custom-select-dropdown select-dropdown' data-activates={field}>
              <div className='hack'>
                { display_value }
              </div>
              <i className="fa fa-chevron-down right"/>
            </div>
            {this.can_edit ? (
              <ul id={field} className='dropdown-content details-dropdown'>
                {
                  dropdown_options.map((option_value, i) => {
                    return <li onClick={(e) => {this.handleDropdownChange(field, i, e)}} ref={field}
                      key={i}>{option_value}</li>
                  })
                }
              </ul>
            ) : null }
          </div>
        </div>
      </div>
    );
  }

  render_metadata_textfield(label, field) {
    let display_value = this.sampleInfo[field] && this.sampleInfo[field].trim() !== "" ? this.sampleInfo[field] : this.TYPE_PROMPT;
    return (
      <div className='row detail-row'>
        <div className='col s6 no-padding'>
          {label}
        </div>
        <div className='col s6 no-padding'>
          <div className="details-value sample-notes">
            <pre suppressContentEditableWarning={true} contentEditable={this.can_edit} id={field}>
              {display_value}
            </pre>
          </div>
        </div>
      </div>
    );
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
      rerunStatus: 'waiting',
      rerunStatusMessage: <span>
          <br/>
          <i className="fa fa-circle-o-notch fa-spin fa-fw"></i>
          Adding sample to queue ...
          </span>
    })
    axios.put(`${this.rerunPath}.json`, {
      authenticity_token: this.csrf
    }).then((response) => {
      this.setState({
        rerunStatus: 'success',
        rerunStatusMessage: 'Rerunning sample'
      });
    // this should set status to UPLOADING/IN PROGRESS after rerun
    }).catch((error) => {
      this.setState({
        rerunStatus: 'failed',
        rerunStatusMessage: <span>
          <br/>
          <i className="fa fa-frown-o fa-fw"></i>Failed to re-run Pipeline
          </span>
      });
    })
  }

  static getActive(section, tab) {
    return (window.localStorage.getItem(section) === tab) ? 'active' : '';
  }

  static setTab(section, tab) {
    window.localStorage.setItem(section, tab);
  }

  static fetchTissueTypes() {
    let tissue_types =  ['-',"Bronchoalveolar lavage", "Cerebrospinal fluid",
    "Nasopharyngeal swab", "Plasma", "Serum", "Solid tissue",
    "Stool", "Synovial fluid", "Whole blood",
    "Whole insect", "Insect abdomen", "Insect engorged abdomen", "Insect head"];
    return tissue_types;
  }

  fetchParams(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  getDownloadLink() {
    const param_background_id = this.fetchParams("background_id");
    const cookie_background_id = Cookies.get('background_id');
    const defaultBackground = cookie_background_id ? `?background_id=${cookie_background_id}` : '';
    const csv_background_id_param =
      param_background_id ? `?background_id=${param_background_id}` : defaultBackground;
    return `/samples/${this.sampleId}/report_csv${csv_background_id_param}`;
  }

  componentDidMount() {
    $('.dropdown-button').dropdown({
      belowOrigin: true
    });

    $('ul.tabs').tabs();
    this.listenNoteChanges();
    this.initializeSelectTag();
    $('.custom-select-dropdown').dropdown({
      belowOrigin: true
    });
    for (var i = 0; i < this.DROPDOWN_METADATA_FIELDS.length; i++) {
      let field = this.DROPDOWN_METADATA_FIELDS[i];
      $(ReactDOM.findDOMNode(this.refs[field])).on('change',this.handleDropdownChange);
    }
  }

  initializeSelectTag() {
    $('select').material_select();
  }

  handleDropdownChange(field, position, element) {
    const parent = $(element.target).parent();
    const value = this.DROPDOWN_OPTIONS[field][position];
    const prevValue = parent.prev().text().trim();
    if (prevValue !== value) {
      parent.prev().html(
        `<div class='hack'>
        ${value}
       </div>
       <i class="fa fa-chevron-down right"/>`
      );
      axios.post('/samples/' + this.sampleInfo.id + '/save_metadata.json', {
        field: field, value: value, authenticity_token: this.csrf
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

  }

  listenNoteChanges() {
    if (!this.can_edit) {

      return ;
    }
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
          field: field, value: newText, authenticity_token: this.csrf
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
    let waitingSpinner =
      <div>
        Sample Waiting ...
        <p>
          <i className='fa fa-spinner fa-spin fa-3x'></i>
        </p>
      </div>;
    if(this.reportPresent) {
      d_report = <PipelineSampleReport
        sample_id = {this.sampleId}
        report_ts = {this.reportTime}
        git_version = {this.gitVersion}
        all_categories = {this.allCategories}
        all_backgrounds = {this.allBackgrounds}
        report_details = {this.reportDetails}
        report_page_params = {this.reportPageParams}
        can_see_align_viz = {this.canSeeAlignViz}
      />;
    } else if(this.pipelineInProgress()) {
      d_report =
        <div className="center-align text-grey text-lighten-2 no-report">
          {waitingSpinner}
        </div>;
    } else {
      d_report =
      <div className="center-align text-grey text-lighten-2 no-report">
        <h6 className={this.state.rerunStatus}>
          { (this.state.rerunStatus === 'success') ?
            waitingSpinner : this.state.rerunStatusMessage
          }
        </h6>
        <p>
          {
            (this.state.rerunStatus === 'failed' && this.can_edit) ?
            <a onClick={ this.rerunPipeline }className="custom-button small">
              <i className="fa fa-repeat left"></i>
              RERUN PIPELINE
            </a> : null
          }
        </p>
      </div>;
    }

    let pipeline_run = null;
    let download_section = null;
    const BLANK_TEXT = 'unknown';
    if (this.pipelineRun && this.pipelineRun.total_reads) {
      pipeline_run = (
        <div className="data">
          <div className="row">
            <div className="col s6">
              <div className='row detail-row'>
                <div className='col s6 no-padding'>
                  Total reads
                </div>
                <div className='details-value col s6 no-padding'>
                  { numberWithCommas(this.pipelineRun.total_reads) }
                </div>
              </div>
              <div className='row detail-row'>
                <div className='col s6 no-padding'>
                  Non-host reads
                </div>
                <div className={`details-value col s6 no-padding ${!this.summary_stats.remaining_reads ? BLANK_TEXT : ''}`}>
                  {!this.summary_stats.remaining_reads ?
                    BLANK_TEXT :
                    numberWithCommas(this.summary_stats.remaining_reads)
                  }
                  { !this.summary_stats.percent_remaining ? '' :
                    ` (${this.summary_stats.percent_remaining.toFixed(2)}%)`
                  }
                </div>
              </div>
              <div className='row detail-row'>
                <div className='col s6 no-padding'>
                  Unmapped reads
                </div>
                <div className={`details-value col s6 no-padding ${!this.summary_stats.unmapped_reads ? BLANK_TEXT : ''}`}>
                  { !this.summary_stats.unmapped_reads ? BLANK_TEXT :
                    numberWithCommas(this.summary_stats.unmapped_reads)
                  }
                </div>
              </div>
            </div>
            <div className="col s6">
              <div className='row detail-row'>
                <div className='col s6 no-padding'>
                  Passed quality control
                </div>
                <div className={`details-value col s6 no-padding ${!this.summary_stats.qc_percent ? BLANK_TEXT : ''}`}>
                  {
                    !this.summary_stats.qc_percent ? BLANK_TEXT :
                      `${this.summary_stats.qc_percent.toFixed(2)}%`
                  }
                </div>
              </div>
              <div className='row detail-row'>
                <div className='col s6 no-padding'>
                  Compression ratio
                </div>
                <div className={`details-value col s6 no-padding ${!this.summary_stats.compression_ratio ? BLANK_TEXT : ''}`}>
                  {
                    !this.summary_stats.compression_ratio ? BLANK_TEXT
                      : this.summary_stats.compression_ratio.toFixed(2)
                  }
                </div>
              </div>
              <div className='row detail-row'>
                <div className='col s6 no-padding'>
                  Date processed
                </div>
                <div className={`details-value col s6 no-padding ${!this.summary_stats.last_processed_at ? BLANK_TEXT : ''}`}>
                  {!this.summary_stats.last_processed_at ? BLANK_TEXT :
                    moment(this.summary_stats.last_processed_at).startOf('second').fromNow()
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
    );

    download_section = (
      <div>
        <a className="custom-button" href= { `/samples/${this.sampleInfo.id}/nonhost_fasta` }>
          <i className="fa fa-cloud-download"></i>
          Download Non-Host Reads
        </a>
        <a className="custom-button" href= { `/samples/${this.sampleInfo.id}/unidentified_fasta` }>
          <i className="fa fa-cloud-download"></i>
          Download Unmapped Reads
        </a>
        <a className="custom-button" href= { `/samples/${this.sampleInfo.id}/results_folder` }>
          <i className="fa fa-folder-open"/>
          Navigate to Results Folder
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
    let sample_dropdown = '';
    if (this.sample_map && Object.keys(this.sample_map).length > 1) {
      sample_dropdown = (
        <div className='dropdown-button sample-select-dropdown' data-activates='sample-list'>
          <span className='sample-name-label'>{ this.sampleInfo.name }</span>
          <i className="fa fa-chevron-down right"/>

          <ul id='sample-list' className='dropdown-content sample-dropdown-content'>
           { Object.keys(this.sample_map).map((sample_id, i) => {
               return (
                 <li key={i}>
                   <a href={`/samples/${sample_id}`}>
                     { this.sample_map[sample_id] }
                   </a>
                 </li>
               )})
           }
          </ul>
        </div>
      )
    } else {
    sample_dropdown = <span className='sample-name-label'>{ this.sampleInfo.name }</span>
    }

    let version_display = !this.pipelineRun ? '' :
                            !this.pipelineRun.version ? '' :
                              !this.pipelineRun.version.pipeline ? '' :
                                'v' + this.pipelineRun.version.pipeline
    if (version_display != '' && this.pipelineRun.version.nt) {
      version_display = version_display + ', NT ' + this.pipelineRun.version.nt
    }
    if (version_display != '' && this.pipelineRun.version.nr) {
      version_display = version_display + ', NR ' + this.pipelineRun.version.nr
    }

    let run_date_display = !this.pipelineRun ? '' :
                             !this.pipelineRun.created_at ? '' :
                               '(run on ' + Date(Date.parse(this.pipelineRun.created_at))  + ')'

    let retriable = this.pipelineRunRetriable ? (
      <div className="row">
        <div className="col s12">
          <div className="content-title">
            Retry Pipeline
          </div>
        <h6 className={this.state.rerunStatus}>
          { (this.state.rerunStatus === 'success') ?
            waitingSpinner : null
          }
        </h6>
        <p>
          Pipeline was not 100% successful. Sample status: <b>{ this.pipelineStatus }</b> <br/>
          {
            (this.state.rerunStatus === 'failed' && this.can_edit) ?
            <a onClick={ this.rerunPipeline }className="custom-button small">
              <i className="fa fa-repeat"></i>
              RETRY PIPELINE
            </a> : null
          }
        </p>
        </div>
      </div>) : null;

    let delete_sample_button = (
      <Button onClick={this.deleteSample}>
        Delete sample
      </Button>  
    )

    return (
      <div>
        <SubHeader>
          <div className="sub-header">
            <div className="title">
              PIPELINE {version_display} {run_date_display}
            </div>
            <div className="row">
              <div className="sub-title col s9">
                <a
                href={`/?project_id=${this.projectInfo.id}`}>
                  {this.projectInfo.name + ' '}
                </a>
                > { sample_dropdown }
              { this.sampleInfo.status == "created" ? delete_sample_button : null }
              </div>
              <div className="col no-padding s3 right-align">
                <div className="report-action-buttons">
                  <a className="right" href={this.getDownloadLink()}>
                    <Button icon labelPosition="left" className="icon link download-btn">
                      <Icon className="cloud download alternate" />
                        Download
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            <div className="sub-header-navigation">
              <div className="nav-content">
                <ul className="tabs tabs-transparent">
                  <li className="tab">
                    <a href="#reports" className='active'>Report</a>
                  </li>
                  <li className="tab">
                    <a href="#details" className=''>Details</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </SubHeader>
        <Divider className="reports-divider" />
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
                      Sample Details
                    </div>
                    <div className="data">
                      <div className="row">
                        <div className="col s6">
                          <div className='row detail-row'>
                            <div className='col s6 no-padding'>
                              Host
                            </div>
                            <div className={`details-value col s6 no-padding
                            ${!this.host_genome ? BLANK_TEXT : ''}`}>
                              {!this.host_genome ? BLANK_TEXT : this.host_genome.name}
                            </div>
                          </div>

                          <div className='row detail-row'>
                            <div className='col s6 no-padding'>
                              Upload date
                            </div>
                            <div className='details-value col s6 no-padding'>
                              { moment(this.sampleInfo.created_at).startOf('second').fromNow() }
                            </div>
                          </div>
                          {this.render_metadata_textfield("Location", "sample_location", 0)}
                        </div>
                        <div className="col s6">
                          {this.render_metadata_dropdown("Tissue type", "sample_tissue")}
                          {this.render_metadata_dropdown("Nucleotide type", "sample_template")}
                          <div className='row detail-row no-padding'>
                            <div className='col s5 label'>
                              Unique ID
                            </div>
                            <div className='col s7 '>
                              <div className="details-value label sample-notes">
                                <pre suppressContentEditableWarning={true} contentEditable={this.can_edit} id='sample_host'>
                                  {this.sampleInfo['sample_host'] && this.sampleInfo['sample_host'].trim() !== "" ?
                                    this.sampleInfo['sample_host'] : this.TYPE_PROMPT
                                  }
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col s12">
                          <div className='details-title note'>
                            Notes
                          </div>
                          <div className="sample-notes note">
                            <pre className='details-value' suppressContentEditableWarning={true} contentEditable={this.can_edit} id='sample_notes'>
                              {this.sampleInfo['sample_notes'] && this.sampleInfo['sample_notes'].trim() !== "" ? this.sampleInfo['sample_notes'] : this.TYPE_PROMPT}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col s12">
                    <div className="content-title">
                      PIPELINE OUTPUT
                    </div>
                    { pipeline_run }
                  </div>
                </div>
                { retriable }

              </div>

              <div className="col s3 download-area">
                <div className='download-title'>
                  Downloads Reads
                </div>
                <a className="custom-button" href={ `/samples/${this.sampleInfo.id}/fastqs_folder`  }>
                  <i className="fa fa-folder-open"/>
                  Go To Source Data
                </a>
                { download_section }
              </div>
            </div>
          </div>
        </div>
        <div id="reports" className="reports-screen container tab-screen col s12">
          { d_report }
        </div>
      </div>
    )
  }
}
export default PipelineSampleReads;
