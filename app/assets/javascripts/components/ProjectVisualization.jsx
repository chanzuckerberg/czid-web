/**
 * @class ProjectVisualization
 * @desc a component to visualize sample and their species taxonomy distribution
 */
class ProjectVisualization  extends React.Component {
  constructor(props) {
    super(props);
    this.projectName = props.project_name;
    this.csvRecords = props.csv_records;
  }
  render () {
    return (
      <div id="project-visualization">
        <SubHeader>
          <div className="sub-header">
            <div className="title">
              Project Visualization
            </div>
            <div className="sub-title">
              Track pathogen distribution across { this.projectName } samples
            </div>
          </div>
        </SubHeader>
        <div className="row visualization-content">
          <div className="col s2" id="visualization-sidebar">
            <div className='select-pathogens genus card'>
              <div className='selected-pathogens'>
                <div className='title grey-text'>
                  All Processed Samples
                </div>
                <ul>
                  { this.csvRecords.map((sample, i) => {
                    return (
                      <li key={i}>
                        <div className='pathogen-label samples'>
                          <div className='grey-text text-lighten-1'>
                            { sample.name }
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  { ((!this.csvRecords.length)) ?
                    <div className='text-grey text-lighten-1 center'>-no processed samples-</div> : ''
                  }
                </ul>
              </div>
            </div>
          </div>
          <div className="col s10 graphs">
            <div className="card">
              <div className="card-action top">
                <a href="#">Heatmap</a>
              </div>
              <div className="card-content">
                <div className='row'>
                  <div className='col s9 center' id="heat-map">
                    <div className='scroll-heatmap center'>
                      <svg id='heat-map-canvas'></svg>
                    </div>

                  </div>
                  <div className='col s3'>
                    <div className='color-scale-info'>
                      <svg id='color-scale'></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}