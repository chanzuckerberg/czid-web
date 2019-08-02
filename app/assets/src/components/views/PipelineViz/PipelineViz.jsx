import React from "react";
import cx from "classnames";
import { PanZoom } from "react-easy-panzoom";

import DetailsSidebar from "~/components/common/DetailsSidebar/DetailsSidebar";
import CircleCheckmarkIcon from "~/components/ui/icons/CircleCheckmarkIcon";
import NetworkGraph from "~/components/visualizations/NetworkGraph";
import PipelineStageArrowheadIcon from "~/components/ui/icons/PipelineStageArrowheadIcon";
import PlusMinusControl from "~/components/ui/controls/PlusMinusControl";
import PropTypes from "~/components/utils/propTypes";
import RemoveIcon from "~/components/ui/icons/RemoveIcon";

import cs from "./pipeline_viz.scss";
import PipelineVizHeader from "./PipelineVizHeader";
import { inverseTransformDOMCoordinates } from "./utils";

const START_NODE_ID = -1;
const END_NODE_ID = -2;

class PipelineViz extends React.Component {
  constructor(props) {
    super(props);

    this.stageNames = [
      "Host Filtering",
      "Alignment",
      "Post Processing",
      ...(props.admin ? ["Experimental"] : []),
    ];

    this.graphs = [];
    this.graphContainers = [];
    this.lastMouseMoveInfo = {
      graphIndex: null,
      nodeId: null,
      x: 0,
      y: 0,
      alteredGraphs: new Set(),
    };
    this.panZoomContainer = React.createRef();

    this.state = {
      // Set stages that can be rendered to open, and others to closed.
      stagesOpened: this.stageNames.map(
        (_, i) => i < this.props.graphData.stages.length
      ),
      interStageArrows: ["", "", ""],
      sidebarVisible: false,
      sidebarParams: {},
      hovered: false,
    };
  }

  componentDidMount() {
    this.drawGraphs();
    window.addEventListener("resize", this.handleWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowResize);
  }

  getStepDataAtIndices({ stageIndex, stepIndex }) {
    const {
      graphData: { stages },
    } = this.props;
    return stages[stageIndex].steps[stepIndex];
  }

  getEdgeInfoFor(stageIndex, stepIndex, direction) {
    const {
      graphData: { edges },
    } = this.props;
    const stepData = this.getStepDataAtIndices({
      stageIndex: stageIndex,
      stepIndex: stepIndex,
    });
    switch (direction) {
      case "input":
        return stepData.inputEdges.map(edgeId => edges[edgeId]);
      case "output":
        return stepData.outputEdges.map(edgeId => edges[edgeId]);
      default:
        return stepData.inputEdges
          .concat(stepData.outputEdges)
          .map(edgeId => edges[edgeId]);
    }
  }

  getNodeIdAtCoords(graph, xCoord, yCoord) {
    const { x, y } = inverseTransformDOMCoordinates(
      this.panZoomContainer.current.dragContainer.current,
      xCoord,
      yCoord
    );
    return graph.getNodeAt(x, y);
  }

