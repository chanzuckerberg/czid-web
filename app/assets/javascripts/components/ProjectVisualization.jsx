/**
  * @class ProjectVisualization
  * @desc a component to visualize sample and their species taxonomy distribution
*/
class ProjectVisualization extends React.Component {

  constructor(props) {
    super(props);
    this.heatmapData = [{
      pathogen: 'Clavispora',
      readInfo: [{
        rpm: 50.091,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-7-102A_S10'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-12-102A_S15'
      }]
    }, {
      pathogen: 'Spirometra',
      readInfo: [{
        rpm: 50.091,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-12-102A_S15'
      }]
    }, {
      pathogen: 'Klebsiella',
      readInfo: [{
        rpm: 50.091,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-7-102A_S10'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-12-102A_S15'
      }]
    }, {
      pathogen: 'Streptococcus',
      readInfo: [{
        rpm: 50.091,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-7-102A_S10'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-12-102A_S15'
      }]
    }, {
      pathogen: 'Ralstonia',
      readInfo: [{
        rpm: 50.091,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-7-102A_S10'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-12-102A_S15'
      }]
    }, {
      pathogen: 'Delftia',
      readInfo: [{
        rpm: 50.091,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-7-102A_S10'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      },{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-12-102A_S15'
      }]
    }];
    const a = this.heatmapData.map(d => d.readInfo.length);
    this.totalPathogens = a.reduce((total, val) => total + val);
    console.log('TOTAL pathogens', this.totalPathogens);
    this.temp = new Array(this.totalPathogens);
    this.samples = ['MMC-4-102A_S7', 'MMC-3--H2O_S6',
    'MMC-5-102A_S8', 'MMC-6-102A_S9', 'MMC-7-102A_S10',
    'MMC-8-102A_S11', 'MMC-9-102A_S12', 'MMC-10-102A_S13',
    'MMC-11-102A_S14', 'MMC-12-102A_S15'];
    //
  }
	componentDidMount() {
		this.renderHeatMap();
    $('.card-collapse').click((e) => {
      const chevron = $(e.toElement);
      const card = chevron.parent().next();
      chevron.toggleClass('fa-chevron-down');
      card.slideToggle(300);
    });
	}

  /**
    * @method render
    * @desc overrides render component method
    * @return {Object} DOM object
  */
  render() {
    return (
	<div id="project-visualization">
		<SubHeader>
          <div className="sub-header">
            <div className="title">
              Project Visualization
            </div>
            <div className="sub-title">
             Track pathogen distribution across mosquito samples
            </div>
          </div>
        </SubHeader>
        <div className="row visualization-content">
	        <div className="col s2" id="visualization-sidebar">
			<div className='select-pathogens genus card'>
				<div className='search-pathogen'>
					<div className='row search-row'>
						<div className='col s12'>
							<input type='text' placeholder='Add Genus' />
						</div>
							{ /* <div className='col s2 right'> <i className='fa fa-plus-circle add-pathogen-icon'></i>  </div>*/ }
					</div>
				</div>
				<div className='selected-pathogens'>
					<ul>
						<li>
							<div className='row'>
								<div className='pathogen-label col s10'>
									<input id='Delftia' className='filled-in' type="checkbox" defaultChecked={true} />
									<label htmlFor='Delftia'>Delftia</label>
								</div>
								<div className='remove-icon right col center s2'>
									<i className='fa fa-times'></i>
								</div>
							</div>
						</li>
						<li>
							<div className='row'>
								<div className='pathogen-label col s10'>
									<input id='Ralstonia' className='filled-in' type="checkbox" defaultChecked={true} />
									<label htmlFor='Ralstonia'>Ralstonia</label>
								</div>
								<div className='remove-icon right col center s2'>
									<i className='fa fa-times'></i>
								</div>
							</div>
						</li>
						<li>
							<div className='row'>
								<div className='pathogen-label col s10'>
									<input id='Streptococcus' className='filled-in' type="checkbox" defaultChecked={true} />
									<label htmlFor='Streptococcus'>Streptococcus</label>
								</div>
								<div className='remove-icon right col center s2'>
									<i className='fa fa-times'></i>
								</div>
							</div>
						</li>
                  <li>
                    <div className='row'>
                      <div className='pathogen-label col s10'>
                        <input id='Klebsiella' className='filled-in' type="checkbox" defaultChecked={true} />
                        <label htmlFor='Klebsiella'>Klebsiella</label>
                      </div>
                      <div className='remove-icon right col center s2'>
                        <i className='fa fa-times'></i>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className='row'>
                      <div className='pathogen-label col s10'>
                        <input id='Klebsiella' className='filled-in' type="checkbox" defaultChecked={true} />
                        <label htmlFor='Klebsiella'>Spirometra</label>
                      </div>
                      <div className='remove-icon right col center s2'>
                        <i className='fa fa-times'></i>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className='row'>
                      <div className='pathogen-label col s10'>
                        <input id='Klebsiella' className='filled-in' type="checkbox" defaultChecked={true} />
                        <label htmlFor='Klebsiella'>Clavispora</label>
                      </div>
                      <div className='remove-icon right col center s2'>
                        <i className='fa fa-times'></i>
                      </div>
                    </div>
                  </li>
					</ul>
				</div>
			</div>
			<div className='select-pathogens species card'>
				<div className='search-pathogen'>
					<div className='row search-row'>
						<div className='col s12'>
							<input type='text' placeholder='Add more species' />
						</div>
						{ /* <div className='col s2 right'> <i className='fa fa-plus-circle add-pathogen-icon'></i>  </div>*/ }
					</div>
				</div>
				<div className='selected-pathogens'>
					<ul>
						<li>
							<div className='row'>
								<div className='pathogen-label col s10'>
									<input id='Methylobacterium phyllosphaerae' className='filled-in' type="checkbox" defaultChecked={false} />
									<label htmlFor='Methylobacterium phyllosphaerae'>Methylobacterium phyllosphaerae</label>
								</div>
								<div className='remove-icon right col center s2'>
									<i className='fa fa-times'></i>
								</div>
							</div>
						</li>
						<li>
							<div className='row'>
								<div className='pathogen-label col s10'>
									<input id='Methylotenera versatilis' className='filled-in' type="checkbox" defaultChecked={false} />
									<label htmlFor='Methylotenera versatilis'>Methylotenera versatilis</label>
								</div>
								<div className='remove-icon right col center s2'>
									<i className='fa fa-times'></i>
								</div>
							</div>
						</li>
						<li>
							<div className='row'>
								<div className='pathogen-label col s10'>
									<input id='Stenotrophomonas acidaminiphila' className='filled-in' type="checkbox" defaultChecked={false} />
									<label htmlFor='Stenotrophomonas acidaminiphila'>Stenotrophomonas acidaminiphila</label>
								</div>
								<div className='remove-icon right col center s2'>
									<i className='fa fa-times'></i>
								</div>
							</div>
						</li>
					</ul>
				</div>
			</div>
	        </div>
	        <div className="col s8 graphs">
            <div className="card">
              <div className="card-action top">
                <a href="#">Heatmap</a>
                <i className="fa fa-chevron-up card-collapse right"></i>
              </div>
              <div className="card-content">
                <div className='row'>
                  <div className='col s9' id="heat-map"></div>
                   <div className='col s3'>
                      <div className='select-focus'>
                        Visualize <select className='browser-default'>
                          <option>
                            Rpm
                          </option>
                          <option>
                            R count
                          </option>
                          <option>
                            zscore
                          </option>
                        </select>
                      </div>
                      <div className='color-scale-info'>
                        Color Scale
                        <ul>
                          <li className='a'></li>
                          <li className='b'></li>
                          <li className='c'></li>
                          <li className='d'></li>
                          <li className='e'></li>
                        </ul>
                      </div>
                   </div>
                </div>
              </div>
            </div>

	        </div>
	        <div className='col s2'>
			<div className='Visualization-actions'>
				<ul className='card'>
					<li>
						<a href=''>
							<i className='fa fa-save text-white indigo'></i> Save Data
						</a>
					</li>
					<li>
						<a href=''>
							<i className='fa fa-cloud-download text-white teal'></i> Download Data
						</a>
					</li>
				</ul>
			</div>
	        </div>
        </div>
	</div>
    );
  }

