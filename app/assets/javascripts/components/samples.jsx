class Samples extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.project = this.props.project;
    this.samples = this.props.samples;
    this.outputData = this.props.outputData
    this.all_project = props.all_project|| [];
    this.defaultSortBy = 'newest';
    const currentSort = SortHelper.currentSort();
    this.state = {
      sort_query: currentSort.sort_query
        ? currentSort.sort_query  : `sort_by=${this.defaultSortBy}`
    };
    this.columnSorting = this.columnSorting.bind(this);
  }

  columnSorting(e) {
    const className = e.target.className;
    const pos = className.indexOf('sort_by');
    const sort_query = className.substr(pos).split(' ')[0];
    this.setState({ sort_query });
    SortHelper.applySort(sort_query);
  }

  renderPipelineOutput(samples, pipelineInfo) {
    return samples.map((sample, i) => {
      let pInfo = pipelineInfo[i];
      return (
        <tr onClick={ this.viewSample.bind(this, sample.id)} key={i}>
          <td>
            <i className="fa fa-flask" aria-hidden="true"></i> {sample.name}
          </td>
          <td>{moment(sample.created_at).format(' L,  h:mm a')}</td>
         <td>{ !pInfo.pipeline_info ? 'NA' : <a href={'/samples/' + sample.id}>{numberWithCommas(pInfo.pipeline_info.total_reads)}</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.summary_stats.remaining_reads) ? 'NA' : <a href={'/samples/' + sample.id}>{numberWithCommas(pInfo.summary_stats.remaining_reads)}</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.summary_stats.percent_remaining) ? 'NA' : <a href={'/samples/' + sample.id}>{pInfo.summary_stats.percent_remaining.toFixed(2)}%</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.summary_stats.compression_ratio) ? 'NA' : <a href={'/samples/' + sample.id}>{pInfo.summary_stats.compression_ratio.toFixed(2)}</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.summary_stats.qc_percent) ? 'NA' : <a href={'/samples/' + sample.id}>{pInfo.summary_stats.qc_percent.toFixed(2)}%</a>}</td>
          <td>{ !pInfo.pipeline_info ? 'Pending' : <a href={'/samples/' + sample.id}>Created</a>}</td>
        </tr>
      )
    })
  }

  viewSample(id) {
    location.href = `/samples/${id}`
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

  renderTable(samples, pipelineInfo) {
    return (
    <div className="content-wrapper">
      <div className="container sample-container">
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
              <tbody>
                {this.renderPipelineOutput(samples, pipelineInfo)}
              </tbody>
          </table>
      </div>
    </div>
    )
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
          <div className="container">
            <div className="content">
              <div className="title">
                <a href='/'>All Projects</a> { !this.project ?  '' : `> ${this.project.name}` }
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
                <i className="fa fa-bar-chart" aria-hidden="true"></i>
                <span>SAMPLES</span>
              </div>
            </div>
          </div>
        </div>
          {!this.samples.length && !this.outputData.length ? <div className="no-data"><i className="fa fa-frown-o" aria-hidden="true"> No data to display</i></div> : this.renderTable(this.samples, this.outputData)}
      </div>
    )
  }

}