  handleStageClick(stageIndex, info) {
    const graph = this.graphs[stageIndex];
    const clickedNodeId = this.getNodeIdAtCoords(
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
        ? this.getStepDataAtIndices(edgeInfo.from).name
        : "";
      return {
        fromStepName: fromStepName,
        files: edgeInfo.files.map(file => {
          return { fileName: file.displayName, url: file.url };
        }),
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
          const fileInfoAsString = JSON.stringify(fileInfo);
          if (!seenFiles.has(fileInfoAsString)) {
            seenFiles.add(fileInfoAsString);
            files.push({ fileName: fileInfo.displayName, url: fileInfo.url });
          }
          return files;
        }, []);
      })
      .flat();

    const stepInfo = this.getStepDataAtIndices({
      stageIndex: stageIndex,
      stepIndex: clickedNodeId,
    });
    this.setState({
      sidebarVisible: true,
      sidebarParams: {
        stepName: stepInfo.name,
        description: stepInfo.description,
        inputFiles: inputInfo,
        outputFiles: outputInfo,
      },
    });
  }

  shouldUpdateMoveMouse(x, y) {
    const { minMouseMoveUpdateDistance } = this.props;
    const distance = Math.sqrt(
      Math.pow(x - this.lastMouseMoveInfo.x, 2) +
        Math.pow(y - this.lastMouseMoveInfo.y, 2)
    );
    return distance >= minMouseMoveUpdateDistance;
  }

  handleMouseMove(stageIndex, e) {
    const graph = this.graphs[stageIndex];
    if (!this.shouldUpdateMoveMouse(e.clientX, e.clientY)) {
      return;
    }

    const rect = e.target.getBoundingClientRect();
    const nodeId = this.getNodeIdAtCoords(
      graph,
      e.clientX - rect.left,
      e.clientY - rect.top
    );

    if (
      stageIndex != this.lastMouseMoveInfo.graphIndex ||
      nodeId != this.lastMouseMoveInfo.nodeId
    ) {
      this.handleNodeBlur();
    }

    Object.assign(this.lastMouseMoveInfo, {
      graphIndex: stageIndex,
      nodeId: nodeId,
      x: e.clientX,
      y: e.clientY,
    });

    if (nodeId != null) {
      this.handleNodeHover(stageIndex, nodeId);
    }
  }

  handleNodeHover(stageIndex, nodeId) {
    const { inputEdgeColor, highlightColor } = this.props;
    const graph = this.graphs[stageIndex];
    const updatedInterStageArrows = [...this.state.interStageArrows];

    const hoveredNodeColoring = this.getNodeStatusOptions(
      this.getStepDataAtIndices({
        stageIndex: stageIndex,
        stepIndex: nodeId,
      }).status,
      true
    );
    graph.updateNodes([nodeId], hoveredNodeColoring);
    this.lastMouseMoveInfo.alteredGraphs.add(stageIndex);

    const inputColorOptions = {
      color: {
        color: inputEdgeColor,
        hover: inputEdgeColor,
        inherit: false,
      },
      width: 2,
      hidden: false,
    };
    const inputEdgesInfo = this.getEdgeInfoFor(stageIndex, nodeId, "input");
    const intraStageInputEdges = inputEdgesInfo.reduce((edgeIds, edgeInfo) => {
      if (edgeInfo.isIntraStage) {
        edgeIds.push(`${edgeInfo.from.stepIndex}-${nodeId}-colored`);
      } else {
        if (edgeInfo.from) {
          const prevGraph = this.graphs[edgeInfo.from.stageIndex];
          const prevEdgeId = `${
            edgeInfo.from.stepIndex
          }-${END_NODE_ID}-colored`;
          prevGraph.updateEdges([prevEdgeId], inputColorOptions);

          for (
            let arrowIndex = edgeInfo.from.stageIndex;
            arrowIndex < stageIndex;
            arrowIndex++
          ) {
            updatedInterStageArrows[arrowIndex] = "from";
          }

          this.lastMouseMoveInfo.alteredGraphs.add(edgeInfo.from.stageIndex);
        }

        edgeIds.push(`${START_NODE_ID}-${nodeId}-colored`);
      }
      return edgeIds;
    }, []);
    graph.updateEdges(intraStageInputEdges, inputColorOptions);

    const outputColorOptions = {
      color: {
        color: highlightColor,
        hover: highlightColor,
        inherit: false,
      },
      width: 2,
      hidden: false,
    };
    const outputEdgesInfo = this.getEdgeInfoFor(stageIndex, nodeId, "output");
    const intraStageOutputEdges = outputEdgesInfo.reduce(
      (edgeIds, edgeInfo) => {
        if (edgeInfo.to) {
          if (edgeInfo.isIntraStage) {
            edgeIds.push(`${nodeId}-${edgeInfo.to.stepIndex}-colored`);
          } else {
            const nextGraph = this.graphs[edgeInfo.to.stageIndex];
            const nextGraphEdgeId = `${START_NODE_ID}-${
              edgeInfo.to.stepIndex
            }-colored`;
            nextGraph.updateEdges([nextGraphEdgeId], outputColorOptions);

            for (
              let arrowIndex = stageIndex;
              arrowIndex < edgeInfo.to.stageIndex;
              arrowIndex++
            ) {
              updatedInterStageArrows[arrowIndex] = "to";
            }

            this.lastMouseMoveInfo.alteredGraphs.add(edgeInfo.to.stageIndex);
            edgeIds.push(`${nodeId}-${END_NODE_ID}-colored`);
          }
        }
        return edgeIds;
      },
      []
    );
    graph.updateEdges(intraStageOutputEdges, outputColorOptions);

    this.graphs.forEach(graph => this.centerEndNodeVertically(graph));
    this.setState({
      hovered: true,
      interStageArrows: updatedInterStageArrows,
    });
  }

  handleNodeBlur = () => {
    const { graphIndex, nodeId, alteredGraphs } = this.lastMouseMoveInfo;
    if (nodeId == null) {
      return;
    }

    const origNodeColor = this.getNodeStatusOptions(
      this.getStepDataAtIndices({
        stageIndex: graphIndex,
        stepIndex: nodeId,
      }).status
    );
    this.graphs[graphIndex].updateNodes([nodeId], origNodeColor);

    alteredGraphs.forEach(i => {
      const graph = this.graphs[i];
      const allColoredEdges = graph.getEdges(edge => {
        return edge.id.match(/-colored$/g);
      });
      graph.updateEdges(allColoredEdges, { hidden: true });
      this.centerEndNodeVertically(graph);
    });
    alteredGraphs.clear();
    this.setState({
      hovered: false,
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

  getStatusGroupFor(stageIndex, stepIndex) {
    const {
      graphData: { stages },
    } = this.props;
    const step = stages[stageIndex].steps[stepIndex];
    return step.status;
  }

  generateNodeData(stageIndex, edgeData) {
    const {
      graphData: { stages },
    } = this.props;
    const stepData = stages[stageIndex].steps;
    const nodeData = stepData.map((step, i) => {
      return {
        id: i,
        label: step.name,
        group: step.status,
      };
    });

    nodeData.push({ id: START_NODE_ID, group: "startEndNodes" });
    nodeData.push({ id: END_NODE_ID, group: "startEndNodes" });

    this.addHierarchicalLevelsToNodes(nodeData, edgeData);
    return nodeData;
  }

  getNodeStatusOptions(status, hovered = false) {
    const {
      notStartedNodeColor,
      inProgressNodeColor,
      finishedNodeColor,
      erroredNodeColor,
    } = this.props;
    let options;
    switch (status) {
      case "notStarted":
        options = notStartedNodeColor;
        break;
      case "inProgress":
        options = inProgressNodeColor;
        break;
      case "finished":
        options = finishedNodeColor;
        break;
      case "errored":
        options = erroredNodeColor;
        break;
    }

    const backgroundColor =
      hovered && options.hovered ? options.hovered : options.default;
    const textColor = options.textColor;
    return {
      color: {
        background: backgroundColor,
        border: backgroundColor,
        highlight: {
          background: backgroundColor,
          border: backgroundColor,
        },
      },
      ...(textColor ? { font: { color: textColor } } : {}),
    };
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
    const {
      graphData: { stages },
    } = this.props;
    const stepData = stages[stageIndex].steps;

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
    const {
      graphData: { stages },
    } = this.props;
    const hiddenEdgeColorOption = {
      color: {
        opacity: 0,
        inherit: false,
      },
    };

    // Connect all nodes to start and end nodes with hidden edges for centering
    return stages[stageIndex].steps
      .map((_, stepIndex) => {
        return [
          {
            from: stepIndex,
            to: END_NODE_ID,
            id: `${stepIndex}-${END_NODE_ID}-hidden`,
            ...hiddenEdgeColorOption,
          },
          {
            from: START_NODE_ID,
            to: stepIndex,
            id: `${START_NODE_ID}-${stepIndex}-hidden`,
            ...hiddenEdgeColorOption,
          },
        ];
      })
      .flat();
  }

  centerEndNodeVertically(graph) {
    // Starting for each graph node is already vertically centered.
    const yStartNodePos = graph.getNodePosition(START_NODE_ID).y;
    const xEndNodePos = graph.getNodePosition(END_NODE_ID).x;
    graph.moveNodeToPosition(END_NODE_ID, xEndNodePos, yStartNodePos);
  }

  closeIfNonActiveStage(stageIndex) {
    const {
      graphData: { stages },
    } = this.props;
    const stageData = stages[stageIndex];
    const graph = this.graphs[stageIndex];
    if (stageData.jobStatus != "STARTED") {
      graph.afterDrawingOnce(() => this.toggleStage(stageIndex));
    }
  }

  drawGraphs() {
    const {
      graphData: { stages },
    } = this.props;

    stages.forEach((_, i) => {
      this.drawStageGraph(i);
    });
  }

  drawStageGraph(index) {
    const { backgroundColor, edgeColor } = this.props;

    const container = this.graphContainers[index];

    const edgeData = this.generateEdgeData(index);
    const nodeData = this.generateNodeData(index, edgeData);

    const options = {
      nodes: {
        borderWidth: 1,
        borderWidthSelected: 1,
        shadow: {
          color: "rgba(0, 0, 0, 0.22)",
          x: 0,
          y: 2,
          size: 8,
        },
        shape: "box",
        shapeProperties: {
          borderRadius: 4,
        },
        margin: {
          left: 6,
          right: 6,
        },
        widthConstraint: {
          minimum: 100,
        },
        heightConstraint: {
          minimum: 24,
        },
        font: {
          face: "Open Sans",
          size: 11,
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
        notStarted: this.getNodeStatusOptions("notStarted"),
        inProgress: this.getNodeStatusOptions("inProgress"),
        finished: this.getNodeStatusOptions("finished"),
        errored: this.getNodeStatusOptions("errored"),
      },
      edges: {
        chosen: false,
        arrows: {
          to: {
            enabled: true,
            type: "arrow",
            scaleFactor: 0.6,
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
          levelSeparation: 150,
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
        hover: false,
        selectConnectedEdges: false,
      },
      onClick: info => this.handleStageClick(index, info),
    };

    const currStageGraph = new NetworkGraph(
      container,
      nodeData,
      edgeData,
      options
    );
    this.graphs.push(currStageGraph);
    currStageGraph.minimizeSizeGivenScale(1.0);
    this.centerEndNodeVertically(currStageGraph);
    this.closeIfNonActiveStage(index);
  }

  handleWindowResize = () => {
    this.graphs.forEach((graph, i) => {
      if (this.state.stagesOpened[i]) {
        graph.minimizeSizeGivenScale(1.0);
        this.centerEndNodeVertically(graph);
      }
    });
  };

  renderStageContainer(stageName, i) {
    const {
      graphData: { stages },
    } = this.props;
    const { stagesOpened, hovered } = this.state;
    const isOpened = stagesOpened[i];

    // Stages without dag_json recorded are not toggleable
    const toggleable = i < stages.length;
    const jobStatus = stages[i].jobStatus;

    const stageContainer = toggleable && (
      <div className={isOpened ? cs.openedStage : cs.hidden}>
        <div className={cs.graphLabel}>
          {stageName}
          <RemoveIcon
            onClick={() => this.toggleStage(i)}
            className={cs.closeIcon}
          />
        </div>
        <div
          className={cx(cs.graph, hovered && cs.hovered)}
          onMouseMove={e => this.handleMouseMove(i, e)}
          ref={ref => {
            this.graphContainers[i] = ref;
          }}
        />
      </div>
    );

    return (
      <div className={cs.stage}>
        <div
          className={cx(
            isOpened && toggleable ? cs.hidden : cs.stageButton,
            cs[jobStatus],
            !toggleable && cs.disabled
          )}
          onClick={() => this.toggleStage(i)}
        >
          <CircleCheckmarkIcon className={cs.statusIcon} />
          {stageName}
        </div>
        {stageContainer}
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
    const {
      zoomMin,
      zoomMax,
      pipelineRun,
      pipelineVersions,
      lastProcessedAt,
      sample,
    } = this.props;
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
      <div className={cs.pipelineVizPage}>
        <PipelineVizHeader
          pipelineRun={pipelineRun}
          pipelineVersions={pipelineVersions}
          lastProcessedAt={lastProcessedAt}
          sample={sample}
        />
        <div className={cs.pipelineVizContainer}>
          <PanZoom
            className={cs.panZoomContainer}
            minZoom={zoomMin}
            maxZoom={zoomMax}
            zoomSpeed={3}
            ref={this.panZoomContainer}
          >
            <div className={cs.pipelineViz}>{stageContainers}</div>
          </PanZoom>
          <PlusMinusControl
            onPlusClick={((this.panZoomContainer || {}).current || {}).zoomIn}
            onMinusClick={((this.panZoomContainer || {}).current || {}).zoomOut}
            className={cs.plusMinusControl}
          />
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

const nodeColors = PropTypes.shape({
  default: PropTypes.string.isRequired,
  hovered: PropTypes.string,
});

PipelineViz.propTypes = {
  admin: PropTypes.bool,
  graphData: PropTypes.object,
  pipelineRun: PropTypes.PipelineRun,
  sample: PropTypes.Sample,
  pipelineVersions: PropTypes.arrayOf(PropTypes.string),
  lastProcessedAt: PropTypes.string,
  backgroundColor: PropTypes.string,
  notStartedNodeColor: nodeColors,
  inProgressNodeColor: nodeColors,
  finishedNodeColor: nodeColors,
  erroredNodeColor: nodeColors,
  edgeColor: PropTypes.string,
  highlightColor: PropTypes.string,
  inputEdgeColor: PropTypes.string,
  zoomMin: PropTypes.number,
  zoomMax: PropTypes.number,
  minMouseMoveUpdateDistance: PropTypes.number,
};

PipelineViz.defaultProps = {
  admin: false,
  backgroundColor: "#f8f8f8",
  notStartedNodeColor: { default: "#ffffff", textColor: "#666666" },
  inProgressNodeColor: { default: "#eff2fc", hovered: "#5887fa" },
  finishedNodeColor: { default: "#e6f7ed" },
  erroredNodeColor: { default: "#f9ebeb" },
  edgeColor: "#999999",
  highlightColor: "#3867fa",
  inputEdgeColor: "#000000",
  zoomMin: 0.5,
  zoomMax: 3,
  minMouseMoveUpdateDistance: 20,
};

export default PipelineViz;