  renderHeatMap() {
    const canvas = { width: 800, height: 600, minHeigth: 400 };
    const svg = d3.select('#heat-map').append('svg');
    const margin = { top: 50, right: 35, bottom: 200, left: 80 };
    const xMargin = { left: margin.left + 10, right: margin.right + 10 };
    const dataLength = this.heatmapData.length;
    const totalSamples = this.samples.length;

    const rectHeight =
      (canvas.height - margin.top - margin.bottom) / dataLength;
    const rectWidth =
      (canvas.width - xMargin.left - xMargin.right) / totalSamples;

    svg
      .attr('width', canvas.width)
      .attr('height', canvas.height);

    const yScale = d3
      .scaleLinear()
      .domain([1, dataLength])
      .range([canvas.height - margin.bottom, margin.top]);

    console.log('Y would be ', canvas.height - yScale(2));

    const xScale = d3
      .scaleLinear()
      .domain([1, totalSamples])
      .range([xMargin.left, canvas.width - xMargin.right - 20]);

    const rectHeightScale = d3
      .scaleLinear()
      .domain([])
      .range();

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(totalSamples - 1)
      .tickFormat((d, i) => this.samples[i]);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(dataLength - 1)
      .tickFormat((d, i) => {
        console.log('Y Data', d);
        return this.heatmapData[i].pathogen;
      });

    svg
      .append('g')
      .attr('transform', `translate(${[margin.left, 0]})`)
      .call(yAxis)
      .selectAll('text')
      .attr('transform', 'rotate(50)');

    svg.append('g')
      .attr('transform', `translate(${[25, (canvas.height - margin.bottom) + rectHeight]})`)
      .call(xAxis)
      .selectAll('text')
      .attr('text-anchor', 'start')
      .attr('transform', `rotate(60)`);

    //let readInfo;
    this.heatmapData.map((pathogen, i) => {
      let { readInfo } = pathogen;
      console.log('Read info', readInfo);
      svg
        .append('g')
        .selectAll('rect')
        .data(readInfo)
        .enter()
        .append('rect')
        .attr('height', rectHeight)
        .attr('width', rectWidth)
        .attr('fill', (d, i) => {
          if (i < 1) {
            return '#c7c6c6';
          }
          return (i % 2 === 0) ? ((i % 3 === 0) ? '#9E9E9E' : '#757575') : '#424242';
        })
        .attr('stroke', '#fff')
        .attr('y', () => yScale(i + 1) - 30)
        .attr('x', (d, index) => {
          console.log('Rectangles', d, 'Pos', index);
          let sampleName = readInfo[index].sample;
          let pos = this.samples.indexOf(sampleName);
          if (pos >= 0) {
            return xScale(pos + 1);
          }
        })
        .append('title')
        .text((data, i) => {
          return `RPM: ${data.rpm} R count: ${data.rCount}`;
        });
      });
  }
}
