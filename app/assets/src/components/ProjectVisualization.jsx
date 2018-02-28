/*
 * TODO
 * - Use standard loading screen
 * - Make the dondegram leafs be in the middle of the columns
 */

import React from 'react';
import {withFauxDOM} from 'react-faux-dom';
import SubHeader from './SubHeader';
import symlog from './symlog';
import * as d3 from 'd3';
import {event as currentEvent} from 'd3';
import axios from 'axios';
import ObjectHelper from '../helpers/ObjectHelper';
import clusterfck from 'clusterfck';
class SampleHeatmapTooltip extends React.Component {
  constructor(props) {
    super(props);
  }

  renderTaxons () {
    let taxon = this.props.taxon;
    if (!taxon) {
      return
    }
    
    let valueMap = [
        ['Agg Score', 'NT.aggregatescore'],
        null,
        ['NT RPM', 'NT.rpm'],
        ['NR RPM', 'NR.rpm'],
        ['NT R', 'NT.r'],
        ['NR R', 'NR.r'],
        ['NT Z', 'NT.zscore'],
        ['NR Z', 'NR.zscore'],
        ['NT Max Z', 'NT.maxzscore'],
        ['NR Max Z', 'NR.maxzscore'],
    ]
    let ret = [
      <li className="col s12" key="taxon-name">
        <label>Taxon:</label>{taxon.name}
      </li>
    ];
    valueMap.forEach(function (pair) {
      if (!pair) {
        ret.push(<li key="blank" className="col s6">&nbsp;</li>);
        return;
      }

      let key = pair[0],
          value = pair[1];

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
    return ret;
  }
  render () {
    let sample = this.props.sample;
    return (
      <div className="heatmap-tooltips">
        <ul className="row">
          <li className="col s12">
            <label>Sample:</label>{sample.name}
          </li>
          {this.renderTaxons()}
        </ul>
      </div>
    )
  }
}

class D3Heatmap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {}
    this.colors = this.props.colors || [
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
      top: 80, // char_width * longest_col_label * 0.7,
      left: 10,
      bottom: 100,
      right: char_width * longest_row_label
    };
    this.cellWidth = Math.max(900 / this.col_number, 20);
    this.cellHeight = Math.max(400 / this.row_number, 15);

    this.width = this.cellWidth * this.col_number + this.margin.left + this.margin.right;
    this.height = this.cellHeight * this.row_number + this.margin.top + this.margin.bottom;
    
    this.tree = props.tree;
    this.scale = props.scale;
    this.legendElementWidth = this.margin.right / this.colors.length;
  }

  componentDidMount () {
    this.renderD3();
  }

  renderD3 () {
    let that = this

    this.svg = d3.select(this.container).append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");


    this.renderRowLabels();
    //this.renderColLabels();
    this.renderHeatmap();
    this.renderLegend();
    this.renderDendrogram();
  }

