/*
 * TODO
 * - Use standard loading screen
 * - Make the dondegram leafs be in the middle of the columns
 */

import React from 'react';
import SubHeader from './SubHeader';
import symlog from './symlog';
import * as d3 from 'd3';
import {event as currentEvent} from 'd3';
import axios from 'axios';
import ObjectHelper from '../helpers/ObjectHelper';
import clusterfck from 'clusterfck';
import ReactNouislider from './ReactNouislider';

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
      left: Math.ceil(Math.sqrt(this.row_number)) * 10,
      left: Math.ceil(Math.sqrt(this.row_number)) * 10,
      bottom: 100,
      right: char_width * longest_row_label
    };
    this.cellWidth = Math.max(900 / this.col_number, 20);
    this.cellHeight = Math.max(400 / this.row_number, 15);

    this.width = this.cellWidth * this.col_number + this.margin.left + this.margin.right;
    this.height = this.cellHeight * this.row_number + this.margin.top + this.margin.bottom;
    
    this.colTree = props.colTree;
    this.rowTree = props.rowTree;
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
      .attr("height", this.height);

    this.offsetCanvas = this.svg.append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");


    this.renderRowLabels();
    //this.renderColLabels();
    this.renderHeatmap();
    this.renderLegend();
    this.renderColDendrogram();
    this.renderRowDendrogram();
  }

  renderHeatmap () {
    let colorScale = this.scale()
        .domain([this.min, this.max])
        .range([0, this.colors.length-1]);

    let that = this;
    var heatMap = this.offsetCanvas.append("g").attr("class","g3")
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
  
  renderColDendrogram () {
		let width = this.cellWidth * this.col_number,
				height = this.margin.top - 20;
    
    let container = this.renderDendrogram(this.colTree, width, height, "cc", this.colLabel);
    container.attr("transform", "rotate(90) translate(0, -" + (width + this.margin.left) + ")")
  }

  renderRowDendrogram () {
    let height = this.margin.left - 20,
        width = this.cellHeight * this.row_number;
    
    let container = this.renderDendrogram(this.rowTree, width, height, "cr", this.rowLabel);
    container.attr("transform", "translate(0, " + this.margin.top + ")")
  }

  renderDendrogram (tree, width, height, cssClass, labels) {
		var cluster = d3.layout.cluster()
    		.size([width, height])
        .separation(function () { return 1; });

		let diagonal = (d, i) => {
    	return "M" + d.source.y + "," + d.source.x + "V" + d.target.x + "H" + d.target.y;
		}
		
		//var diagonal = d3.svg.diagonal()
    //		.projection(function(d) { return [d.y, d.x]; });

    //set up the visualisation:
    let visContainer = this.svg.append("g")
      .attr("width", width)
      .attr("height", height)

    let vis = visContainer.append("g")
    
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

    var nodes = cluster.nodes(tree);

    let i = 0;
    for (let n of nodes) {
      n.id = i;
      i += 1;
    }
    var link = vis.selectAll("path.link." + cssClass + "-link")
      .data(cluster.links(nodes))
      .enter().append("path")
      .attr("class", function (e) { 
        return "link " + cssClass + "-link " + cssClass + "-link-" + e.source.id + "-" + e.target.id; 
      })
      .attr("d", diagonal);

    var hovers = vis.selectAll("rect.hover-target." + cssClass + "-hover-target")
      .data(cluster.links(nodes))
      .enter().append("rect")
      .attr("class", function (e) { 
        return "hover-target " + cssClass + "-hover-target " + cssClass + "-hover-" + e.source.id + "-" + e.target.id; 
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
          let cls = "." + cssClass + "-link-" + node.parent.id + "-" + node.id;
          d3.selectAll(cls).classed("link-hover", true);i

          if(node.label) {
            let idx = labels.indexOf(node.label);
            let selector = "." + cssClass + idx;
            console.log("highlighting", selector);
            d3.selectAll(selector).classed("highlight", true);
          }
        }
      })
      .on("mouseout", function (d) {
          d3.selectAll(".D3Heatmap").classed("highlighting", false);
          d3.selectAll("." + cssClass + "-link").classed("link-hover", false);
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
    return visContainer;
  }
  
  renderLegend () {
    let that = this,
        height = 20,
        x_offset = this.cellWidth * this.col_number;

    this.offsetCanvas.selectAll(".legend-text-min")
        .data([this.min])
        .enter().append("text")
        .attr("x", x_offset)
        .attr("y", -33)
        .attr("class", "mono")
        .text(Math.round(this.min));
    
    this.offsetCanvas.selectAll(".legend-text-max")
        .data([this.max])
        .enter().append("text")
        .attr("class", "mono")
        .attr("x", function (d, i) { return x_offset + that.legendElementWidth * that.colors.length; })
        .attr("y", -33)
        .text(Math.round(this.max))
        .style("text-anchor", "end");

    var legend = this.offsetCanvas.selectAll(".legend")
      .data(this.colors)
      .enter().append("g")
      .attr("class", "legend");

    legend.append("rect")
      .attr("x", function(d, i) { return x_offset + that.legendElementWidth * i; })
      .attr("y", -10 - height)
      .attr("width", this.legendElementWidth)
      .attr("height", height)
      .style("fill", function(d, i) { return that.colors[i]; });

	this.offsetCanvas.append("rect")
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
    let rowLabels = this.offsetCanvas.append("g")
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
    let colLabels = this.offsetCanvas.append("g")
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
      dataScaleIdx: 0,
      minDataThreshold: -99999999999,
      maxDataThreshold: 99999999999,
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
        if (value >= that.state.minDataThreshold && value <= this.state.maxDataThreshold) {
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
    let clustered_samples = this.clusterSamples(data, dataType, taxons);
    let clustered_taxons = this.clusterTaxons(data, dataType, taxons);
    this.setState({
      data: data,
      clustered_samples: clustered_samples,
      min: minMax.min,
      max: minMax.max,
      dataType: dataType,
      taxons: taxons,
      clustered_taxons: clustered_taxons,
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

  clusterSamples (data, dataType, taxons) {
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
      vector.sample = sample;
      vectors.push(vector);
    }
    
    let cluster = clusterfck.hcluster(vectors);
    
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
				node.label = node.value.sample.name;
        clustered_samples.push(node.value.sample);
      }
    }
    
    return {
      tree: cluster,
      flat: clustered_samples.reverse(),
    }
  }

  extractTaxons (data) {
    let taxon_names = new Set();

    for (var i = 0, len = data.length; i < len; i += 1) {
      let sample = data[i];
      for (var j = 0; j < sample.taxons.length; j+= 1) {
        let taxon = sample.taxons[j];
        taxon_names.add(taxon.name);
      }
    }
    return Array.from(taxon_names);
  }

  clusterTaxons (data, dataType, taxon_names) {
    let taxon_scores = {};
    for (let taxon of taxon_names) {
      taxon_scores[taxon] = [];

      for (let sample of data) {
        let value = null;
        for (let sample_taxon of sample.taxons) {
          if (sample_taxon.name == taxon) {
            value = this.getDataProperty(sample_taxon, dataType);
            break;
          }
        }
        taxon_scores[taxon].push(value);
      }
    }

    let vectors = [];
    for(let key of Object.keys(taxon_scores)) {
      let vector = taxon_scores[key];
      vector.taxon_name = key;
      vectors.push(vector);
    }
    let cluster = clusterfck.hcluster(vectors);
    let clustered_taxons = [];
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
				node.label = node.value.taxon_name;
        clustered_taxons.push(node.value.taxon_name);
      }
    }
     
    return {
      tree: cluster,
      flat: clustered_taxons,
    }
  }

  getColumnLabel (column_index) {
    return this.state.clustered_samples.flat[column_index].name;
  }

  getRowLabel (row_index) {
    return this.state.clustered_taxons.flat[row_index];
  }

  getTaxonFor (row_index, column_index) {
    let d = this.state.clustered_samples.flat[column_index];
    let taxon_name = this.state.clustered_taxons.flat[row_index];

    for (let i = 0; i < d.taxons.length; i += 1) {
      let taxon = d.taxons[i];
      if (taxon.name == taxon_name) {
        return taxon;
      }
    }
    return undefined;
  }

  getTooltip (row_index, column_index) {
    let sample = this.state.clustered_samples.flat[column_index],
        taxon_name = this.state.clustered_taxons.flat[row_index],
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
    let sample = this.state.clustered_samples.flat[d.col];
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

    let colors = [
      "rgb(255, 255, 255)",
      "rgb(255, 255, 250)",
      "rgb(255, 255, 245)",
      "rgb(255, 255, 240)",
      "rgb(255, 255, 235)",
      "rgb(255, 255, 229)",
      "rgb(255, 255, 224)",
      "rgb(255, 255, 219)",
      "rgb(255, 255, 214)",
      "rgb(255, 255, 209)",
      "rgb(255, 255, 204)",
      "rgb(255, 255, 199)",
      "rgb(255, 255, 194)",
      "rgb(255, 255, 188)",
      "rgb(255, 255, 183)",
      "rgb(255, 255, 178)",
      "rgb(255, 255, 173)",
      "rgb(255, 253, 163)",
      "rgb(255, 251, 153)",
      "rgb(255, 249, 143)",
      "rgb(255, 247, 133)",
      "rgb(255, 244, 122)",
      "rgb(255, 242, 112)",
      "rgb(255, 240, 102)",
      "rgb(255, 238, 92)",
      "rgb(254, 236, 82)",
      "rgb(254, 234, 72)",
      "rgb(254, 232, 62)",
      "rgb(254, 230, 52)",
      "rgb(254, 227, 41)",
      "rgb(254, 225, 31)",
      "rgb(254, 223, 21)",
      "rgb(254, 221, 11)",
      "rgb(254, 213, 17)",
      "rgb(254, 206, 24)",
      "rgb(254, 199, 31)",
      "rgb(254, 192, 38)",
      "rgb(253, 184, 44)",
      "rgb(253, 177, 51)",
      "rgb(253, 170, 57)",
      "rgb(253, 163, 64)",
      "rgb(253, 155, 70)",
      "rgb(253, 148, 77)",
      "rgb(253, 140, 84)",
      "rgb(253, 133, 91)",
      "rgb(252, 125, 97)",
      "rgb(252, 118, 104)",
      "rgb(252, 111, 110)",
      "rgb(252, 104, 117)",
      "rgb(252, 97, 125)",
      "rgb(252, 91, 133)",
      "rgb(252, 84, 141)",
      "rgb(252, 78, 149)",
      "rgb(252, 71, 156)",
      "rgb(252, 65, 164)",
      "rgb(252, 58, 172)",
      "rgb(252, 52, 180)",
      "rgb(251, 45, 188)",
      "rgb(251, 39, 196)",
      "rgb(251, 32, 204)",
      "rgb(251, 26, 212)",
      "rgb(251, 19, 219)",
      "rgb(251, 13, 227)",
      "rgb(251, 6, 235)",
      "rgb(251, 0, 243)",
      "rgb(244, 0, 242)",
      "rgb(237, 0, 242)",
      "rgb(230, 0, 241)",
      "rgb(223, 0, 241)",
      "rgb(216, 0, 240)",
      "rgb(209, 0, 240)",
      "rgb(202, 0, 240)",
      "rgb(196, 0, 240)",
      "rgb(189, 0, 239)",
      "rgb(182, 0, 239)",
      "rgb(175, 0, 238)",
      "rgb(168, 0, 238)",
      "rgb(161, 0, 237)",
      "rgb(154, 0, 237)",
      "rgb(147, 0, 236)",
      "rgb(140, 0, 236)",
    ];

    return (
      <D3Heatmap
        colTree={this.state.clustered_samples.tree}
        rowTree={this.state.clustered_taxons.tree}
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
      minDataThreshold: -99999999999,
      maxDataThreshold: 99999999999,
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
    this.setState({
      minDataThreshold: parseFloat(e[0]),
      maxDataThreshold: parseFloat(e[1])
    });
  }

  renderThresholdSlider () {
    if (!this.state.data) {
      return;
    }
    return (
      <div className="range-field">
        <label>Threshold</label>
        <div className="slider-container">
          <ReactNouislider
            range={{min: this.state.min, max: this.state.max + 1}}
            start={[this.state.minDataThreshold, this.state.maxDataThreshold]}
            connect={[false, true, false]}
            onChange={this.updateDataThreshold.bind(this)}
            tooltips
          />
        </div>
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
