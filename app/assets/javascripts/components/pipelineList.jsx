class PipelineList extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  componentDidMount() {
  }

  render() {
    return (
      <div className="content-wrapper">
        <div className="search-wrapper container">
          <i className="fa fa-search" aria-hidden="true"></i>
          <span>PIPELINES OUTPUTS</span>
        </div>
        <div className="container sample-container">
        {!this.props.pipelineOutputs ? <i className="fa fa-frown" aria-hidden="true">No outputs available</i> :
          <table className="bordered highlight">
          <thead>
            <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Total Reads</th>
                <th>Final Reads</th>
            </tr>
          </thead>

           {this.props.pipelineOutputs.map((output, i) => {
            return (
              <tbody key={i}>
                <tr>
                <td ><i className="fa fa-flask" aria-hidden="true"></i>{output.id}</td>
                  <td>{moment(output.created_at).format('MM-DD-YYYY')}</td>
                  <td>{output.total_reads}</td>
                  <td>{output.remaining_reads }</td>
                </tr>
              </tbody>
            )
          })}
        </table>
         }
        </div>
      </div>
    )
  }

}
