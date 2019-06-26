import React from "react";
import { mapValues } from "lodash/fp";
import PropTypes from "prop-types";
import ReactPanZoom from "@ajainarayanan/react-pan-zoom";

import RemoveIcon from "~/components/ui/icons/RemoveIcon";
import NetworkGraph from "~/components/visualizations/NetworkGraph.js";
import cs from "./pipeline_viz.scss";

const START_NODE_ID = -1;
const END_NODE_ID = -2;

class PipelineViz extends React.Component {
  constructor(props) {
    super(props);
    this.pipelineVersion = this.props.stageResults.pipeline_version;
    this.stagesData = this.stagesDataWithModifiedStepNames();
    this.graphs = [];
    this.graphContainers = [];

    this.stageNames = [
      "Host Filtering",
      "GSNAPL/RAPSEARCH alignment",
      "Post Processing",
      ...(props.admin ? ["Experimental"] : []),
    ];

    this.state = {
      stagesOpened: [true, true, true, true],
      zoom: 1,
    };
  }

  componentDidMount() {
    this.drawGraphs();
  }

  handleMouseWheelZoom = e => {
    const { zoomChangeInterval } = this.props;
    const zoomChange = (e.deltaY < 0 ? 1 : -1) * zoomChangeInterval;
    this.setState({ zoom: this.state.zoom + zoomChange });
  };

  toggleStage(index) {
    const updatedStagesOpened = [...this.state.stagesOpened];
    updatedStagesOpened[index] = !updatedStagesOpened[index];
    this.setState({ stagesOpened: updatedStagesOpened });
  }

  stagesDataWithModifiedStepNames() {
    // Strips 'PipelineStep[Run/Generate]' from front of each step name.
    // TODO(ezhong): Consider adding 'name' field to dag_json later.
    const { stageResults } = this.props;
    const stagesWithModifiedNames = mapValues(stageData => {
      const modifiedStageData = Object.assign({}, stageData);
      modifiedStageData.steps = modifiedStageData.steps.map(step => {
        return {
          ...step,
          class: step.class.replace(/^(PipelineStep(Run|Generate)?)/, ""),
        };
      });
      return modifiedStageData;
    }, stageResults.stages);
    return stagesWithModifiedNames;
  }

  generateNodeData(index, edgeData) {
    const stageData = this.stagesData[this.stageNames[index]];
    const stepData = stageData.steps;

    const nodeData = [];
    stepData.forEach((step, i) => {
      nodeData.push({ id: i, label: step.class });
    });
    nodeData.push({ id: START_NODE_ID, group: "startEndNodes" });
    nodeData.push({ id: END_NODE_ID, group: "startEndNodes" });

    this.addHierarchicalLevelsToNodes(nodeData, edgeData);
    return nodeData;
  }

  addHierarchicalLevelsToNodes(nodeData, edgeData) {
    // This method assumes that the steps are topologically sorted already,
    // in that each node's parent all appear in the array before it.
    const nodeToCurrentLevel = {};
    nodeData.forEach(node => {
      nodeToCurrentLevel[node.id] = 1;
    });

    edgeData.forEach(edge => {
      const newLevel = nodeToCurrentLevel[edge.from] + 1;
      if (newLevel > nodeToCurrentLevel[edge.to]) {
        nodeToCurrentLevel[edge.to] = newLevel;
        if (edge.to != END_NODE_ID) {
          nodeToCurrentLevel[END_NODE_ID] = Math.max(
            nodeToCurrentLevel[END_NODE_ID],
            newLevel + 1
          );
        }
      }
    });

    nodeData.forEach(node => {
      node.level = nodeToCurrentLevel[node.id];
    });
  }

  generateIntraEdgeData(index) {
    const stageData = this.stagesData[this.stageNames[index]];
    const stepData = stageData.steps;

    const outTargetToStepId = {};
    stepData.forEach((step, i) => {
      if (!(step.out in outTargetToStepId)) {
        // Populate outFileToStepId for intra-stage edges
        outTargetToStepId[step.out] = i;
      }
    });

    const intraEdgeData = [];
    stepData.forEach((step, i) => {
      step.in.forEach(inTarget => {
        if (inTarget in outTargetToStepId) {
          const fromId = outTargetToStepId[inTarget];
          intraEdgeData.push({ from: fromId, to: i });
        } else {
          // Connect beginning steps to input node
          intraEdgeData.push({ from: START_NODE_ID, to: i });
        }
      });
    });
    return intraEdgeData;
  }

  generateInterEdgeData(index) {
    const { backgroundColor } = this.props;
    const stageData = this.stagesData[this.stageNames[index]];
    const stepData = stageData.steps;

    if (index == this.stageNames.length - 1) {
      // For final stage, create hidden edges to final node for vertical centering of nodes.
      return stepData.map((_, i) => {
        return {
          from: i,
          to: END_NODE_ID,
          color: {
            color: backgroundColor,
            inherit: false,
          },
          chosen: false,
        };
      });
    } else {
      // Create edges to output node if it's output files appear in next stage's inputs.
      const currFileNameToOutputtingNode = {};
      stepData.forEach((step, i) => {
        stageData.targets[step.out].forEach(fileName => {
          const fileNameWithPath = `${stageData.output_dir_s3}/${
            this.pipelineVersion
          }/${fileName}`;
          currFileNameToOutputtingNode[fileNameWithPath] = i;
        });
      });

      const interEdgeData = [];

      const nextStageData = this.stagesData[this.stageNames[index + 1]];
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
                interEdgeData.push({
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

      return interEdgeData;
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
    this.stageNames.forEach((_, i) => {
      this.drawStageGraph(i);
    });
    this.adjustGraphNodePositions();
    this.closeNonactiveSteps();
  }

  closeNonactiveSteps() {
    this.stageNames.forEach((stageName, i) => {
      const graph = this.graphs[i];
      const stageData = this.stagesData[stageName];
      if (stageData.job_status !== "STARTED") {
        graph.afterDrawingOnce(() => {
          this.toggleStage(i);
        });
      }
    });
  }

  drawStageGraph(index) {
    const { nodeColor, backgroundColor, edgeColor } = this.props;
    const container = this.graphContainers[index];

    const edgeData = this.generateIntraEdgeData(index).concat(
      this.generateInterEdgeData(index)
    );
    const nodeData = this.generateNodeData(index, edgeData);

    const options = {
      nodes: {
        borderWidth: 0,
        color: nodeColor,
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
          color: backgroundColor,
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
        color: edgeColor,
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
    const stageContainers = this.stageNames.map((stageName, i) => {
      const isOpened = this.state.stagesOpened[i];

      return (
        <div key={stageName} className={cs.stage}>
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
                this.graphContainers[i] = ref;
              }}
            />
          </div>
        </div>
      );
    });

    return (
      <div onWheel={this.handleMouseWheelZoom}>
        <ReactPanZoom zoom={this.state.zoom}>
          <div className={cs.pipelineViz}>{stageContainers}</div>
        </ReactPanZoom>
      </div>
    );
  }
}

PipelineViz.propTypes = {
  stageResults: PropTypes.object,
  backgroundColor: PropTypes.string,
  nodeColor: PropTypes.string,
  edgeColor: PropTypes.string,
  zoomChangeInterval: PropTypes.number,
};

PipelineViz.defaultProps = {
  backgroundColor: "#f8f8f8",
  nodeColor: "#eaeaea",
  edgeColor: "#999999",
  zoomChangeInterval: 0.01,
};

export default PipelineViz;
