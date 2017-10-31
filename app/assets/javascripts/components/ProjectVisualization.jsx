/**
  * @class ProjectVisualization
  * @desc a component to visualize sample and their species taxonomy distribution
*/
class ProjectVisualization extends React.Component {

  constructor(props) {
    super(props);
    this.heatmapData = [{
      pathogen: 'Clavispora',
      readInfo: [{ rpm: 0.045, rCount: 2, sample: 'MMC-4-102A_S7' }]
    },{
      pathogen: 'Clavispora',
      readInfo: [{ rpm: 0.045, rCount: 2, sample: 'MMC-4-102A_S7' }]
    },{
      pathogen: 'Clavispora',
      readInfo: [{ rpm: 0.045, rCount: 2, sample: 'MMC-4-102A_S7' }]
    },{
      pathogen: 'Clavispora',
      readInfo: [{ rpm: 0.045, rCount: 2, sample: 'MMC-4-102A_S7' }]
    }, {
      pathogen: 'Spirometra',
      readInfo: [{ rpm: 0.226, rCount: 10, sample: 'MMC-4-102A_S7' }]
    }, {
      pathogen: 'Klebsiella',
      readInfo: [{ rpm: 0.181, rCount: 8, sample: 'MMC-4-102A_S7' }]
    }, {
      pathogen: 'Streptococcus',
      readInfo: [{ rpm: 1.747, rCount: 77, sample: 'MMC-4-102A_S7' }]
    }, {
      pathogen: 'Ralstonia',
      readInfo: [{ rpm: 0.045, rCount: 2, sample: 'MMC-4-102A_S7' }]
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
      }]
    }];

    const a = this.heatmapData.map(d => d.readInfo.length);
    this.totalPathogens = a.reduce((total, val) => total + val);
    this.temp = new Array(this.totalPathogens);
    this.samples = ['MMC-4-102A_S7', 'MMC-3--H2O_S6', 'MMC-5-102A_S8', 'MMC-5-102A_S8', 'MMC-5-102A_S8', 'MMC-5-102A_S8', 'MMC-5-102A_S8', 'MMC-5-102A_S8', 'MMC-5-102A_S8', 'MMC-5-102A_S8', 'MMC-5-102A_S8', 'MMC-5-102A_S8'];
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
									<input id='Azospira' className='filled-in' type="checkbox" defaultChecked={false} />
									<label htmlFor='Azospira'>Azospira</label>
								</div>
								<div className='remove-icon right col center s2'>
									<i className='fa fa-times'></i>
								</div>
							</div>
						</li>
						<li>
							<div className='row'>
								<div className='pathogen-label col s10'>
									<input id='Ralstonia' className='filled-in' type="checkbox" defaultChecked={false} />
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
									<input id='Methylobacterium' className='filled-in' type="checkbox" defaultChecked={false} />
									<label htmlFor='Methylobacterium'>Methylobacterium</label>
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
                <div id="heat-map"></div>
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
    const canvas = { width: 400, height: 400, minHeigth: 400 };
    const svg = d3.select('#heat-map').append('svg');
    const margin = { top: 50, right: 10, bottom: 100, left: 60 };
    const xMargin = { left: margin.left + 10, right: margin.right + 10 };
    const dataLength = this.heatmapData.length;
    const totalSamples = this.samples.length;

    const rectHeight =
      (canvas.height - margin.top - margin.bottom) / dataLength;
    const rectWidth =
      (canvas.width - xMargin.left - xMargin.right) / totalSamples;

    const colorGridSize = 30;


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
      .range([xMargin.left, canvas.width - xMargin.right]);

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
      .attr('transform', `translate(${[0, (canvas.height - margin.bottom) + rectHeight]})`)
      .call(xAxis)
      .selectAll('text')
      .attr('text-anchor', 'start')
      .attr('transform', `rotate(60)`);

    svg
      .append('g')
      .selectAll('rect')
      .data(this.heatmapData)
      .enter().append('rect')
      .attr('height', rectHeight)
      .attr('width', rectWidth)
      .attr('x', (d, i) => {
        let sampleName = d.readInfo[0].sample;
        let pos = this.samples.indexOf(sampleName);
        if (pos >= 0) {
          return xScale(pos + 1);
        } else {
          console.log('No sample found for pathogen');
        }
      })
      .attr('y', (d, i) => {
        console.log(i + 1);
        return yScale(i + 1) - 30;
      })
      .attr('fill', '#c7c6c6')
      .attr('stroke', '#fff');
  }
}
