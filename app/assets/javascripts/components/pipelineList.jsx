class PipelineList extends React.Component {
  constructor(props, context) {
    super(props, context);

  }

  renderPipelineOutput(samples, pipelineruns) {
    <h1>{JSON.stringify(samples, pipelineruns)}</h1>
    return samples.map((sample, i) => {
      return (
        <tr key={i}>

          <td><a href={'/samples/' + sample.id}>
            <i className="fa fa-flask" aria-hidden="true"></i> {sample.name} </a>
          </td>

          <td><a href={'/samples/' + sample.id}>{moment(sample.created_at).format(' L,  h:mm a')}</a></td>

          <td>{ !pipelineruns[i].pipeline_info ? 'NA' : <a href={'/samples/' + sample.id}>{pipelineruns[i].pipeline_info.total_reads}</a>}</td>

          <td>{ !pipelineruns[i].pipeline_info ? 'NA' : <a href={'/samples/' + sample.id}>{pipelineruns[i].pipeline_info.remaining_reads}</a>}</td>

          <td>{ !pipelineruns[i].pipeline_info ? 'NA' : <a href={'/samples/' + sample.id}>{(pipelineruns[i].pipeline_info.remaining_reads/pipelineruns[i].pipeline_info.total_reads * 100).toFixed(2) }%</a>}</td>

          <td><a href={'/samples/' + sample.id}>{sample.status}</a></td>
         
          <td>{ !pipelineruns[i].pipeline_run ? 'NA' : <a href={'/samples/' + sample.id}>{pipelineruns[i].pipeline_run.job_status}</a>}</td>

        </tr>
      )
    })
  }

  renderTable(samples, lastpipelinerun) {
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
              <th>Sample status</th>
              <th>Pipeline run status</th>
            </tr>
            </thead>
              <tbody>
                {this.renderPipelineOutput(samples, lastpipelinerun)}
              </tbody>
          </table>
      </div>
    </div>
    )
  }

  render() {
    return (
      <div>
        <Header />
        <div className="sub-header-home">
          <div className="container">
            <div className="content">
              <div className="title">
                All Projects  > { !this.props.project ?  'No project to display yet' : this.props.project.name }
              </div>

              <div className="sub-title">
              { !this.props.project ?  'No project to display yet' : this.props.project.name }
              </div>

              <div className="title-filter">
                <i className="fa fa-bar-chart" aria-hidden="true"></i>
                <span>PIPELINES OUTPUTS</span>
              </div>
            </div>
          </div>
        </div>
          {!this.props.samples && this.props.outputData? <div className="no-data"><i className="fa fa-frown-o" aria-hidden="true"> No data to display</i></div> : this.renderTable(this.props.samples, this.props.outputData)}
      </div>
    )
  }

}

