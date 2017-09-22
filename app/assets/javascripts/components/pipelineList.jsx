class PipelineList extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  componentDidMount() {
    $('.tooltipped').tooltip({delay: 50});
  }

  render() {
    return (
      <div>
        <Header />
        <div className="sub-header-home">
				  <div className="container">
					  <div className="content">				  	
              <div className="title">
                All Projects  >  Uganda Project
              </div>

              <div className="sub-title">
                Uganda Project 
              </div>

              <div className="title-filter">
                <i className="fa fa-bar-chart" aria-hidden="true"></i>
                <span>PIPELINES OUTPUTS</span>
            </div>
					  </div>
				  </div>
		  	</div>
        <div className="content-wrapper">
          <div className="container sample-container">
          {!this.props.pipelineOutputs ? 'Nothing to show' :
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
                  <td ><i className="fa fa-flask" aria-hidden="true"></i>{output.Name}</td>
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
    </div>
    )
  }

}
