import React from 'react';
import axios from 'axios';
import ReactDOM from 'react-dom';
import moment from 'moment';
import $ from 'jquery';
import Tipsy from 'react-tipsy';
import Materialize from 'materialize-css';
import SortHelper from './SortHelper';
import numberWithCommas from '../helpers/strings';
import ProjectSelection from './ProjectSelection';
import ReportFilter from './ReportFilter';
import PipelineSampleReads from './PipelineSampleReads';
import StringHelper from '../helpers/StringHelper';
import StickySidebar from './StickySidebar';

class Samples extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleSearch = this.handleSearch.bind(this);
    this.csrf = props.csrf;
    this.favoriteProjects = props.favorites || [];
    this.allProjects = props.projects || [];
    this.defaultSortBy = 'newest';
    const currentSort = SortHelper.currentSort();
    this.columnSorting = this.columnSorting.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.fetchResults = this.fetchResults.bind(this);
    this.fetchSamples = this.fetchSamples.bind(this);
    this.hostGenomes = props.hostGenomes || [];
    this.handleStatusFilterSelect = this.handleStatusFilterSelect.bind(this);
    this.handleTissueFilterSelect = this.handleTissueFilterSelect.bind(this);
    this.handleHostFilterSelect = this.handleHostFilterSelect.bind(this);
    this.setUrlLocation = this.setUrlLocation.bind(this);
    this.sortSamples = this.sortSamples.bind(this);
    this.switchColumn = this.switchColumn.bind(this);
    this.handleProjectSelection = this.handleProjectSelection.bind(this);
    this.pageSize = props.pageSize || 30;
    this.tissue_types = PipelineSampleReads.fetchTissueTypes();
    this.handleAddUser = this.handleAddUser.bind(this);
    this.editableProjects = props.editableProjects
    this.canEditProject = this.canEditProject.bind(this)
    this.fetchProjectUsers = this.fetchProjectUsers.bind(this);
    this.updateProjectUserState = this.updateProjectUserState.bind(this);
    this.updateUserDisplay = this.updateUserDisplay.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.selectSample = this.selectSample.bind(this);
    this.compareSamples = this.compareSamples.bind(this);
    this.selectTissueFilter = this.selectTissueFilter.bind(this);
    this.selectHostFilter = this.selectHostFilter.bind(this);
    this.displayMetaDataDropdown = this.displayMetaDataDropdown.bind(this);
    this.state = {
      invite_status: null,
      project: null,
      project_users: [],
      totalNumber: null,
      projectId: null,
      displaySelectSamplees: this.checkURLContent(),
      selectedProjectId: this.fetchParams('project_id') || null,
      filterParams: this.fetchParams('filter') || '',
      searchParams: this.fetchParams('search') || '',
      tissueParams: this.fetchParams('tissue') || [],
      hostParams: this.fetchParams('host') || [],
      sampleIdsParams: this.fetchParams('ids') || [],
      allSamples: [],
      sort_by: this.fetchParams('sort_by') || 'id,desc',
      pagesLoaded: 0,
      pageEnd: false,
      checkedBoxes: 0,
      allChecked: false,
      selectedSampleIndices: [],
      displayDropdown: false,
      selectedTissueFilters: [],
      selectedTissueIndices: [],
      selectedHostIndices: [],
      initialFetchedSamples: [],
      loading: false,
      isRequesting: false,
      displayEmpty: false,
      project_id_download_in_progress: null,
      project_add_email_validation: null,
      projectType: this.fetchParams('type') || 'all',
      columnsShown: ["total_reads",
        "nonhost_reads",
        "quality_control",
        "compression_ratio",
        'host_genome',
        'location',
        'pipeline_status'],
      allColumns: [
        "total_reads",
        "nonhost_reads",
        "quality_control",
        "compression_ratio",
        'host_genome',
        'location',
        'pipeline_status',
        'notes',
        'nucleotide_type'
      ]
    };
    this.sortCount = 0;

    this.COLUMN_DISPLAY_MAP = { total_reads: { display_name: "Total reads", type: "pipeline_data" },
      nonhost_reads: { display_name: "Non-host reads", type: "pipeline_data" },
      quality_control: { display_name: "Passed QC", tooltip: "Passed quality control", type: "pipeline_data" },
      compression_ratio: { display_name: "DCR", tooltip: "Duplicate compression ratio", type: "pipeline_data" },
      pipeline_status: { display_name: "Status", type: "pipeline_data" },
      nucleotide_type: { display_name: "Nucleotide type", type: "metadata" },
      location: { display_name: "Location", type: "metadata" },
      host_genome: { display_name: "Host", type: "metadata" },
      notes: { display_name: "Notes", type: "metadata" } };
    this.handleColumnSelectChange = this.handleColumnSelectChange.bind(this);
    this.columnHidden = this.columnHidden.bind(this);
    this.startReportGeneration = this.startReportGeneration.bind(this);
    this.checkReportDownload = this.checkReportDownload.bind(this);
    this.displayReportProgress = this.displayReportProgress.bind(this);

    $(document).ready(function() {
      $('select').material_select();
      $('.modal').modal({
        inDuration: 0,
        outDuration: 0
      });
    });
  }

  static showLoading(message) {
    $('.page-loading .spinner-label').text(message);
    $('.page-loading').css('display', 'flex');
  }

  static hideLoader() {
    $('.page-loading').css('display', 'none');
  }

  initializeTooltip() {
    // only updating the tooltip offset when the component is loaded
    $(() => {
      const tooltipIdentifier = $("[rel='tooltip']");
      tooltipIdentifier.tooltip({
        delay: 0,
        html: true,
        placement: 'top',
        offset: '0px 50px'
      });
    });
  }

  selectTissueFilter(e) {
    const filterList = this.state.selectedTissueFilters;

    let filter, filterIndex;
    let selectedFilter = e.target.getAttribute('data-status');

    if(e.target.checked) {
      filterList.push(selectedFilter);
    } else {
      filterIndex = filterList.indexOf(selectedFilter);
      filterList.splice(filterIndex, 1);
    }
    this.setState({ 
      selectedTissueFilters: filterList
    }, () => {
      this.handleTissueFilterSelect(this.state.selectedTissueFilters);
    });
  }

  selectHostFilter(e) {
    
    // current array of options
    const hostList = this.state.selectedHostIndices

    let index;
    // check if the check box is checked or unchecked
    if (e.target.checked) {
      // add the numerical value of the checkbox to options array
      hostList.push(+e.target.id)
      console.log(hostList, 'hostlist');
    } else {
      // or remove the value from the unchecked checkbox from the array
      index = hostList.indexOf(+e.target.id)
      hostList.splice(index, 1)
    }
    // update the state with the new array of options
    this.setState({ 
      selectedHostIndices: hostList 
    }, () => {
      this.handleHostFilterSelect(this.state.selectedHostIndices);
    })
    console.log(this.state.selectedHostIndices, 'select host');
  }
  

  canEditProject(projectId) {
    return (this.editableProjects.indexOf(parseInt(projectId)) > -1)
  }

  displayReportProgress(res) {
      $('.download-progress')
      .html(`<i className="fa fa-circle-o-notch fa-spin fa-fw"></i> ${res.data.status_display}`)
      .css('display', 'block')
      setTimeout(() => {
        this.checkReportDownload();
      }, 2000)
  }

  startReportGeneration() {
    Samples.showLoading('Downloading reports...');
    axios.get(`/projects/${this.state.selectedProjectId}/make_project_reports_csv`).then((res) => {
      Samples.hideLoader();
      this.setState({
        project_id_download_in_progress: this.state.selectedProjectId
      });
      this.displayReportProgress(res);
    }).catch((err) => {
      console.log(err);
    });
  }

  checkReportDownload() {
    axios.get(`/projects/${this.state.project_id_download_in_progress}/project_reports_csv_status`).then((res) => {
      let download_status = res.data.status_display
      if (download_status === 'complete') {
        Samples.hideLoader();
        location.href = `/projects/${this.state.project_id_download_in_progress}/send_project_reports_csv`
        this.setState({
          project_id_download_in_progress: null
        });
      } else {
        this.displayReportProgress(res);
      }
    }).catch((e) => {
      this.setState({
        project_id_download_in_progress: null
      }, () => {
        Materialize.toast(
          `Failed to download report for '${this.state.project.name}'`, 3000,
          'rounded');
      });
    });
  }

  sortSamples() {
    this.sortCount += 1;
    let new_sort, message = '';
    if(this.sortCount === 3) {
      this.sortCount = 0;
      new_sort = 'id,desc';
      message = 'Sorting samples by date created...';
    } else {
      new_sort = (this.state.sort_by === 'name,asc') ? 'name,desc' :  'name,asc';
      message = (new_sort === 'name,asc') ? 'Sorting samples by name (A-Z)...' : 'Sorting samples by name (Z-A)...';
    }
    this.setState({ sort_by: new_sort, pagesLoaded: 0, pageEnd: false }, () => {
      this.setUrlLocation();
      ReportFilter.showLoading(message);
      this.fetchResults(() => {
        ReportFilter.hideLoading();
      });
    });
  }

  columnSorting(e) {
    const className = e.target.className;
    const pos = className.indexOf('sort_by');
    const sort_query = className.substr(pos).split(' ')[0];
    this.setState({ sort_query });
    SortHelper.applySort(sort_query);
  }

  fetchParams(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param)
  }

  updateProjectUserState(email_array) {
    this.setState({project_users: email_array})
  }

  resetForm() {
    $('#add_user_to_project').val('');
    this.setState({
      project_add_email_validation: null,
      invite_status: null
    });
  }

  fetchProjectUsers(id) {
    if (!id || !this.canEditProject(id)) {
      this.updateProjectUserState([])
    } else {
      axios.get(`/projects/${id}/all_emails.json`).then((res) => {
        this.updateProjectUserState(res.data.emails)
      }).catch((error) => {
        this.updateProjectUserState([])
      });
    }
  }

  toggleProjectVisbility(projId, publicAccess) {
    if (projId) {
      axios.put(`/projects/${projId}.json`, {
        public_access: publicAccess,
        authenticity_token: this.csrf
      })
      .then((res) => {
        this.setState({
          project: Object.assign(this.state.project, { public_access: publicAccess })
        });
      })
      .catch((error) => {
        Materialize.toast(
          `Unable to change project visibility for '${this.state.project.name}'`,
          3000, 'rounded');
      });
    }
  }

  displayMetaDataDropdown() {
    this.setState({
      displayDropdown: !this.state.displayDropdown
    });
  }
  updateUserDisplay(email_to_add) {
    let new_project_users = this.state.project_users
    if (!new_project_users.includes(email_to_add)) {
      new_project_users.push(email_to_add)
      this.setState({project_users: new_project_users});
    }
  }

  handleAddUser(e, waitForEnter) {
    if(waitForEnter && e.keyCode !== 13) {
      return;
    } else {
      let email_to_add = this.refs.add_user.value;
      let project_id = this.state.selectedProjectId;
      const isValidEmail = StringHelper.validateEmail(email_to_add);
      if (isValidEmail) {
        this.setState({
          project_add_email_validation: null,
          invite_status: 'sending'
        });
        axios.put(`/projects/${project_id}/add_user`, {
             user_email_to_add: email_to_add,
             authenticity_token: this.csrf
          })
          .then((res) => {
            this.updateUserDisplay(email_to_add);
            this.setState({
              invite_status: 'sent'
            });
        })
      } else {
        this.setState({
          project_add_email_validation: 'Invalid email address, try again?'
        });
      }
    }
  }

  handleSearchChange(e) {
    if (e.target.value !== '') {
      this.setState({ searchParams: e.target.value });
    } else {
      this.setState({
        searchParams: '',
        pageEnd: false,
        pagesLoaded: 0
      }, () => {
        this.setUrlLocation();
        this.fetchResults();
      });
    }
  }

  switchColumn(column_name, position) {
    const columnsShown = Object.assign([], this.state.columnsShown);
    columnsShown[position] = column_name;
    this.setState({ columnsShown });
  }

  appendStatusIcon(status) {
    switch(status) {
      case 'WAITING':
        return <i className="waiting fa fa-arrow-up" aria-hidden="true"></i>;
        break;
      case 'INPROGRESS':
        return <i className="uploading fa fa-repeat" aria-hidden="true"></i>;
        break;
      case 'POST PROCESSING':
        return <i className="uploading fa fa-repeat" aria-hidden="true"></i>;
        break;
      case 'HOST FILTERING':
        return <i className="uploading fa fa-repeat" aria-hidden="true"></i>;
        break;
      case 'ALIGNMENT':
        return <i className="uploading fa fa-repeat" aria-hidden="true"></i>;
        break;
      case 'FAILED':
        return <i className="failed fa fa-times" aria-hidden="true"></i>;
        break;
      case 'COMPLETE':
        return <i className="complete fa fa-check" aria-hidden="true"></i>;
        break;
      default:
        return <i className="waiting fa fa-arrow-up" aria-hidden="true"></i>;
    }
  }

  formatRunTime(runtime) {
    runtime = Number(runtime);
    const h = Math.floor(runtime / 3600);
    const m = Math.floor(runtime % 3600 / 60);
    const s = Math.floor(runtime % 3600 % 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
    const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
  }

  renderPipelineOutput(samples) {
    let BLANK_TEXT = <span className="blank">NA</span>;
    return samples.map((sample, i) => {
      let dbSample = sample.db_sample;
      let derivedOutput = sample.derived_sample_output;
      let runInfo = sample.run_info;
      let uploader = sample.uploader.name;
      let statusClass = !runInfo.job_status_description ? this.applyChunkStatusClass(runInfo) : this.applyClass(runInfo.job_status_description)
      let status = !runInfo.job_status_description ? this.getChunkedStage(runInfo) : runInfo.job_status_description;
      const rowWithChunkStatus = (
        <div className={`${statusClass} status`}>
          {this.appendStatusIcon(status)}
          <span>{status}</span>
        </div>
      );

      const sample_name_info = (
        <span onClick={(e) => this.viewSample(dbSample.id, e)} className='sample-name-info'>
          <div className='card-label top-label'>
            {/*<span className='project-name'>*/}
            {/*Mosquito*/}
            {/*</span>*/}
            <span className='upload-date'>
                Uploaded {moment(dbSample.created_at).startOf('second').fromNow()}
              </span>
          </div>
          <div className='card-label center-label sample-name'>
            {dbSample.name}
          </div>
          <div className='card-label author bottom-label author'>
            { !uploader || uploader === '' ? '' : <span>Uploaded by: {uploader}</span>}
          </div>
        </span>
      )
      const data_values = { total_reads: !derivedOutput.pipeline_run ? BLANK_TEXT : numberWithCommas(derivedOutput.pipeline_run.total_reads),
        nonhost_reads: (!derivedOutput.summary_stats || !derivedOutput.summary_stats.remaining_reads) ? BLANK_TEXT : numberWithCommas(derivedOutput.summary_stats.remaining_reads),
        nonhost_reads_percent: (!derivedOutput.summary_stats || !derivedOutput.summary_stats.percent_remaining) ? '' : <span className="percent"> {`(${derivedOutput.summary_stats.percent_remaining.toFixed(2)}%)`} </span>,
        quality_control: (!derivedOutput.summary_stats || !derivedOutput.summary_stats.qc_percent) ? BLANK_TEXT : `${derivedOutput.summary_stats.qc_percent.toFixed(2)}%`,
        compression_ratio: (!derivedOutput.summary_stats || !derivedOutput.summary_stats.compression_ratio) ? BLANK_TEXT : derivedOutput.summary_stats.compression_ratio.toFixed(2),
        nucleotide_type: dbSample && dbSample.sample_template ? dbSample.sample_template : BLANK_TEXT,
        location: dbSample && dbSample.sample_location ? dbSample.sample_location : BLANK_TEXT,
        host_genome: derivedOutput && derivedOutput.host_genome_name ? derivedOutput.host_genome_name : BLANK_TEXT,
        notes: dbSample && dbSample.sample_notes ? dbSample.sample_notes : BLANK_TEXT };

      return (
        <a className='col s12 no-padding sample-feed' key={i} >
          <div>
            <div className='samples-card white'>
              <div className='flex-container'>
                <ul className='flex-items'>
                  <li className='check-box-container'>
                    { this.state.displaySelectSamplees ? <div><input type="checkbox" id={i} onClick = { this.selectSample }
                      className="filled-in checkbox" value={ this.state.selectedSampleIndices.indexOf(i) != -1 }
                      /> <label htmlFor={i}>{sample_name_info}</label></div> : sample_name_info }
                  </li>
                  {
                    this.state.columnsShown.map((column, pos) => {
                      let column_data = '';
                      if (column === 'pipeline_status') {
                        column_data = (
                          <li  key={pos} onClick={this.viewSample.bind(this, dbSample.id)} >
                            <div className='card-label top-label'>
                              { rowWithChunkStatus }
                            </div>
                            <div className='card-label center-label'>
                              { runInfo.total_runtime ?
                                <span className="time">
                                  <i className="fa fa-clock-o" aria-hidden="true"/>
                                  <span className='duration-label'>
                                    { this.formatRunTime(runInfo.total_runtime) }
                                    </span>
                                </span> : null
                              }
                            </div>
                          </li>
                        )
                      } else if(column === 'nonhost_reads') {
                        column_data = (<li key={pos}>
                          <div className='card-label center center-label data-label'>
                            {data_values[column]} {data_values["nonhost_reads_percent"]}
                          </div>
                        </li>)
                      } else {
                        column_data = (<li key={pos} onClick={this.viewSample.bind(this, dbSample.id)} >
                          <div className='card-label center center-label data-label'>
                            {data_values[column]}
                          </div>
                        </li>)
                      }
                      return column_data;
                    })
                  }
                </ul>
              </div>
            </div>
          </div>
        </a>
      )
    })
  }

  //Load more samples on scroll
  scrollDown() {
    var that = this;
    $(window).scroll(function() {
      if ($(window).scrollTop() > $(document).height() - $(window).height() - 6000) {
        { !that.state.isRequesting && !that.state.pageEnd ? that.loadMore() : null }
        return false;
      }
    });
  }

  //fetch first set of samples
  fetchSamples() {
    Samples.showLoading('Fetching samples...');
    const params = this.getParams();
    axios.get(`/samples?${params}`).then((res) => {
      Samples.hideLoader();
      this.setState((prevState) => ({
        initialFetchedSamples: res.data.samples,
        allSamples: res.data.samples,
        displayEmpty: false,
        pagesLoaded: prevState.pagesLoaded+1,
        totalNumber: res.data.total_count,
        pageEnd: res.data.samples.length < this.pageSize
      }));
      if (!this.state.allSamples.length) {
        this.setState({ displayEmpty: true });
      }
    }).catch((err) => {
      Samples.hideLoader();
      this.setState((prevState) => ({
        allSamples: [],
        displayEmpty: true,
        pagesLoaded: 0,
        pageEnd: prevState.pageEnd
      }))
    })
  }

  //fetch data used by projects page
  fetchProjectPageData() {
    this.fetchSamples();
  }

  //load more paginated samples
  loadMore() {
    const params = this.getParams();
    this.setState({ isRequesting: true })
    axios.get(`/samples?${params}`).then((res) => {
      this.setState((prevState) => ({
        isRequesting: false,
        allSamples: [...prevState.allSamples, ...res.data.samples],
        pagesLoaded: prevState.pagesLoaded+1,
        pageEnd: res.data.samples.length < this.pageSize
      }))
    }).catch((err) => {
      this.setState((prevState) => ({
        isRequesting: false,
        allSamples: [...prevState.allSamples],
        pagesLoaded: prevState.pagesLoaded,
        pageEnd: prevState.pageEnd
      }))
    })
  }

  checkURLContent() {
    if(window.location.href.indexOf("select") > -1) {
      return true;
    } else {
      return false;
    }
  }

  //fetch project, filter and search params
  getParams() {
    let params = `filter=${this.state.filterParams}&page=${this.state.pagesLoaded+1}&search=${this.state.searchParams}&sort_by=${this.state.sort_by}`;
    let projectId = parseInt(this.state.selectedProjectId);

    if(projectId) {
      params += `&project_id=${projectId}`
    }
    if(this.state.sampleIdsParams.length) {
      let sampleParams = this.state.sampleIdsParams;
      params += `&ids=${sampleParams}`
    }

    if(this.state.selectedTissueFilters.length) {
      let tissueParams = this.state.selectedTissueFilters;
      params += `&tissue=${tissueParams.join(',')}`
    }

    if(this.state.selectedHostIndices.length) {
      let hostParams = this.state.selectedHostIndices;
      params += `&host=${hostParams.join(',')}`
    }
    return params;
  }

  //fetch results from filtering, search or switching projects
  fetchResults(cb) {
    Samples.showLoading('Fetching samples...');
    const params = this.getParams();
    axios.get(`/samples?${params}`).then((res) => {
      Samples.hideLoader();
      this.setState((prevState) => ({
        initialFetchedSamples: res.data.samples,
        allSamples: res.data.samples,
        displayEmpty: false,
        totalNumber: res.data.total_count,
        pagesLoaded: prevState.pagesLoaded+1,
        pageEnd: res.data.samples.length < this.pageSize
      }));
      if (!this.state.allSamples.length) {
        this.setState({ displayEmpty: true });
      }
      if(typeof cb === 'function') {
        cb();
      }
    }).catch((err) => {
      Samples.hideLoader();
      this.setState({
        initialFetchedSamples: [],
        allSamples: [],
        displayEmpty: true,
      });
      if(typeof cb === 'function') {
        cb();
      }
    })
  }

  applyClass(status) {
    if(status === 'COMPLETE') {
      return 'complete';
    } else if (status === 'WAITING') {
      return 'waiting';
    } else if (status === 'INPROGRESS') {
      return 'uploading';
    } else if (status === 'FAILED') {
      return 'failed';
    }
  }

  applyChunkStatusClass(runInfo) {
    let postProcess = runInfo['Post Processing']
    let hostFiltering = runInfo['Host Filtering']
    let alignment = runInfo['GSNAPL/RAPSEARCH alignment']
    if (postProcess) {
      return postProcess === 'LOADED' ? 'complete' : 'uploading';
    } else if(alignment) {
      return alignment === 'FAILED' ? 'failed' : 'uploading';
    } else if(hostFiltering) {
      return hostFiltering === 'FAILED' ? 'failed' : 'uploading';
    }
  }

  getChunkedStage(runInfo) {
    let postProcess = runInfo['Post Processing']
    let hostFiltering = runInfo['Host Filtering']
    let alignment = runInfo['GSNAPL/RAPSEARCH alignment']
    if (postProcess === 'FAILED' || alignment === 'FAILED' || hostFiltering === 'FAILED') {
      return 'FAILED';
    } else if (postProcess) {
      if (postProcess === 'LOADED')
        return 'COMPLETE';
      else
        return  'POST PROCESSING';
    } else if (alignment) {
      return 'ALIGNMENT';
    } else if (hostFiltering) {
      return 'HOST FILTERING';
    }  else {
      return 'WAITING';
    }
  }

  //handle search when query is passed
  handleSearch(e) {
    if (e.target.value !== '' && e.key === 'Enter') {
      Samples.showLoading(`Searching for samples that match ${e.target.value}...`)
      this.setState({
        pagesLoaded: 0,
        pageEnd: false,
        searchParams: e.target.value
      }, () => {
        Samples.hideLoader();
        this.setUrlLocation();
        this.fetchResults();
      });
    }
  }

  fetchProjectDetails(projId) {
    if (!projId) {
      this.setState({
        selectedProjectId: null,
        project: null,
        pagesLoaded: 0,
        pageEnd: false,
      });
      this.fetchSamples();
    } else {
      projId = parseInt(projId);
      axios.get(`projects/${projId}.json`).then((res) => {
        this.setState({
          pagesLoaded: 0,
          project: res.data
        });
        this.fetchProjectUsers(projId);
        this.fetchResults();
      }).catch((err) => {
        this.setState({ project: null })
      })
    }
  }

  viewSample(id, e) {
    e.preventDefault();
    // _satellite.track('viewsample')
    $(".checkAll, .checkbox").prop('checked', false);
    location.href = `/samples/${id}`;
  }

  getActiveSort(className) {
    if(className) {
      const sort = SortHelper.getFilter('sort_by');
      if (sort === className) {
        return 'active';
      } else if (className === this.defaultSortBy && !sort) {
        return 'active';
      }
    }
  }

  toggleDisplayProjects() {
    this.setState((prevState) => ({ showLess: !prevState.showLess }))
  }

  renderEmptyTable() {
    return (
      <div className="center-align"><i className='fa fa-frown-o'> No result found</i></div>
    )
  }

 displayDownloadDropdown() {
  $('.download-dropdown').dropdown({
    constrainWidth: false, // Does not change width of dropdown to that of the activator
    gutter: 0, // Spacing from edge
    belowOrigin: true, // Displays dropdown below the button
    alignment: 'left', // Displays dropdown with edge aligned to the left of button
    stopPropagation: true // Stops event propagation
  });
 }

  findSelectedColumns(selO) {
    const selValues = [];
    for (let i=0; i < selO.length; i++) {
      const column_name = selO.options[i].value;
      if (selO.options[i].selected && column_name !== "") {
        selValues.push(column_name);
      }
    }
    return selValues;
  }

  handleColumnSelectChange(e) {
    const selected_columns = this.findSelectedColumns(e.target);
    this.setState({columnsShown: selected_columns});
  }

  columnHidden(column) {
    return !this.state.columnsShown.includes(column)
  }

  display_column_options(column_map, data_type) {
    const column_list = Object.keys(column_map)
    return column_list.map((option_name, i) => {
      if (column_map[option_name].type === data_type) {
        return (
          <option key={option_name} id={option_name} value={option_name}>
            {column_map[option_name].display_name}
          </option>
        )
      }
    })
  }

  addFavIconClass(project) {
    return (
      <i data-status="favorite" data-fav={project.favorited} data-id={project.id} onClick={this.toggleFavorite} className={!project.favorited ? "favorite fa fa-star-o":  "favorite fa fa-star"}></i>
    )
  }

  initializeSelectAll() {
    // select all checkboxes
    var that = this;
    $('.checkAll').click(function(e) {
      var checked = e.currentTarget.checked;
      $('.checkbox').prop('checked', checked);
      var checkedCount = $("input:checkbox:checked").length
      that.setState({
        allChecked: checked,
        checkedBoxes: checkedCount
      });
    }); 
  }


  fetchAllSelectedIds(checked) {
    var that = this;
    $('.checkbox').each((id, element) => {
      let sampleList = that.state.selectedSampleIndices;
      if (checked) {
        if (sampleList.indexOf(id) === -1) {
          sampleList.push(+id);
        }
      } else {
        sampleList = []
      }
    that.setState({ selectedSampleIndices: sampleList })
    });
  }

  compareSamples() {
    let params;
    if(this.state.allChecked) {
      this.fetchAllSelectedIds(this.state.allChecked);
    } 
    if(this.state.selectedSampleIndices.length) {
      let sampleParams = this.state.selectedSampleIndices;
      location.href = `/samples/heatmap?sample_ids=${sampleParams}`
    }
  }

  selectSample(e) {
    console.log('got called');
    e.stopPropagation();
    $(".checkAll").prop('checked', false);
    this.setState({
      allChecked: false
    });
    // current array of options
    const sampleList = this.state.selectedSampleIndices

    let index
    // check if the check box is checked or unchecked
 
    if (e.target.checked) {
      // add the numerical value of the checkbox to options array
      sampleList.push(+e.target.id)
    } else {
      // or remove the value from the unchecked checkbox from the array
      index = sampleList.indexOf(+e.target.id)
      sampleList.splice(index, 1)
    }
    var checkedCount = $("input:checkbox:checked").length
    // update the state with the new array of options
    this.setState({ 
      selectedSampleIndices: sampleList,
      checkedBoxes: checkedCount
     })
  }


  downloadTable(id) {
    _satellite.track('downloadtable');
    location.href = `/projects/${id}/csv`;
  }

  renderTable(samples) {
    let project_id = this.state.selectedProjectId ? this.state.selectedProjectId : 'all'
    let search_field_width = (project_id === 'all') ? 'col s4 no-padding' : 'col s2 no-padding'
    let search_field = (
      <div className={search_field_width + ' search-field'}>
        <div className='row'>
          <i className="fa search-icon left fa-search"></i>
          <input id="search"
            value={this.state.searchParams}
            onChange={this.handleSearchChange}
            onKeyDown={this.handleSearch}
            className="search col s12"
            placeholder='Search'/>
        </div>
      </div>
    );
    let table_download_button = (
      <div className='col s2 download-table'>
        <div className='white'>
          <a href={`/projects/${project_id}/csv`} className="download-project center">
            <i className="fa fa-cloud-download"/>
            <span>Download table</span>
          </a>
        </div>
      </div>
    );

    let check_all = (
      <div className="check-all">
          <input type="checkbox"
            id="checkAll"
            className="filled-in checkAll"
            />
          <label htmlFor="checkAll"></label>
          <i className="fa fa-caret-down"></i>    
      </div>
    );

    let compare_button = (
      <div className='col s2 download-table'>
        <div className='white'>
          <a onClick={this.compareSamples} className="compare center">
            <span>Compare</span>
          </a>
        </div>
      </div>
    )

    const reports_download_button_contents = this.state.project_id_download_in_progress ?
      <span className='download-progress'/>
      : <a onClick={this.startReportGeneration} className="download-project center">
                                             <i className="fa fa-cloud-download"/>
                                             <span>Download reports</span>
                                           </a>
    const reports_download_button = (
      <div className='col s2 download-table'>
        <div className='white'>
          { reports_download_button_contents }
        </div>
        {/*Dropdown menu*/}
        <ul id='download-dropdown' className='dropdown-content'>
          <li><a href={`/projects/${project_id}/csv`}>Download Table</a></li>
          { project_id === 'all' ? null : <li><a onClick={this.startReportGeneration}> Download Reports</a></li> }
        </ul>
      </div>
    );

    const metaDataFilter = (
      <div>
        <div className="col s2 metadata">
            <div className='metadata-dropdown' onClick={this.displayMetaDataDropdown}>
            Metadata </div><i className="fa fa-angle-down" onClick={this.displayMetaDataDropdown}></i>
              { this.state.displayDropdown ? <div className="row metadata-options">
                <div className="col s6">
                  <h6>Host</h6>
                { this.hostGenomes.map((host, i) => {
                  return (
                    <div key={i} className="options-wrapper">
                      <input name="host" type="checkbox" data-id={host.id} checked={this.state.selectedHostIndices.indexOf(host.id) < 0 ? "" : "checked"} value={this.state.selectedHostIndices.indexOf(i) != -1 } onChange={this.selectHostFilter}
                        id={host.id} className="filled-in human" />
                      <label htmlFor={host.id}>{host.name}</label>
                    </div>
                  )
                })}
                  </div>
              <div className="col s6">
              <h6>Tissue type</h6>
                {this.tissue_types.map((tissue, i) => {
                  return (
                    <div key={i} className="options-wrapper"> 
                    <input name="tissue" type="checkbox"
                    id={tissue} className="filled-in" data-status={tissue} checked={this.state.selectedTissueFilters.indexOf(tissue) < 0 ? "" : "checked"} onChange={this.selectTissueFilter} />
                    <label htmlFor={tissue}>{tissue}</label>
                  </div>  
                  )
                })}
              </div>
            </div> : null }
      </div>
      </div>
    )
    
    const search_box = (
      <div className="row search-box">
        { this.state.displaySelectSamplees ? check_all : null }
        { search_field }
        { metaDataFilter  }
        { table_download_button }
         { this.state.checkedBoxes > 0  ? compare_button : null }
        { project_id === 'all' ? null : reports_download_button }
      </div>
    );

    let addUser = (
      <div id="modal1" className="modal project-popup">
        <div className="modal-content">
          <div className='project_modal_header'>
            Project Members and Access Control
          </div>
          <div className='project_modal_title'>
            { this.state.project? this.state.project.name : null }
          </div>
          <div className='project_modal_visiblity'>
            {this.state.project ? (
              this.state.project.public_access ?
               <span>
                  <i className="tiny material-icons">lock_open</i>
                  <span className='label'>Public Project</span>
                  <a href='#'
                    onClick={() => this.toggleProjectVisbility(
                      this.state.project.id, 0)}>
                    Make project private
                  </a>
               </span>:
               <span>
                 <i className="tiny material-icons">lock</i>
                    <span className='label'>Private Project</span>
                    <a href='#'
                      onClick={() => this.toggleProjectVisbility(
                        this.state.project.id, 1)}>
                      Make project public
                    </a>
               </span>
            ) : null}
          </div>

          <div className='add_member row'>
            <input ref="add_user" id='add_user_to_project' type="email"
              placeholder='Add project members by email'
              onKeyDown={(e) => this.handleAddUser(e, true)}
              className="validate col s12 browser-default"/>
            <span className='add_member_action'
              onClick={ this.handleAddUser }>Add member</span>
            <div className='error-message'>
              { this.state.project_add_email_validation }
            </div>
            {
              (this.state.invite_status === 'sending') ?
              <div className='status-message'>
                <i className="fa fa-circle-o-notch fa-spin fa-fw"></i>
                 Hang tight, sending invitation...
              </div> : null
            }
            {
              (this.state.invite_status === 'sent') ?
              <div className='status-message success teal-text text-darken-2'>
                <i className="fa fa-smile-o fa-fw"></i>
                 Yay! User has been added
              </div> : null
            }
          </div>

          <div className='members_list'>
            <div className='list_title'>
              <i className="tiny material-icons">person_add</i> Project Members
            </div>
            <ul>
              { this.state.project_users.length > 0 ?
                  this.state.project_users.map((email) => { return <li key={email}>{email}</li> })
                  : <li key="None">None</li>
              }
            </ul>
          </div>
          <button className='modal-close'>
            Close
          </button>
        </div>
      </div>
    );

    const project_menu = (
      <div className='right'>
        <ul className='project-menu'>
          <li>
            { this.state.project ? (
              this.state.project.public_access ?
               <span>
                 <i className="tiny material-icons">lock_open</i> Public project
               </span>:
               <span>
                 <i className="tiny material-icons">lock</i> Private project
               </span>
            ) : null }
          </li>
          <li>
              { this.state.project && this.canEditProject(this.state.project.id) ? (
                this.state.project_users.length ?
                <span>
                  <i className="tiny material-icons">people</i>
                    {this.state.project_users.length}
                    { (this.state.project_users.length > 1) ? ' members' : ' member'}
                </span>
                : <span>
                    No member
                  </span>
              ) : null }

          </li>
          <li className='add-member'>
            { this.state.project && this.canEditProject(this.state.project.id) ? (
            <a className='modal-trigger' href="#modal1" onClick={this.resetForm}>
              Add user
            </a>) : null }
          </li>
        </ul>
      </div>
    );

    const projInfo = (
      <div>
        {
          this.state.selectedProjectId ? project_menu : null
        }
        <div className="wrapper">
          <div className={(!this.state.project) ? "proj-title heading all-proj" : "heading proj-title"}>
          { (!this.state.project) ? <div className="">All Projects</div>
              : <div>
                  <span className="">{ this.state.project.name }</span>
                </div>
          }
        </div>
          <p className="subheading col no-padding s12">
          { this.state.allSamples.length === 0 ? 'No sample found'
            : ( this.state.allSamples.length === 1 ? '1 sample found'
              : `Showing ${this.state.allSamples.length} out of ${this.state.totalNumber} total samples`)
          }
        </p>
        </div>
      </div>
    );


   const filterStatus = (
        <div className='dropdown-status-filtering'>
          <li>
            <a className="title">
              <b>Filter status</b>
            </a>
          </li>
          <li className="filter-item" data-status="WAITING" onClick={ this.handleStatusFilterSelect } ><a data-status="WAITING" className="filter-item waiting">Waiting</a><i data-status="WAITING" className="filter fa fa-check hidden"></i></li>
          <li className="filter-item" data-status="UPLOADING" onClick={ this.handleStatusFilterSelect }><a data-status="UPLOADING" className="filter-item uploading">In Progress</a><i data-status="UPLOADING"  className="filter fa fa-check hidden"></i></li>
          <li className="filter-item" data-status="CHECKED" onClick={ this.handleStatusFilterSelect }><a data-status="CHECKED" className="filter-item complete">Complete</a><i data-status="CHECKED" className="filter fa fa-check hidden"></i></li>
          <li className="filter-item" onClick={ this.handleStatusFilterSelect } data-status="FAILED" ><a data-status="FAILED" className="filter-item failed">Failed</a><i data-status="FAILED" className="filter fa fa-check hidden"></i></li>
          <li className="filter-item" data-status="ALL" onClick={ this.handleStatusFilterSelect }><a data-status="ALL" className="filter-item all">All</a><i data-status="ALL" className="filter all fa fa-check hidden"></i></li>
          <li className="divider"/>
        </div>
   )

    const tableHead = (
      <div className='col s12 sample-feed-head no-padding samples-table-head'>
        <div className='samples-card white'>
          <div className='flex-container'>
            <ul className='flex-items'>
              <li className='sample-name-info'>
                <div className='card-label column-title center-label sample-name'>
                  <div className='sort-able' onClick={this.sortSamples}>
                    <span>Name</span><i className={`fa ${(this.state.sort_by === 'name,desc')
                    ? 'fa fa-sort-alpha-desc' : 'fa fa-sort-alpha-asc'}
                  ${(this.state.sort_by === 'name,desc' || this.state.sort_by === 'name,asc') ? 'active': 'hidden'}`}/>
                  </div>
                </div>
              </li>
              { this.state.columnsShown.map((column_name, pos) => {
                return (
                  <li key={`shown-${pos}`}>
                    {
                      this.COLUMN_DISPLAY_MAP[column_name].tooltip ?
                      <Tipsy position='bottom'
                        content={this.COLUMN_DISPLAY_MAP[column_name].tooltip}>
                        <div className='card-label column-title center-label sample-name center menu-dropdown'
                          data-activates={`column-dropdown-${pos}`}>
                          {this.COLUMN_DISPLAY_MAP[column_name].display_name } <i className="fa fa-caret-down"/>
                        </div>
                      </Tipsy>
                      :
                      <div className='card-label column-title center-label sample-name center menu-dropdown'
                        data-activates={`column-dropdown-${pos}`}>
                        {this.COLUMN_DISPLAY_MAP[column_name].display_name } <i className="fa fa-caret-down"/>
                      </div>
                    }
                    <ul className='dropdown-content column-dropdown' id={`column-dropdown-${pos}`}>
                        { column_name === 'pipeline_status' ?
                          <div>{filterStatus}</div> : null 
                        }
                        <li>
                          <a className="title">
                            <b>Switch column</b>
                          </a>
                        </li>
                        {this.state.allColumns.map((name, i) => {
                          return (
                            (this.state.columnsShown.includes(name)) ?
                              <li key={`all-${i}`} className={`disabled column_name ${column_name === name ? 'current': ''}`}>
                                { this.COLUMN_DISPLAY_MAP[name].display_name }
                                {(column_name === name) ?
                                  <i className="fa fa-check right"/> : null}
                              </li>
                              : <li key={`all-${i}`} className='selectable column_name' onClick={() => this.switchColumn(name, pos)}>
                                { this.COLUMN_DISPLAY_MAP[name].display_name }
                              </li>
                          )
                        })
                        }
                      </ul>
                    </li>
                  )
                })
                }
              </ul>
          </div>
        </div>
      </div>
    );

    return (
      <div className="row content-wrapper">
        <div className="project-info col s12">
          { projInfo } { addUser }
        </div>

        <div className="sample-container no-padding col s12">
          { search_box }
          <div className="sample-table-container row">
            { tableHead }
            { !samples.length && this.state.displayEmpty ? this.renderEmptyTable() : this.renderPipelineOutput(samples)  }
          </div>
        </div>
        { !this.state.pageEnd && this.state.allSamples.length > 14 ? <div className="scroll">
        <i className='fa fa-spinner fa-spin fa-3x'></i>
        </div> : "" }
      </div>
    )
  }


  componentDidUpdate(prevProps, prevState) {
    const prevStatus = prevState.filterParams;
    const currentStatus = this.state.filterParams;
    if(prevStatus !== currentStatus) {
      $(`i[data-status="${prevStatus}"]`).removeClass('active');
    } else {
      $(`i[data-status="${currentStatus}"]`).addClass('active');
    }
  }

  componentDidMount() {
    const textSize = 14;
    $(() => {
      const win = $(window);
      const samplesHeader = $('.sample-table-container');
      win.scroll(() => {
        let scrollTop = $(window).scrollTop();
        if (scrollTop > samplesHeader.offset().top) {
          samplesHeader.addClass('shadow');
        } else {
          samplesHeader.removeClass('shadow');
        }
      });
      $('.filter').hide();
    });
    this.initializeSelectAll();
    this.initializeTooltip();
    this.fetchProjectPageData();
    this.state.selectedProjectId ? this.fetchProjectDetails(this.state.selectedProjectId) : null;
    this.scrollDown();
    // this.initializeProjectList();
    this.displayPipelineStatusFilter();
    this.initializeColumnSelect();
    $(".dropdown-content>li>a").css("font-size", textSize)
  }

  initializeColumnSelect() {
    $(document).ready(function() {
      $('select').material_select();
    });
    $(ReactDOM.findDOMNode(this.refs.columnSelector)).on('change',this.handleColumnSelectChange.bind(this));
  }

  // initialize filter dropdown
  displayPipelineStatusFilter() {
    $('.status-dropdown, .menu-dropdown').dropdown({
      belowOrigin: true,
      stopPropagation: false,
      constrainWidth: false
    });
  }

  displayCheckMarks(filter) {
    $('.filter').hide();
    $(`.filter[data-status="${filter}"]`).show();
  }

  //handle filtering when a filter is selected from list
  handleStatusFilterSelect(e) {
    let status = e.target.getAttribute('data-status');
    this.setState({
      pagesLoaded: 0,
      pageEnd: false,
      filterParams: status
    }, () => {
      this.setUrlLocation();
      this.fetchResults();
    });
  }

  //handle filtering when a host filter is selected from list
  handleHostFilterSelect(hostParams) {
    this.setState({
      pagesLoaded: 0,
      pageEnd: false,
      hostParams: hostParams
    }, () => {
      this.setUrlLocation();
      this.fetchResults();
    });
  }

  handleTissueFilterSelect(tissueParams) {
      this.setState({
        pagesLoaded: 0,
        pageEnd: false,
        tissueParams: tissueParams
      }, () => {
        this.setUrlLocation();
        this.fetchResults();
      });
  }

  //set Url based on requests
  setUrlLocation() {
    let projectId = parseInt(this.state.selectedProjectId);
    const params = {
      project_id: projectId ? projectId : null,
      filter: this.state.filterParams,
      tissue: this.state.tissueParams,
      host: this.state.hostParams,
      search: this.state.searchParams,
      sort_by: this.state.sort_by,
      type: this.state.projectType
    };
    window.history.replaceState(null, null, `?${$.param(params)}`)
  }

  handleProjectSelection(id, listType) {
    this.setState({
      selectedProjectId: id,
      pagesLoaded: 0,
      pageEnd: false,
      projectType: listType
    }, () => {
      this.setUrlLocation();
      this.fetchProjectDetails(id);
      this.fetchProjectUsers(id)
    });
  }

  render() {
    const project_section =
      <ProjectSelection
        favoriteProjects = { this.favoriteProjects }
        allProjects = { this.allProjects }
        csrf = { this.csrf }
        selectProject = { this.handleProjectSelection }
      />;

    return (
      <div className="row content-body">
        <div className='col no-padding s2 sidebar'>
          <StickySidebar>
            { project_section }
          </StickySidebar>
        </div>
        <div className="col no-padding samples-content s10">
          { this.renderTable(this.state.allSamples) }
        </div>
      </div>
    )
  }

}
export default Samples;
