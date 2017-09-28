class PipelineList extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  renderPipelineOutput(data) {
    return data.map((output, i) => {
      return (
        <tr key={i}>
          <td><a href={'/pipeline_outputs/' + output.id}>
            <i className="fa fa-flask" aria-hidden="true"></i> {this.props.outputData.sample_info.name} </a>
          </td>
          <td><a href={'/pipeline_outputs/' + output.id}>{moment(output.created_at).format(' L,  h:mm a')}</a></td>
          <td><a href={'/pipeline_outputs/' + output.id}>{output.total_reads}</a></td>
          <td><a href={'/pipeline_outputs/' + output.id}>{output.remaining_reads }</a></td>
          <td><a href={'/pipeline_outputs/' + output.id}>{(output.remaining_reads/output.total_reads * 100).toFixed(2) }%</a></td>
        </tr>
      )
    })
  }

  renderTable(input) {
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
            </tr>
            </thead>
              <tbody>
                {this.renderPipelineOutput(input)}
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
                All Projects  > { this.props.outputData.project_info.name }
              </div>

              <div className="sub-title">
                { this.props.outputData.project_info.name }
              </div>

              <div className="title-filter">
                <i className="fa fa-bar-chart" aria-hidden="true"></i>
                <span>PIPELINES OUTPUTS</span>
              </div>
            </div>
          </div>
        </div>
          {!this.props.pipelineOutputs ? <div className="no-data"><i className="fa fa-frown-o" aria-hidden="true"> No data to display</i></div> : this.renderTable(this.props.pipelineOutputs)}
      </div>
    )
  }

}

