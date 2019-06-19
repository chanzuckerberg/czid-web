import React from "react";
import { DataSet, Network } from "vis";
import { forEach } from "lodash";
import PropTypes from "prop-types";
import ReactPanZoom from "@ajainarayanan/react-pan-zoom";

import cs from "./pipeline_viz.scss";

const START_NODE_ID = -1;
const END_NODE_ID = -2;
const STAGE_BG_COLOR = "#f8f8f8";
const NODE_COLOR = "#eaeaea";
const EDGE_COLOR = "#999999";

class PipelineViz extends React.Component {
  constructor(props) {
    super(props);
    this.stageResults = this.props.stageResults;
    this.stageNames = this.props.admin
      ? [
          "Host Filtering",
          "GSNAPL/RAPSEARCH alignment",
          "Post Processing",
          "Experimental",
        ]
      : ["Host Filtering", "GSNAPL/RAPSEARCH alignment", "Post Processing"];

    this.stageGraphs = [];
    this.prevPosition = window.scrollY;

    this.state = {
      stage0Opened: true,
      stage1Opened: true,
      stage2Opened: true,
      stage3Opened: true,
      zoom: 1,
    };
  }

  componentDidMount() {
    this.renderGraphs();
  }

  onMouseWheelZoom(e) {
    if (e.deltaY > 0) {
      this.setState({ zoom: this.state.zoom - 0.01 });
    } else if (e.deltaY < 0) {
      this.setState({ zoom: this.state.zoom + 0.01 });
    }
  }

  toggleStage(index) {
    let stageKeyName = `stage${index}Opened`;
    this.setState({ [stageKeyName]: !this.state[stageKeyName] });
  }

  modifyStepNames() {
    // Strips 'PipelineStep[Run/Generate]' from front of each step name.
    // Consider adding 'name' field to dag_json later.
    forEach(this.stageResults, (stageData, _) => {
      stageData.steps.forEach(step => {
        if (step.class.substring(0, 12) == "PipelineStep") {
          step.class = step.class.substring(12);
        }
        if (step.class.substring(0, 3) == "Run") {
          step.class = step.class.substring(3);
        }
        if (step.class.substring(0, 8) == "Generate") {
          step.class = step.class.substring(8);
        }
      });
    });
  }

  adjustStageWidth(graph) {
    // Set initial zoom for width calculation.
    graph.moveTo({
      scale: 1,
    });

    // Calculate and set new canvas width
    const minX = graph.canvasToDOM({
      x: graph.getBoundingBox(START_NODE_ID).right,
    }).x;
    const maxX = graph.canvasToDOM({
      x: graph.getBoundingBox(END_NODE_ID).right,
    }).x;
    graph.setSize(maxX - minX + "px", "100%");

    // Reset zoom (which is adjusted in setSize).
    graph.moveTo({
      scale: 1,
    });
  }

  adjustStartEndNodeHeights() {
    let centerDOMCoords;
    this.stageGraphs.forEach((graphInfo, i) => {
      const graph = graphInfo.graph;
      if (i == 0) {
        const canvasCoords = graph.getPositions([START_NODE_ID])[START_NODE_ID];
        centerDOMCoords = graph.canvasToDOM(canvasCoords);
      } else {
        const canvasCoords = graph.DOMtoCanvas(centerDOMCoords);
        graph.moveNode(
          START_NODE_ID,
          graph.getPositions([START_NODE_ID])[START_NODE_ID].x,
          canvasCoords.y
        );
        graph.moveNode(
          END_NODE_ID,
          graph.getPositions([END_NODE_ID])[END_NODE_ID].x,
          canvasCoords.y
        );
      }
    });
  }

  renderGraphs() {
    this.modifyStepNames();
    this.stageNames.forEach((stageName, i) => {
      this.renderStageGraph(
        this.stageResults[stageName],
        this[`container${i}`],
        i
      );
    });
    this.renderInterStageEdges();
    this.adjustStartEndNodeHeights();
  }

  renderInterStageEdges() {
    this.stageGraphs.forEach((currStageInfo, i) => {
      if (i == this.stageGraphs.length - 1) {
        // Create hidden edges to final node for vertical centering.
        currStageInfo.data.nodes.forEach(nodeData => {
          currStageInfo.data.edges.add({
            from: nodeData.id,
            to: END_NODE_ID,
            color: {
              color: STAGE_BG_COLOR,
              inherit: false,
            },
            chosen: false,
          });
        });
      } else {
        const currStageData = this.stageResults[this.stageNames[i]];

        // TODO(ezhong): For file names, prepend with output_dir_s3 string
        // along with pipeline version number appended, then use that entire
        // string to compare in second loop, using given_targets.
        const currFileNameToOutputtingNode = {};
        currStageData.steps.forEach((step, stepIndex) => {
          currStageData.targets[step.out].forEach(fileName => {
            // Temporary fix for TODO above.
            if (fileName.substring(0, 9) == "assembly/") {
              fileName = fileName.substring(9);
            }
            // stepIndex is the same as the nodeId for the given graph
            currFileNameToOutputtingNode[fileName] = stepIndex;
          });
        });

        const nextStageData = this.stageResults[this.stageNames[i + 1]];
        nextStageData.steps.forEach((step, stepIndex) => {
          step.in.forEach(inTarget => {
            nextStageData.targets[inTarget].forEach(fileName => {
              if (fileName in currFileNameToOutputtingNode) {
                const currNodeId = currFileNameToOutputtingNode[fileName];
                currStageInfo.data.edges.add({
                  from: currNodeId,
                  to: END_NODE_ID,
                });
              }
            });
          });
        });
      }
    });
  }

