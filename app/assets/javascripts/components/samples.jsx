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

  renderPipelineOutput(samples) {
    return samples.map((sample, i) => {
      let dbSample = sample.db_sample;
      let derivedOutput = sample.derived_sample_output;
      let runInfo = sample.run_info
      rowWithChunkStatus = (
        <td className={this.applyChunkStatusClass(runInfo)}>
          <a href={'/samples/' + dbSample.id}>{this.getChunkedStage(runInfo)}</a>
        </td>
      );
      rowWithoutChunkStatus = (
        <td className={this.applyClass(runInfo.job_status_description)}>
          <a href={'/samples/' + dbSample.id}>{runInfo.job_status_description}</a>
        </td>
      )
     
      return (
        <tr onClick={ this.viewSample.bind(this, dbSample.id)} key={i}>
          <td>
            {dbSample.name}
          </td>
          <td>{moment(dbSample.created_at).format(' L,  h:mm a')}</td>
          <td>{ !derivedOutput.pipeline_output ? 'NA' : <a href={'/samples/' + dbSample.id}>{numberWithCommas(derivedOutput.pipeline_output.total_reads)}</a>}</td>
          <td>{ (!derivedOutput.summary_stats || !derivedOutput.summary_stats.remaining_reads) ? 'NA' : <a href={'/samples/' + dbSample.id}>{numberWithCommas(derivedOutput.summary_stats.remaining_reads)}</a>}</td>
          <td>{ (!derivedOutput.summary_stats || !derivedOutput.summary_stats.percent_remaining) ? 'NA' : <a href={'/samples/' + dbSample.id}>{derivedOutput.summary_stats.percent_remaining.toFixed(2)}%</a>}</td>
          <td>{ (!derivedOutput.summary_stats || !derivedOutput.summary_stats.qc_percent) ? 'NA' : <a href={'/samples/' + dbSample.id}>{derivedOutput.summary_stats.qc_percent.toFixed(2)}%</a>}</td>
          <td>{ (!derivedOutput.summary_stats || !derivedOutput.summary_stats.compression_ratio) ? 'NA' : <a href={'/samples/' + dbSample.id}>{derivedOutput.summary_stats.compression_ratio.toFixed(2)}</a>}</td>
          { !runInfo.job_status_description ? rowWithChunkStatus : rowWithoutChunkStatus }
        </tr>
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
    if (postProcess && alignment === 'LOADED' && hostFiltering === 'LOADED') {
      return  'Post Processing';
    } else if (postProcess === null && alignment && hostFiltering === 'LOADED') {
      return 'Alignment';
    } else if (postProcess === null && alignment === null && hostFiltering) {
      return 'Host Filtering';
    } else if (postProcess === 'FAILED' || alignment === 'FAILED' || hostFiltering === 'FAILED') {
      return 'FAILED';
    } else {
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
    return (
    <div className="content-wrapper">
      <div className="sample-container">
        <div className="row search-box">
          <span className="icon"><i className="fa fa-search" aria-hidden="true"></i></span>
          <input id="search" value={this.state.urlSearchQuery} onChange={this.handleSearchChange}  type="search" onKeyDown={this.handleSearch} className="search" placeholder='Search for Sample'/>{ this.state.showSearchLoader ? <i className='fa fa-spinner fa-spin fa-lg'></i> : null }
        </div>
          {/* Dropdown menu */}
          <ul id='dropdownstatus' className='status dropdown-content'>
          <li><a href="#!" className="title"><b>Filter by status</b></a></li>
          <li data-status="WAITING" onClick={ this.filterByStatus } ><a data-status="WAITING" className="waiting" href="#!">Waiting</a></li>
          <li data-status="UPLOADING" onClick={ this.filterByStatus }><a data-status="UPLOADING" className="uploading" href="#!">In Progress</a></li>
          <li data-status="CHECKED" onClick={ this.filterByStatus }><a data-status="CHECKED" className="complete" href="#!">Complete</a></li>
          <li onClick={ this.filterByStatus } data-status="FAILED" ><a data-status="FAILED" className="failed" href="#!">Failed</a></li>
            <li className="divider"></li>
          <li data-status="ALL" onClick={ this.filterByStatus }><a data-status="ALL" className="all" href="#!">All</a></li>
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

  // initialize filter dropdown
  displayPipelineStatusFilter() {
    $('.status-dropdown').dropdown({
      belowOrigin: true,
      stopPropagation: false,
      constrainWidth: true
    });
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
                  <span>Upload Sample</span>
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

