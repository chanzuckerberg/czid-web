class Samples extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.project = props.project || null;
    this.projectId = this.project ? this.project.id : null;
    this.samples = props.unfiltered;
    this.samplesCount = props.samples_count;
    this.switchProject = this.switchProject.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    // this.outputData = props.outputData || [];
    // this.pipelineRunInfo = props.pipeline_run_info || [];
    this.all_project = props.all_project|| [];
    // this.filteredJobs = props.filtered || []
    // this.filteredJobsComplete = {
    //   samples: this.filteredJobs.complete_jobs || [],
    //   outputData: this.filteredJobs.completed_info.final_result || [],
    //   pipelineRunInfo: this.filteredJobs.completed_info.pipeline_run_info
    // }
    // this.filteredJobsFailed = {
    //   samples: this.filteredJobs.failed_jobs,
    //   outputData: this.filteredJobs.failed_info.final_result || [],
    //   pipelineRunInfo: this.filteredJobs.failed_info.pipeline_run_info
    // }
    this.defaultSortBy = 'newest';
    const currentSort = SortHelper.currentSort();
    this.state = {
      showSearchLoader: false,
      urlProjectId: this.fetchUrlParamsProjectId() || null,
      displayedSamples: this.samples || [],
      samplesCount: this.samplesCount,
      sort_query: currentSort.sort_query
      ? currentSort.sort_query  : `sort_by=${this.defaultSortBy}`,
    };
    this.columnSorting = this.columnSorting.bind(this);
    this.filterByStatus = this.filterByStatus.bind(this)
  }

  columnSorting(e) {
    const className = e.target.className;
    const pos = className.indexOf('sort_by');
    const sort_query = className.substr(pos).split(' ')[0];
    this.setState({ sort_query });
    SortHelper.applySort(sort_query);
  }

  renderEmptyTable() {
    return (
      <div className="center-align"><i className='fa fa-frown-o'> No result found</i></div>
    )
  }

  renderPipelineOutput(samples) {
    return samples.map((sample, i) => {
      let job = sample.job;
      let statistics = sample.statistics;
      let runInfo = sample.run_info
      return (
        <tr onClick={ this.viewSample.bind(this, job.id)} key={i}>
          <td>
            {job.name}
          </td>
          <td>{moment(job.created_at).format(' L,  h:mm a')}</td>
          <td>{ !statistics.pipeline_output ? 'NA' : <a href={'/samples/' + job.id}>{numberWithCommas(statistics.pipeline_output.total_reads)}</a>}</td>
          <td>{ (!statistics.summary_stats || !statistics.summary_stats.remaining_reads) ? 'NA' : <a href={'/samples/' + job.id}>{numberWithCommas(statistics.summary_stats.remaining_reads)}</a>}</td>
          <td>{ (!statistics.summary_stats || !statistics.summary_stats.percent_remaining) ? 'NA' : <a href={'/samples/' + job.id}>{statistics.summary_stats.percent_remaining.toFixed(2)}%</a>}</td>
          <td>{ (!statistics.summary_stats || !statistics.summary_stats.qc_percent) ? 'NA' : <a href={'/samples/' + job.id}>{statistics.summary_stats.qc_percent.toFixed(2)}%</a>}</td>
          <td>{ (!statistics.summary_stats || !statistics.summary_stats.compression_ratio) ? 'NA' : <a href={'/samples/' + job.id}>{statistics.summary_stats.compression_ratio.toFixed(2)}</a>}</td>
          <td className={this.applyClass(runInfo.job_status_description)}>{ !runInfo.job_status_description ? '' : <a href={'/samples/' + job.id}>{runInfo.job_status_description}</a>}</td>
        </tr>
      )
    })
  }

  applyClass(status) {
    if(status === 'COMPLETE') {
      return 'complete';
    } else if (status === 'UPLOADING' || status === 'IN PROGRESS') {
      return 'uploading';
    } else if (status === 'INITIALIZING') {
      return 'initializing';
    } else {
      return 'failed';
    }
  }

  fetchUrlParamsProjectId() {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('project_id')
  }

  handleSearch(e) {
    if (e.target.value !== '' && e.key === 'Enter') {
      this.setState({ showSearchLoader: true })
      if (this.state.urlProjectId ) {
        let projectId = parseInt(this.state.urlProjectId)
        this.setState({ showSearchLoader: false })
        location.href = `?project_id=${projectId}&search=${e.target.value}`
      } else {
        this.setState({ showSearchLoader: false })
        location.href = `?search=${e.target.value}`
      }
    }
  }

  switchProject(e) {
    let id = e.target.getAttribute('data-id')
    this.setState({
      urlProjectId: id
    })
    location.href = `?project_id=${id}`
  }

  viewSample(id) {
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

  renderTable(samples) {
    return (
    <div className="content-wrapper">
      <div className="sample-container">
        <div className="row search-box">
          <span className="icon"><i className="fa fa-search" aria-hidden="true"></i></span>
          <input id="search" type="search" onKeyPress={this.handleSearch} className="search" placeholder='Search for Sample'/>{ this.state.showSearchLoader ? <i className='fa fa-spinner fa-spin fa-lg'></i> : null }
        </div>
          {/* Dropdown menu */}
          <ul id='dropdownstatus' className='status dropdown-content'>
          <li><a href="#!" className="title"><b>Filter by Pipeline run status</b></a></li>
            <li className="divider"></li>
            <li data-status="COMPLETE" onClick={ this.filterByStatus }><a data-status="COMPLETE" className="complete" href="#!">Complete</a></li>
            <li onClick={ this.filterByStatus }><a className="running" href="#!">In Progress</a></li>
            <li onClick={ this.filterByStatus } data-status="FAILED" ><a data-status="FAILED" className="failed" href="#!">Failed</a></li>
            <li><a className="uploading" href="#!">Uploading</a></li>
            <li><a className="initializing" href="#!">Initializing</a></li>
            <li className="divider"></li>
            <li data-status="ALL" onClick={ this.filterByStatus }  ><a data-status="ALL" className="initializing" href="#!">All</a></li>
          </ul>
          <table className="bordered highlight samples-table">
            <thead>
            <tr>
              <th>Name</th>
              <th>Date Uploaded
              <div className='sort-controls left'>
                <i onClick={ this.columnSorting } className={`${this.getActiveSort('oldest')} fa fa-caret-up sort_by=oldest` }></i>
                <i onClick={ this.columnSorting } className={`${this.getActiveSort('newest')} fa fa-caret-down sort_by=newest` }></i>
              </div>
              </th>
              <th>Total Reads</th>
              <th>Final Reads</th>
              <th>Percentage Reads</th>
              <th>QC</th>
              <th>Compression Ratio</th>
              <th className="status-dropdown" data-activates="dropdownstatus"><a href="#!" data-activates="dropdownstatus"><i className="status-filter fa fa-caret-down"></i></a>Pipeline run status</th>
            </tr>
            </thead>
              { samples.length ? <tbody>{this.renderPipelineOutput(samples)}</tbody> : null }
          </table>
          { !samples.length ? this.renderEmptyTable() : null }
      </div>
    </div>
    )
  }

  gotoPage(path) {
    location.href = `${path}`;
  }

  componentDidMount() {
    $('.project-toggle').click((e) => {
      e.stopPropagation();
      const arrowElement = $(e.toElement)[0];
      const top = arrowElement.offsetTop;
      const height = arrowElement.offsetHeight;
      const width = arrowElement.offsetWidth;
      const left = arrowElement.offsetLeft;
      $('.dropdown-bubble').css({ top: `${(top + height) + 20}px`, left: `${(left - width) - 5}px`});
      $('.dropdown-bubble').slideToggle(200);
    });
    $(document).click(() => { $('.dropdown-bubble').slideUp(200); });
    this.displayPipelineStatusFilter();
  }

  displayPipelineStatusFilter() {
    // $('.status-button').dropdown('open')
    $('.status-dropdown').dropdown({
      belowOrigin: true,
      stopPropagation: false,
      hover: true,
      constrainWidth: true
    })
  }

  filterByStatus(e) {
    console.log('got called filter')
    var that = this;
    let status = e.target.getAttribute('data-status');
    console.log(status);
    switch(status) {
      case 'COMPLETE':
        that.setState({
          displayedSamples: this.filteredJobsComplete.samples,
          displayedPipelineRunInfo: this.filteredJobsComplete.pipelineRunInfo,
          displayedOutputData: this.filteredJobsComplete.outputData
        })
        console.log('got called complete', "filtered state:", this.filteredJobsComplete.samples, this.state, 'after complete filtering')
        break;
      case 'FAILED':
        that.setState({
          displayedSamples: this.filteredJobsFailed.samples,
          displayedPipelineRunInfo: this.filteredJobsFailed.pipelineRunInfo,
          displayedOutputData: this.filteredJobsFailed.outputData
        })
        break;
      case 'ALL':
        that.setState({
          displayedSamples: this.samples,
          displayedPipelineRunInfo: this.pipelineRunInfo,
          displayedOutputData: this.outputData
        })
        break;
      default:
        that.setState({
          displayedSamples: this.samples,
          displayedPipelineRunInfo: this.pipelineRunInfo,
          displayedOutputData: this.outputData
        })
    }
  }

  render() {
    return (
      <div>
        <div className="sub-header-home">
          <div className="sub-header-items">
            <div className="content">

            <div onClick={ this.gotoPage.bind(this, '/samples/new') }   className="upload">
                <i className="fa fa-flask" aria-hidden="true"></i>
                <span>Upload Sample</span>
              </div>

              <div className="sub-title">
                <span>{ (!this.project) ? 'All projects' : this.project.name }<i className='fa fa-angle-down project-toggle'></i></span> 
                <div className='dropdown-bubble'>
                  <div className="dropdown-container">
                    <ul>
                      <li className="title">
                        <a href="/">All projects </a>
                      </li>
                      { this.all_project.map((project, i) => {
                        return (
                          <li key={i}>
                            <a data-id={project.id} onClick={this.switchProject} >
                              { project.name }
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
             
              <div className="title-filter">
                <span><i>{this.state.samplesCount === 0 ? 'No sample found' : ( this.state.samplesCount === 1 ? '1 sample found' : `${this.state.samplesCount} samples found`)}</i></span>
              </div>
            </div>
          </div>
        </div>
          {!this.state.displayedSamples ? <div className="no-data"><i className="fa fa-frown-o" aria-hidden="true"> No data to display</i></div> : this.renderTable(this.state.displayedSamples)}
      </div>
    )
  }

}
