
import React from 'react';
import {withFauxDOM} from 'react-faux-dom';
import SubHeader from './SubHeader';
import * as d3 from 'd3';
import {event as currentEvent} from 'd3';
import axios from 'axios';
import ObjectHelper from '../helpers/ObjectHelper';

class SampleHeatmapTooltip extends React.Component {
  constructor(props) {
    super(props);
  }

  renderTaxons () {
    let taxon = this.props.taxon;
    if (!taxon) {
      return
    }
    
    let valueMap = {
        'NT Score': 'NT.aggregatescore',
        'NT RPM': 'NT.rpm',
        'NT Z': 'NT.zscore',
        'NR Score': 'NR.aggregatescore',
        'NR RPM': 'NR.rpm',
        'NR Z': 'NR.zscore',
    }
    let ret = [
      <li className="col s12" key="taxon-name">
        <label>Taxon:</label>{taxon.name}
      </li>
    ];
    Object.keys(valueMap).forEach(function (key) {
      let value = valueMap[key];
      let parts = value.split("."),
            base = taxon;

      for (var part of parts) {
        base = base[part];
      }
      ret.push(<li className="col s6" key={"taxon-" + value + "-value"}>
        <label>{key}:</label>
        {base.toFixed(1)}
      </li>);
    });
    return (
      <ul className="row">
        {ret}
      </ul>
    );
  }
  render () {
    let sample = this.props.sample;
    return (
      <div className="heatmap-tooltips">
        {sample.name}
        {this.renderTaxons()}
      </div>
    )
  }
}

