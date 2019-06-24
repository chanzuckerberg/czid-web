import React from "react";
import { forEach } from "lodash";
import PropTypes from "prop-types";
import ReactPanZoom from "@ajainarayanan/react-pan-zoom";

import RemoveIcon from "~/components/ui/icons/RemoveIcon";
import NetworkGraph from "~/components/visualizations/NetworkGraph.js";
import cs from "./pipeline_viz.scss";

const START_NODE_ID = -1;
const END_NODE_ID = -2;
const STAGE_BG_COLOR = "#f8f8f8";
const NODE_COLOR = "#eaeaea";
const EDGE_COLOR = "#999999";
const ZOOM_CHANGE_INTERVAL = 0.01;

class PipelineViz extends React.Component {
  constructor(props) {
    super(props);
    this.pipelineVersion = this.props.stageResults.pipeline_version;
    this.stageGraphsInfo = [];
    this.graphs = [];

    this.stageNames = [
      "Host Filtering",
      "GSNAPL/RAPSEARCH alignment",
      "Post Processing",
    ];
    if (this.props.admin) {
      this.stageNames.push("Experimental");
    }

    this.state = {
      stagesOpened: [true, true, true, true],
      zoom: 1,
    };

    this.onMouseWheelZoom = this.onMouseWheelZoom.bind(this);
  }

  componentDidMount() {
    this.drawGraphs();
  }

  onMouseWheelZoom(e) {
    const zoomChange = (e.deltaY < 0 ? 1 : -1) * ZOOM_CHANGE_INTERVAL;
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
    forEach(this.props.stageResults.stages, (stageData, _) => {
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

  populateNodeAndEdgeData(index, nodeData, edgeData) {
    const stageData = this.props.stageResults.stages[this.stageNames[index]];
    const stepData = stageData.steps;

    const outTargetOrPathToStepId = {};
    const currFileNameToOutputtingNode = {};
    stepData.forEach((step, i) => {
      // Populate nodeData
      nodeData.push({ id: i, label: step.class, level: 1 });

      if (!(step.out in outTargetOrPathToStepId)) {
        // Populate outFileToStepId for intra-stage edges
        outTargetOrPathToStepId[step.out] = i;
        // Populate currFileNameToOutputtingNode for inter-stage edges
        stageData.targets[step.out].forEach(fileName => {
          const fileNameWithPath = `${stageData.output_dir_s3}/${
            this.pipelineVersion
          }/${fileName}`;
          currFileNameToOutputtingNode[fileNameWithPath] = i;
        });
      }
    });

    // Add beginning (input) and ending (output) nodes
    nodeData.push({ id: START_NODE_ID, level: 0, group: "startEndNodes" });
    nodeData.push({ id: END_NODE_ID, group: "startEndNodes" });

    let maxLevel = 1;
    stepData.forEach((step, i) => {
      step.in.forEach(inTarget => {
        if (inTarget in outTargetOrPathToStepId) {
          const fromId = outTargetOrPathToStepId[inTarget];
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

    if (index < this.stageNames.length - 1) {
      // Create edges to output node if it's output files appear in next stage's inputs.
      const nextStageData = this.props.stageResults.stages[
        this.stageNames[index + 1]
      ];
      nextStageData.steps.forEach((step, nextNodeId) => {
        step.in.forEach(inTarget => {
          nextStageData.targets[inTarget].forEach(fileName => {
            if (inTarget in nextStageData.given_targets) {
              const fileNameWithPath = `${
                nextStageData.given_targets[inTarget].s3_dir
              }/${fileName}`;
              if (fileNameWithPath in currFileNameToOutputtingNode) {
                const currNodeId =
                  currFileNameToOutputtingNode[fileNameWithPath];
                edgeData.push({
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
    } else {
      // For final stage, create hidden edges to final node for vertical centering of nodes.
      stepData.forEach((_, i) => {
        edgeData.push({
          from: i,
          to: END_NODE_ID,
          color: {
            color: STAGE_BG_COLOR,
            inherit: false,
          },
          chosen: false,
        });
      });
    }
  }

  adjustGraphNodePositions() {
    let yCenteredDOMPos;

    this.graphs.forEach((graph, i) => {
      if (i == 0) {
        yCenteredDOMPos = graph.getNodePosition(START_NODE_ID).y;
      } else {
        const xStartNodePos = graph.getNodePosition(START_NODE_ID).x;
        graph.moveNodeToPosition(START_NODE_ID, xStartNodePos, yCenteredDOMPos);

        const xEndNodePos = graph.getNodePosition(END_NODE_ID).x;
        graph.moveNodeToPosition(END_NODE_ID, xEndNodePos, yCenteredDOMPos);
      }
    });
  }

  drawGraphs() {
    this.modifyStepNames();
    this.stageNames.forEach((stageName, i) => {
      this.drawStageGraph(i);
    });
    this.adjustGraphNodePositions();
    this.closeNonactiveSteps();
  }

  closeNonactiveSteps() {
    this.stageNames.forEach((stageName, i) => {
      const graph = this.graphs[i];
      const stageData = this.props.stageResults.stages[stageName];
      if (!(stageData.job_status == "STARTED")) {
        graph.afterDrawingOnce(() => {
          this.toggleStage(i);
        });
      }
    });
  }

  drawStageGraph(index) {
    const container = this[`container${index}`];

    const nodeData = [];
    const edgeData = [];

    this.populateNodeAndEdgeData(index, nodeData, edgeData);

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

    const currStageGraph = new NetworkGraph(
      container,
      nodeData,
      edgeData,
      options
    );
    currStageGraph.minimizeWidthGivenScale(1.0);

    this.graphs.push(currStageGraph);
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
            <div className={cs.graphLabel}>
              {stageName}
              <RemoveIcon
                className={cs.closeButton}
                onClick={() => this.toggleStage(i)}
              />
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
      <div onWheel={this.onMouseWheelZoom}>
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
