class PipelineSampleReads extends React.Component {

  constructor(props) {
    super(props);
    this.pipelineOutput = this.props.pipelineOutput;
    this.sampleInfo = this.props.sampleInfo;
    this.projectInfo = this.props.projectInfo;
  }

  componentDidMount() {
    $('ul.tabs').tabs();
    const slider = document.getElementById('genus-slider');
    const specieSlider = document.getElementById('specie-slider');
    const scoreSlider = document.getElementById('score-slider');

    noUiSlider.create(slider, {
      start: [1, 100],
      connect: true,
      step: 1,
      orientation: 'horizontal', // 'horizontal' or 'vertical'
      range: {
        'min': 0,
        'max': 100
      },
      format: wNumb({
        decimals: 0
      })
    });

    noUiSlider.create(specieSlider, {
      start: [1, 100],
      connect: true,
      step: 1,
      orientation: 'horizontal', // 'horizontal' or 'vertical'
      range: {
        'min': 0,
        'max': 100
      },
      format: wNumb({
        decimals: 0
      })
    });

    noUiSlider.create(scoreSlider, {
      start: [1, 25000],
      connect: true,
      step: 1,
      orientation: 'horizontal', // 'horizontal' or 'vertical'
      range: {
        'min': 0,
        'max': 25000
      },
      format: wNumb({
        decimals: 0
      })
    });


  }