  renderHeatmap () {
    let colorScale = this.scale()
        .domain([this.min, this.max])
        .range([0, this.colors.length-1]);

    let that = this;
    var heatMap = this.svg.append("g").attr("class","g3")
      .selectAll(".cellg")
      .data(this.data, function (d) {
        return d.row + ":" + d.col;
      })
      .enter()
      .append("rect")
      .attr("x", function(d, i) { return d.col * that.cellWidth; })
      .attr("y", function(d) { return d.row * that.cellHeight; })
      .attr("class", function(d){return "cell cell-border cr"+d.row+" cc"+d.col })
      .attr("width", this.cellWidth)
      .attr("height", this.cellHeight)
      .style("fill", function(d) {
        if (d.value === undefined) {
          return "#f6f6f6";
        }
        let colorIndex = colorScale(d.value);
        return that.colors[Math.round(colorIndex)];
      })
      .on("click", this.props.onCellClick)
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

  renderDendrogram () {
		let width = this.cellWidth * this.col_number,
				height = this.margin.top - 20;
 
		var cluster = d3.layout.cluster()
    		.size([width, height]);

		let diagonal = (d, i) => {
    	return "M" + d.source.y + "," + d.source.x + "V" + d.target.x + "H" + d.target.y;
		}
		
		//var diagonal = d3.svg.diagonal()
    //		.projection(function(d) { return [d.y, d.x]; });

    //set up the visualisation:
    var vis = this.svg.append("g")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "rotate(90) translate(-" + (height + 10) + ", -" + width + ")")
      .append("g")
    
    cluster.children(function (d) {
      let children = [];
      if (d.left) {
        children.push(d.left);
      }
      if (d.right) {
        children.push(d.right);
      }
      return children;
    });

    var nodes = cluster.nodes(this.tree);

    let i = 0;
    for (let n of nodes) {
      n.id = i;
      i += 1;
    }
    var link = vis.selectAll("path.link")
      .data(cluster.links(nodes))
      .enter().append("path")
      .attr("class", function (e) { 
        return "link link-" + e.source.id + "-" + e.target.id; 
      })
      .attr("d", diagonal);

    var hovers = vis.selectAll("rect.hover-target")
      .data(cluster.links(nodes))
      .enter().append("rect")
      .attr("class", function (e) { 
        return "hover-target hover-" + e.source.id + "-" + e.target.id; 
      })
      .attr("x", function(d, i) { return Math.min(d.source.y, d.target.y); })
      .attr("y", function(d, i) { return Math.min(d.source.x, d.target.x); })
      .attr("width", function (d, i) { return Math.abs(d.target.y - d.source.y); })
      .attr("height", function (d, i) { return Math.abs(d.target.x - d.source.x); })
      .attr("fill", "rgba(0,0,0,0)")
      .on("mouseover", (d) => {
        d3.selectAll(".D3Heatmap").classed("highlighting", true);
        let base = d.source.children.slice();
        let to_visit = base;
        while(to_visit.length > 0) {
          let node = to_visit.pop();
          if(node.left) { to_visit.push(node.left); }
          if(node.right) { to_visit.push(node.right); }
          let cls = ".link-" + node.parent.id + "-" + node.id;
          d3.selectAll(cls).classed("link-hover", true);i

          if(node.sample) {
            let col = this.colLabel.indexOf(node.sample.name);
            d3.selectAll(".cc" + col).classed("highlight", true);
          }
        }
      })
      .on("mouseout", function (d) {
          d3.selectAll(".D3Heatmap").classed("highlighting", false);
          d3.selectAll(".link").classed("link-hover", false);
          d3.selectAll(".D3Heatmap .highlight").classed("highlight", false);
      });
    /*
		var node = vis.selectAll("g.node")
				.data(nodes)
			.enter().append("g")
				.attr("class", "node")
				.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

		node.append("circle")
			.attr("r", 4.5);
  	node.append("text")
      .attr("dy", 3)
      .attr("x", function(d) { return d.children ? -8 : 8; })
      .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(function(d) {
				if (d.sample) {
					return d.sample.name; 
				}
			});
      */
  }
  
  renderLegend () {
    let that = this,
        height = 20,
        x_offset = this.cellWidth * this.col_number;

    this.svg.selectAll(".legend-text-min")
        .data([this.min])
        .enter().append("text")
        .attr("x", x_offset)
        .attr("y", -33)
        .attr("class", "mono")
        .text(Math.round(this.min));
    
    this.svg.selectAll(".legend-text-max")
        .data([this.max])
        .enter().append("text")
        .attr("class", "mono")
        .attr("x", function (d, i) { return x_offset + that.legendElementWidth * that.colors.length; })
        .attr("y", -33)
        .text(Math.round(this.max))
        .style("text-anchor", "end");

    var legend = this.svg.selectAll(".legend")
      .data(this.colors)
      .enter().append("g")
      .attr("class", "legend");

    legend.append("rect")
      .attr("x", function(d, i) { return x_offset + that.legendElementWidth * i; })
      .attr("y", -10 - height)
      .attr("width", this.legendElementWidth)
      .attr("height", height)
      .style("fill", function(d, i) { return that.colors[i]; });

	this.svg.append("rect")
        .attr("x", function(d, i) { return x_offset + that.legendElementWidth * i; })
        .attr("stroke", "#aaa")
        .attr("stroke-width", "0.25")
        .style("fill", "none")
        .attr("y", -10 - height)
        .attr("width", that.legendElementWidth * that.colors.length)  
        .attr("height", height);    
  }

