class Samples extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.project = props.project;
    this.samples = props.samples;
    this.samplesAmount = props.samples_count;
    this.outputData = props.outputData
    this.pipeline_run_info = props.pipeline_run_info
    this.all_project = props.all_project|| [];
    this.defaultSortBy = 'newest';
    const currentSort = SortHelper.currentSort();
    this.state = {
      displayedSamples: this.samples || [],
      sort_query: currentSort.sort_query
      ? currentSort.sort_query  : `sort_by=${this.defaultSortBy}`
    };
    this.columnSorting = this.columnSorting.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
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

  renderPipelineOutput(samples, pipelineInfo, pipeline_run_info) {
    return samples.map((sample, i) => {
      let pInfo = pipelineInfo[i];
      let pr_info = pipeline_run_info[i];
      return (
        <tr onClick={ this.viewSample.bind(this, sample.id)} key={i}>
          <td>
            {sample.name}
          </td>
          <td>{moment(sample.created_at).format(' L,  h:mm a')}</td>
         <td>{ !pInfo.pipeline_info ? 'NA' : <a href={'/samples/' + sample.id}>{numberWithCommas(pInfo.pipeline_info.total_reads)}</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.summary_stats.remaining_reads) ? 'NA' : <a href={'/samples/' + sample.id}>{numberWithCommas(pInfo.summary_stats.remaining_reads)}</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.summary_stats.percent_remaining) ? 'NA' : <a href={'/samples/' + sample.id}>{pInfo.summary_stats.percent_remaining.toFixed(2)}%</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.summary_stats.compression_ratio) ? 'NA' : <a href={'/samples/' + sample.id}>{pInfo.summary_stats.compression_ratio.toFixed(2)}</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.summary_stats.qc_percent) ? 'NA' : <a href={'/samples/' + sample.id}>{pInfo.summary_stats.qc_percent.toFixed(2)}%</a>}</td>
          <td className={this.applyClass(pr_info.job_status_description)}>{ !pr_info.job_status_description ? '' : <a href={'/samples/' + sample.id}>{pr_info.job_status_description}</a>}</td>
        </tr>
      )
    })
  }

  applyClass(status) {
    if(status === 'COMPLETE') {
      return 'complete';
    } else {
      return 'failed';
    }
  }

  handleSearch(e) {
    var that = this;
    if (e.target.value === "") {
      $("#pagination").css("display", "");
      that.setState({
        displayedSamples: this.samples
      })
    } else {
      axios.get('/samples/search.json', 
        {params: {search: e.target.value}
      }).then((response) => {
        if (response.data.length) {
          that.setState({
            displayedSamples: response.data,
          })
          $("#pagination").css("display", "");
        } else {
          $("#pagination").css("display", "none");
          that.setState({
            displayedSamples: [],
          })
          that.renderEmptyTable();
        }
      }).catch((error) => {
        $("#pagination").css("display", "none");
        that.setState({
          displayedSamples: [],
        })
        that.renderEmptyTable();
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

  renderTable(samples, pipelineInfo, pipeline_run_info) {
    return (
    <div className="content-wrapper">
      <div className="sample-container">
        <input id="search" type="search" onChange={this.handleSearch} className="search" placeholder='&#xf002; Search for Sample'/>
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
              <th>Compression Ratio</th>
              <th>QC</th>
              <th>Pipeline run status</th>
            </tr>
            </thead>
              { samples.length ? <tbody>{this.renderPipelineOutput(samples, pipelineInfo, pipeline_run_info)}</tbody> : null }
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
                  <ul>
                    <li>
                      <a href="/">All projects </a>
                    </li>
                    { this.all_project.map((project, i) => {
                      return (
                        <li key={i}>
                          <a href={`?project_id=${project.id}`}>
                            { project.name }
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
             
              <div className="title-filter">
                <span><i>{this.samplesAmount === 0 ? 'No sample found' : ( this.samplesAmount === 1 ? '1 sample found' : `${this.samplesAmount} samples found`)}</i></span>
              </div>
            </div>
          </div>
        </div>
          {!this.samples.length && !this.outputData.length ? <div className="no-data"><i className="fa fa-frown-o" aria-hidden="true"> No data to display</i></div> : this.renderTable(this.state.displayedSamples, this.outputData, this.pipeline_run_info)}
      </div>
    )
  }

}