class D3Heatmap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {}
    this.colors = [
      '#FFFFFF',
      '#F9F1F4',
      '#F3E4EA',
      '#EDD6E0',
      '#E7C9D6',
      '#E2BBCC',
      '#DCAEC2',
      '#D6A1B8',
      '#D093AE',
      '#CA86A4',
      '#C57899',
      '#BF6B8F',
      '#B95D85',
      '#B3507B',
      '#AD4371',
      '#A83567',
      '#A2285D',
      '#9C1A53',
      '#960D49',
      '#91003F',
    ];

    this.initializeData(this.props);
  }

  initializeData (props) {
    this.row_number = props.rows;
    this.col_number = props.columns;

    this.rowLabel = [];
    this.colLabel = [];

    let char_width = 8,
        longest_row_label = 0,
        longest_col_label = 0;

    // Figure out column and row labels
    for (let i = 0; i < this.row_number; i += 1) {
      let label = props.getRowLabel(i)
      this.rowLabel.push(label);
      longest_row_label = Math.max(longest_row_label, label.length);
    }

    for (let j = 0; j < this.col_number; j += 1) {
      let label = props.getColumnLabel(j);
      this.colLabel.push(label);
      longest_col_label = Math.max(longest_col_label, label.length);
    }

    // Generate the grid data
    this.data = [];
    this.min = 999999999;
    this.max = -999999999;

    for (var i = 0; i < this.row_number; i += 1) {
      for (var j = 0; j < this.col_number; j += 1) {
        var col = this.colLabel[j];
        let value = props.getCellValue(i, j);
        this.data.push({
          row: i,
          col: j,
          value: value,
        });
        if (value !== undefined) {
          this.min = Math.min(this.min, value);
          this.max = Math.max(this.max, value);
        }
      }
    }
    this.margin ={
      top:  char_width * longest_col_label * 0.75,
      right: 10,
      bottom: 50,
      left: char_width * longest_row_label
    };

    this.cellSize = Math.min(900 / this.col_number, 400 / this.row_number);
    this.cellSize = parseInt(Math.max(this.cellSize, 20), 10);

    this.width = this.cellSize * this.col_number + this.margin.left + this.margin.right;
    this.height = this.cellSize * this.row_number + this.margin.top + this.margin.bottom;

    this.legendElementWidth = this.col_number * this.cellSize / this.colors.length;
  }

  componentDidMount () {
    this.renderD3();
  }

  renderD3 () {
    let that = this

    this.svg = d3.select(this.container).append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");


    this.renderRowLabels();
    this.renderColLabels();
    this.renderHeatmap();
    this.renderLegend();
  }

  renderHeatmap () {
    let colorScale = d3.scale.quantile()
        .domain([this.min, this.max])
        .range(this.colors);

    let that = this;
    var heatMap = this.svg.append("g").attr("class","g3")
      .selectAll(".cellg")
      .data(this.data, function (d) {
        return d.row + ":" + d.col;
      })
      .enter()
      .append("rect")
      .attr("x", function(d, i) { return d.col * that.cellSize; })
      .attr("y", function(d) { return d.row * that.cellSize; })
      .attr("class", function(d){return "cell cell-border cr"+d.row+" cc"+d.col })
      .attr("width", this.cellSize)
      .attr("height", this.cellSize)
      .style("fill", function(d) {
        if (d.value === undefined) {
          return "#f6f6f6";
        }
        return colorScale(d.value);
      })
      .on("mouseover", function(d){
         //highlight text
         d3.select(this).classed("cell-hover",true);
         d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==d.row;});
         d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==d.col;});

         d3.select(that.tooltip)
           .style("left", (currentEvent.pageX+10) + "px")
           .style("top", (currentEvent.pageY-10) + "px")
          d3.select(that.tooltip).classed("hidden", false);
          that.setState({
            hoverRow: d.row,
            hoverColumn: d.col,
          });
      })
      .on("mouseout", function(){
             d3.select(this).classed("cell-hover",false);
             d3.selectAll(".rowLabel").classed("text-highlight",false);
             d3.selectAll(".colLabel").classed("text-highlight",false);
             d3.select(that.tooltip).classed("hidden", true);
      })
      ;

  }
  renderLegend () {
    let that = this,
        height = 20;

    this.svg.selectAll(".legend-text-min")
        .data([this.min])
        .enter().append("text")
        .attr("x", function (d, i) { return 0; })
        .attr("y", function (d, i) { return that.cellSize * (that.row_number + 2); })
        .text(Math.round(this.min));
    
    this.svg.selectAll(".legend-text-max")
        .data([this.max])
        .enter().append("text")
        .attr("x", function (d, i) { return that.legendElementWidth * that.colors.length; })
        .attr("y", function (d, i) { return that.cellSize * (that.row_number + 2); })
        .text(Math.round(this.max))
        .style("text-anchor", "end");

    var legend = this.svg.selectAll(".legend")
      .data(this.colors)
      .enter().append("g")
      .attr("class", "legend");

    legend.append("rect")
      .attr("x", function(d, i) { return that.legendElementWidth * i; })
      .attr("y", this.cellSize * (this.row_number + 1))
      .attr("width", this.legendElementWidth)
      .attr("height", height)
      .style("fill", function(d, i) { return that.colors[i]; });

	this.svg.append("rect")
        .attr("stroke", "#aaa")
        .attr("stroke-width", "0.25")
        .style("fill", "none")
        .attr("x", 0)
        .attr("y", that.cellSize * (that.row_number + 1)) 
        .attr("width", that.legendElementWidth * that.colors.length)  
        .attr("height", height);    
  }

  renderRowLabels () {
    let rowSortOrder=false;
    let that = this;
    let rowLabels = this.svg.append("g")
        .selectAll(".rowLabelg")
        .data(this.rowLabel)
        .enter()
        .append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) {
          return i * that.cellSize;
        })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + this.cellSize / 1.5 + ")")
        .attr("class", function (d,i) {
          return "rowLabel mono r"+i;}
        )
        .on("mouseover", function(d) {
          d3.select(this).classed("text-hover",true);
        })
        .on("mouseout" , function(d) {
          d3.select(this).classed("text-hover",false);
        })
        // .on("click", function(d,i) {
        //   rowSortOrder=!rowSortOrder;
        //   that.sortbylabel("r",i,rowSortOrder);
        // });
  }

  renderColLabels () {
    let colSortOrder = false;
    let that = this;
    let colLabels = this.svg.append("g")
      .selectAll(".colLabelg")
      .data(this.colLabel)
      .enter()
      .append("g")
      .attr("transform", function (d, i) {
        return "translate(" + that.cellSize * i + ",-6)"
      })
      .append("text")
      .text(function (d) { return d; })
      .attr("x", 0)
      .attr("y", 0)
      .style("text-anchor", "left")
      .attr("transform", "translate("+this.cellSize/2 + ",-6) rotate (-45)")
      .attr("class",  function (d,i) { return "colLabel mono c"+i;} )
      .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
      .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
      // .on("click", function(d,i) {colSortOrder=!colSortOrder;  that.sortbylabel("c",i,colSortOrder);});
  }

  sortbylabel(rORc, i, sortOrder) {
    let that = this
    var svg = this.svg;
    var t = svg.transition().duration(1000);
    var log2r=[];
    var sorted; // sorted is zero-based index

    svg.selectAll(".c"+rORc+i).filter(function (ce) {
      log2r.push(ce.value);
    });

    if (rORc=="r") { // sort log2ratio of a gene
     sorted=d3.range(that.col_number).sort(function(a,b){ if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
     t.selectAll(".cell")
       .attr("x", function(d) { return sorted.indexOf(d.col) * that.cellSize; })
       ;
     t.selectAll(".colLabel")
      .attr("y", function (d, i) { return sorted.indexOf(i) * that.cellSize; })
     ;
    }else{ // sort log2ratio of a contrast
     sorted=d3.range(that.row_number).sort(function(a,b){if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
     t.selectAll(".cell")
       .attr("y", function(d) { return sorted.indexOf(d.row) * that.cellSize; })
       ;
     t.selectAll(".rowLabel")
      .attr("y", function (d, i) { return sorted.indexOf(i) * that.cellSize; })
     ;
    }
  }

  componentWillReceiveProps (nextProps) {
    if (ObjectHelper.shallowEquals(nextProps, this.props)) {
      return;
    }
    d3.select("svg").remove();
    this.initializeData(nextProps);
    this.renderD3();
  }

  renderTooltip () {
    if (this.state.hoverRow === undefined) {
      return;
    }

    return (
      <div className="heatmap-tooltip hidden" ref={(tooltip) => { this.tooltip = tooltip; }} >
        {this.props.getTooltip(this.state.hoverRow, this.state.hoverColumn)}
      </div>)
  }

  render () {
    return (
      <div className="D3Heatmap">
        {this.renderTooltip()}
        <div ref={(container) => { this.container = container; }} >
        </div>
      </div>
    )
  }
}

/**
 * @class ProjectVisualization
 * @desc a component to visualize sample and their species taxonomy distribution
 */
class ProjectVisualization extends React.Component {
  constructor(props) {
    super(props);
    this.sample_ids = [14,15,16,17,18,19,20,21,22];
    this.taxon_ids = [29448, 329, 658664, 374, 375, 305, 308, 44255, 1217052, 1842450, 1230476];
    this.state = {
      loading: false,
      data: undefined,
      dataType: "NT.aggregatescore",
      dataThreshold: -99999999999,
    };

    this.dataTypes = ["NT.aggregatescore", "NT.rpm", "NT.zscore", "NR.aggregatescore", "NR.rpm", "NR.zscore"];
    this.dataGetters = {}
    for (var dataType of this.dataTypes) {
      this.dataGetters[dataType] = this.makeDataGetter(dataType);
    }
  }

  getDataProperty (data, property) {
    let parts = property.split("."),
        base = data;

    for (var part of parts) {
      base = base[part];
    }
    return base;
  }

  makeDataGetter (dataType) {
    let that = this;
    return function (row, col) {
      let taxon = this.getTaxonFor(row, col);
      if (taxon) {
        let value = this.getDataProperty(taxon, dataType);
        if (value >= that.state.dataThreshold) {
          return value;
        }
      }
    }
  }

  componentDidMount () {
    this.fetchDataFromServer();
  }

  fetchDataFromServer () {
    this.setState({loading: true})
    this.request && this.request.cancel();
    this.request = axios.get("/samples/samples_taxons.json?sample_ids=" + this.sample_ids + "&taxon_ids=" + this.taxon_ids)
    .then((response) => {
      this.updateMinMax(response.data, this.state.dataType);
      this.setState({
        data: response.data,
        taxons: this.extractTaxons(response.data),
      });
    }).then(() => {
      this.setState({ loading: false });
    });
  }

  updateMinMax (data, dataType) {
    let taxon_lists = [];
    for (let sample of data){
      taxon_lists.push(sample.taxons);
    }
    let taxons = [].concat.apply([], taxon_lists);

    let min = d3.min(taxons, (d) => {
      return this.getDataProperty(d, dataType);
    });
    let max = d3.max(taxons, (d) => {
      return this.getDataProperty(d, dataType);
    });
    this.setState({
      min: min,
      max: max,
    });
  }

  extractTaxons (data) {
    let taxons = {};

    for (var i = 0, len = data.length; i < len; i += 1) {
      let sample = data[i];

      for (var j = 0; j < sample.taxons.length; j+= 1) {
        let taxon = sample.taxons[j];
        taxons[taxon.tax_id] = taxon.name;
      }
    }

    return Object.values(taxons);
  }

  getColumnLabel (column_index) {
    return this.state.data[column_index].name;
  }

  getRowLabel (row_index) {
    return this.state.taxons[row_index];
  }

  getTaxonFor (row_index, column_index) {
    let d = this.state.data[column_index];
    let taxon_name = this.state.taxons[row_index];

    for (let i = 0; i < d.taxons.length; i += 1) {
      let taxon = d.taxons[i];
      if (taxon.name == taxon_name) {
        return taxon;
      }
    }
    return undefined;
  }

  getTooltip (row_index, column_index) {
    let sample = this.state.data[column_index],
        taxon_name = this.state.taxons[row_index],
        taxon;

    for (let i = 0; i < sample.taxons.length; i += 1) {
      let ttaxon = sample.taxons[i];
      if (ttaxon.name == taxon_name) {
        taxon = ttaxon;
        break;
      }
    }

    return (
      <SampleHeatmapTooltip sample={sample} taxon={taxon} />
    )

  }

  renderLoading () {
    return (<p className="loading-indicator">Loading...</p>);
  }

  renderHeatmap () {
    if (!this.state.data) {
      return;
    }

    return (
      <D3Heatmap
        rows={this.state.taxons.length}
        columns={this.state.data.length}
        getRowLabel={this.getRowLabel.bind(this)}
        getColumnLabel={this.getColumnLabel.bind(this)}
        getCellValue={this.dataGetters[this.state.dataType].bind(this)}
        getTooltip={this.getTooltip.bind(this)}
      />
    )
  }

  updateDataType (e) {
    let newDataType = e.target.innerText;
    this.setState({dataType: newDataType});
    this.updateMinMax(this.state.data, newDataType);
  }

  renderTypePickers () {
    let ret = [];
    for (var dataType of this.dataTypes) {
      ret.push(
        <button key={dataType} onClick={this.updateDataType.bind(this)}>{dataType}</button>
      )
    }
    return ret
  }
  
  updateDataThreshold (e) {
    this.setState({dataThreshold: e.target.value});
  }

  renderThresholdSlider () {
    if (!this.state.data) {
      return;
    }
    return (
      <div>
        {this.state.min}
        <input min={this.state.min} max={this.state.max + 1} type="range" onChange={this.updateDataThreshold.bind(this)} value={this.state.dataThreshold}/>
        {this.max}
      </div>
    )
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
              Track pathogen distribution across samples
            </div>
            <div>
              {this.renderTypePickers()}
            </div>
            <div>
              {this.renderThresholdSlider()}
            </div>
          </div>
        </SubHeader>
        <div className="row visualization-content">
          {this.state.loading && this.renderLoading()}
          {this.renderHeatmap()}
        </div>
      </div>
    );
  }
}

export default ProjectVisualization;
