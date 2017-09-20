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
        {!this.props.pipelineOutputs ? 'Nothing to show' :
          <table className="bordered highlight">
          <thead>
            <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Created by</th>
                <th>Total Reads</th>
                <th>Final Reads</th>
            </tr>
          </thead>

           {this.props.pipelineOutputs.map((output, i) => {
            return (
              <tbody key={i}>
                <tr>
                <td ><i className="fa fa-flask" aria-hidden="true"></i>{output.Name}</td>
                  <td>{output.created_at}</td>
                  <td>{output.created_by}</td>
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

  getMockData() {
    return [
      {"Name": "NID00015_CSF_S3 Virus", "date_created":"08-10-2017", "created_by": "Gerald Buchanan", "total_reads": "-", "quality_control":"2", "duplicate_ratio":"2", "non_human_reads":"1","final_reads": "-"},
      {"Name": "NID00015_CSF_S3", "date_created":"02-10-2017", "created_by": "Harvey Lowe", "total_reads": "1242155", "quality_control":"4", "duplicate_ratio":"2", "non_human_reads":"2", "final_reads": "4560 (003%)"},
      {"Name": "NID00015_CSF_S3 Virus", "date_created":"08-10-2017", "created_by": "Gerald Buchanan", "total_reads": "-", "quality_control":"6", "duplicate_ratio":"2", "non_human_reads":"2","final_reads": "-"},
      {"Name": "NID00016_CSF_S4", "date_created":"02-0302017", "created_by": "Gerald Buchanan", "total_reads": "1237818", "quality_control":"2", "duplicate_ratio":"2", "non_human_reads":"2", "final_reads": "4560 (003%)"},
      {"Name": "NID00015_CSF_S3 Virus", "date_created":"02-0302017", "created_by": "Gerald Buchanan", "total_reads": "1237818", "quality_control":"2", "duplicate_ratio":"2","non_human_reads":"2", "final_reads": "4560 (003%)"},
      {"Name": "NID00015_CSF_S3", "date_created":"02-0302017", "created_by": "Gerald Buchanan", "total_reads": "1237818", "quality_control":"2", "duplicate_ratio":"2","non_human_reads":"2", "final_reads": "4560 (003%)"},
      {"Name": "NID00015_CSF_S3", "date_created":"02-0302017", "created_by": "Gerald Buchanan", "total_reads": "1237818", "quality_control":"2", "duplicate_ratio":"2","non_human_reads":"2",  "final_reads": "4560 (003%)"},
      {"Name": "NID00015_CSF_S3 Virus", "date_created":"02-0302017", "created_by": "Gerald Buchanan", "total_reads": "1237818", "quality_control":"2", "duplicate_ratio":"2","non_human_reads":"2",  "final_reads": "4560 (003%)"},
      {"Name": "NID00015_CSF_S3 Virus", "date_created":"02-0302017", "created_by": "Gerald Buchanan", "total_reads": "1237818", "quality_control":"2", "duplicate_ratio":"2", "non_human_reads":"2", "final_reads": "4560 (003%)"}
    ]
  }
}
