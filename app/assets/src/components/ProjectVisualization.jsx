
import React from 'react';
import {withFauxDOM} from 'react-faux-dom';
import SubHeader from './SubHeader';
import * as d3 from 'd3';
import {event as currentEvent} from 'd3';

class D3Heatmap extends React.Component {
  constructor(props) {
    super(props);

    this.data = [];
    this.rowLabel = [];
    this.colLabel = this.props.columns;

    for (var i = 0; i < this.props.data.length; i += 1) {
      var row = this.props.data[i];
      this.rowLabel.push(row.name);
      for (var j = 0; j < this.colLabel.length; j += 1) {
        var col = this.colLabel[j];
        this.data.push({
          row: i,
          col: j,
          value: row[col],
        });
      }
    }

    this.margin = this.props.margin || { top: 150, right: 10, bottom: 50, left: 100 };
    this.cellSize = this.props.cellSize || 20;
    this.col_number = this.colLabel.length;
    this.row_number = this.props.data.length;
    this.width = this.cellSize * this.col_number; // - margin.left - margin.right,
    this.height = this.cellSize * this.row_number;  // - margin.top - margin.bottom,
    this.legendElementWidth = this.cellSize * 2.5;
    this.colors = ['#005824','#1A693B','#347B53','#4F8D6B','#699F83','#83B09B','#9EC2B3','#B8D4CB','#D2E6E3','#EDF8FB','#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'];
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
        .domain([ -10 , 0, 10])
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
      .style("fill", function(d) { return colorScale(d.value); })
      .on("mouseover", function(d){
         //highlight text
         d3.select(this).classed("cell-hover",true);
         d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==d.row;});
         d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==d.col;});

         // Update the tooltip position and value
         d3.select(that.tooltip)
           .style("left", (currentEvent.pageX+10) + "px")
           .style("top", (currentEvent.pageY-10) + "px")
           .select("#value")
           .text(d.value);
          d3.select(that.tooltip).classed("hidden", false);
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
    let that = this;
    var legend = this.svg.selectAll(".legend")
      .data([-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10])
      .enter().append("g")
      .attr("class", "legend");

    legend.append("rect")
      .attr("x", function(d, i) { return that.legendElementWidth * i; })
      .attr("y", this.height+(this.cellSize*2))
      .attr("width", this.legendElementWidth)
      .attr("height", this.cellSize)
      .style("fill", function(d, i) { return that.colors[i]; });

    legend.append("text")
      .attr("class", "mono")
      .text(function(d) { return d; })
      .attr("width", this.legendElementWidth)
      .attr("x", function(d, i) { return that.legendElementWidth * i; })
      .attr("y", this.height + (this.cellSize*4));
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
        .on("click", function(d,i) {
          rowSortOrder=!rowSortOrder;
          that.sortbylabel("r",i,rowSortOrder);
        });
  }

  renderColLabels () {
    let colSortOrder = false;
    let that = this;
    let colLabels = this.svg.append("g")
      .selectAll(".colLabelg")
      .data(this.colLabel)
      .enter()
      .append("text")
      .text(function (d) { return d; })
      .attr("x", 0)
      .attr("y", function (d, i) { return i * that.cellSize; })
      .style("text-anchor", "left")
      .attr("transform", "translate("+this.cellSize/2 + ",-6) rotate (-90)")
      .attr("class",  function (d,i) { return "colLabel mono c"+i;} )
      .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
      .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
      .on("click", function(d,i) {colSortOrder=!colSortOrder;  that.sortbylabel("c",i,colSortOrder);});
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

  render () {
    return (
      <div className="D3Heatmap">
        <div className="heatmap-tooltip hidden" ref={(tooltip) => { this.tooltip = tooltip; }} ><p><span id="value"/></p></div>
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
  }

  render () {
    let data = [{"name":"1759080_s_at","con1027":0,"con1028":0,"con1029":0,"con103":-2,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":-1,"con1035":1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":1,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":-2,"con130":-2,"con131":-2,"con132":0,"con133":-1,"con134":-1,"con135":-1,"con136":3,"con137":-1,"con138":5,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":-1,"con2":-1,"con200":-1,"con201":0,"con21":0},{"name":"1759302_s_at","con1027":0,"con1028":0,"con1029":0,"con103":-3,"con1030":0,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":3,"con110":0,"con111":0,"con112":-1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":1,"con130":1,"con131":0,"con132":-1,"con133":-1,"con134":0,"con135":-1,"con136":1,"con137":-2,"con138":0,"con139":-3,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":-1,"con199":0,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1759502_s_at","con1027":0,"con1028":0,"con1029":-1,"con103":1,"con1030":-1,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":-1,"con109":1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":0,"con133":0,"con134":1,"con135":1,"con136":-1,"con137":0,"con138":-2,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":-1,"con192":0,"con193":0,"con194":1,"con199":0,"con2":-1,"con200":0,"con201":0,"con21":0},{"name":"1759540_s_at","con1027":0,"con1028":0,"con1029":0,"con103":1,"con1030":-1,"con1031":0,"con1032":0,"con1033":0,"con1034":1,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":-1,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":1,"con131":2,"con132":4,"con133":0,"con134":0,"con135":0,"con136":-3,"con137":-8,"con138":-1,"con139":-10,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":1,"con188":1,"con189":1,"con191":-1,"con192":0,"con193":0,"con194":0,"con199":0,"con2":-1,"con200":0,"con201":0,"con21":0},{"name":"1759781_s_at","con1027":0,"con1028":0,"con1029":0,"con103":-1,"con1030":0,"con1031":-1,"con1032":-1,"con1033":0,"con1034":0,"con1035":1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":-1,"con130":-1,"con131":-1,"con132":-2,"con133":0,"con134":-1,"con135":0,"con136":7,"con137":-1,"con138":7,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":1,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":-1,"con199":0,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1759828_s_at","con1027":0,"con1028":-1,"con1029":0,"con103":2,"con1030":0,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":-1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":4,"con132":3,"con133":-1,"con134":-1,"con135":-1,"con136":-1,"con137":-1,"con138":-2,"con139":-6,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":-1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":1,"con199":-1,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1759829_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":-7,"con1031":-1,"con1032":0,"con1033":2,"con1034":0,"con1035":0,"con1036":0,"con1037":-1,"con1038":0,"con1039":0,"con1040":0,"con1041":1,"con108":0,"con109":-1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":0,"con133":0,"con134":-2,"con135":0,"con136":-1,"con137":0,"con138":-2,"con139":0,"con14":-1,"con15":-1,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":-1,"con174":0,"con184":-1,"con185":-1,"con186":-1,"con187":-2,"con188":-1,"con189":-2,"con191":0,"con192":0,"con193":-1,"con194":0,"con199":0,"con2":-1,"con200":0,"con201":0,"con21":0},{"name":"1759906_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":0,"con1032":-2,"con1033":-1,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":-1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":-2,"con132":-3,"con133":-2,"con134":-1,"con135":-2,"con136":-2,"con137":0,"con138":-3,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":-1,"con16":0,"con17":0,"con174":0,"con184":1,"con185":2,"con186":2,"con187":1,"con188":-1,"con189":-1,"con191":0,"con192":0,"con193":1,"con194":-1,"con199":-2,"con2":-3,"con200":-3,"con201":0,"con21":-1},{"name":"1760088_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":-1,"con1031":-1,"con1032":-1,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":-1,"con109":0,"con110":0,"con111":1,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":1,"con130":1,"con131":3,"con132":4,"con133":2,"con134":0,"con135":0,"con136":-1,"con137":1,"con138":0,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":1,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":0,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1760164_s_at","con1027":0,"con1028":1,"con1029":-1,"con103":-2,"con1030":-1,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":2,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":-1,"con130":-1,"con131":-1,"con132":0,"con133":-1,"con134":-1,"con135":-1,"con136":0,"con137":-1,"con138":0,"con139":-1,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":-1,"con192":0,"con193":0,"con194":0,"con199":0,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1760453_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":-1,"con1038":0,"con1039":-1,"con1040":-1,"con1041":-1,"con108":-1,"con109":2,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":1,"con130":1,"con131":-1,"con132":0,"con133":0,"con134":0,"con135":0,"con136":-1,"con137":-4,"con138":1,"con139":-3,"con14":0,"con15":0,"con150":0,"con151":0,"con152":-2,"con153":-3,"con16":-1,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":1,"con199":0,"con2":-1,"con200":0,"con201":0,"con21":2},{"name":"1760516_s_at","con1027":1,"con1028":0,"con1029":-1,"con103":1,"con1030":-1,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":-1,"con1040":0,"con1041":-1,"con108":-1,"con109":-1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":4,"con132":1,"con133":-1,"con134":-2,"con135":-2,"con136":2,"con137":-1,"con138":-1,"con139":-7,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":1,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":0,"con2":0,"con200":0,"con201":1,"con21":0},{"name":"1760594_s_at","con1027":0,"con1028":0,"con1029":0,"con103":3,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":1,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":-1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":1,"con128":0,"con129":0,"con130":1,"con131":4,"con132":2,"con133":5,"con134":4,"con135":5,"con136":4,"con137":-1,"con138":3,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":1,"con191":-1,"con192":1,"con193":1,"con194":2,"con199":0,"con2":3,"con200":0,"con201":1,"con21":0},{"name":"1760894_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":1,"con1039":2,"con1040":1,"con1041":2,"con108":0,"con109":0,"con110":0,"con111":0,"con112":-1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":2,"con133":0,"con134":1,"con135":1,"con136":-1,"con137":0,"con138":1,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":1,"con17":1,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":0,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1760951_s_at","con1027":0,"con1028":0,"con1029":2,"con103":1,"con1030":0,"con1031":1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":-1,"con1041":0,"con108":-1,"con109":1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":-1,"con130":-1,"con131":-1,"con132":-2,"con133":-2,"con134":-1,"con135":-1,"con136":2,"con137":2,"con138":1,"con139":1,"con14":2,"con15":2,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":1,"con199":2,"con2":2,"con200":1,"con201":0,"con21":0},{"name":"1761030_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":1,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":-1,"con132":-1,"con133":-1,"con134":-1,"con135":-2,"con136":-1,"con137":0,"con138":-1,"con139":1,"con14":1,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":1,"con186":1,"con187":0,"con188":-1,"con189":0,"con191":-2,"con192":0,"con193":0,"con194":-1,"con199":0,"con2":-8,"con200":0,"con201":0,"con21":-1},{"name":"1761128_at","con1027":0,"con1028":-1,"con1029":1,"con103":-1,"con1030":0,"con1031":-1,"con1032":1,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":4,"con133":-1,"con134":0,"con135":0,"con136":3,"con137":0,"con138":7,"con139":0,"con14":0,"con15":0,"con150":1,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":-1,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":0,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1761145_s_at","con1027":0,"con1028":0,"con1029":0,"con103":1,"con1030":-1,"con1031":-2,"con1032":0,"con1033":0,"con1034":0,"con1035":1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":-1,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":-1,"con130":0,"con131":2,"con132":4,"con133":-1,"con134":1,"con135":1,"con136":-4,"con137":-5,"con138":-2,"con139":-7,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":1,"con184":0,"con185":0,"con186":0,"con187":0,"con188":1,"con189":1,"con191":0,"con192":0,"con193":0,"con194":0,"con199":0,"con2":0,"con200":-1,"con201":0,"con21":0},{"name":"1761160_s_at","con1027":0,"con1028":0,"con1029":0,"con103":2,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":-1,"con109":0,"con110":0,"con111":0,"con112":-1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":1,"con133":0,"con134":0,"con135":0,"con136":-2,"con137":-3,"con138":0,"con139":-3,"con14":0,"con15":0,"con150":0,"con151":0,"con152":-1,"con153":-1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":2,"con199":0,"con2":0,"con200":0,"con201":1,"con21":1},{"name":"1761189_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":-2,"con1032":0,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":-1,"con1038":0,"con1039":-1,"con1040":-1,"con1041":-1,"con108":-1,"con109":1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":1,"con133":-1,"con134":-1,"con135":0,"con136":-2,"con137":-2,"con138":0,"con139":-3,"con14":0,"con15":0,"con150":0,"con151":0,"con152":-2,"con153":-1,"con16":-1,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":1,"con199":0,"con2":0,"con200":0,"con201":0,"con21":2},{"name":"1761222_s_at","con1027":0,"con1028":0,"con1029":-1,"con103":-1,"con1030":0,"con1031":-1,"con1032":-1,"con1033":0,"con1034":0,"con1035":1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":-2,"con130":-2,"con131":-1,"con132":-2,"con133":0,"con134":-1,"con135":-1,"con136":5,"con137":-1,"con138":5,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":-1,"con199":1,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1761245_s_at","con1027":0,"con1028":1,"con1029":0,"con103":0,"con1030":-1,"con1031":-1,"con1032":0,"con1033":1,"con1034":0,"con1035":-1,"con1036":0,"con1037":-1,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":3,"con110":0,"con111":0,"con112":-1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":0,"con133":0,"con134":0,"con135":0,"con136":-1,"con137":-3,"con138":0,"con139":-3,"con14":0,"con15":0,"con150":0,"con151":0,"con152":-1,"con153":-1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":0,"con2":-1,"con200":0,"con201":0,"con21":1},{"name":"1761277_s_at","con1027":0,"con1028":0,"con1029":0,"con103":1,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":3,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":-1,"con133":0,"con134":1,"con135":0,"con136":0,"con137":0,"con138":-1,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":-1,"con184":0,"con185":0,"con186":0,"con187":1,"con188":0,"con189":1,"con191":0,"con192":0,"con193":0,"con194":1,"con199":1,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1761434_s_at","con1027":0,"con1028":-1,"con1029":0,"con103":2,"con1030":0,"con1031":-1,"con1032":0,"con1033":-1,"con1034":0,"con1035":0,"con1036":0,"con1037":1,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":-1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":1,"con128":0,"con129":1,"con130":1,"con131":3,"con132":2,"con133":4,"con134":2,"con135":4,"con136":4,"con137":0,"con138":3,"con139":1,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":1,"con191":0,"con192":0,"con193":0,"con194":0,"con199":-1,"con2":2,"con200":0,"con201":0,"con21":0},{"name":"1761553_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":-1,"con109":1,"con110":0,"con111":0,"con112":5,"con125":-1,"con126":0,"con127":0,"con128":-2,"con129":0,"con130":0,"con131":-1,"con132":-2,"con133":-2,"con134":-2,"con135":-2,"con136":-1,"con137":1,"con138":-2,"con139":1,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":-1,"con192":0,"con193":0,"con194":1,"con199":3,"con2":-5,"con200":3,"con201":2,"con21":0},{"name":"1761620_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":-1,"con1040":-1,"con1041":-1,"con108":-1,"con109":0,"con110":0,"con111":0,"con112":1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":-1,"con133":-1,"con134":1,"con135":1,"con136":-1,"con137":0,"con138":-2,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":-1,"con16":0,"con17":0,"con174":0,"con184":-2,"con185":-1,"con186":-1,"con187":0,"con188":1,"con189":1,"con191":0,"con192":0,"con193":0,"con194":1,"con199":0,"con2":2,"con200":0,"con201":0,"con21":0},{"name":"1761873_s_at","con1027":0,"con1028":0,"con1029":-1,"con103":1,"con1030":-3,"con1031":-3,"con1032":0,"con1033":0,"con1034":-1,"con1035":-1,"con1036":0,"con1037":2,"con1038":0,"con1039":0,"con1040":-1,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":-1,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":1,"con132":-1,"con133":1,"con134":-1,"con135":-1,"con136":-1,"con137":0,"con138":-3,"con139":0,"con14":0,"con15":1,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":1,"con191":-2,"con192":0,"con193":0,"con194":0,"con199":0,"con2":-4,"con200":0,"con201":0,"con21":0},{"name":"1761884_s_at","con1027":1,"con1028":0,"con1029":0,"con103":0,"con1030":-1,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":1,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":1,"con128":0,"con129":0,"con130":0,"con131":0,"con132":0,"con133":0,"con134":0,"con135":0,"con136":6,"con137":-1,"con138":6,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":-1,"con194":-1,"con199":0,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1761944_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":-1,"con109":0,"con110":-1,"con111":1,"con112":6,"con125":-1,"con126":-1,"con127":0,"con128":-2,"con129":0,"con130":0,"con131":-1,"con132":0,"con133":-1,"con134":-2,"con135":-2,"con136":-2,"con137":1,"con138":-1,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":1,"con16":0,"con17":0,"con174":1,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":-1,"con192":0,"con193":1,"con194":2,"con199":4,"con2":-3,"con200":3,"con201":3,"con21":0},{"name":"1762105_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":0,"con1032":0,"con1033":1,"con1034":0,"con1035":-1,"con1036":0,"con1037":-2,"con1038":0,"con1039":-1,"con1040":-1,"con1041":-1,"con108":-1,"con109":2,"con110":0,"con111":1,"con112":-1,"con125":0,"con126":0,"con127":1,"con128":0,"con129":1,"con130":0,"con131":0,"con132":3,"con133":0,"con134":0,"con135":0,"con136":-4,"con137":-5,"con138":0,"con139":-5,"con14":-1,"con15":0,"con150":1,"con151":0,"con152":-4,"con153":-3,"con16":-1,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":-1,"con189":0,"con191":0,"con192":0,"con193":0,"con194":2,"con199":-1,"con2":0,"con200":0,"con201":0,"con21":2},{"name":"1762118_s_at","con1027":0,"con1028":0,"con1029":0,"con103":2,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":-1,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":1,"con131":1,"con132":2,"con133":1,"con134":1,"con135":1,"con136":0,"con137":1,"con138":1,"con139":1,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":-1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":1,"con191":-1,"con192":1,"con193":0,"con194":3,"con199":1,"con2":0,"con200":1,"con201":1,"con21":0},{"name":"1762151_s_at","con1027":0,"con1028":0,"con1029":0,"con103":1,"con1030":-1,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":-1,"con1041":0,"con108":0,"con109":2,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":1,"con132":2,"con133":-1,"con134":-1,"con135":0,"con136":0,"con137":-1,"con138":1,"con139":-3,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":0,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1762388_s_at","con1027":0,"con1028":-1,"con1029":0,"con103":0,"con1030":0,"con1031":-1,"con1032":0,"con1033":1,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":2,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":1,"con133":-1,"con134":-1,"con135":-1,"con136":-1,"con137":-2,"con138":0,"con139":-3,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":0,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1762401_s_at","con1027":0,"con1028":0,"con1029":-1,"con103":1,"con1030":-3,"con1031":-3,"con1032":1,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":2,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":1,"con130":2,"con131":3,"con132":1,"con133":3,"con134":-1,"con135":0,"con136":0,"con137":0,"con138":-2,"con139":0,"con14":0,"con15":1,"con150":0,"con151":0,"con152":0,"con153":1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":1,"con191":-2,"con192":0,"con193":0,"con194":0,"con199":0,"con2":-5,"con200":0,"con201":0,"con21":0},{"name":"1762633_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":0,"con1032":1,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":-1,"con132":0,"con133":-1,"con134":0,"con135":0,"con136":0,"con137":0,"con138":0,"con139":0,"con14":0,"con15":0,"con150":-1,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":1,"con2":1,"con200":2,"con201":-1,"con21":0},{"name":"1762701_s_at","con1027":-1,"con1028":1,"con1029":-1,"con103":0,"con1030":-1,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":1,"con1037":1,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":-1,"con109":1,"con110":0,"con111":0,"con112":1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":-1,"con133":-1,"con134":-2,"con135":-2,"con136":-1,"con137":0,"con138":-2,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":3,"con16":0,"con17":0,"con174":1,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":-1,"con191":-2,"con192":0,"con193":0,"con194":1,"con199":0,"con2":-4,"con200":-1,"con201":0,"con21":0},{"name":"1762787_s_at","con1027":0,"con1028":0,"con1029":0,"con103":-1,"con1030":0,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":2,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":1,"con126":0,"con127":-1,"con128":0,"con129":-1,"con130":-1,"con131":-2,"con132":-1,"con133":-1,"con134":0,"con135":-1,"con136":3,"con137":0,"con138":4,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":-1,"con188":0,"con189":-1,"con191":0,"con192":0,"con193":0,"con194":-1,"con199":1,"con2":1,"con200":0,"con201":0,"con21":0},{"name":"1762819_s_at","con1027":0,"con1028":0,"con1029":1,"con103":0,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":0,"con132":0,"con133":0,"con134":1,"con135":1,"con136":-1,"con137":0,"con138":-1,"con139":0,"con14":1,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":1,"con194":1,"con199":1,"con2":1,"con200":2,"con201":-1,"con21":0},{"name":"1762880_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":-1,"con110":0,"con111":0,"con112":1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":1,"con131":3,"con132":3,"con133":3,"con134":1,"con135":1,"con136":0,"con137":1,"con138":0,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":0,"con2":2,"con200":0,"con201":1,"con21":0},{"name":"1762945_s_at","con1027":0,"con1028":0,"con1029":-1,"con103":-1,"con1030":0,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":-1,"con130":-1,"con131":-1,"con132":-3,"con133":0,"con134":-1,"con135":0,"con136":7,"con137":0,"con138":5,"con139":1,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":-1,"con184":0,"con185":0,"con186":0,"con187":0,"con188":-1,"con189":0,"con191":0,"con192":0,"con193":0,"con194":-1,"con199":1,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1762983_s_at","con1027":0,"con1028":0,"con1029":0,"con103":1,"con1030":-1,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":-1,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":2,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":1,"con130":0,"con131":-1,"con132":-2,"con133":-1,"con134":-1,"con135":-1,"con136":0,"con137":-2,"con138":-1,"con139":-2,"con14":0,"con15":0,"con150":0,"con151":0,"con152":-1,"con153":-1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":-1,"con192":0,"con193":0,"con194":0,"con199":1,"con2":0,"con200":0,"con201":0,"con21":1},{"name":"1763132_s_at","con1027":0,"con1028":0,"con1029":0,"con103":-2,"con1030":-2,"con1031":-1,"con1032":1,"con1033":0,"con1034":-1,"con1035":1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":-1,"con130":-1,"con131":-2,"con132":-3,"con133":-1,"con134":0,"con135":-1,"con136":5,"con137":0,"con138":4,"con139":0,"con14":0,"con15":1,"con150":0,"con151":0,"con152":0,"con153":1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":-2,"con192":0,"con193":0,"con194":0,"con199":-1,"con2":-4,"con200":-1,"con201":0,"con21":0},{"name":"1763138_s_at","con1027":0,"con1028":0,"con1029":-1,"con103":1,"con1030":-1,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":2,"con110":0,"con111":0,"con112":-2,"con125":0,"con126":0,"con127":0,"con128":0,"con129":2,"con130":2,"con131":1,"con132":0,"con133":1,"con134":0,"con135":0,"con136":0,"con137":1,"con138":-1,"con139":1,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":1,"con188":1,"con189":1,"con191":0,"con192":0,"con193":0,"con194":1,"con199":2,"con2":0,"con200":1,"con201":0,"con21":0},{"name":"1763146_s_at","con1027":0,"con1028":-1,"con1029":0,"con103":0,"con1030":0,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":-1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":-1,"con132":0,"con133":-1,"con134":-1,"con135":-1,"con136":-2,"con137":0,"con138":-1,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":1,"con199":-1,"con2":0,"con200":0,"con201":-1,"con21":0},{"name":"1763198_s_at","con1027":0,"con1028":0,"con1029":-1,"con103":0,"con1030":-1,"con1031":-1,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":-1,"con1038":0,"con1039":-1,"con1040":0,"con1041":0,"con108":-1,"con109":-1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":1,"con130":1,"con131":1,"con132":0,"con133":2,"con134":-1,"con135":0,"con136":2,"con137":0,"con138":0,"con139":1,"con14":0,"con15":-1,"con150":0,"con151":0,"con152":0,"con153":1,"con16":0,"con17":-1,"con174":1,"con184":-1,"con185":-1,"con186":0,"con187":-1,"con188":0,"con189":0,"con191":0,"con192":0,"con193":-1,"con194":0,"con199":0,"con2":0,"con200":0,"con201":0,"con21":0},{"name":"1763383_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":0,"con1032":0,"con1033":0,"con1034":-1,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":-1,"con130":-1,"con131":0,"con132":5,"con133":-1,"con134":0,"con135":0,"con136":0,"con137":-1,"con138":4,"con139":-2,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":1,"con199":0,"con2":-1,"con200":0,"con201":0,"con21":0},{"name":"1763410_s_at","con1027":0,"con1028":0,"con1029":-1,"con103":-1,"con1030":-1,"con1031":-2,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":2,"con110":0,"con111":0,"con112":-1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":-1,"con130":-1,"con131":0,"con132":1,"con133":-2,"con134":-2,"con135":-1,"con136":3,"con137":0,"con138":4,"con139":-1,"con14":0,"con15":0,"con150":1,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":-1,"con192":1,"con193":0,"con194":1,"con199":1,"con2":-1,"con200":1,"con201":0,"con21":0},{"name":"1763426_s_at","con1027":0,"con1028":0,"con1029":0,"con103":4,"con1030":-1,"con1031":0,"con1032":0,"con1033":0,"con1034":0,"con1035":-1,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":0,"con1041":0,"con108":0,"con109":-1,"con110":0,"con111":0,"con112":0,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":-1,"con131":0,"con132":2,"con133":1,"con134":2,"con135":2,"con136":-2,"con137":0,"con138":0,"con139":1,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":-1,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":1,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":2,"con199":-1,"con2":-1,"con200":0,"con201":0,"con21":0},{"name":"1763490_s_at","con1027":0,"con1028":0,"con1029":0,"con103":0,"con1030":0,"con1031":-1,"con1032":0,"con1033":1,"con1034":0,"con1035":0,"con1036":0,"con1037":-1,"con1038":0,"con1039":-1,"con1040":-1,"con1041":-1,"con108":-1,"con109":3,"con110":0,"con111":0,"con112":-1,"con125":0,"con126":0,"con127":0,"con128":0,"con129":0,"con130":0,"con131":-2,"con132":0,"con133":0,"con134":0,"con135":0,"con136":-2,"con137":-4,"con138":-1,"con139":-2,"con14":-1,"con15":0,"con150":0,"con151":0,"con152":-3,"con153":-3,"con16":-1,"con17":0,"con174":-1,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":0,"con199":-1,"con2":0,"con200":0,"con201":0,"con21":2},{"name":"1763491_s_at","con1027":0,"con1028":0,"con1029":-1,"con103":0,"con1030":-2,"con1031":-3,"con1032":0,"con1033":0,"con1034":0,"con1035":0,"con1036":0,"con1037":0,"con1038":0,"con1039":0,"con1040":1,"con1041":0,"con108":0,"con109":0,"con110":0,"con111":0,"con112":0,"con125":0,"con126":-1,"con127":0,"con128":0,"con129":-1,"con130":-1,"con131":-1,"con132":2,"con133":0,"con134":0,"con135":0,"con136":4,"con137":-1,"con138":6,"con139":0,"con14":0,"con15":0,"con150":0,"con151":0,"con152":0,"con153":0,"con16":0,"con17":0,"con174":0,"con184":0,"con185":0,"con186":0,"con187":0,"con188":0,"con189":0,"con191":0,"con192":0,"con193":0,"con194":1,"con199":-1,"con2":-1,"con200":0,"con201":1,"con21":0}];
    let columns = ['con1027','con1028','con1029','con103','con1030','con1031','con1032','con1033','con1034','con1035','con1036','con1037','con1038','con1039','con1040','con1041','con108','con109','con110','con111','con112','con125','con126','con127','con128','con129','con130','con131','con132','con133','con134','con135','con136','con137','con138','con139','con14','con15','con150','con151','con152','con153','con16','con17','con174','con184','con185','con186','con187','con188','con189','con191','con192','con193','con194','con199','con2','con200','con201','con21']; // change
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
          </div>
        </SubHeader>
        <div className="row visualization-content">
          <D3Heatmap data={data} columns={columns} />
        </div>
      </div>
    );
  }
}

export default ProjectVisualization;
