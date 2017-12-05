class Samples extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.project = props.project || null;
    this.projectId = this.project ? this.project.id : null;
    this.samples = props.unfiltered;
    this.samplesCount = props.samples_count;
    this.switchProject = this.switchProject.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.all_project = props.all_project|| [];
    this.defaultSortBy = 'newest';
    const currentSort = SortHelper.currentSort();
    this.columnSorting = this.columnSorting.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.filterByStatus = this.filterByStatus.bind(this)
    this.state = {
      urlProjectId: this.fetchParams('project_id') || null,
      urlFilterQuery: this.fetchParams('filter') || null,
      urlSearchQuery: this.fetchParams('search') || '',
      displayedSamples: this.samples || [],
      samplesCount: this.samplesCount,
      sort_query: currentSort.sort_query
      ? currentSort.sort_query  : `sort_by=${this.defaultSortBy}`,
      checkFilter: false
    };
    $("#pagination").css("display", "");
  }

  columnSorting(e) {
    const className = e.target.className;
    const pos = className.indexOf('sort_by');
    const sort_query = className.substr(pos).split(' ')[0];
    this.setState({ sort_query });
    SortHelper.applySort(sort_query);
  }

  renderEmptyTable() {
    $("#pagination").css("display", "none");
    return (
      <div className="center-align"><i className='fa fa-frown-o'> No result found</i></div>
    )
  }

  handleSearchChange(e) {
    if (e.target.value !== '') {
      this.setState({ urlSearchQuery: e.target.value });
    } else {
      this.setState({ urlSearchQuery: '' });
      this.displayResultsByParams(this.state.urlProjectId, e.target.value, this.state.urlFilterQuery);
    }
  }


  appendStatusIcon(status) {
    switch(status) {
      case 'WAITING':
        return <i className="waiting fa fa-arrow-up" aria-hidden="true"></i>;
        break;
      case 'INPROGRESS':
        return <i className="uploading fa fa-repeat" aria-hidden="true"></i>;
        break;
      case 'HOST FILTERING':
        return <i className="uploading fa fa-repeat" aria-hidden="true"></i>;
        break;
      case 'ALIGNEMENT':
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
    var h = Math.floor(runtime / 3600);
    var m = Math.floor(runtime % 3600 / 60);
    var s = Math.floor(runtime % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay; 
}

  renderPipelineOutput(samples) {
    var BLANK_TEXT = ''

    return samples.map((sample, i) => {
      let dbSample = sample.db_sample;
      let derivedOutput = sample.derived_sample_output;
      let runInfo = sample.run_info
      let uploader = sample.uploader.name
      let statusClass = !runInfo.job_status_description ? this.applyChunkStatusClass(runInfo) : this.applyClass(runInfo.job_status_description)
      let status = !runInfo.job_status_description ? this.getChunkedStage(runInfo) : runInfo.job_status_description

      rowWithChunkStatus = (
        <div className={statusClass}>
          <span>{this.appendStatusIcon(status)}</span><p className="status">{status}</p>
        </div>
      );
      rowWithoutChunkStatus = (
        <div className={statusClass}>
          <span>{this.appendStatusIcon(status)}</span><p className="status">{status}</p>
        </div>
      )

      return (
        <div className="row job-container" onClick={ this.viewSample.bind(this, dbSample.id)} key={i}>
          <div className="job-card">
            <div className="col s4">
              <p className="sample-name">{dbSample.name}</p>
              <p className="uploader">
                <span>Uploaded {moment(dbSample.created_at).startOf('second').fromNow()}</span>
                { !uploader || uploader === '' ? '' : <span> | by {uploader}</span>} 
              </p>
            </div>
            <div className="reads col s1">
              <p>
              { !derivedOutput.pipeline_output ? 'NA' : numberWithCommas(derivedOutput.pipeline_output.total_reads) }
              </p>
            </div>
            <div className="reads col s2">
              <p>
              { (!derivedOutput.summary_stats || !derivedOutput.summary_stats.remaining_reads) ? 'NA' : numberWithCommas(derivedOutput.summary_stats.remaining_reads) }
              { (!derivedOutput.summary_stats || !derivedOutput.summary_stats.percent_remaining) ? '' : ` (${derivedOutput.summary_stats.percent_remaining.toFixed(2)}%)` } 
              </p>
            </div>
            <div className="reads col s2">
              <p>
              { (!derivedOutput.summary_stats || !derivedOutput.summary_stats.compression_ratio) ? 'NA' : derivedOutput.summary_stats.compression_ratio.toFixed(2) }
              </p>
            </div>
            <div className="reads col s1">
              <p>{ (!derivedOutput.summary_stats || !derivedOutput.summary_stats.qc_percent) ? 'NA' : `${derivedOutput.summary_stats.qc_percent.toFixed(2)}%`}</p>
            </div>
              <div className={ runInfo.total_runtime ? "reads status-col col s2" : 'reads col s2 no-time'}>{ !runInfo.job_status_description ? rowWithChunkStatus : rowWithoutChunkStatus }
              { runInfo.total_runtime ? <p className="time"><i className="fa fa-clock-o" aria-hidden="true"></i><span>{this.formatRunTime(runInfo.total_runtime)}</span></p> : ''}
            </div>
          </div>
        </div>
      )
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

  //Fetch Params from url for queries
  fetchParams(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param)
  }

  //handle search when query is passed
  handleSearch(e) {
    if (e.target.value !== '' && e.key === 'Enter') {
      this.displayResultsByParams(this.state.urlProjectId, e.target.value, this.state.urlFilterQuery)
    }
  }

  //display results from entire samples or within a project based on parameters, Also filter and search
  displayResultsByParams(project, searchParams, filterParams) {
    let projectId = parseInt(project);
    if (projectId && searchParams !== '' && filterParams) {
      location.href = `?project_id=${projectId}&filter=${filterParams}&search=${searchParams}`;
    } else if (projectId && searchParams !== '') {
      location.href = `?project_id=${projectId}&search=${searchParams}`;
    } else if (projectId && filterParams) {
      location.href = `?project_id=${projectId}&filter=${filterParams}`;
    } else if (searchParams !== '' && filterParams) {
      location.href = `?search=${searchParams}&filter=${filterParams}`;
    } else if (searchParams !== '') {
      location.href = `?search=${searchParams}`;
    } else if (filterParams) {
      location.href = `?filter=${filterParams}`;
    } else {
      location.href = '/';
    }
  }

  //Select or switch Project
  switchProject(e) {
    let id = e.target.getAttribute('data-id');
    this.setState({ urlProjectId: id });
    location.href = `?project_id=${id}`;
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
    const tableHead = (
      <div className="row wrapper">
        <div className="row table-container">
          <div className="col s4"><span>Name</span></div>
          <div className="col s1">Total Reads</div>
          <div className="col s2">Non-Host reads</div>
          <div className="col s2">Compression Ratio</div>
          <div className="col s1">Quality</div>
          <div className="col s2 status-dropdown" data-activates="dropdownstatus"><i className="status-filter fa fa-caret-down"></i>Status</div>
        </div>
      </div>
    )
    return (
    <div className="content-wrapper">
      <div className="sample-container">
        <div className="row search-box">
          <span className="icon"><i className="fa fa-search" aria-hidden="true"></i></span>
          <input id="search" value={this.state.urlSearchQuery} onChange={this.handleSearchChange}  type="search" onKeyDown={this.handleSearch} className="search" placeholder='Search for sample'/>{ this.state.showSearchLoader ? <i className='fa fa-spinner fa-spin fa-lg'></i> : null }
        </div>
          {/* Dropdown menu */}
          <ul id='dropdownstatus' className='status dropdown-content'>
<<<<<<< HEAD
            <li className="filter-item"><a href="#!" className="title filter-item"><b>Filter by status</b></a></li>
            <li className="divider"></li>
            <li className="filter-item" data-status="WAITING" onClick={ this.filterByStatus } ><a data-status="WAITING" className="waiting filter-item" href="#!">Waiting</a><i data-status="WAITING" className="filter fa fa-check"></i></li>
            <li className="filter-item" data-status="UPLOADING" onClick={ this.filterByStatus }><a data-status="UPLOADING" className="uploading filter-item" href="#!">In Progress</a><i data-status="UPLOADING"  className="filter fa fa-check"></i></li>
            <li className="filter-item" data-status="CHECKED" onClick={ this.filterByStatus }><a data-status="CHECKED" className="complete filter-item" href="#!">Complete</a><i data-status="CHECKED" className="filter fa fa-check"></i></li>
            <li className="filter-item" onClick={ this.filterByStatus } data-status="FAILED" ><a data-status="FAILED" className="failed filter-item" href="#!">Failed</a><i data-status="FAILED" className="filter fa fa-check"></i></li>
              <li className="divider"></li>
            <li className="filter-item" data-status="ALL" onClick={ this.filterByStatus }><a data-status="ALL" className="all filter-item" href="#!">All</a><i data-status="ALL" className="filter all fa fa-check"></i></li>
=======
            <li><a href="#!" className="title"><b>Filter by status</b></a></li>
            <li data-status="WAITING" onClick={ this.filterByStatus } ><a data-status="WAITING" className="waiting" href="#!">WAITING</a></li>
            <li data-status="UPLOADING" onClick={ this.filterByStatus }><a data-status="UPLOADING" className="uploading" href="#!">IN PROGRESS</a></li>
            <li data-status="CHECKED" onClick={ this.filterByStatus }><a data-status="CHECKED" className="complete" href="#!">COMPLETE</a></li>
            <li onClick={ this.filterByStatus } data-status="FAILED" ><a data-status="FAILED" className="failed" href="#!">FAILED</a></li>
              <li className="divider"></li>
            <li data-status="ALL" onClick={ this.filterByStatus }><a data-status="ALL" className="all" href="#!">All</a></li>
>>>>>>> Samples run time update
          </ul>
          { tableHead }
          { samples.length ? this.renderPipelineOutput(samples) : this.renderEmptyTable() }
      </div>
    </div>
    )
  }

  gotoPage(path) {
    location.href = `${path}`;
  }

  componentDidMount() {
    $('.filter').hide()
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
    this.displayCheckMarks(this.state.urlFilterQuery);
  }

  // initialize filter dropdown
  displayPipelineStatusFilter() {
    const textSize = 14
    $('.status-dropdown').dropdown({
      belowOrigin: true,
      stopPropagation: false,
      constrainWidth: true
    });
    $(".dropdown-content>li>a").css("font-size", textSize)
  }

  displayCheckMarks(filter) {
    $(`.filter[data-status="${filter}"]`).show();
  }
  

  //handle filtering when a filter is selected from list
  filterByStatus(e) {
    var that = this;
    let status = e.target.getAttribute('data-status');
    that.setState({ urlFilterQuery: status });
    this.displayResultsByParams(this.state.urlProjectId, this.state.urlSearchQuery, status);
  }


  render() {
    return (
      <div>
        <div className="sub-header-home">
          <div className="sub-header-items">
            <div className="content">
              <div  className="upload">
                <a href='/samples/new'>
                  <i className="fa fa-flask" aria-hidden="true"/>
                  <span>Upload sample</span>
                </a>
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

