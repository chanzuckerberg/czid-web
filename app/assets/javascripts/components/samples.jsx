class Samples extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.project = this.props.project;
    this.samples = this.props.samples;
    this.outputData = this.props.outputData
  }


  renderPipelineOutput(samples, pipelineInfo) {
    return samples.map((sample, i) => {
      return (
        <tr key={i}>
          <td><a href={'/samples/' + sample.id}>
            <i className="fa fa-flask" aria-hidden="true"></i> {sample.name} </a>
          </td>
          <td><a href={'/samples/' + sample.id}>{moment(sample.created_at).format(' L,  h:mm a')}</a></td>
          <td>{ !pipelineInfo[i].pipeline_info ? 'NA' : <a href={'/samples/' + sample.id}>{numberWithCommas(pipelineInfo[i].pipeline_info.total_reads)}</a>}</td>
          <td>{ !pipelineInfo[i].pipeline_info ? 'NA' : <a href={'/samples/' + sample.id}>{numberWithCommas(pipelineInfo[i].summary_stats.remaining_reads)}</a>}</td>
          <td>{ !pipelineInfo[i].pipeline_info ? 'NA' : <a href={'/samples/' + sample.id}>{pipelineInfo[i].summary_stats.percent_remaining.toFixed(2)}%</a>}</td>
          <td>{ !pipelineInfo[i].pipeline_info ? 'Pending' : <a href={'/samples/' + sample.id}>Created</a>}</td>
          <td>{ !pipelineInfo[i].job_stats ? 'NA' : <a href={'/samples/' + sample.id}>{pipelineInfo[i].summary_stats.compression_ratio.toFixed(2)}</a>}</td>
          <td>{ !pipelineInfo[i].job_stats ? 'NA' : <a href={'/samples/' + sample.id}>{pipelineInfo[i].summary_stats.qc_percent.toFixed(2)}%</a>}</td>
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

  render() {
    return (
      <div>
        <div className="sub-header-home">
          <div className="container">
            <div className="content">
              <div className="title">
                All Projects  > { !this.project ?  'No project to display yet' : this.project.name }
              </div>

              <div className="sub-title">
              { !this.project ?  'No project to display yet' : this.project.name }
              </div>

              <div className="title-filter">
                <i className="fa fa-bar-chart" aria-hidden="true"></i>
                <span>SAMPLES</span>
              </div>
            </div>
          </div>
        </div>
          {!this.samples && this.outputData ? <div className="no-data"><i className="fa fa-frown-o" aria-hidden="true"> No data to display</i></div> : this.renderTable(this.samples, this.outputData)}
      </div>
    )
  }

}

