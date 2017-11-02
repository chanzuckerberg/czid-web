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
        rpm: 2.091,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 3.65,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      }, {
        rpm: 10.181,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 424,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      }, {
        rpm: 32.103,
        rCount: 8,
        sample: 'MMC-7-102A_S10'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 948.22,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      }, {
        rpm: 438.8,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 365,
        rCount: 8,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 901,
        rCount: 8,
        sample: 'MMC-12-102A_S15'
      }]
    }, {
      pathogen: 'Spirometra',
      readInfo: [{
        rpm: 691,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 432,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      } ,{
        rpm: 772,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 243.4,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      } ,{
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 0.181,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      }, {
        rpm: 12.94,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 82.21,
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
        rpm: 13,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 4.91,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      }, {
        rpm: 110,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 3424.1,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      }, {
        rpm: 13,
        rCount: 8,
        sample: 'MMC-7-102A_S10'
      }, {
        rpm: 234,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 9439,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      }, {
        rpm: 234.2,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 11.1,
        rCount: 8,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 149.10,
        rCount: 8,
        sample: 'MMC-12-102A_S15'
      }]
    }, {
      pathogen: 'Streptococcus',
      readInfo: [{
        rpm: 137.2,
        rCount: 13,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 237.24,
        rCount: 24,
        sample: 'MMC-4-102A_S7'
      }, {
        rpm: 938.21,
        rCount: 24,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 383.2,
        rCount: 632,
        sample: 'MMC-6-102A_S9'
      }, {
        rpm: 245.1,
        rCount: 53,
        sample: 'MMC-7-102A_S10'
      }, {
        rpm: 132.22,
        rCount: 35,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 43.221,
        rCount: 23,
        sample: 'MMC-9-102A_S12'
      }, {
        rpm: 34.21,
        rCount: 3,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 654.123,
        rCount: 28,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 243.51,
        rCount: 84,
        sample: 'MMC-12-102A_S15'
      }]
    }, {
      pathogen: 'Ralstonia',
      readInfo: [{
        rpm: 939.48,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 244.43,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      }, {
        rpm: 412.30,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 83.22,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      }, {
        rpm: 341.24,
        rCount: 8,
        sample: 'MMC-7-102A_S10'
      }, {
        rpm: 425.2,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 829.21,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      }, {
        rpm: 134.1,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 53.1,
        rCount: 8,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 892.2,
        rCount: 8,
        sample: 'MMC-12-102A_S15'
      }]
    }, {
      pathogen: 'Delftia',
      readInfo: [{
        rpm: 132.1,
        rCount: 140,
        sample: 'MMC-3--H2O_S6'
      }, {
        rpm: 134.1,
        rCount: 8,
        sample: 'MMC-4-102A_S7'
      }, {
        rpm: 342.24,
        rCount: 8,
        sample: 'MMC-5-102A_S8'
      }, {
        rpm: 2421.13,
        rCount: 8,
        sample: 'MMC-6-102A_S9'
      }, {
        rpm: 242.1,
        rCount: 8,
        sample: 'MMC-7-102A_S10'
      }, {
        rpm: 2424.5,
        rCount: 8,
        sample: 'MMC-8-102A_S11'
      }, {
        rpm: 2.402,
        rCount: 8,
        sample: 'MMC-9-102A_S12'
      }, {
        rpm: 1342,
        rCount: 8,
        sample: 'MMC-10-102A_S13'
      }, {
        rpm: 24.89,
        rCount: 8,
        sample: 'MMC-11-102A_S14'
      }, {
        rpm: 2472,
        rCount: 242,
        sample: 'MMC-12-102A_S15'
      }]
    }];
    const a = this.heatmapData.map(d => d.readInfo.length);
    this.totalPathogens = a.reduce((total, val) => total + val);
    this.temp = d3.range(this.totalPathogens);
    this.samples = ['MMC-4-102A_S7', 'MMC-3--H2O_S6',
    'MMC-5-102A_S8', 'MMC-6-102A_S9', 'MMC-7-102A_S10',
    'MMC-8-102A_S11', 'MMC-9-102A_S12', 'MMC-10-102A_S13',
    'MMC-11-102A_S14', 'MMC-12-102A_S15'];
    //
    this.renderHeatMap = this.renderHeatMap.bind(this);
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
                        <div className='scale-label'>Color scale range</div>
                        <div id='color-scale'></div>
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
    const colors = ['#a021f0', '#ff26f4', '#ff7279', '#ff6201', '#ffec01'];

    const rectHeight =
      (canvas.height - margin.top - margin.bottom) / dataLength;
    const rectWidth =
      (canvas.width - xMargin.left - xMargin.right) / totalSamples;

    const minMaxes = [];
    this.heatmapData.map((data) => {
      let minMax = d3.extent(data.readInfo, (d) => {
        return d.rpm;
      });
      minMaxes.push(...minMax);
    });
    const colorMinMax = d3.extent(minMaxes);

    const colorScale = d3
    .scaleQuantile()
    .domain(minMaxes)
    .range(colors);
    svg
      .attr('width', canvas.width)
      .attr('height', canvas.height);

    this.renderColorScale(colorMinMax, colorScale);

    const yScale = d3
      .scaleLinear()
      .domain([1, dataLength])
      .range([canvas.height - margin.bottom, margin.top]);

    const xScale = d3
      .scaleLinear()
      .domain([1, totalSamples])
      .range([xMargin.left, canvas.width - xMargin.right - 20]);

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(totalSamples - 1)
      .tickFormat((d, i) => this.samples[i]);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(dataLength - 1)
      .tickFormat((d, i) => {
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

    this.heatmapData.map((pathogen, i) => {
      let { readInfo } = pathogen;
      svg
        .append('g')
        .selectAll('rect')
        .data(readInfo)
        .enter()
        .append('rect')
        .attr('height', rectHeight)
        .attr('width', rectWidth)
        .attr('fill', (d, i) => colorScale(d.rpm))
        .attr('stroke', '#fff')
        .attr('y', () => yScale(i + 1) - 30)
        .attr('x', (d, index) => {
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

  renderColorScale(colorMinMax, colorScale) {
    const colorScaleView = d3.select('#color-scale').append('svg');
    const colorScaleMargin = { left: 10, right: 10, bottom: 10, top: 10 };
    const colorScaleCanvas = { width: 300, height: 200 };
    const quantiles = [colorMinMax[0], ...colorScale.quantiles()];
    const gridHeight =
      (colorScaleCanvas.height - colorScaleMargin.top - colorScaleMargin.bottom) / quantiles.length;
    const gridWidth = 30;

    colorScaleView
      .attr('width', colorScaleCanvas.width)
      .attr('height', colorScaleCanvas.height);

    const c = colorScaleView.selectAll('g')
      .data(quantiles).enter().append('g');
      c
      .append('rect')
      .attr('fill', d => colorScale(d))
      .attr('height', gridHeight)
      .attr('width', 30)
      .attr('stroke', '#fff')
      .attr('y', (d, i) => i * gridHeight)
      .attr('x', 0);
      c
      .append('text')
      .text(d => `≥ ${d.toFixed(3)}`)
      .attr('x', gridWidth + 5)
      .attr('y', (d, i) => ((i * gridHeight) + (gridHeight / 1.5)))
      .attr('fill', 'rgb(160, 160, 160)');
  }
}
