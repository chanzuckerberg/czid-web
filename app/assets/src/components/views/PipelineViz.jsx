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
    this.stageResults = this.props.stageResults.stages;
    this.pipelineVersion = this.props.stageResults.pipeline_version;
    this.stageGraphsInfo = [];

    if (this.props.admin) {
      this.stageNames = [
        "Host Filtering",
        "GSNAPL/RAPSEARCH alignment",
        "Post Processing",
        "Experimental",
      ];
    } else {
      this.stageNames = [
        "Host Filtering",
        "GSNAPL/RAPSEARCH alignment",
        "Post Processing",
      ];
    }

    this.state = {
      stagesOpened: [true, true, true, true],
      zoom: 1,
    };
  }

  componentDidMount() {
    this.renderGraphs();
  }

  onMouseWheelZoom(e) {
    const zoomChange = (e.deltaY < 0 ? 1 : -1) * 0.01;
    this.setState({ zoom: this.state.zoom + zoomChange });
  }

  toggleStage(index) {
    const updatedStagesOpened = [...this.state.stagesOpened];
    updatedStagesOpened[index] = !updatedStagesOpened[index];
    this.setState({ stagesOpened: updatedStagesOpened });
  }

  modifyStepNames() {
    // Strips 'PipelineStep[Run/Generate]' from front of each step name.
    // TODO(ezhong): Consider adding 'name' field to dag_json later.
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

  populateNodeAndEdgeData(stepData, nodeData, edgeData) {
    const outTargetToStepId = {};
    stepData.forEach((step, i) => {
      // Populate nodeData
      nodeData.push({ id: i, label: step.class, level: 1 });

      // Populate intermediatary outFileToStepId for edges
      if (!(step.out in outTargetToStepId)) {
        outTargetToStepId[step.out] = i;
      }
    });

    // Add beginning (input) and ending (output) nodes
    nodeData.push({ id: START_NODE_ID, level: 0, group: "startEndNodes" });
    nodeData.push({ id: END_NODE_ID, group: "startEndNodes" });

    let maxLevel = 1;
    stepData.forEach((step, i) => {
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
          // Connect beginning steps to input node
          edgeData.push({ from: START_NODE_ID, to: i });
        }
      });
    });
    nodeData[stepData.length + 1].level = maxLevel + 1;
  }

  adjustGraphNodePositions() {
    let centerDOMCoords;
    this.stageGraphsInfo.forEach((graphInfo, i) => {
      const graph = graphInfo.graph;
      this.adjustStageWidth(graph);
      if (i == 0) {
        const canvasCoords = graph.getPositions([START_NODE_ID])[START_NODE_ID];
        centerDOMCoords = graph.canvasToDOM(canvasCoords);
      } else {
        const canvasYCoord = graph.DOMtoCanvas(centerDOMCoords).y;
        graph.moveNode(
          START_NODE_ID,
          graph.getPositions([START_NODE_ID])[START_NODE_ID].x,
          canvasYCoord
        );
        graph.moveNode(
          END_NODE_ID,
          graph.getPositions([END_NODE_ID])[END_NODE_ID].x,
          canvasYCoord
        );
      }
    });
  }

  adjustStageWidth(graph) {
    // Set initial zoom for width calculation.
    graph.moveTo({ scale: 1 });

    // Calculate and set new canvas width.
    const minX = graph.canvasToDOM({
      x: graph.getBoundingBox(START_NODE_ID).right,
    }).x;
    // Use right instead of left to include room for edge arrow tip.
    const maxX = graph.canvasToDOM({
      x: graph.getBoundingBox(END_NODE_ID).right,
    }).x;
    graph.setSize(maxX - minX + "px", "100%");

    // Reset zoom (which is adjusted in setSize).
    graph.moveTo({ scale: 1, position: { x: 0, y: 0 } });
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
    this.adjustGraphNodePositions();
  }

  renderInterStageEdges() {
    this.stageGraphsInfo.forEach((currStageInfo, i) => {
      if (i == this.stageGraphsInfo.length - 1) {
        // Create hidden edges to final node for vertical centering of nodes.
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

        const currFileNameToOutputtingNode = {};
        currStageData.steps.forEach((step, nodeId) => {
          currStageData.targets[step.out].forEach(fileName => {
            fileName = `${currStageData.output_dir_s3}/${
              this.pipelineVersion
            }/${fileName}`;
            currFileNameToOutputtingNode[fileName] = nodeId;
          });
        });

        const nextStageData = this.stageResults[this.stageNames[i + 1]];
        nextStageData.steps.forEach((step, nextNodeId) => {
          step.in.forEach(inTarget => {
            nextStageData.targets[inTarget].forEach(fileName => {
              if (inTarget in nextStageData.given_targets) {
                fileName = `${
                  nextStageData.given_targets[inTarget].s3_dir
                }/${fileName}`;
                if (fileName in currFileNameToOutputtingNode) {
                  const currNodeId = currFileNameToOutputtingNode[fileName];
                  currStageInfo.data.edges.add({
                    from: currNodeId,
                    to: END_NODE_ID,
                  });
                  // TODO(ezhong): Interactions between output of current stage (currNodeId)
                  // and input of next stage (nextNodeId) in visualization should be setup here
                }
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

    this.populateNodeAndEdgeData(stageData.steps, nodeData, edgeData);

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
      },
    };

    const graph = new Network(container, data, options);

    // Close stages that currently are not running.
    if (!(stageData.job_status == "STARTED")) {
      graph.once("afterDrawing", () => {
        this.toggleStage(index);
      });
    }

    this.stageGraphsInfo.push({
      graph: graph,
      data: data,
    });
  }

  render() {
    const stageContainers = [];

    this.stageNames.forEach((stageName, i) => {
      const isOpened = this.state.stagesOpened[i];

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
