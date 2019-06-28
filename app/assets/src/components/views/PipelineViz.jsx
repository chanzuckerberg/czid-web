import React from "react";
import { mapValues } from "lodash/fp";
import PropTypes from "prop-types";
import ReactPanZoom from "@ajainarayanan/react-pan-zoom";

import RemoveIcon from "~/components/ui/icons/RemoveIcon";
import DetailsSidebar from "~/components/common/DetailsSidebar/DetailsSidebar";
import NetworkGraph from "~/components/visualizations/NetworkGraph.js";
import cs from "./pipeline_viz.scss";

const START_NODE_ID = -1;
const END_NODE_ID = -2;

class PipelineViz extends React.Component {
  constructor(props) {
    super(props);

    this.stageNames = [
      "Host Filtering",
      "GSNAPL/RAPSEARCH alignment",
      "Post Processing",
      ...(props.admin ? ["Experimental"] : []),
    ];

    this.pipelineVersion = this.props.stageResults.pipeline_version;
    this.stagesData = this.getStagesData();
    this.graphs = [];
    this.graphContainers = [];

    this.state = {
      stagesOpened: [true, true, true, true],
      zoom: 1,
      sidebarVisible: false,
      sidebarParams: {},
    };
  }

  componentDidMount() {
    this.drawGraphs();
  }

  createFilePath(filePathSections) {
    return filePathSections
      .filter(
        pathSection =>
          pathSection != null && pathSection != undefined && pathSection != ""
      )
      .join("/");
  }

  getStagesData() {
    // TODO(ezhong): Include file download urls once passed up from backend.
    const stageResults = this.stageResultsWithModifiedStepNames();
    const filePathToOutputStep = this.generateFilePathToOutputStep();

    const stages = Object.keys(stageResults).map(stageName => {
      const rawStageData = stageResults[stageName];
      const steps = rawStageData.steps.map(step => {
        const name = step.class;

        const inputInfo = step.in
          .map(inTarget => {
            const inTargetFiles = rawStageData.targets[inTarget].map(
              fileName => {
                const filePathSections =
                  inTarget in rawStageData.given_targets
                    ? [rawStageData.given_targets[inTarget].s3_dir]
                    : [rawStageData.output_dir_s3, this.pipelineVersion];
                filePathSections.push(fileName);

                const filePath = this.createFilePath(filePathSections);
                const outputStepInfo = filePathToOutputStep[filePath];
                return {
                  fileName: fileName,
                  url: "",
                  ...(outputStepInfo
                    ? {
                        fromStepIndex: outputStepInfo.stepIndex,
                        fromStageIndex: outputStepInfo.stageIndex,
                      }
                    : {}),
                };
              }
            );
            return inTargetFiles;
          })
          .flat();

        const outputInfo = rawStageData.targets[step.out].map(fileName => {
          return {
            fileName: fileName,
            url: "",
          };
        });

        return {
          name: name,
          inputInfo: inputInfo,
          outputInfo: outputInfo,
        };
      });

      return {
        stageName: stageName,
        jobStatus: stageResults[stageName].job_status,
        steps: steps,
      };
    });

    return stages;
  }

  generateFilePathToOutputStep() {
    const { stageResults } = this.props;
    const filePathToOutputStep = {};
    this.stageNames.forEach((stageName, stageIndex) => {
      const stageData = stageResults.stages[stageName];
      const targets = stageData.targets;
      stageData.steps.forEach((step, stepIndex) => {
        targets[step.out].forEach(fileName => {
          const filePath = this.createFilePath([
            stageData.output_dir_s3,
            this.pipelineVersion,
            fileName,
          ]);
          filePathToOutputStep[filePath] = {
            stageIndex: stageIndex,
            stepIndex: stepIndex,
            fileName: fileName,
          };
        });
      });
    });
    return filePathToOutputStep;
  }

