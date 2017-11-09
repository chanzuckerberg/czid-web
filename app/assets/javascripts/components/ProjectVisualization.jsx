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
            <SelectPathogen />
	        </div>
	        <div className="col s10 graphs">
            <div className="card">
              <div className="card-action top">
                <a href="#">Heatmap</a>
                <i className="fa fa-chevron-up card-collapse right"></i>
              </div>
              <div className="card-content">
                <div className='row'>
                  <div className='col s9' id="heat-map">
                    <svg id='heat-map-canvas'></svg>
                  </div>
                   <div className='col s3'>
                      <div className='color-scale-info'>
                        <div className='scale-label'>Color scale range</div>
                        <svg id='color-scale'></svg>
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

  static renderHeatMap(pathogens, samples, scoreType) {

    const canvas = { width: 800, height: 800 };
    const svg = d3.select('#heat-map-canvas');
    const margin = { top: 50, right: 35, bottom: 200, left: 120 };
    const xMargin = { left: margin.left + 10, right: margin.right + 10 };
    const dataLength = pathogens.length;
    const totalSamples = samples.length;
    const expectedReads = dataLength * totalSamples;
    let totalReads = 0;

    const colors = ['rgb(0, 250, 250)', 'rgb(23, 173, 203)',
    'rgb(46, 100, 158)', 'rgb(24, 53, 103)', 'rgb(0, 0, 0)'];

    if (dataLength && totalSamples) {
      const rectHeight =
        (canvas.height - margin.top - margin.bottom) / dataLength;
      const rectWidth =
        (canvas.width - xMargin.left - xMargin.right) / totalSamples;

      let minMaxes = [];
      pathogens.map((data) => {
        totalReads += data.readInfo.length;
        let minMax = d3.extent(data.readInfo, (d) => {
          return d[scoreType];
        });
        minMaxes.push(...minMax);
      });
      minMaxes = [...new Set(minMaxes)];
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

      svg.select('.yAxis').remove(); // we should do a smart update instead
      svg
        .append('g')
        .attr('class', 'yAxis')
        .transition()
        .duration(100)
        .attr('transform', `translate(${[margin.left, 0]})`)
        .call(yAxis)
        .selectAll('text')
        .attr('transform', 'rotate(50)');

      svg.select('.xAxis').remove();
      svg
        .append('g')
        .attr('class', 'xAxis')
        .attr('transform', `translate(${[25, (canvas.height - margin.bottom) + rectHeight]})`)
        .call(xAxis)
        .selectAll('text')
        .attr('text-anchor', 'start')
        .attr('transform', `rotate(60)`);

      const drawPathogenGroup = svg.selectAll('.grouped-pathogens')
        .data(pathogens, d => d.pathogen);

      drawPathogenGroup.exit().remove();

      const pathogenUpdate = drawPathogenGroup
        .enter()
        .append('g')
        .attr('class', 'grouped-pathogens')
        .attr('transform', (d, i) => `translate(0, ${yScale(i + 1) - 30})`)
        .merge(drawPathogenGroup);

      const drawRect = pathogenUpdate
        .selectAll('.color-rect')
        .data((d, i) => {
          if (d.readInfo) {
            let count = totalSamples - d.readInfo.length;
            if (count) {
              let foundSamples = d.readInfo.map((r) => r.sample);
              let unAvailableSamples =
              samples.filter((s) => foundSamples.indexOf(s) < 0);
              // we need to draw more rect to fill the blank space
              unAvailableSamples.forEach((s) => {
                d.readInfo.push({ sample: s, type: 'no-read' });
              });
              return d.readInfo;
            }
          }
          return d.readInfo;
        }, (k) => k[scoreType]);
      drawRect.exit().remove();
      const rectUpdate = 
        drawRect
          .enter()
          .append('rect')
          .attr('fill', (d, i) => {
            if (d['type'] == 'no-read') {
              // we encountered a placeholder rectangle
              return '#cacaca';
            }
            return colorScale(d[scoreType]);
          })
          .attr('class', 'color-rect')
          .attr('height', rectHeight)
          .attr('width', rectWidth)
          .attr('stroke', '#fff')
          .attr('y', 0)
          .attr('x', (d) => {
            let sampleName = d.sample;
            let pos = samples.indexOf(sampleName);
            if (pos >= 0) {
              return xScale(pos + 1);
            }
          })
          .append('title')
          .text((d, i) => {
            if (d['type'] == 'no-read') {
              return '';
            }
            return `NT rpm: ${d.nt_rpm} NT zscore: ${d.nt_zscore}\nNR rpm: ${d.nr_rpm} NR zscore:  ${d.nr_zscore}`;
          });

        rectUpdate.merge(drawRect)
          .attr('fill', (d, i) => {
            if (d['type'] == 'no-read') {
              // we encountered a placeholder rectangle
              return '#cacaca';
            }
            return colorScale(d[scoreType]);
          });
    }
  }

  static renderColorScale(colorMinMax, colorScale) {
    const colorScaleView = d3.select('#color-scale');
    const colorScaleMargin = { left: 10, right: 10, bottom: 10, top: 10 };
    const colorScaleCanvas = { width: 300, height: 200 };
    const quantiles = [...new Set([colorMinMax[0], ...colorScale.quantiles()])];

    const gridHeight =
      (colorScaleCanvas.height - colorScaleMargin.top - colorScaleMargin.bottom) / quantiles.length;
    const gridWidth = 30;

    colorScaleView
      .attr('width', colorScaleCanvas.width)
      .attr('height', colorScaleCanvas.height);

    colorScaleView.select('.color-quantile').remove();

    const c = colorScaleView.selectAll('.color-quantile')
      .data(quantiles)
      .enter()
        .append('g')
        .attr('class', 'color-quantile');
        c
        .append('rect')
        .attr('class', 'color-quantile')
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

     //  const merge =  c
     //  .enter()
     //  .append('g')
     //  .append('rect')

     // issue updating the color scale


     //  .merge(c);

     // const update = drawPathogenGroup
     //    .enter()
     //    .append('g')
     //    .attr('class', 'grouped-pathogens')
     //    .attr('transform', (d, i) => `translate(0, ${yScale(i + 1) - 30})`)
     //    .merge(drawPathogenGroup);
  }

}

