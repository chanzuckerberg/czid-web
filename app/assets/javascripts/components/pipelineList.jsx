class PipelineList extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      pipelineOutputs: null
    }
  }

  componentDidMount() {
    $.get('http://dev.idseq.net/pipeline_outputs.json', function(data, status) {
      this.setState({
        pipelineOutputs: response
      })
    })
      console.log(this.state.pipelineOutputs, 'allofem');
  }

  render() {
    return (
      <div className="content-wrapper">
        <div className="search-wrapper container">
          <i className="fa fa-search" aria-hidden="true"></i>
          <span>ALL</span>|<span>PIPELINES</span>|<span>REPORTS</span>
        </div>
        <div className="container sample-container">
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

         {!this.state.pipelineOutputs ? <p>Nothing to show</p> : this.state.pipelineOutputs.map((output, i) => {
            return (
              <tbody key={i}>
                <tr>
                <td ><i className="fa fa-flask" aria-hidden="true"></i>{sample.Name}</td>
                  <td>{sample.date_created}</td>
                  <td>{sample.created_by}</td>
                  <td>{sample.total_reads}</td>
                  <td>{sample.final_reads}</td>
                </tr>
              </tbody>
            )
          })}
         }
          
        </table>
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