  stageResultsWithModifiedStepNames() {
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

  handleMouseWheelZoom = e => {
    const { zoomChangeInterval } = this.props;
    const zoomChange = (e.deltaY < 0 ? 1 : -1) * zoomChangeInterval;
    this.setState({ zoom: this.state.zoom + zoomChange });
  };

  handleStepClick(stageIndex, info) {
    const clickedNodeId = info.nodes[0];
    if (clickedNodeId == null) {
      return;
    }

    const stageData = this.stagesData[stageIndex];
    const stepData = stageData.steps[clickedNodeId];

    const inputFiles = stepData.inputInfo.map(input => {
      const fileInfo = {
        fileName: input.fileName,
        url: input.url,
      };
      if (input.fromStageIndex != null && input.fromStepIndex != null) {
        fileInfo.fromStepName = this.stagesData[input.fromStageIndex].steps[
          input.fromStepIndex
        ].name;
      }
      return fileInfo;
    });

    this.setState({
      sidebarVisible: true,
      sidebarParams: {
        stepName: stepData.name,
        description: "",
        inputFiles: inputFiles,
        outputFiles: stepData.outputInfo,
      },
    });
  }

  closeSidebar = () => {
    this.setState({
      sidebarVisible: false,
    });
  };

  toggleStage(index) {
    const updatedStagesOpened = [...this.state.stagesOpened];
    updatedStagesOpened[index] = !updatedStagesOpened[index];
    this.setState({ stagesOpened: updatedStagesOpened });
  }

  generateNodeData(index, edgeData) {
    const stageData = this.stagesData[index];
    const stepData = stageData.steps;

    const nodeData = stepData.map((step, i) => {
      return { id: i, label: step.name };
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
    const stepData = this.stagesData[index].steps;

    const intraEdgeData = stepData
      .map((step, currStepIndex) => {
        const connectedNodes = new Set();
        return step.inputInfo.reduce((edges, inputFile) => {
          const fromNode =
            inputFile.fromStageIndex == index
              ? inputFile.fromStepIndex
              : START_NODE_ID;

          if (!connectedNodes.has(fromNode)) {
            connectedNodes.add(fromNode);
            edges.push({ from: fromNode, to: currStepIndex });
          }
          return edges;
        }, []);
      })
      .flat();

    return intraEdgeData;
  }

  generateInterEdgeData(index) {
    const { backgroundColor } = this.props;

    if (index == this.stagesData.length - 1) {
      // For final stage, create hidden edges to final node for vertical centering of nodes.
      const stepData = this.stagesData[index].steps;
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
      // Create edges to output node if its output files appear in next stage's inputs.
      const nextStageData = this.stagesData[index + 1];
      const interEdgeData = nextStageData.steps
        .map((step, nextNodeId) => {
          const connectedNodes = new Set();
          return step.inputInfo.reduce((edges, inputFileInfo) => {
            if (
              inputFileInfo.fromStageIndex == index &&
              !connectedNodes.has(inputFileInfo.fromStepIndex)
            ) {
              // TODO(ezhong): Interactions between output of current stage (inputFileInfo.fromStepIndex)
              // and input of next stage (nextNodeId) in visualization should be setup here
              connectedNodes.add(inputFileInfo.fromStepIndex);
              edges.push({
                from: inputFileInfo.fromStepIndex,
                to: END_NODE_ID,
              });
            }
            return edges;
          }, []);
        })
        .flat();

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

  closeNonativeSteps() {
    this.stagesData.forEach((stageData, i) => {
      const graph = this.graphs[i];
      if (stageData.jobStatus !== "STARTED") {
        graph.afterDrawingOnce(() => {
          this.toggleStage(i);
        });
      }
    });
  }

  drawGraphs() {
    this.stageNames.forEach((_, i) => {
      this.drawStageGraph(i);
    });
    this.adjustGraphNodePositions();
    this.closeNonativeSteps();
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
      options,
      info => this.handleStepClick(index, info)
    );
    currStageGraph.minimizeWidthGivenScale(1.0);

    this.graphs.push(currStageGraph);
  }

  render() {
    const { sidebarVisible, sidebarParams, stagesOpened, zoom } = this.state;
    const stageContainers = this.stageNames.map((stageName, i) => {
      const isOpened = stagesOpened[i];

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
      <div>
        <div onWheel={this.handleMouseWheelZoom}>
          <ReactPanZoom zoom={zoom}>
            <div className={cs.pipelineViz}>{stageContainers}</div>
          </ReactPanZoom>
        </div>
        <DetailsSidebar
          visible={sidebarVisible}
          mode="pipelineStepDetails"
          params={sidebarParams}
          onClose={this.closeSidebar}
        />
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
