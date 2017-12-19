class Samples extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.switchProject = this.switchProject.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.defaultSortBy = 'newest';
    const currentSort = SortHelper.currentSort();
    this.columnSorting = this.columnSorting.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.fetchResults = this.fetchResults.bind(this);
    this.fetchSamples = this.fetchSamples.bind(this);
    this.handleStatusFilterSelect = this.handleStatusFilterSelect.bind(this);
    this.setUrlLocation = this.setUrlLocation.bind(this);
    this.sortSamples = this.sortSamples.bind(this);
    this.state = {
      project: null,
      totalNumber: null,
      selectedProjectId: this.fetchParams('project_id') || null,
      filterParams: this.fetchParams('filter') || '',
      searchParams: this.fetchParams('search') || '',
      sampleIdsParams: this.fetchParams('ids') || [],
      allSamples: [],
      allProjects: [],
      sort_by: this.fetchParams('sort_by') || 'created_at,desc',
      pagesLoaded: 0,
      pageEnd: false,
      initialFetchedSamples: [],
      loading: false,
      isRequesting: false,
      displayEmpty: false,
      columnsShown: ["total_reads", "nonhost_reads", "quality_control" , "compression_ratio", "pipeline_status"]
    };
    this.sortCount = 0;
    this.initializeTooltip();
    this.COLUMN_DISPLAY_MAP = { total_reads: { display_name: "Total reads", type: "pipeline_data" },
                                nonhost_reads: { display_name: "Non-host reads", type: "pipeline_data" },
                                quality_control: { display_name: "Passed QC", tooltip: "Passed quality control", type: "pipeline_data" },
                                compression_ratio: { display_name: "DCR", tooltip: "Duplicate compression ratio", type: "pipeline_data" },
                                pipeline_status: { display_name: "Status", type: "pipeline_data" },
                                tissue_type: { display_name: "Tissue type", type: "metadata" },
                                nucleotide_type: { display_name: "Nucleotide type", type: "metadata" },
                                location: { display_name: "Location", type: "metadata" },
                                host_genome: { display_name: "Host", type: "metadata" },
                                notes: { display_name: "Notes", type: "metadata" } }
    this.handleColumnSelectChange = this.handleColumnSelectChange.bind(this);
    this.columnHidden = this.columnHidden.bind(this);
    $(document).ready(function() {
      $('select').material_select();
    });
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
      $('.row.table-container div').hover(() => {
        const selectTooltip = $('.tooltip');
        const leftOffset = parseInt(selectTooltip.css('left'));
        if(!isNaN(leftOffset)) {
          selectTooltip.css('left', leftOffset - 15);
        }
      });
    });
  }

  sortSamples() {
    this.sortCount += 1;
    let new_sort, message = '';
    if(this.sortCount === 3) {
      this.sortCount = 0;
      new_sort = 'created_at,desc';
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
    var h = Math.floor(runtime / 3600);
    var m = Math.floor(runtime % 3600 / 60);
    var s = Math.floor(runtime % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
}

  renderPipelineOutput(samples) {
    let BLANK_TEXT = <span className="blank">NA</span>

    return samples.map((sample, i) => {
      let dbSample = sample.db_sample;
      let derivedOutput = sample.derived_sample_output;
      let runInfo = sample.run_info
      let uploader = sample.uploader.name
      let statusClass = !runInfo.job_status_description ? this.applyChunkStatusClass(runInfo) : this.applyClass(runInfo.job_status_description)
      let status = !runInfo.job_status_description ? this.getChunkedStage(runInfo) : runInfo.job_status_description

      rowWithChunkStatus = (
        <div className={statusClass}>
          <span>{this.appendStatusIcon(status)}</span><p className="optional-column pipeline_status status">{status}</p>
        </div>
      );
      rowWithoutChunkStatus = (
        <div className={statusClass}>
          <span>{this.appendStatusIcon(status)}</span><p className="optional-column pipeline_status status">{status}</p>
        </div>
      )
      data_values = { total_reads: !derivedOutput.pipeline_output ? BLANK_TEXT : numberWithCommas(derivedOutput.pipeline_output.total_reads),
                      nonhost_reads: (!derivedOutput.summary_stats || !derivedOutput.summary_stats.remaining_reads) ? BLANK_TEXT : numberWithCommas(derivedOutput.summary_stats.remaining_reads),
                      nonhost_reads_percent: (!derivedOutput.summary_stats || !derivedOutput.summary_stats.percent_remaining) ? '' : <span className="percent"> {`(${derivedOutput.summary_stats.percent_remaining.toFixed(2)}%)`} </span>,
                      quality_control: (!derivedOutput.summary_stats || !derivedOutput.summary_stats.qc_percent) ? BLANK_TEXT : `${derivedOutput.summary_stats.qc_percent.toFixed(2)}%`,
                      compression_ratio: (!derivedOutput.summary_stats || !derivedOutput.summary_stats.compression_ratio) ? BLANK_TEXT : derivedOutput.summary_stats.compression_ratio.toFixed(2),
                      tissue_type: dbSample && dbSample.sample_tissue ? dbSample.sample_tissue : BLANK_TEXT,
                      nucleotide_type: dbSample && dbSample.sample_template ? dbSample.sample_template : BLANK_TEXT,
                      host_genome: BLANK_TEXT,
                      notes: dbSample && dbSample.sample_notes ? dbSample.sample_notes : BLANK_TEXT }

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

            <div key="total_reads" className="reads col s1" hidden={this.columnHidden("total_reads")}><p>{ data_values["total_reads"] }</p></div>
            <div key="nonhost_reads" className="reads col s2" hidden={this.columnHidden("nonhost_reads")}><p>{ data_values["nonhost_reads"] }{ data_values["nonhost_reads_percent"] }</p></div>
            <div key="quality_control" className="reads col s1 center" hidden={this.columnHidden("quality_control")}><p>{ data_values["quality_control"] }</p></div>
            <div key="compression_ratio" className="reads col s1 center" hidden={this.columnHidden("compression_ratio")}><p>{ data_values["compression_ratio"] }</p></div>

            { Object.keys(this.COLUMN_DISPLAY_MAP).map((option_name, i) => {
                if (this.COLUMN_DISPLAY_MAP[option_name].type === "metadata") {
                  return (
                    <div className="col s1" hidden={this.columnHidden(option_name)}><p>{ data_values[option_name] }</p></div>
                  )
            }})}

            <div className={ runInfo.total_runtime ? "reads status-col col s2" : 'reads col s2 no-time'} hidden={this.columnHidden("pipeline_status")}>
              { !runInfo.job_status_description ? rowWithChunkStatus : rowWithoutChunkStatus }
              { runInfo.total_runtime ? <p className="time"><i className="fa fa-clock-o" aria-hidden="true"></i><span>{this.formatRunTime(runInfo.total_runtime)}</span></p> : ''}
            </div>
          </div>
        </div>
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
    const params = this.getParams();
    axios.get(`/samples?${params}`).then((res) => {
      this.setState((prevState) => ({
        loading: false,
        initialFetchedSamples: res.data.samples,
        allSamples: res.data.samples,
        displayEmpty: false,
        pagesLoaded: prevState.pagesLoaded+1,
        totalNumber: res.data.total_count
      }))
    if (!this.state.allSamples.length) {
      this.setState({ displayEmpty: true });
    }
    }).catch((err) => {
      this.setState((prevState) => ({
        loading: false,
        allSamples: [],
        displayEmpty: true,
        pagesLoaded: 0,
      }))
    })
  }

  //fetch all Projects
  fetchProjects() {
    axios.get(`/projects.json`).then((res) => {
      this.setState({
        allProjects: res.data,
        loading: false,
      })
    }).catch((err) => {
      this.setState({
        allProjects: [],
        loading: false,
      })
    })
  }

  //fetch data used by projects page
  fetchProjectPageData() {
    this.setState({ loading: true })
    this.fetchProjects();
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
        pageEnd: res.data.samples.length >= 15 ? false : true,
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

    return params;
  }

  //fetch results from filtering, search or switching projects
  fetchResults(cb) {
    const params = this.getParams();
    axios.get(`/samples?${params}`).then((res) => {
      this.setState((prevState) => ({
        loading: false,
        initialFetchedSamples: res.data.samples,
        allSamples: res.data.samples,
        displayEmpty: false,
        totalNumber: res.data.total_count,
        pagesLoaded: prevState.pagesLoaded+1
      }));
      if (!this.state.allSamples.length) {
        this.setState({ displayEmpty: true });
      }
      if(typeof cb === 'function') {
        cb();
      }
    }).catch((err) => {
      this.setState({
        loading: false,
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
      this.setState({
        loading: true,
        pagesLoaded: 0,
        pageEnd: false,
        searchParams: e.target.value
      }, () => {
        this.setUrlLocation();
        this.fetchResults();
      });
    }
  }

  //Select or switch Project
  switchProject(e) {
    let id = e.target.getAttribute('data-id');
    this.setState({
      selectedProjectId: id,
      pageEnd: false
    }, () => {
      this.setUrlLocation();
      this.fetchProjectDetails(id);
    });
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
        })
        this.fetchResults();
      }).catch((err) => {
        this.setState({ project: null})
      })
    }
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

  renderEmptyTable() {
    return (
      <div className="center-align"><i className='fa fa-frown-o'> No result found</i></div>
    )
  }

  findSelectedColumns(selO) {
    var selValues = [];
    for (i=0; i < selO.length; i++) {
      column_name = selO.options[i].value;
      if (selO.options[i].selected && column_name !== "") {
        selValues.push(column_name);
      }
    }
    return selValues;
  }

  handleColumnSelectChange(e) {
    selected_columns = this.findSelectedColumns(e.target);
    console.log("before: " + this.columnHidden("tissue_type"));
    this.setState({columnsShown: selected_columns});
    console.log("after: " + this.columnHidden("tissue_type"));
  }

  columnHidden(column) {
    return !this.state.columnsShown.includes(column)
  }

  display_column_options(column_map, data_type, default_checked) {
    column_list = Object.keys(column_map)
    return column_list.map((option_name, i) => {
      if (column_map[option_name].type === data_type) {
        return (
          <option key={option_name} id={option_name} value={option_name} selected={default_checked}>
            {column_map[option_name].display_name}
          </option>
        )
      }
    })
  }

  renderTable(samples) {

    search_box = (
      <div className="search-box">
        <span className="icon"><i className="fa fa-search" aria-hidden="true"></i></span>
        <input id="search" value={this.state.searchParams} onChange={this.handleSearchChange}  type="search" onKeyDown={this.handleSearch} className="search" placeholder='Search for Sample'/>{ this.state.showSearchLoader ? <i className='fa fa-spinner fa-spin fa-lg'></i> : null }
      </div>
    );

    const tableHead = (
      <div className="row wrapper">
        <div className="row table-container">

          <div className="col s4 sort-able">
            <div onClick={this.sortSamples}>
              <span>Name</span>
              <i className={`fa ${(this.state.sort_by === 'name,desc') ? 'fa fa-caret-up' : 'fa fa-caret-down'}
              ${(this.state.sort_by === 'name,desc' || this.state.sort_by === 'name,asc') ? 'active': 'hidden'}`}></i>
            </div>
          </div>

          <div className="col s1" hidden={this.columnHidden("total_reads")}>{ this.COLUMN_DISPLAY_MAP.total_reads.display_name }</div>
          <div className="col s2" hidden={this.columnHidden("nonhost_reads")}>{ this.COLUMN_DISPLAY_MAP.nonhost_reads.display_name }</div>
          <div className="col s1 center" rel='tooltip' data-placement='bottom' title={this.COLUMN_DISPLAY_MAP.quality_control.tooltip}
            hidden={this.columnHidden("quality_control")}>{ this.COLUMN_DISPLAY_MAP.quality_control.display_name }</div>
          <div className="col s1 center" rel='tooltip' data-placement='bottom' title={this.COLUMN_DISPLAY_MAP.compression_ratio.tooltip}
            hidden={this.columnHidden("compression_ratio")}>{ this.COLUMN_DISPLAY_MAP.compression_ratio.display_name }</div>

          { Object.keys(this.COLUMN_DISPLAY_MAP).map((option_name, i) => {
              if (this.COLUMN_DISPLAY_MAP[option_name].type === "metadata") {
                return (
                  <div className="col s1" hidden={this.columnHidden(option_name)}>{ this.COLUMN_DISPLAY_MAP[option_name].display_name }</div>
                )
          }})}

          <div key="pipeline_status" className="optional-column pipeline_status col s2 status-dropdown" data-activates="dropdownstatus">
            <i className="status-filter fa fa-caret-down"></i>{ this.COLUMN_DISPLAY_MAP.pipeline_status.display_name }
          </div>
        </div>
      </div> 
    );

    status_filter_dropdown = (
      <ul id='dropdownstatus' className='status dropdown-content'>
        <li><a className="title"><b>Filter by status</b></a></li>
        <li className="divider"></li>
        <li className="filter-item" data-status="WAITING" onClick={ this.handleStatusFilterSelect } ><a data-status="WAITING" className="filter-item waiting">Waiting</a><i data-status="WAITING" className="filter fa fa-check"></i></li>
        <li className="filter-item" data-status="UPLOADING" onClick={ this.handleStatusFilterSelect }><a data-status="UPLOADING" className="filter-item uploading">In Progress</a><i data-status="UPLOADING"  className="filter fa fa-check"></i></li>
        <li className="filter-item" data-status="CHECKED" onClick={ this.handleStatusFilterSelect }><a data-status="CHECKED" className="filter-item complete">Complete</a><i data-status="CHECKED" className="filter fa fa-check"></i></li>
        <li className="filter-item" onClick={ this.handleStatusFilterSelect } data-status="FAILED" ><a data-status="FAILED" className="filter-item failed">Failed</a><i data-status="FAILED" className="filter fa fa-check"></i></li>
        <li className="divider"></li>
        <li className="filter-item" data-status="ALL" onClick={ this.handleStatusFilterSelect }><a data-status="ALL" className="filter-item all">All</a><i data-status="ALL" className="filter all fa fa-check"></i></li>
      </ul>
    );

    column_select_dropdown = (
      <div className="column-dropdown">
        <div class="input-field col s8">
          <select multiple name="columnSelector" ref="columnSelector" onChange={this.handleColumnSelectChange}>
            <optgroup label="Pipeline Data">
              { this.display_column_options(this.COLUMN_DISPLAY_MAP, "pipeline_data", true) }
            </optgroup>
            <optgroup label="Sample Data">
              { this.display_column_options(this.COLUMN_DISPLAY_MAP, "metadata", false) }
            </optgroup>
          </select>
        </div>
      </div>
    );
 
    return (
    <div className="content-wrapper">
      <div className="sample-container">
          { search_box }
          { column_select_dropdown }
          { status_filter_dropdown }
          <div className="sample-table-container">
            { tableHead }
            { !samples.length && this.state.displayEmpty ? this.renderEmptyTable() : this.renderPipelineOutput(samples)  }
          </div>
      </div>
      { !this.state.pageEnd && this.state.initialFetchedSamples && this.state.initialFetchedSamples.length > 14 ? <div className="scroll">
        <i className='fa fa-spinner fa-spin fa-3x'></i>
      </div> : "" }
      { this.state.loading ? <div className="scroll">
        <i className='fa fa-spinner fa-spin fa-3x'></i>
      </div> : "" }
    </div>
    )
  }

  initializeProjectList() {
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
  }

  componentDidMount() {
    $('.filter').hide()
    this.fetchProjectPageData();
    this.state.selectedProjectId ? this.fetchProjectDetails(this.state.selectedProjectId) : null;
    this.scrollDown();
    this.initializeProjectList();
    this.displayPipelineStatusFilter();
    this.initializeColumnSelect();
  }

  initializeColumnSelect() {
    $(document).ready(function() {
      $('select').material_select();
    });
    $(ReactDOM.findDOMNode(this.refs.columnSelector)).on('change',this.handleColumnSelectChange.bind(this));
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
    $('.filter').hide()
    $(`.filter[data-status="${filter}"]`).show();
  }

  //handle filtering when a filter is selected from list
  handleStatusFilterSelect(e) {
    let status = e.target.getAttribute('data-status');
    this.setState({
      loading: true,
      pagesLoaded: 0,
      pageEnd: false,
      filterParams: status
    }, () => {
      this.setUrlLocation();
      this.displayCheckMarks(this.state.filterParams);
      this.fetchResults();
    });
  }

  //set Url based on requests
  setUrlLocation() {
    let projectId = parseInt(this.state.selectedProjectId);
    const params = {
      project_id: projectId ? projectId : '',
      filter: this.state.filterParams,
      search: this.state.searchParams,
      sort_by: this.state.sort_by
    };
    window.history.replaceState(null, null, `?${jQuery.param(params)}`)
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
                <span>{ (!this.state.project) ? 'All projects' : this.state.project.name }<i className='fa fa-angle-down project-toggle'></i></span>
                <div className='dropdown-bubble'>
                  <div className="dropdown-container">
                    <ul>
                      <li onClick={this.switchProject} className="title">
                        <a>All projects </a>
                      </li>
                      { this.state.allProjects.map((project, i) => {
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
                <span><i>{this.state.allSamples.length === 0 ? 'No sample found' : ( this.state.allSamples.length === 1 ? '1 sample found' : `${this.state.allSamples.length} out of ${this.state.totalNumber} samples found`)}</i></span>
              </div>
            </div>
          </div>
        </div>
          {this.renderTable(this.state.allSamples)}
      </div>
    )
  }

}

