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
                  <div className='col s9 center' id="heat-map">
                    <div className="viz loading-pathogens center grey-text darken-2">
                      <div className='message'>
                        Please wait fetching pathogens to visualize
                      </div>
                      <i className="fa fa-spinner fa-spin fa-2x"></i>
                    </div>
                    <svg id='heat-map-canvas'></svg>
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

  static renderHeatMap(pathogens, samples, countType, sortBy) {

    const dataLength = pathogens.length;
    const totalSamples = samples.length;
    const grid = { width: 60, height: 60 };
    const paddingBottom = 150;
    const paddingLeft = 200;
    const canvas = {
      width: (grid.width * totalSamples) + paddingLeft,
      height: (grid.height * dataLength) + paddingBottom
    };
    const svg = d3.select('#heat-map-canvas');
    const margin = {
      top: 20,
      right: grid.width,
      bottom: 20,
      left: 20 + paddingLeft
    };
    const colors = ['rgb(0, 250, 250)', 'rgb(23, 173, 203)',
    'rgb(46, 100, 158)', 'rgb(24, 53, 103)', 'rgb(0, 0, 0)'];
    const blankRectColor = '#cacaca'; // the color of the placeholder rect
    if (dataLength && totalSamples) {

      let minMaxes = [];
      pathogens.map((data) => {
        let minMax = d3.extent(data.readInfo, (d) => {
          return d[countType];
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

      const xScale = d3
        .scaleLinear()
        .domain([1, totalSamples])
        .range([margin.left, ((canvas.width) - margin.right) + 5]);

      const xAxis = d3
        .axisBottom(xScale)
        .ticks(totalSamples - 1)
        .tickFormat((d, i) => samples[i]);

      const drawPathogenName = svg.selectAll('.pathogen-name')
        .data(pathogens, d => d.pathogen);

      const transition = d3.transition().duration(1000);

      drawPathogenName.exit().remove();
      drawPathogenName
        .enter()
        .append('text')
        .attr('class', 'pathogen-name')
        .text(d => d.pathogen)
        .attr('y', (d, i) => ((i * grid.height) + 5) + (grid.height / 1.5))
        .attr('text-anchor', 'end')
        .attr('x', margin.left - 5)
        .merge(drawPathogenName)
        .transition(transition)
        .attr('y', (d, i) => ((i * grid.height) + 5) + (grid.height / 1.5))
        .text(d => d.pathogen);
      svg.select('.xAxis').remove();
      svg
        .append('g')
        .attr('class', 'xAxis')
        .attr('transform', `translate(${[grid.width / 1.5, (canvas.height - paddingBottom) + 5]})`)
        .call(xAxis)
        .selectAll('text')
        .attr('text-anchor', 'start')
        .attr('transform', 'rotate(60)');

      const drawPathogenGroup = svg.selectAll('.grouped-pathogens')
        .data(pathogens, (d, i) => i);

      drawPathogenGroup
        .exit()
        .transition(transition)
        .attr('transform', `translate(${-canvas.width}, ${canvas.height / 1.5})`)
        .remove();

      const pathogenUpdate = drawPathogenGroup
        .enter()
        .append('g')
        .attr('class', 'grouped-pathogens')
        .attr('transform', (d, i) => {
          return `translate(0, ${(i * grid.height) + 5})`;
         })
        .merge(drawPathogenGroup);

      const drawRect = pathogenUpdate
        .selectAll('.color-rect')
        .data((d) => {
          if (d.readInfo) {
            const count = totalSamples - d.readInfo.length;
            if (count) {
              const foundSamples = d.readInfo.map(r => r.sample);
              const unAvailableSamples =
              samples.filter(s => foundSamples.indexOf(s) < 0);
              // we need to draw more rect to fill the blank space
              unAvailableSamples.forEach((s) => {
                d.readInfo.push({
                  sample: s, type: 'no-read'
                });
              });
              return d.readInfo;
            }
          }
          return d.readInfo;
        }, k => k[countType]);
      drawRect.exit().remove();
      const rectUpdate = 
        drawRect
          .enter()
          .append('rect')
          .attr('fill', (d, i) => {
            if (d['type'] === 'no-read') {
              return blankRectColor;
            }
            return colorScale(d[countType]);
          })
          .attr('class', 'color-rect')
          .attr('height', grid.height)
          .attr('width', grid.width)
          .attr('stroke', '#fff')
          .attr('y', 0)
          .attr('x', (d, i) => {
            const sampleName = d.sample;
            let pos = samples.indexOf(sampleName);
            if (pos >= 0) {
              return xScale(pos + 1);
            }
          })
          .append('title')
          .text((d, i) => {
            if (d['type'] === 'no-read') {
              return;
            }
            return `NT rpm: ${d.nt_rpm} NT zscore: ${d.nt_zscore}\nNR rpm: ${d.nr_rpm} NR zscore:  ${d.nr_zscore}`;
          });
        rectUpdate.merge(drawRect)
          .transition(transition)
          .attr('fill', (d, i) => {
            if (d['type'] == 'no-read') {
              // we encountered a placeholder rectangle
              return blankRectColor;
            }
            return colorScale(d[countType]);
          })
          .attr('x', (d, i) => {
            const sampleName = d.sample;
            let pos = samples.indexOf(sampleName);
            if (pos >= 0) {
              return xScale(pos + 1);
            }
          });
    }
  }

  static renderColorScale(colorMinMax, colorScale) {
    const colorScaleView = d3.select('#color-scale');
    const colorScaleMargin = { left: 10, right: 10, bottom: 50, top: 10 };
    const colorScaleCanvas = { width: 200, height: 200 };
    const quantiles = [...new Set([colorMinMax[0], ...colorScale.quantiles()])];
    const label = ['Color scale range'];
    const labelHeight = 15;

    const gridHeight =
      (colorScaleCanvas.height - colorScaleMargin.top - colorScaleMargin.bottom) / quantiles.length;
    const gridWidth = 30;

    colorScaleView
      .attr('width', colorScaleCanvas.width)
      .attr('height', colorScaleCanvas.height);


    colorScaleView.selectAll('.scale-label')
      .data(label)
      .enter()
      .append('text')
      .attr('class', 'scale-label')
      .attr('y', colorScaleMargin.top + 10)
      .attr('x', colorScaleMargin.left)
      .text(d => d);

    // colorScaleView.select('.color-quantile').remove();

    const a = colorScaleView.selectAll('.color-quantile')
    .data(quantiles, d => d);
    const cGroup = a
      .enter()
      .append('g')
      .attr('class', 'color-quantile')
      .attr('transform', `translate(${[0, colorScaleMargin.top + labelHeight] })`);

    cGroup
      .append('rect')
      .attr('height', gridHeight)
      .attr('width', gridWidth)
      .attr('fill', d => colorScale(d))
      .attr('y', (d, i) => (i * gridHeight))
      .attr('x', colorScaleMargin.left)
      .attr('stroke', '#fff');

    cGroup
      .append('text')
      .text(d => `≥ ${(d) ? d.toFixed(3) : d}`)
      .attr('x', colorScaleMargin.left + (gridWidth + 10))
      .attr('y', (d, i) => ((i * gridHeight) + (gridHeight / 1.5)))
      .attr('fill', 'rgb(160, 160, 160)');

    a.exit().remove();
  }

  static sortPathogens(pathogens, sortBy) {
    if (pathogens && sortBy) {
      const sortDetails = sortBy.split('_');
      if (sortDetails.length < 3) {
        return;
      }
      const dir = sortDetails.shift();
      sortBy = sortDetails.join('_');
      const minMax = (dir === 'highest') ? Math.max : Math.min;
      return pathogens.sort((b, a) => {
        const readsB = b.readInfo.map(o => o[sortBy]);
        const readsA = a.readInfo.map(o => o[sortBy]);
        readsA.splice(readsA.indexOf(undefined));
        readsB.splice(readsB.indexOf(undefined));
        return (dir === 'highest') ? minMax(...readsA) - minMax(...readsB)
          : minMax(...readsB) - minMax(...readsA);
      });      
    }
  }
}