  renderRowLabels () {
    let rowSortOrder=false;
    let that = this;
    let rowLabels = this.svg.append("g")
        .selectAll(".rowLabelg")
        .data(this.rowLabel)
        .enter();
    
    let groups = rowLabels.append("g")
        .attr("class", "rowLabelg")
        .attr("transform", "translate(" + (this.cellWidth * this.col_number) + ", 0)")
        .on("mouseover", function(d) {
          d3.select(this).classed("text-hover",true);
        })
        .on("mouseout" , function(d) {
          d3.select(this).classed("text-hover",false);
        });
    
    groups.append("rect")
        .attr("y", function (d, i) {
          return i * that.cellHeight;
        })
        .attr("width", this.margin.right)
        .attr("height", this.cellHeight)
        .style("fill", "#fff");

    groups.append("text")
        .text(function (d) { return d; })
        .attr("y", function (d, i) {
          return i * that.cellHeight;
        })
        .attr("transform", "translate(8," + this.cellHeight / 1.5 + ")")
        .attr("class", function (d,i) {
          return "rowLabel mono r"+i;}
        )
      
    groups.append("text")
        .attr("class", "removeLink mono")
        .text("x")
        .attr("y", function (d, i) {
          return i * that.cellHeight;
        })
        .attr("transform", "translate(" + this.margin.right + "," + this.cellHeight / 1.5 + ")")
        .style("text-anchor", "end")
        .on("click", (d,i) => {
          this.props.onRemoveRow(d);
        });
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
        return "translate(" + that.cellWidth * i + ",-6)"
      })
      .append("text")
      .text(function (d) { return d; })
      .attr("x", 0)
      .attr("y", 0)
      .style("text-anchor", "left")
      .attr("transform", "translate("+this.cellWidth/2 + ",-6) rotate (-45)")
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
       .attr("x", function(d) { return sorted.indexOf(d.col) * that.cellWidth; })
       ;
     t.selectAll(".colLabel")
      .attr("y", function (d, i) { return sorted.indexOf(i) * that.cellHeight; })
     ;
    }else{ // sort log2ratio of a contrast
     sorted=d3.range(that.row_number).sort(function(a,b){if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
     t.selectAll(".cell")
       .attr("y", function(d) { return sorted.indexOf(d.row) * that.cellHeight; })
       ;
     t.selectAll(".rowLabel")
      .attr("y", function (d, i) { return sorted.indexOf(i) * that.cellHeight; })
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
    this.sample_ids = this.props.sample_ids;

    this.scales = [
      ["Symmetric Log", symlog],
      ["Linear", d3.scale.linear], 
    ];

    this.state = {
      loading: false,
      data: undefined,
      dataType: "NT.aggregatescore",
      dataThreshold: -99999999999,
      dataScaleIdx: 0,
    };

    this.dataTypes = ["NT.aggregatescore", "NT.rpm", "NT.r", "NT.zscore", "NT.maxzscore", "NR.rpm", "NR.r", "NR.zscore", "NR.maxzscore"];
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
    this.request = axios.get("/samples/samples_taxons.json?sample_ids=" + this.sample_ids)
    .then((response) => {
      let taxons = this.extractTaxons(response.data);
      this.updateData(response.data, this.state.dataType, taxons);
    }).then(() => {
      this.setState({ loading: false });
    });
  }
  
  updateData (data, dataType, taxons) {
    let minMax = this.getMinMax(data, dataType, taxons);
    let clustered_data = this.cluster(data, dataType, taxons);
    this.setState({
      data: clustered_data.flat,
      tree: clustered_data.tree,
      taxons: taxons,
      min: minMax.min,
      max: minMax.max,
      dataType: dataType,
    });
  }

  getMinMax (data, dataType, taxon_names) {
    let taxon_lists = [];
    taxon_names = new Set(taxon_names);
    for (let sample of data) {
      let sample_taxons = [];
      for (let taxon of sample.taxons) {
        if (taxon_names.has(taxon.name)) {
          taxon_lists.push(sample.taxons);
        }
      }
      taxon_lists.push(sample_taxons);
    }
    let taxons = [].concat.apply([], taxon_lists);
    let min = d3.min(taxons, (d) => {
      return this.getDataProperty(d, dataType);
    });
    let max = d3.max(taxons, (d) => {
      return this.getDataProperty(d, dataType);
    });
    return {
      min: min,
      max: max,
    };
  }

  cluster (data, dataType, taxons) {
    let vector_to_sample = {};
    // vectorize
    let vectors = [];
    for (let sample of data) {
      let vector = [];
      for (let taxon_name of taxons) {
        let value = null;
        for(let taxon of sample.taxons) {
          if (taxon.name == taxon_name) {
            value = this.getDataProperty(taxon, dataType);
            break;
          }
        }
        vector.push(value);
      }
      vector_to_sample[vector] = sample;
      vectors.push(vector);
    }
    // cluster
    let cluster = clusterfck.hcluster(vectors);
    
    // Create vectors
    let clustered_samples = [];
    let to_visit = [cluster];
    while (to_visit.length > 0) {
      let node = to_visit.pop();
      if (node.right) {
        to_visit.push(node.right); 
      } 
      if (node.left) {
        to_visit.push(node.left);
      }

      if (node.value) {
				node.sample = vector_to_sample[node.value];
        clustered_samples.push(vector_to_sample[node.value]);
      }
    }
    
    return {
      tree: cluster,
      flat: clustered_samples.reverse(),
    }
  }

  extractTaxons (data) {
    let taxon_scores = {};
    for (var i = 0, len = data.length; i < len; i += 1) {
      let sample = data[i];

      for (var j = 0; j < sample.taxons.length; j+= 1) {
        let taxon = sample.taxons[j];
        if (taxon_scores[taxon.name] === undefined) {
          taxon_scores[taxon.name] = 0;
        }
        taxon_scores[taxon.name] += Math.abs(taxon.NT.aggregatescore);
      }
    }
    let arr = [];
    for(let key of Object.keys(taxon_scores)) {
      arr.push([taxon_scores[key], key]);
    }
    let ret = [];
    arr.sort(function (a, b) {
      return b[0] - a[0];
    });
    for(let pair of arr) {
      ret.push(pair[1]);
    }
    return ret;
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
    return (<p className="loading-indicator text-center">Loading...</p>);
  }
  
  onCellClick (d) {
    let sample = this.state.data[d.col];
    window.location.href = "/samples/" + sample.sample_id;
  }

  onRemoveRow (rowLabel) {
    let idx = this.state.taxons.indexOf(rowLabel);
    if (idx > -1) {
      this.state.taxons.splice(idx, 1);
    }
    this.updateData(this.state.data, this.state.dataType, this.state.taxons); 
  }

  renderHeatmap () {
    if (!this.state.data) {
      return;
    }

    let colors=[
      "rgb(255,255,255)", 
      "rgb(255,255,235)",
      "rgb(255,255,214)",
      "rgb(255,255,194)",
      "rgb(255,255,173)",
      "rgb(255,247,133)",
      "rgb(255,238,92)",
      "rgb(254,230,52)",
      "rgb(254,221,11)",
      "rgb(254,192,38)",
      "rgb(253,163,64)",
      "rgb(253,133,91)",
      "rgb(252,104,117)",
      "rgb(252,78,149)",
      "rgb(252,52,180)",
      "rgb(251,26,212)",
      "rgb(251, 0, 243)",
      "rgb(223,0,241)",
      "rgb(196,0,240)",
      "rgb(168,0,238)",
      "rgb(140, 0, 236)"
    ];

    return (
      <D3Heatmap
        tree={this.state.tree}
        rows={this.state.taxons.length}
        columns={this.state.data.length}
        getRowLabel={this.getRowLabel.bind(this)}
        getColumnLabel={this.getColumnLabel.bind(this)}
        getCellValue={this.dataGetters[this.state.dataType].bind(this)}
        getTooltip={this.getTooltip.bind(this)}
        onCellClick={this.onCellClick.bind(this)}
        onRemoveRow={this.onRemoveRow.bind(this)}
        scale={this.scales[this.state.dataScaleIdx][1]}
        colors={colors}
      />
    )
  }

  updateDataType (e) {
    let newDataType = e.target.value;
    this.updateData(this.state.data, newDataType, this.state.taxons);
    this.setState({
      dataThreshold: -99999999999,
    });
  }

  renderTypePickers () {
   if (!this.state.data) {
      return;
    }

    let ret = [];
    for (var dataType of this.dataTypes) {
      ret.push(
        <option key={dataType} value={dataType}>{dataType}</option>
      )
    }
    return (
      <select value={this.state.dataType} onChange={this.updateDataType.bind(this)}>
        {ret}
      </select>
    )
  }
  
  updateDataThreshold (e) {
    this.setState({dataThreshold: e.target.value});
  }

  renderThresholdSlider () {
    if (!this.state.data) {
      return;
    }
    return (
      <div className="range-field">
        <label>Threshold</label>
        <input min={this.state.min} max={this.state.max + 1} type="range" onChange={this.updateDataThreshold.bind(this)} value={this.state.dataThreshold}/>
      </div>
    )
  }

  updateDataScale (e) {
    this.setState({ dataScaleIdx: e.target.value });
  }

  renderScalePicker () {
    if (!this.state.data) {
      return;
    }

    let ret = [];

    for (let i = 0; i < this.scales.length; i += 1) {
      let scale = this.scales[i];
      ret.push(
        <option key={i} value={i}>{scale[0]}</option>
      )
    }
    return (
      <select value={this.state.dataScaleIdx} onChange={this.updateDataScale.bind(this)}>
        {ret}
      </select>
    )
 }

  render () {
    return (
      <div id="project-visualization">
        <SubHeader>
          <div className="sub-header">
            <div className="row sub-menu">
              <div className="col s4">
                <label>Data Scale</label>
                {this.renderScalePicker()}
              </div>
              <div className="col s4">
                <label>Data Type</label>
                {this.renderTypePickers()}
              </div>
              <div className="col s4">
                {this.renderThresholdSlider()}
              </div>
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
