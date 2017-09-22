class PipelineSampleReads extends React.Component {
  componentDidMount() {
    $('ul.tabs').tabs();
  }

  render() {
    return (
      <div>
        <Header>
          <div className="sub-header">
            <div className="title">
              PIPELINE
            </div>

            <div className="sub-title">
              Uganda Project > NID0015_CSF_S3
            </div>

            <div className="sub-header-navigation">
              <div className="nav-content">
                <ul className="tabs tabs-transparent">
                  <li className="tab"><a href="#screen1" className="active">Details</a></li>
                  <li className="tab"><a className="" href="#test2">LogFile</a></li>
                  <li className="tab"><a href="#test3">Quality</a></li>
                  <li className="tab"><a href="#test4">Reports</a></li>
                </ul>
              </div>
            </div>
          </div>
        </Header>
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
                                 <td>Human</td>
                              </tr>
                              <tr>
                                <td>Entry Date</td>
                                <td>07-01-2015</td>
                              </tr>
                             <tr>
                                <td>Illumina Run Date</td>
                                <td>07-01-2015</td>
                              </tr>
                              <tr>
                                <td>Illumina Flow Cell</td>
                                <td className=" grey-text text-lighten-1">Not Set</td>
                              </tr>
                             <tr>
                                <td>Nucleic Acid Type</td>
                                <td>RNA</td>
                              </tr>
                             <tr>
                                <td>Diagnosis</td>
                                <td>Neurocysticercosis</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="col s6">
                          <table className="highlight responsive-table">
                            <tbody>
                              <tr>
                                <td>Tissue Type</td>
                                 <td>CSF</td>
                              </tr>
                              <tr>
                                <td>Library Prep Protocol</td>
                                <td>NuGen-Nextera</td>
                              </tr>
                             <tr>
                                <td>Lab</td>
                                <td className=" grey-text text-lighten-1">Not set</td>
                              </tr>
                              <tr>
                                <td>Location</td>
                                <td>Uganda</td>
                              </tr>
                             <tr>
                                <td>Symptopms</td>
                                <td>Fever, Coma</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col s12">
                          <table>
                            <tbody>
                              <tr>
                                <td className="notes">Notes</td>
                                <td className="sample-notes">
                                  Subject 2
                                  <br/>
                                  248 6204  Taenia solium
                                  <br/>
                                  827 60517 Taenia asiatica
                                  <br/>
                                  -- Ignored pairs: 2787
                                  <br/>
                                  -- Retained pairs: 569 (16.95 percent of total non-host sequence)
                                  <br/>
                                </td>
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
                                 <td>177127171</td>
                              </tr>
                              <tr>
                                <td>Passed Quality Control</td>
                                <td>2.78%</td>
                              </tr>
                             <tr>
                                <td>Compression Ratio</td>
                                <td>2.45</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="col s6">
                          <table className="highlight">
                            <tbody>
                              <tr>
                                <td>Final Read Paris</td>
                                 <td>214141</td>
                              </tr>
                              <tr>
                                <td>Unmatched Reads</td>
                                <td>12981</td>
                              </tr>
                             <tr>
                                <td>Non Human Reads</td>
                                <td>245532</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="genome-breakdown">
                      <div>
                        Genome Breakdown
                      </div>
                      <div className="labels">
                        <ul>
                          <li className="">
                            <div className="label-color mid-gray"></div>
                            <div className="label-title">
                              <span className="read-count">31781</span>
                              <span className="read-label">Bacteria Reads</span>
                            </div>
                          </li>

                          <li className="">
                            <div className="label-color light-gray"></div>
                            <div className="label-title">
                              <span className="read-count">31781</span>
                              <span className="read-label">Bacteria Reads</span>
                            </div>
                          </li>

                          <li className="">
                            <div className="label-color dark-gray"></div>
                            <div className="label-title">
                              <span className="read-count">31781</span>
                             <span className="read-label">Bacteria Reads</span>
                            </div>
                          </li>

                          <li className="">
                            <div className="label-color normal-gray"></div>
                            <div className="label-title">
                              <span className="read-count">31781</span>
                              <span className="read-label">Bacteria Reads</span>
                            </div>
                          </li>
                        </ul>
                      </div>

                      <div className="graph">
                        <div className="row">
                          <div className="col s3 visuals mid-gray"></div>
                          <div className="col s3 visuals light-gray"></div>
                          <div className="col s3 visuals dark-gray"></div>
                          <div className="col s3 visuals normal-gray"></div>
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

                <a className="custom-button">
                  <i className="fa fa-file-text-o left"></i> GENERATE REPORT
                </a>
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }

}
