class Samples extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.project = this.props.project;
    this.samples = this.props.samples;
    this.outputData = this.props.outputData
    this.all_project = props.all_project|| [];
  }


  renderPipelineOutput(samples, pipelineInfo) {
    return samples.map((sample, i) => {
      let pInfo = pipelineInfo[i];
      return (
        <tr key={i}>
          <td><a href={'/samples/' + sample.id}>
            <i className="fa fa-flask" aria-hidden="true"></i> {sample.name} </a>
          </td>
          <td><a href={'/samples/' + sample.id}>{moment(sample.created_at).format(' L,  h:mm a')}</a></td>
          <td>{ !pInfo.pipeline_info ? 'NA' : <a href={'/samples/' + sample.id}>{numberWithCommas(pInfo.pipeline_info.total_reads)}</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.summary_stats.remaining_reads) ? 'NA' : <a href={'/samples/' + sample.id}>{numberWithCommas(pInfo.summary_stats.remaining_reads)}</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.percent_remaining) ? 'NA' : <a href={'/samples/' + sample.id}>{pInfo.summary_stats.percent_remaining.toFixed(2)}%</a>}</td>

          <td>{ !pInfo.pipeline_info ? 'Pending' : <a href={'/samples/' + sample.id}>Created</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.compression_ratio) ? 'NA' : <a href={'/samples/' + sample.id}>{pInfo.summary_stats.compression_ratio.toFixed(2)}</a>}</td>
          <td>{ (!pInfo.summary_stats || !pInfo.qc_percent) ? 'NA' : <a href={'/samples/' + sample.id}>{pInfo.summary_stats.qc_percent.toFixed(2)}%</a>}</td>
        </tr>
      )
    })
  }

  renderTable(samples, pipelineInfo) {
    return (
    <div className="content-wrapper">
      <div className="container sample-container">
          <table className="bordered highlight">
            <thead>
            <tr>
              <th>Name</th>
              <th>Date Uploaded</th>
              <th>Total Reads</th>
              <th>Final Reads</th>
              <th>Percentage Reads</th>
              <th>Pipeline run status</th>
              <th>Compression Ratio</th>
              <th>QC</th>
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
                All Projects { !this.project ?  '' : `> ${this.project.name}` }
              </div>

              <div className="sub-title">
                { (!this.project) ? 'All projects' : this.project.name } <i className='fa fa-angle-down project-toggle'> </i>
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
