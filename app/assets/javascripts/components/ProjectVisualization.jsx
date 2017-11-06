/**
  * @class ProjectVisualization
  * @desc a component to visualize sample and their species taxonomy distribution
*/
class ProjectVisualization extends React.Component {

  constructor(props) {
    super(props);
  }

	componentDidMount() {

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
            <SelectPathogen renderHeatMap = { this.renderHeatMap } />
	        </div>
	        <div className="col s10 graphs">
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
                            nt_rpm
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
	        {
            /*
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
            */
          }
        </div>
	</div>
    );
  }

  renderHeatMap(pathogens, samples) {

    const canvas = { width: 700, height: 800 };
    const svg = d3.select('#heat-map').append('svg');
    const margin = { top: 50, right: 35, bottom: 200, left: 120 };
    const xMargin = { left: margin.left + 10, right: margin.right + 10 };
    const dataLength = pathogens.length;
    const totalSamples = samples.length;
    const colors = ['#a021f0', '#ff26f4', '#ff7279', '#ff6201', '#ffec01'];

    if (dataLength && totalSamples) {
      const rectHeight =
        (canvas.height - margin.top - margin.bottom) / dataLength;
      const rectWidth =
        (canvas.width - xMargin.left - xMargin.right) / totalSamples;

      const minMaxes = [];
      pathogens.map((data) => {
        let minMax = d3.extent(data.readInfo, (d) => {
          return d.nt_rpm;
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

      ProjectVisualization.renderColorScale(colorMinMax, colorScale);
      // let the user know what values the colors represents
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
        .tickFormat((d, i) => samples[i]);

      const yAxis = d3
        .axisLeft(yScale)
        .ticks(dataLength - 1)
        .tickFormat((d, i) => {
          return pathogens[i].pathogen;
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

      pathogens.map((pathogen, i) => {
        let { readInfo } = pathogen;
        let drawRect = svg.append('g').selectAll('rect').data(readInfo, (d, _id) => i);


        drawRect.exit().remove();

        let enter = drawRect
          .enter()
          .append('rect')
          .attr('height', rectHeight)
          .attr('width', rectWidth);


        drawRect = enter.merge(drawRect)
          .attr('fill', (d, i) => colorScale(d.nt_rpm))
          .attr('stroke', '#fff')
          .attr('y', () => yScale(i + 1) - 30)
          .attr('x', (d, index) => {
            let sampleName = readInfo[index].sample;
            let pos = samples.indexOf(sampleName);
            if (pos >= 0) {
              return xScale(pos + 1);
            }
          })
          .append('title')
          .text((data, i) => {
            return `RPM: ${data.nt_rpm} NT zscore: ${data.nt_zscore}`;
          });
        });
    }
  }

  static renderColorScale(colorMinMax, colorScale) {
    const colorScaleView = d3.select('#color-scale').append('svg');
    const colorScaleMargin = { left: 10, right: 10, bottom: 10, top: 10 };
    const colorScaleCanvas = { width: 300, height: 200 };
    const quantiles = [...new Set([colorMinMax[0], ...colorScale.quantiles()])];
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
      .text(d => `≥ ${(d) ? d.toFixed(3) : d}`)
      .attr('x', gridWidth + 5)
      .attr('y', (d, i) => ((i * gridHeight) + (gridHeight / 1.5)))
      .attr('fill', 'rgb(160, 160, 160)');
  }
}