  render() {
    return (
      <div>
        <Header />
        <SubHeader>
          <div className="sub-header">
            <div className="title">
              PIPELINE
            </div>

            <div className="sub-title">
              <a href="/"> {this.projectInfo.name} </a> > { this.sampleInfo.name }
            </div>

            
            <div className="sub-header-navigation">
              <div className="nav-content">
                <ul className="tabs tabs-transparent">
                  <li className="tab"><a href="#screen1" className="active">Details</a></li>
                  <li className="tab"><a href="#reports">Reports</a></li>
                </ul>
              </div>
            </div>
          </div>
        </SubHeader>
        <div id="screen1" className="tab-screen col s12">
          <div className="container tab-screen-content">
            <div className="row">
              <div className="col s9">

                <div className="row">
                  <div className="col s12">
                    <div className="content-title">
                      SAMPLE INFO
                    </div>

                    <div className="data">
                      <div className="row">
                        <div className="col s6">
                          <table className="highlight">
                            <tbody>
                              <tr>
                                <td>Host</td>
                                 <td> { (!this.sampleInfo.host) ? 'N/A' : this.sampleInfo.host } </td>
                              </tr>
                              <tr>
                                <td>Entry Date</td>
                                <td>{moment(this.sampleInfo.created_at).format('L, h:mm a')}</td>
                              </tr>
                              <tr>
                                <td>Location</td>
                                <td>{ (!this.sampleInfo.sample_location) ? 'N/A' : this.sampleInfo.sample_location }</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="col s6">
                          <table className="highlight responsive-table">
                            <tbody>
                              <tr>
                                <td>Tissue Type</td>
                                 <td>{ (!this.sampleInfo.sample_tissue) ? 'N/A' : this.sampleInfo.sample_tissue }</td>
                              </tr>
                              <tr>
                                <td>Library Prep Protocol</td>
                                <td>{ (!this.sampleInfo.sample_library) ? 'N/A' : this.sampleInfo.sample_library }</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="data-divider"/>

                <div className="row">
                  <div className="col s12">
                    <div className="content-title">
                      PIPELINE OUTPUT
                    </div>

                    <div className="data">
                      <div className="row">
                        <div className="col s6">
                          <table className="highlight">
                            <tbody>
                              <tr>
                                <td>Total reads</td>
                                 <td>{ this.pipelineOutput.total_reads }</td>
                              </tr>
                              <tr>
                                <td>Passed Quality Control</td>
                                <td>{(this.pipelineOutput.remaining_reads /
                                  this.pipelineOutput.total_reads * 100).toFixed(2) }%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="col s6">
                          <table className="highlight">
                            <tbody>
                              <tr>
                                <td>Remaining Reads</td>
                                 <td>{ this.pipelineOutput.remaining_reads }</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col s3 download-area">
                <a className="custom-button">
                  <i className="fa fa-cloud-download left"></i> DOWNLOAD ALL READS
                </a>

                <a className="custom-button">
                  <i className="fa fa-user-times left"></i> DOWNLOAD NON HUMAN READS
                </a>

                <a href={'/pipeline_outputs/' + this.pipelineOutput.id + '/#reports'} className="custom-button">
                  <i className="fa fa-file-text-o left"></i> GENERATE REPORT
                </a>
              </div>

            </div>
          </div>
        </div>
        <div id="reports" className="reports-screen tab-screen col s12">
          <div className="container tab-screen-content">
            <div className="row">
              <div className="col s3 reports-sidebar">
                <div className="sidebar-title">
                  <i className="fa fa-filter fa-fw"></i> Filter Report
                </div>

                <div className="sidebar-tabs">
                  <div className="row">
                    <div className="col s12 sidebar-full-container">
                      <div id="filters-pane" className="pane col s12">

                        <div className="filter-controls">
                          <div className="filter-title">
                            CATEGORY
                          </div>

                          <div className="filter-values">
                            <p>
                              <input type="checkbox" className="filled-in" id="bacteria" defaultChecked="checked" />
                              <label htmlFor="bacteria">Bacteria</label>
                            </p>
                            <p>
                              <input type="checkbox" className="filled-in" id="fungi" defaultChecked="checked" />
                              <label htmlFor="fungi">Fungi</label>
                            </p>
                            <p>
                            <input type="checkbox" className="filled-in" id="virus" defaultChecked="checked" />
                            <label htmlFor="virus">Virus</label>
                          </p>
                          </div>
                        </div>

                        <div className="filter-controls">
                          <div className="filter-title">
                            THRESHOLDS
                          </div>

                          <div className="filter-values">

                            <div className="">
                              <div className="slider-title">
                                Genus Z Score
                              </div>
                              <div id="genus-slider"></div>
                            </div>

                            <div className="">
                              <div className="slider-title">
                                Species Z Score
                              </div>
                              <div id="specie-slider"></div>
                            </div>

                            <div className="">
                              <div className="slider-title">
                                Score 1
                              </div>
                              <div className="slider-values">
                                <div className="start">1</div>
                                <div className="end">100</div>
                              </div>
                              <div id="score-slider"></div>
                            </div>
                          </div>

                        </div>

                      </div>
                      <div className="apply-filter-button center-align">
                        <button className="btn waves-effect grey waves-light">
                          Apply filter
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
              <div className="col s9 reports-main ">
                <div className="reports-table-title">
                  <div className="result-count">
                    24 of 100 returned
                  </div>

                  <div className="">
                    <select>
                      <option>
                        Custom selection
                      </option>
                      <option>
                       Apply filter
                      </option>
                    </select>
                  </div>
                </div>

                <table className='bordered'>
                  <thead>
                  <tr>
                    <th>Category</th>
                    <th>Species</th>
                    <th>Genus</th>
                    <th>Score 1</th>
                    <th>NT Genus Z</th>
                    <th>NT Species Z</th>
                    <th>NT Species RM</th>
                  </tr>
                  </thead>

                  <tbody>
                  <tr>
                    <td>Bacteria</td>
                    <td>Nitrosomonas eutropha (916)</td>
                    <td>Nitrosomonas (914)</td>
                    <td>29452</td>
                    <td>14.61</td>
                    <td>1.04</td>
                    <td>27.97</td>
                  </tr>
                  <tr>
                    <td>Bacteria</td>
                    <td>Nitrosomonas eutropha (916)</td>
                    <td>Nitrosomonas (914)</td>
                    <td>29452</td>
                    <td>14.61</td>
                    <td>1.04</td>
                    <td>27.97</td>
                  </tr>
                  <tr>
                    <td>Bacteria</td>
                    <td>Nitrosomonas eutropha (916)</td>
                    <td>Nitrosomonas (914)</td>
                    <td>29452</td>
                    <td>14.61</td>
                    <td>1.04</td>
                    <td>27.97</td>
                  </tr>
                  <tr>
                    <td>Bacteria</td>
                    <td>Nitrosomonas eutropha (916)</td>
                    <td>Nitrosomonas (914)</td>
                    <td>29452</td>
                    <td>14.61</td>
                    <td>1.04</td>
                    <td>27.97</td>
                  </tr>
                  <tr>
                    <td>Bacteria</td>
                    <td>Nitrosomonas eutropha (916)</td>
                    <td>Nitrosomonas (914)</td>
                    <td>29452</td>
                    <td>14.61</td>
                    <td>1.04</td>
                    <td>27.97</td>
                  </tr>
                  <tr>
                    <td>Bacteria</td>
                    <td>Nitrosomonas eutropha (916)</td>
                    <td>Nitrosomonas (914)</td>
                    <td>29452</td>
                    <td>14.61</td>
                    <td>1.04</td>
                    <td>27.97</td>
                  </tr>
                  <tr>
                    <td>Bacteria</td>
                    <td>Nitrosomonas eutropha (916)</td>
                    <td>Nitrosomonas (914)</td>
                    <td>29452</td>
                    <td>14.61</td>
                    <td>1.04</td>
                    <td>27.97</td>
                  </tr>
                  <tr>
                    <td>Bacteria</td>
                    <td>Nitrosomonas eutropha (916)</td>
                    <td>Nitrosomonas (914)</td>
                    <td>29452</td>
                    <td>14.61</td>
                    <td>1.04</td>
                    <td>27.97</td>
                  </tr>
                  <tr>
                    <td>Bacteria</td>
                    <td>Nitrosomonas eutropha (916)</td>
                    <td>Nitrosomonas (914)</td>
                    <td>29452</td>
                    <td>14.61</td>
                    <td>1.04</td>
                    <td>27.97</td>
                  </tr>
                  <tr>
                    <td>Bacteria</td>
                    <td>Nitrosomonas eutropha (916)</td>
                    <td>Nitrosomonas (914)</td>
                    <td>29452</td>
                    <td>14.61</td>
                    <td>1.04</td>
                    <td>27.97</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
