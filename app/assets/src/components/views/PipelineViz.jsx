import React from "react";
import { mapValues, groupBy } from "lodash/fp";
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
    this.edgeFileData = this.getEdgeFileData();
    this.stageStepData = this.getStageStepData();
    this.populateStageStepDataEdges();

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
    return this.stageStepData[stageIndex].steps[stepIndex];
  }

  getEdgeFileData() {
    const filePathToOutputInputSteps = this.generateFilePathToOutputInputSteps();

    // Expand to one object per entry in "to" field array
    const perFilePath = Object.keys(filePathToOutputInputSteps)
      .map(filePath => {
        const fileInfo = filePathToOutputInputSteps[filePath];
        if (fileInfo.to.length) {
          return fileInfo.to.map(toNodeInfo => {
            return {
              filePath: filePath,
              fileName: fileInfo.fileName,
              from: fileInfo.from,
              to: toNodeInfo,
            };
          });
        } else {
          return {
            filePath: filePath,
            fileName: fileInfo.fileName,
            from: fileInfo.from,
            to: undefined,
          };
        }
      })
      .flat();

    // Group files with the same starting node and ending node
    const filesGroupedByMatchingStartEndNodes = Object.values(
      groupBy(
        filePathInfo =>
          JSON.stringify({ from: filePathInfo.from, to: filePathInfo.to }),
        perFilePath
      )
    );

    // Coalesce redundant information (starting ndoe and ending node)
    return filesGroupedByMatchingStartEndNodes.map(filesOnSameEdge => {
      const fileInfo = filesOnSameEdge.map(fileInfo => {
        // TODO(ezhong): Include file download urls once passed up from backend.
        return {
          fileName: fileInfo.fileName,
          filePath: fileInfo.filePath,
          url: "",
        };
      });

      return {
        from: filesOnSameEdge[0].from,
        to: filesOnSameEdge[0].to,
        files: fileInfo,
      };
    });
  }

  getStageStepData() {
    const { stageResults } = this.props;

    const stages = this.stageNames.map(stageName => {
      const stageData = stageResults.stages[stageName];
      const steps = stageData.steps.map(step => {
        return {
          name: this.getModifiedStepName(step.class),
          inputEdges: [],
          outputEdges: [],
        };
      });
      return {
        stageName: stageName,
        jobStatus: stageData.job_status,
        steps: steps,
      };
    });

    return stages;
  }

  populateStageStepDataEdges() {
    this.edgeFileData.forEach((edgeData, edgeIndex) => {
      const { from, to } = edgeData;
      from &&
        this.getStepDataAtIndices(
          from.stageIndex,
          from.stepIndex
        ).outputEdges.push(edgeIndex);
      to &&
        this.getStepDataAtIndices(to.stageIndex, to.stepIndex).inputEdges.push(
          edgeIndex
        );
    });
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
            from: {
              stageIndex: stageIndex,
              stepIndex: stepIndex,
            },
            to: [],
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
            filePathToOutputInputSteps[filePath].to = [
              { stageIndex: stageIndex, stepIndex: stepIndex },
              ...(filePathToOutputInputSteps[filePath].to || []),
            ];
          });
        });
      });
    });

    return filePathToOutputInputSteps;
  }

  getModifiedStepName(stepClassName) {
    return stepClassName.replace(/^(PipelineStep(Run|Generate)?)/, "");
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
    const inputInfo = stepData.inputEdges.map(edgeId => {
      const edgeInfo = this.edgeFileData[edgeId];
      const fromStepName = edgeInfo.from
        ? this.getStepDataAtIndices(
            edgeInfo.from.stageIndex,
            edgeInfo.from.stepIndex
          ).name
        : "";
      return {
        fromStepName: fromStepName,
        files: edgeInfo.files,
      };
    });

    const seenFiles = new Set();
    const outputInfo = stepData.outputEdges
      .map(edgeId => {
        return this.edgeFileData[edgeId].files.reduce((files, fileInfo) => {
          if (!seenFiles.has(fileInfo.fileName)) {
            seenFiles.add(fileInfo.fileName);
            files.push(fileInfo);
          }
          return files;
        }, []);
      })
      .flat();

    this.setState({
      sidebarVisible: true,
      sidebarParams: {
        stepName: stepData.name,
        description: "",
        inputFiles: inputInfo,
        outputFiles: outputInfo,
      },
    });
  }

  handleNodeHover(stageIndex, info) {
    const { highlightColor } = this.props;
    const graph = this.graphs[stageIndex];
    const stepInfo = this.getStepDataAtIndices(stageIndex, info.node);
    const updatedInterStageArrows = [...this.state.interStageArrows];

    const inputColorOptions = {
      color: {
        color: "#000000",
        hover: "#000000",
        inherit: false,
      },
      width: 2,
    };

    const inputEdges = stepInfo.inputEdges.reduce((edges, edgeId) => {
      const edgeInfo = this.edgeFileData[edgeId];
      if (edgeInfo.from && edgeInfo.from.stageIndex == stageIndex) {
        // Edge exists within current graph
        edges.push(
          graph.getEdgeBetweenNodes(edgeInfo.from.stepIndex, info.node)
        );
      } else if (edgeInfo.from && edgeInfo.from.stageIndex != stageIndex) {
        // Edge from previous graph
        const prevGraph = this.graphs[edgeInfo.from.stageIndex];
        const graphEdgeId = prevGraph.getEdgeBetweenNodes(
          edgeInfo.from.stepIndex,
          END_NODE_ID
        );
        prevGraph.updateEdges([graphEdgeId], inputColorOptions);
        updatedInterStageArrows[edgeInfo.from.stageIndex] = "from";

        edges.push(graph.getEdgeBetweenNodes(START_NODE_ID, info.node));
      }
      return edges;
    }, []);

    graph.updateEdges(inputEdges, inputColorOptions);

    const outputColorOptions = {
      color: {
        color: highlightColor,
        hover: highlightColor,
        inherit: false,
      },
      width: 2,
    };

    const outputEdges = stepInfo.outputEdges.reduce((edges, edgeId) => {
      const edgeInfo = this.edgeFileData[edgeId];
      if (edgeInfo.to && edgeInfo.to.stageIndex == stageIndex) {
        // Edge exists within current graph
        edges.push(graph.getEdgeBetweenNodes(info.node, edgeInfo.to.stepIndex));
      } else if (edgeInfo.to && edgeInfo.to.stageIndex != stageIndex) {
        // Edge from next graph
        const nextGraph = this.graphs[edgeInfo.to.stageIndex];
        const graphEdgeId = nextGraph.getEdgeBetweenNodes(
          START_NODE_ID,
          edgeInfo.to.stepIndex
        );
        nextGraph.updateEdges([graphEdgeId], outputColorOptions);
        updatedInterStageArrows[edgeInfo.to.stageIndex - 1] = "to";

        edges.push(graph.getEdgeBetweenNodes(info.node, END_NODE_ID));
      }
      return edges;
    }, []);

    graph.updateEdges(outputEdges, outputColorOptions);

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

  generateNodeData(stageIndex, edgeData) {
    const stepData = this.stageStepData[stageIndex].steps;
    const nodeData = stepData.map((step, i) => {
      return { id: i, label: step.name };
    });

    nodeData.push({ id: START_NODE_ID, group: "startEndNodes" });
    nodeData.push({ id: END_NODE_ID, group: "startEndNodes" });

    this.addHierarchicalLevelsToNodes(nodeData, edgeData);
    return nodeData;
  }

  addHierarchicalLevelsToNodes(nodeData, edgeData) {
    const nodeToCurrentLevel = {};
    const fromToToEdgeMap = {};
    nodeData.forEach(node => {
      nodeToCurrentLevel[node.id] = 1;
      fromToToEdgeMap[node.id] = [];
    });

    edgeData.forEach(edge => {
      fromToToEdgeMap[edge.from].push(edge.to);
    });

    const bfs = [START_NODE_ID];
    while (bfs.length) {
      const currentNode = bfs.shift();

      // Update children, then add to back of bfs queue
      const newLevel = nodeToCurrentLevel[currentNode] + 1;
      fromToToEdgeMap[currentNode].forEach(toNodeId => {
        if (newLevel > nodeToCurrentLevel[toNodeId]) {
          nodeToCurrentLevel[toNodeId] = newLevel;
          if (toNodeId != END_NODE_ID) {
            nodeToCurrentLevel[END_NODE_ID] = Math.max(
              nodeToCurrentLevel[END_NODE_ID],
              newLevel + 1
            );
          }
        }
        bfs.push(toNodeId);
      });
    }

    nodeData.forEach(node => {
      node.level = nodeToCurrentLevel[node.id];
    });
  }

  generateEdgeData(stageIndex) {
    const stepData = this.stageStepData[stageIndex].steps;
    const hiddenEdgeColorOption = {
      color: {
        opacity: 0,
        inherit: false,
      },
    };

    const edgeData = stepData
      .map((step, currStepIndex) => {
        let connectedToEndNode = false;

        const outputEdges = step.outputEdges.reduce((edges, edgeId) => {
          const edgeInfo = this.edgeFileData[edgeId];
          if (edgeInfo.to && edgeInfo.to.stageIndex == stageIndex) {
            connectedToEndNode = true;
            edges.push({ from: currStepIndex, to: edgeInfo.to.stepIndex });
          } else if (!connectedToEndNode) {
            if (edgeInfo.to) {
              connectedToEndNode = true;
              edges.push({ from: currStepIndex, to: END_NODE_ID });
            } else if (stageIndex == this.stageNames.length - 1) {
              // Create hidden edges at the last stage for centering.
              connectedToEndNode = true;
              edges.push({
                from: currStepIndex,
                to: END_NODE_ID,
                ...hiddenEdgeColorOption,
              });
            }
          }
          return edges;
        }, []);

        let connectedToStartNode = false;
        const inputEdges = step.inputEdges.reduce((edges, edgeId) => {
          const edgeInfo = this.edgeFileData[edgeId];
          if (!connectedToStartNode) {
            if (edgeInfo.from == null) {
              // Create hidden edge if input is initial sample file.
              edges.push({
                from: START_NODE_ID,
                to: currStepIndex,
                ...hiddenEdgeColorOption,
              });
            } else if (edgeInfo.from.stageIndex != stageIndex) {
              connectedToStartNode = true;
              edges.push({ from: START_NODE_ID, to: currStepIndex });
            }
          }
          return edges;
        }, []);

        return outputEdges.concat(inputEdges);
      })
      .flat();

    if (stageIndex == 0) {
      edgeData.push({ from: START_NODE_ID, to: 0, ...hiddenEdgeColorOption });
    }

    return edgeData;
  }

  centerEndNodeVertically(graph) {
    // Starting for each graph node is already vertically centered.
    const yStartNodePos = graph.getNodePosition(START_NODE_ID).y;
    const xEndNodePos = graph.getNodePosition(END_NODE_ID).x;
    graph.moveNodeToPosition(END_NODE_ID, xEndNodePos, yStartNodePos);
  }

  closeNonativeSteps() {
    this.stageStepData.forEach((stageData, i) => {
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

    const edgeData = this.generateEdgeData(index);
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
