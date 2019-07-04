import React from "react";
import ReactDOM from "react-dom";
import { groupBy } from "lodash/fp";
import PropTypes from "prop-types";
import { PanZoom } from "react-easy-panzoom";
import { Matrix, inverse } from "ml-matrix";
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
    this.edgeFileData = this.createEdgeFileData();
    this.stageStepData = this.createStageStepData();
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

  getStepDataAt(stageStepIndices) {
    const { stageIndex, stepIndex } = stageStepIndices;
    return this.stageStepData[stageIndex].steps[stepIndex];
  }

  getEdgeInfoFor(stageIndex, stepIndex, direction) {
    const stepData = this.getStepDataAt({
      stageIndex: stageIndex,
      stepIndex: stepIndex,
    });
    switch (direction) {
      case "input":
        return stepData.inputEdges.map(edgeId => this.edgeFileData[edgeId]);
      case "output":
        return stepData.outputEdges.map(edgeId => this.edgeFileData[edgeId]);
      default:
        return stepData.inputEdges
          .concat(stepData.outputEdges)
          .map(edgeId => this.edgeFileData[edgeId]);
    }
  }

  createEdgeFileData() {
    const infoPerFilePath = this.generateInfoPerFilePath();

    // Group files with the same starting node and ending node
    const filesGroupedByMatchingStartEndNodes = Object.values(
      groupBy(filePathInfo => {
        return JSON.stringify({ from: filePathInfo.from, to: filePathInfo.to });
      }, infoPerFilePath)
    );

    // Coalesce redundant information (starting node and ending node)
    // TODO(ezhong): Include file download urls once passed up from backend.
    return filesGroupedByMatchingStartEndNodes.map(filesOnSameEdge => {
      const from = filesOnSameEdge[0].from;
      const to = filesOnSameEdge[0].to;
      const fileInfo = filesOnSameEdge.map(fileInfo => {
        return {
          fileName: fileInfo.fileName,
          filePath: fileInfo.filePath,
          url: "",
        };
      });

      return {
        from: from,
        to: to,
        isIntraStage: from && to && from.stageIndex == to.stageIndex,
        files: fileInfo,
      };
    });
  }

  generateInfoPerFilePath() {
    const { stageResults } = this.props;

    const filePathToOutputtingStep = {};
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
          filePathToOutputtingStep[filePath] = {
            fileName: fileName,
            from: {
              stageIndex: stageIndex,
              stepIndex: stepIndex,
            },
          };
        });
      });
    });

    const infoPerFilePath = [];
    const remainingOutputFiles = new Set(Object.keys(filePathToOutputtingStep));
    this.stageNames.forEach((stageName, stageIndex) => {
      const stageData = stageResults.stages[stageName];
      const targets = stageData.targets;

      stageData.steps.forEach((step, stepIndex) => {
        step.in.forEach(inTarget => {
          targets[inTarget].forEach(fileName => {
            const filePathSections =
              inTarget in stageData.given_targets
                ? [stageData.given_targets[inTarget].s3_dir]
                : [stageData.output_dir_s3, this.pipelineVersion];
            filePathSections.push(fileName);

            const filePath = this.createFilePath(filePathSections);
            remainingOutputFiles.delete(filePath);

            infoPerFilePath.push({
              filePath: filePath,
              fileName: fileName,
              to: {
                stageIndex: stageIndex,
                stepIndex: stepIndex,
              },
              ...(filePathToOutputtingStep[filePath] || {}),
            });
          });
        });
      });
    });

    // Include output files that aren't input to any steps.
    Array.from(remainingOutputFiles).forEach(filePath => {
      infoPerFilePath.push({
        filePath: filePath,
        ...filePathToOutputtingStep[filePath],
      });
    });

    return infoPerFilePath;
  }

  createStageStepData() {
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
      from && this.getStepDataAt(from).outputEdges.push(edgeIndex);
      to && this.getStepDataAt(to).inputEdges.push(edgeIndex);
    });
  }

  getEdgesBetweenNodes(graph, fromId, toId, type) {
    const allEdges = graph.getEdgesBetweenNodes(fromId, toId);
    if (type) {
      const edgeTypeRegex = new RegExp(`-${type}$`, "g");
      return allEdges.filter(edgeId => edgeId.match(edgeTypeRegex));
    }
    return allEdges;
  }

  getModifiedStepName(stepClassName) {
    return stepClassName.replace(/^(PipelineStep(Run|Generate)?)/, "");
  }

  inverseTransformDOMCoordinates(x, y) {
    const panZoomContainerDOM = ReactDOM.findDOMNode(this.panZoomContainer)
      .firstChild;
    const cssMatrixString = window
      .getComputedStyle(panZoomContainerDOM)
      .getPropertyValue("transform");
    const [a, b, c, d] = cssMatrixString
      .replace(/(matrix\()|(\))+/gi, "")
      .split(", ")
      .map(str => parseFloat(str))
      .slice(0, 4);

    const scalingMatrix = new Matrix([[a, c], [b, d]]);
    const invScalingMatrix = inverse(scalingMatrix);

    const coordinates = Matrix.columnVector([x, y]);
    const scaledCoordinates = invScalingMatrix.mmul(coordinates);

    return { x: scaledCoordinates.get(0, 0), y: scaledCoordinates.get(1, 0) };
  }

  getNodeIdAt(graph, xCoord, yCoord) {
    const { x, y } = this.inverseTransformDOMCoordinates(xCoord, yCoord);
    return graph.getNodeAt(x, y);
  }

  handleClick(stageIndex, info) {
    const graph = this.graphs[stageIndex];
    const clickedNodeId = this.getNodeIdAt(
      graph,
      info.pointer.DOM.x,
      info.pointer.DOM.y
    );
    if (clickedNodeId == null) {
      return;
    }

    this.graphs.forEach((graph, i) => i != stageIndex && graph.unselectAll());
    graph.selectNodes([clickedNodeId]);

    const inputEdgesInfo = this.getEdgeInfoFor(
      stageIndex,
      clickedNodeId,
      "input"
    );
    const inputInfo = inputEdgesInfo.map(edgeInfo => {
      const fromStepName = edgeInfo.from
        ? this.getStepDataAt(edgeInfo.from).name
        : "";
      return {
        fromStepName: fromStepName,
        files: edgeInfo.files,
      };
    });

    const seenFiles = new Set();
    const outputEdgesInfo = this.getEdgeInfoFor(
      stageIndex,
      clickedNodeId,
      "output"
    );
    const outputInfo = outputEdgesInfo
      .map(edgeInfo => {
        // Remove duplicate output file listings
        return edgeInfo.files.reduce((files, fileInfo) => {
          if (!seenFiles.has(fileInfo.fileName)) {
            seenFiles.add(fileInfo.fileName);
            files.push(fileInfo);
          }
          return files;
        }, []);
      })
      .flat();

    const stepName = this.getStepDataAt({
      stageIndex: stageIndex,
      stepIndex: clickedNodeId,
    }).name;
    this.setState({
      sidebarVisible: true,
      sidebarParams: {
        stepName: stepName,
        description: "",
        inputFiles: inputInfo,
        outputFiles: outputInfo,
      },
    });
  }

  handleNodeHover(stageIndex, info) {
    const { highlightColor } = this.props;
    const graph = this.graphs[stageIndex];
    const updatedInterStageArrows = [...this.state.interStageArrows];

    const inputColorOptions = {
      color: {
        color: "#000000",
        hover: "#000000",
        inherit: false,
      },
      width: 2,
      hidden: false,
    };

    const intraStageInputEdges = this.getEdgesBetweenNodes(
      graph,
      null,
      info.node,
      "colored"
    );
    graph.updateEdges(intraStageInputEdges, inputColorOptions);

    const inputEdgesInfo = this.getEdgeInfoFor(stageIndex, info.node, "input");
    inputEdgesInfo.forEach(edgeInfo => {
      if (!edgeInfo.isIntraStage && edgeInfo.from) {
        const prevGraph = this.graphs[edgeInfo.from.stageIndex];
        const prevGraphEdgeIds = this.getEdgesBetweenNodes(
          prevGraph,
          edgeInfo.from.stepIndex,
          END_NODE_ID,
          "colored"
        );
        prevGraph.updateEdges(prevGraphEdgeIds, inputColorOptions);
        updatedInterStageArrows[edgeInfo.from.stageIndex] = "from";
      }
    });

    const outputColorOptions = {
      color: {
        color: highlightColor,
        hover: highlightColor,
        inherit: false,
      },
      width: 2,
      hidden: false,
    };

    const intraStageOutputEdges = this.getEdgesBetweenNodes(
      graph,
      info.node,
      null,
      "colored"
    );
    graph.updateEdges(intraStageOutputEdges, outputColorOptions);

    const outputEdgesInfo = this.getEdgeInfoFor(
      stageIndex,
      info.node,
      "output"
    );
    outputEdgesInfo.forEach(edgeInfo => {
      if (!edgeInfo.isIntraStage && edgeInfo.to) {
        const nextGraph = this.graphs[edgeInfo.to.stageIndex];
        const nextGraphEdgeIds = this.getEdgesBetweenNodes(
          nextGraph,
          START_NODE_ID,
          edgeInfo.to.stepIndex,
          "colored"
        );
        nextGraph.updateEdges(nextGraphEdgeIds, outputColorOptions);
        updatedInterStageArrows[edgeInfo.to.stageIndex - 1] = "to";
      }
    });

    this.graphs.forEach(graph => this.centerEndNodeVertically(graph));

    this.setState({
      interStageArrows: updatedInterStageArrows,
    });
  }

  handleNodeBlur = () => {
    this.graphs.forEach(graph => {
      const allEdges = this.getEdgesBetweenNodes(graph, null, null, "colored");
      graph.updateEdges(allEdges, { hidden: true });
      this.centerEndNodeVertically(graph);
    });

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

      // Update children and add to back of bfs queue
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

    const regularColoringEdgeData = stepData
      .map((_, currStepIndex) => {
        let connectedToEndNode = false;
        const outputEdgeInfo = this.getEdgeInfoFor(
          stageIndex,
          currStepIndex,
          "output"
        );
        const outputEdges = outputEdgeInfo.reduce((edges, edgeInfo) => {
          if (edgeInfo.isIntraStage) {
            edges.push({
              from: currStepIndex,
              to: edgeInfo.to.stepIndex,
              id: `${currStepIndex}-${edgeInfo.to.stepIndex}`,
            });
          } else if (!connectedToEndNode && edgeInfo.to) {
            connectedToEndNode = true;
            edges.push({
              from: currStepIndex,
              to: END_NODE_ID,
              id: `${currStepIndex}-${END_NODE_ID}`,
            });
          }
          return edges;
        }, []);

        let connectedToStartNode = false;
        const inputEdgeInfo = this.getEdgeInfoFor(
          stageIndex,
          currStepIndex,
          "input"
        );
        const inputEdges = inputEdgeInfo.reduce((edges, edgeInfo) => {
          if (!edgeInfo.isIntraStage && !connectedToStartNode) {
            connectedToStartNode = true;
            edges.push({
              from: START_NODE_ID,
              to: currStepIndex,
              id: `${START_NODE_ID}-${currStepIndex}`,
            });
          }
          return edges;
        }, []);

        return outputEdges.concat(inputEdges);
      })
      .flat();

    const coloringEdgeData = regularColoringEdgeData.map(edge => {
      return Object.assign(
        { ...edge },
        {
          id: `${edge.from}-${edge.to}-colored`,
          hidden: true,
        }
      );
    });

    return regularColoringEdgeData.concat(
      coloringEdgeData,
      this.generateHiddenEdges(stageIndex)
    );
  }

  generateHiddenEdges(stageIndex) {
    const hiddenEdgeColorOption = {
      color: {
        opacity: 0,
        inherit: false,
      },
    };

    // For last stage, connect all nodes to end node for centering
    if (stageIndex == this.stageNames.length - 1) {
      return this.stageStepData[stageIndex].steps.map((_, stepIndex) => {
        return {
          from: stepIndex,
          to: END_NODE_ID,
          id: `${stepIndex}-${END_NODE_ID}-hidden`,
          ...hiddenEdgeColorOption,
        };
      });
    }
    return [];
  }

  centerEndNodeVertically(graph) {
    // Starting for each graph node is already vertically centered.
    const yStartNodePos = graph.getNodePosition(START_NODE_ID).y;
    const xEndNodePos = graph.getNodePosition(END_NODE_ID).x;
    graph.moveNodeToPosition(END_NODE_ID, xEndNodePos, yStartNodePos);
  }

  closeIfNonativeStage(graph, stageIndex) {
    const stageData = this.stageStepData[stageIndex];
    if (stageData.jobStatus != "STARTED") {
      graph.afterDrawingOnce(() => this.toggleStage(stageIndex));
    }
  }

  drawGraphs() {
    this.stageNames.forEach((_, i) => {
      this.drawStageGraph(i);
    });
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
      onClick: info => this.handleClick(index, info),
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
    this.closeIfNonativeStage(currStageGraph, index);

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