  renderStageGraph(stageData, container, index) {
    const nodeData = [];
    const edgeData = [];

    const outTargetToStepId = {};
    stageData.steps.forEach((step, i) => {
      // Populate nodeData
      nodeData.push({ id: i, label: step.class, level: 1 });

      // Populate intermediatary outFileToStepId for edges
      if (!(step.out in outTargetToStepId)) {
        outTargetToStepId[step.out] = i;
      }
    });

    nodeData.push({ id: START_NODE_ID, level: 0, group: "startEndNodes" });
    nodeData.push({ id: END_NODE_ID, group: "startEndNodes" });

    let maxLevel = 1;
    stageData.steps.forEach((step, i) => {
      step.in.forEach(inTarget => {
        if (inTarget in outTargetToStepId) {
          const fromId = outTargetToStepId[inTarget];
          edgeData.push({ from: fromId, to: i });

          nodeData[i].level = Math.max(
            nodeData[i].level,
            nodeData[fromId].level + 1
          );
          maxLevel = Math.max(maxLevel, nodeData[i].level);
        } else {
          // Beginning step for the stage.
          edgeData.push({ from: START_NODE_ID, to: i });
        }
      });
    });

    nodeData[stageData.steps.length + 1].level = maxLevel + 1;

    const data = {
      nodes: new DataSet(nodeData),
      edges: new DataSet(edgeData),
    };

    const options = {
      nodes: {
        borderWidth: 0,
        color: NODE_COLOR,
        shape: "box",
        shapeProperties: {
          borderRadius: 6,
        },
        widthConstraint: {
          minimum: 120,
        },
        heightConstraint: {
          minimum: 24,
        },
        font: {
          face: "Open Sans",
        },
      },
      groups: {
        startEndNodes: {
          widthConstraint: 8,
          heightConstraint: 0,
          color: STAGE_BG_COLOR,
          fixed: {
            x: true,
            y: true,
          },
        },
      },
      edges: {
        arrows: {
          to: {
            enabled: true,
            type: "arrow",
            scaleFactor: 0.8,
          },
        },
        smooth: {
          type: "cubicBezier",
          roundness: 0.8,
        },
        color: EDGE_COLOR,
      },
      layout: {
        hierarchical: {
          direction: "LR",
          sortMethod: "directed",
          levelSeparation: 200,
          parentCentralization: false,
          blockShifting: false,
          edgeMinimization: false,
        },
      },
      physics: {
        enabled: false,
      },
      interaction: {
        zoomView: false,
        dragView: false,
        dragNodes: false,
        hover: true,
        // hoverConnectedEdges: true,
      },
    };

    const graph = new Network(container, data, options);
    this.adjustStageWidth(graph);

    // TODO(ezhong): Once information about pipeline state is passed through,
    // keep current pipeline stage opened.
    graph.once("afterDrawing", () => this.toggleStage(index));
    this.stageGraphs.push({
      graph: graph,
      data: data,
    });
  }

  render() {
    const stageContainers = [];

    this.stageNames.forEach((stageName, i) => {
      const isOpened = this.state[`stage${i}Opened`];

      stageContainers.push(
        <div key={i} className={cs.stage}>
          <div
            className={isOpened ? cs.hidden : cs.stageButton}
            onClick={() => this.toggleStage(i)}
          >
            {stageName}
          </div>

          <div className={isOpened ? cs.openedStage : cs.hidden}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              {stageName}
              <div
                onClick={() => this.toggleStage(i)}
                className={cs.closeButton}
              >
                x
              </div>
            </div>
            <div
              className={cs.graph}
              ref={ref => {
                this[`container${i}`] = ref;
              }}
            />
          </div>
        </div>
      );
    });

    return (
      <div onWheel={e => this.onMouseWheelZoom(e)}>
        <ReactPanZoom zoom={this.state.zoom}>
          <div className={cs.pipelineViz}>{stageContainers}</div>
        </ReactPanZoom>
      </div>
    );
  }
}

PipelineViz.propTypes = {
  stageResults: PropTypes.object,
};

export default PipelineViz;
