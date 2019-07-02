import React from "react";
import { mapValues } from "lodash/fp";
import PropTypes from "prop-types";
import { PanZoom } from "react-easy-panzoom";
import cx from "classnames";

import DetailsSidebar from "~/components/common/DetailsSidebar/DetailsSidebar";
import NetworkGraph from "~/components/visualizations/NetworkGraph";
import PipelineStageArrowheadIcon from "~/components/ui/icons/PipelineStageArrowheadIcon";
import PlusMinusControl from "~/components/ui/controls/PlusMinusControl";
import RemoveIcon from "~/components/ui/icons/RemoveIcon";
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
      interStageArrows: ["", "", ""],
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

  getStepDataAtIndices(stageIndex, stepIndex) {
    return this.stagesData[stageIndex].steps[stepIndex];
  }

  getStagesData() {
    // TODO(ezhong): Include file download urls once passed up from backend.
    const stageResults = this.stageResultsWithModifiedStepNames();
    const filePathToOutputInputSteps = this.generateFilePathToOutputInputSteps();

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
                const outputStepInfo =
                  filePathToOutputInputSteps[filePath].outputtingInfo;
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
          const filePath = this.createFilePath([
            rawStageData.output_dir_s3,
            this.pipelineVersion,
            fileName,
          ]);
          const inputStepInfo =
            filePathToOutputInputSteps[filePath].inputtingInfo;

          return {
            fileName: fileName,
            url: "",
            to: inputStepInfo,
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

  generateFilePathToOutputInputSteps() {
    const { stageResults } = this.props;
    const filePathToOutputInputSteps = {};

    this.stageNames.forEach((stageName, stageIndex) => {
      const stageData = stageResults.stages[stageName];
      const targets = stageData.targets;

      // Populate outputting information
      stageData.steps.forEach((step, stepIndex) => {
        targets[step.out].forEach(fileName => {
          const filePath = this.createFilePath([
            stageData.output_dir_s3,
            this.pipelineVersion,
            fileName,
          ]);
          filePathToOutputInputSteps[filePath] = {
            fileName: fileName,
            outputtingInfo: {
              stageIndex: stageIndex,
              stepIndex: stepIndex,
            },
            inputtingInfo: [],
          };
        });

        // Populate inputting information. This method assumes that
        // outputting step has already stored the filePath into the
        // filePathToOutputInputSteps object.
        step.in.forEach(inTarget => {
          targets[inTarget].forEach(fileName => {
            const filePathSections =
              inTarget in stageData.given_targets
                ? [stageData.given_targets[inTarget].s3_dir]
                : [stageData.output_dir_s3, this.pipelineVersion];
            filePathSections.push(fileName);

            const filePath = this.createFilePath(filePathSections);
            if (!filePathToOutputInputSteps[filePath]) {
              filePathToOutputInputSteps[filePath] = {
                fileName: fileName,
              };
            }
            filePathToOutputInputSteps[filePath].inputtingInfo = [
              { stageIndex: stageIndex, stepIndex: stepIndex },
              ...(filePathToOutputInputSteps[filePath].inputtingInfo || []),
            ];
          });
        });
      });
    });

    return filePathToOutputInputSteps;
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

    this.graphs.forEach((graph, i) => i != stageIndex && graph.unselectAll());

    const stepData = this.getStepDataAtIndices(stageIndex, clickedNodeId);
    const inputFiles = stepData.inputInfo.map(input => {
      const fileInfo = {
        fileName: input.fileName,
        url: input.url,
      };
      if (input.fromStageIndex != null && input.fromStepIndex != null) {
        fileInfo.fromStepName = this.getStepDataAtIndices(
          input.fromStageIndex,
          input.fromStepIndex
        ).name;
      } else {
        fileInfo.fromStepName = "";
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

  handleNodeHover(stageIndex, info) {
    const { highlightColor } = this.props;
    const graph = this.graphs[stageIndex];
    const stepInfo = this.getStepDataAtIndices(stageIndex, info.node);

    const inputColorOptions = {
      color: {
        color: "#000000",
        hover: "#000000",
        inherit: false,
      },
      width: 2,
    };

    const inputEdges = graph.getConnectedEdges(info.node, "to");
    graph.updateEdges(inputEdges, inputColorOptions);

    const updatedInterStageArrows = [...this.state.interStageArrows];
    stepInfo.inputInfo.forEach(inputFile => {
      if (
        inputFile.fromStageIndex != null &&
        inputFile.fromStageIndex != stageIndex
      ) {
        const prevGraph = this.graphs[inputFile.fromStageIndex];
        const edgeId = prevGraph.getEdgeBetweenNodes(
          inputFile.fromStepIndex,
          END_NODE_ID
        );
        prevGraph.updateEdges([edgeId], inputColorOptions);
        updatedInterStageArrows[inputFile.fromStageIndex] = "from";
      }
    });

    const outputColorOptions = {
      color: {
        color: highlightColor,
        hover: highlightColor,
        inherit: false,
      },
      width: 2,
    };

    const outputEdges = graph.getConnectedEdges(info.node, "from");
    graph.updateEdges(outputEdges, outputColorOptions);

    stepInfo.outputInfo.forEach(outputFile => {
      outputFile.to.forEach(outputNode => {
        if (outputNode.stageIndex != stageIndex) {
          const nextGraph = this.graphs[outputNode.stageIndex];
          const edgeId = nextGraph.getEdgeBetweenNodes(
            START_NODE_ID,
            outputNode.stepIndex
          );
          nextGraph.updateEdges([edgeId], outputColorOptions);
          updatedInterStageArrows[outputNode.stageIndex - 1] = "to";
        }
      });
    });

    this.graphs.forEach(graph => this.centerEndNodeVertically(graph));

    this.setState({
      interStageArrows: updatedInterStageArrows,
    });
  }

  handleNodeBlur = () => {
    const { edgeColor } = this.props;
    this.graphs.forEach((graph, graphIndex) => {
      // Undefined selects all edges in the graph.
      graph.updateEdges(undefined, {
        color: {
          color: edgeColor,
          inherit: false,
        },
        width: 1,
      });

      if (graphIndex == this.graphs.length - 1) {
        const hiddenCenteringEdges = graph.getConnectedEdges(END_NODE_ID, "to");
        graph.updateEdges(hiddenCenteringEdges, {
          color: {
            opacity: 0,
            inherit: false,
          },
          chosen: false,
        });
      }
    });

    this.graphs.forEach(graph => this.centerEndNodeVertically(graph));

    this.setState({
      interStageArrows: ["", "", ""],
    });
  };

  closeSidebar = () => {
    this.graphs.forEach(graph => graph.unselectAll());
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
    const stepData = this.stagesData[index].steps;
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
    if (index == this.stagesData.length - 1) {
      // For final stage, create hidden edges to final node for vertical centering of nodes.
      const stepData = this.stagesData[index].steps;
      return stepData.map((_, i) => {
        return {
          from: i,
          to: END_NODE_ID,
          color: {
            opacity: 0,
            inherit: false,
          },
          chosen: false,
        };
      });
    } else {
      // Create edges to output node if its output files appear in next stage's inputs.
      const nextStageData = this.stagesData[index + 1];
      const connectedNodes = new Set();
      const interEdgeData = nextStageData.steps
        .map(step => {
          return step.inputInfo.reduce((edges, inputFileInfo) => {
            if (
              inputFileInfo.fromStageIndex == index &&
              !connectedNodes.has(inputFileInfo.fromStepIndex)
            ) {
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

  centerEndNodeVertically(graph) {
    // Starting for each graph node is already vertically centered.
    const yStartNodePos = graph.getNodePosition(START_NODE_ID).y;
    const xEndNodePos = graph.getNodePosition(END_NODE_ID).x;
    graph.moveNodeToPosition(END_NODE_ID, xEndNodePos, yStartNodePos);
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
    this.closeNonativeSteps();
  }

  drawStageGraph(index) {
    const {
      nodeColor,
      backgroundColor,
      edgeColor,
      highlightColor,
    } = this.props;
    const container = this.graphContainers[index];

    const edgeData = this.generateIntraEdgeData(index).concat(
      this.generateInterEdgeData(index)
    );
    const nodeData = this.generateNodeData(index, edgeData);

    const options = {
      nodes: {
        borderWidth: 1,
        borderWidthSelected: 1,
        color: {
          background: nodeColor,
          border: nodeColor,
          hover: {
            border: highlightColor,
            background: nodeColor,
          },
          highlight: {
            border: highlightColor,
            background: nodeColor,
          },
        },
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
        labelHighlightBold: false,
      },
      groups: {
        startEndNodes: {
          shape: "dot",
          size: 1,
          color: {
            background: backgroundColor,
            border: backgroundColor,
            inherit: false,
          },
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
            scaleFactor: 0.85,
          },
        },
        smooth: {
          type: "cubicBezier",
          roundness: 0.8,
        },
        color: {
          color: edgeColor,
          inherit: false,
        },
        selectionWidth: 0,
        hoverWidth: 0,
      },
      layout: {
        hierarchical: {
          direction: "LR",
          sortMethod: "directed",
          levelSeparation: 200,
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
        selectConnectedEdges: false,
      },
      onClick: info => this.handleStepClick(index, info),
      onNodeHover: info => this.handleNodeHover(index, info),
      onNodeBlur: this.handleNodeBlur,
    };

    const currStageGraph = new NetworkGraph(
      container,
      nodeData,
      edgeData,
      options
    );
    currStageGraph.minimizeWidthGivenScale(1.0);
    this.centerEndNodeVertically(currStageGraph);

    this.graphs.push(currStageGraph);
  }

  renderStageContainer(stageName, i) {
    const isOpened = this.state.stagesOpened[i];
    return (
      <div className={cs.stage}>
        <div
          className={isOpened ? cs.hidden : cs.stageButton}
          onClick={() => this.toggleStage(i)}
        >
          {stageName}
        </div>

        <div className={isOpened ? cs.openedStage : cs.hidden}>
          <div className={cs.graphLabel}>
            {stageName}
            <RemoveIcon onClick={() => this.toggleStage(i)} />
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
  }

  renderStageArrow(arrowValue) {
    let coloring;
    switch (arrowValue) {
      case "from":
        coloring = cs.fromColoring;
        break;
      case "to":
        coloring = cs.toColoring;
        break;
      default:
        coloring = "";
    }

    return (
      <div className={cs.stageArrow}>
        <div className={cx(cs.stageArrowBody, coloring)} />
        <PipelineStageArrowheadIcon
          className={cx(cs.stageArrowHead, coloring)}
        />
      </div>
    );
  }

  render() {
    const { zoomMin, zoomMax } = this.props;
    const { sidebarVisible, sidebarParams, interStageArrows } = this.state;

    const stageContainers = this.stageNames.map((stageName, i) => {
      return (
        <div key={stageName} className={cs.stageAndArrow}>
          {i > 0 && this.renderStageArrow(interStageArrows[i - 1])}
          {this.renderStageContainer(stageName, i)}
        </div>
      );
    });

    return (
      <div>
        <PanZoom
          className={cs.panZoomContainer}
          minZoom={zoomMin}
          maxZoom={zoomMax}
          zoomSpeed={3}
          ref={ref => {
            this.panZoomContainer = ref;
          }}
        >
          <div className={cs.pipelineViz}>{stageContainers}</div>
        </PanZoom>
        <PlusMinusControl
          onPlusClick={this.panZoomContainer && this.panZoomContainer.zoomIn}
          onMinusClick={this.panZoomContainer && this.panZoomContainer.zoomOut}
          className={cs.plusMinusControl}
        />
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
  highlightColor: PropTypes.string,
  zoomMin: PropTypes.number,
  zoomMax: PropTypes.number,
};

PipelineViz.defaultProps = {
  backgroundColor: "#f8f8f8",
  nodeColor: "#eaeaea",
  edgeColor: "#999999",
  highlightColor: "#3867fa",
  zoomMin: 0.5,
  zoomMax: 3,
};

export default PipelineViz;
