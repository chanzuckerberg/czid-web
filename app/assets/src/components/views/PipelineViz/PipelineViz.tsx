import cx from "classnames";
import { diff } from "deep-object-diff";
import { groupBy } from "lodash/fp";
import React from "react";
import { PanZoom } from "react-easy-panzoom";
import { getGraph } from "~/api/pipelineViz";
import DetailsSidebar from "~/components/common/DetailsSidebar/DetailsSidebar";
import PlusMinusControl from "~/components/ui/controls/PlusMinusControl";
import NetworkGraph from "~/components/visualizations/NetworkGraph";
import { getURLParamString, parseUrlParams } from "~/helpers/url";
import Sample from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import { IconArrowPipelineStage, IconCloseSmall } from "~ui/icons";
import { SEQUENCING_TECHNOLOGY_OPTIONS } from "../SampleUploadFlow/constants";
import PipelineVizHeader from "./PipelineVizHeader";
import PipelineVizStatusIcon from "./PipelineVizStatusIcon";
import cs from "./pipeline_viz.scss";
import { inverseTransformDOMCoordinates } from "./utils";

const START_NODE_ID = -1;
const END_NODE_ID = -2;

interface PipelineVizProps {
  showExperimental?: boolean;
  graphData?: { stages: $TSFixMe; edges: $TSFixMe; status: $TSFixMe };
  pipelineRun?: PipelineRun;
  sample?: Sample;
  pipelineVersions?: string[];
  lastProcessedAt?: string;
  backgroundColor?: string;
  notStartedNodeColor?: NodeColors;
  inProgressNodeColor?: NodeColors;
  finishedNodeColor?: NodeColors;
  erroredNodeColor?: NodeColors;
  edgeColor?: string;
  outputEdgeColor?: string;
  inputEdgeColor?: string;
  zoomMin?: number;
  zoomMax?: number;
  zoomSpeed?: number;
  minMouseMoveUpdateDistance?: number;
  xLayoutInterval?: number;
  yLayoutInterval?: number;
  staggerLayoutMultiplier?: number;
  updateInterval?: number;
  pipelineTechnology?:
    | SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA
    | SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;
}

interface PipelineVizState {
  stagesOpened: $TSFixMe[];
  interStageArrows: string[];
  sidebarVisible: boolean;
  sidebarParams: $TSFixMe;
  hovered: boolean;
  graphData: PipelineVizProps["graphData"];
}

class PipelineViz extends React.Component<PipelineVizProps, PipelineVizState> {
  graphContainers: $TSFixMe;
  graphs: $TSFixMe;
  lastMouseMoveInfo: $TSFixMe;
  panZoomContainer: $TSFixMe;
  stageNames: $TSFixMe;
  updateLoop: $TSFixMe;
  constructor(props: PipelineVizProps) {
    super(props);

    const { showExperimental, pipelineTechnology } = props;
    this.stageNames =
      pipelineTechnology === "ONT"
        ? ["ONT mNGS Pipeline"]
        : [
            "Host Filtering",
            "Alignment",
            "Post Processing",
            ...(showExperimental ? ["Experimental"] : []),
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
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        (_: $TSFixMe, i: $TSFixMe) => i < this.props.graphData.stages.length,
      ),
      interStageArrows: ["", "", ""],
      sidebarVisible: false,
      sidebarParams: {},
      hovered: false,
      graphData: props.graphData,
    };
  }

  componentDidMount() {
    const { updateInterval } = this.props;
    this.drawGraphs();
    window.addEventListener("resize", this.handleWindowResize);
    // Only set update loop if the pipeline is still running.
    if (!this.pipelineIsFinished()) {
      this.updateLoop = setInterval(() => this.updateGraphs(), updateInterval);
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowResize);
    clearInterval(this.updateLoop);
  }

  async updateGraphs() {
    const { sample, pipelineRun } = this.props;
    const { graphData } = this.state;

    const oldGraphData = graphData;
    const newGraphData = await getGraph(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      sample.id,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      pipelineRun.version.pipeline,
    );
    this.setState(
      {
        graphData: newGraphData,
      },
      () => this.pipelineIsFinished() && clearInterval(this.updateLoop),
    );
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    const updates = diff(oldGraphData, newGraphData);
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'stages' does not exist on type 'object'.
    if (updates.stages) {
      // @ts-expect-error ts-migrate(2550) FIXME: Property 'entries' does not exist on type 'ObjectC... Remove this comment to see the full error message
      Object.entries(updates.stages).forEach(
        ([stageIndexStr, stageChanges]) => {
          const stageIndex = parseInt(stageIndexStr);

          if (stageIndex < this.graphs.length) {
            // Graph already exists.
            const graph = this.graphs[stageIndex];
            // @ts-expect-error Property 'steps' does not exist on type 'unknown'.
            const steps = stageChanges.steps;
            Object.entries(steps).forEach(([stepIndexStr, stepChanges]) => {
              const stepIndex = parseInt(stepIndexStr);
              // @ts-expect-error Property 'steps' does not exist on type 'unknown'.
              const status = stepChanges.status;
              graph.updateNodes([stepIndex], {
                group: status,
                ...this.getNodeStatusOptions(status),
              });
            });
          } else {
            // A new stage has started and needs to be drawn.
            for (
              let prevStageIndex = 0;
              prevStageIndex < stageIndex;
              prevStageIndex++
            ) {
              const prevGraph = this.graphs[prevStageIndex];
              this.generateEdgeData(prevStageIndex).forEach(
                (edge: $TSFixMe) => {
                  const { id, ...options } = edge;
                  prevGraph.updateEdges([id], options);
                },
              );
            }

            this.drawStageGraph(stageIndex);
          }
        },
      );
    }
  }

  pipelineIsFinished() {
    const {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      graphData: { status },
    } = this.state;
    return ["finished", "userErrored", "pipelineErrored"].includes(status);
  }

  getStepDataAtIndices({ stageIndex, stepIndex }: $TSFixMe) {
    const {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      graphData: { stages },
    } = this.state;
    return stages[stageIndex].steps[stepIndex];
  }

  getEdgeInfoFor(
    stageIndex: $TSFixMe,
    stepIndex: $TSFixMe,
    direction: $TSFixMe,
  ) {
    const {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      graphData: { edges },
    } = this.state;
    const stepData = this.getStepDataAtIndices({
      stageIndex: stageIndex,
      stepIndex: stepIndex,
    });
    switch (direction) {
      case "input":
        return stepData.inputEdges.map((edgeId: $TSFixMe) => edges[edgeId]);
      case "output":
        return stepData.outputEdges.map((edgeId: $TSFixMe) => edges[edgeId]);
      default:
        return stepData.inputEdges
          .concat(stepData.outputEdges)
          .map((edgeId: $TSFixMe) => edges[edgeId]);
    }
  }

  getNodeIdAtCoords(graph: $TSFixMe, xCoord: $TSFixMe, yCoord: $TSFixMe) {
    const { x, y } = inverseTransformDOMCoordinates(
      this.panZoomContainer.current.dragContainer.current,
      xCoord,
      yCoord,
    );
    return graph.getNodeAt(x, y);
  }

  handleStageClick(stageIndex: $TSFixMe, info: $TSFixMe) {
    const { sample, pipelineRun } = this.props;
    const graph = this.graphs[stageIndex];
    const clickedNodeId = this.getNodeIdAtCoords(
      graph,
      info.pointer.DOM.x,
      info.pointer.DOM.y,
    );

    if (clickedNodeId == null) {
      return;
    }

    this.graphs.forEach(
      (graph: $TSFixMe, i: $TSFixMe) => i !== stageIndex && graph.unselectAll(),
    );
    graph.selectNodes([clickedNodeId]);

    const inputEdgesInfo = this.getEdgeInfoFor(
      stageIndex,
      clickedNodeId,
      "input",
    );
    const inputInfo = inputEdgesInfo.map((edgeInfo: $TSFixMe) => {
      const fromStepName = edgeInfo.from
        ? this.getStepDataAtIndices(edgeInfo.from).name
        : "";
      return {
        fromStepName: fromStepName,
        files: edgeInfo.files.map((file: $TSFixMe) => {
          return { fileName: file.displayName, url: file.url };
        }),
      };
    });

    const seenFiles = new Set();
    const outputEdgesInfo = this.getEdgeInfoFor(
      stageIndex,
      clickedNodeId,
      "output",
    );
    const outputInfo = outputEdgesInfo
      .map((edgeInfo: $TSFixMe) => {
        // Remove duplicate output file listings
        return edgeInfo.files.reduce((files: $TSFixMe, fileInfo: $TSFixMe) => {
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
        status: stepInfo.status,
        startTime: stepInfo.startTime,
        endTime: stepInfo.endTime,
        resources: stepInfo.resources,
        sample: sample,
        pipelineRun: pipelineRun,
      },
    });
  }

  shouldUpdateMoveMouse(x: $TSFixMe, y: $TSFixMe) {
    const { minMouseMoveUpdateDistance } = this.props;
    const distance = Math.sqrt(
      Math.pow(x - this.lastMouseMoveInfo.x, 2) +
        Math.pow(y - this.lastMouseMoveInfo.y, 2),
    );
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return distance >= minMouseMoveUpdateDistance;
  }

  handleMouseMove(stageIndex: $TSFixMe, e: $TSFixMe) {
    const graph = this.graphs[stageIndex];
    if (!this.shouldUpdateMoveMouse(e.clientX, e.clientY)) {
      return;
    }

    const rect = e.target.getBoundingClientRect();
    const nodeId = this.getNodeIdAtCoords(
      graph,
      e.clientX - rect.left,
      e.clientY - rect.top,
    );

    if (
      stageIndex !== this.lastMouseMoveInfo.graphIndex ||
      nodeId !== this.lastMouseMoveInfo.nodeId
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

  handleNodeHover(stageIndex: $TSFixMe, nodeId: $TSFixMe) {
    const { inputEdgeColor, outputEdgeColor } = this.props;
    const graph = this.graphs[stageIndex];
    const updatedInterStageArrows = [...this.state.interStageArrows];

    const hoveredNodeColoring = this.getNodeStatusOptions(
      this.getStepDataAtIndices({
        stageIndex: stageIndex,
        stepIndex: nodeId,
      }).status,
      true,
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
    const intraStageInputEdges = inputEdgesInfo.reduce(
      (edgeIds: $TSFixMe, edgeInfo: $TSFixMe) => {
        if (edgeInfo.isIntraStage) {
          edgeIds.push(`${edgeInfo.from.stepIndex}-${nodeId}-colored`);
        } else {
          if (edgeInfo.from) {
            const prevGraph = this.graphs[edgeInfo.from.stageIndex];
            const prevEdgeId = `${edgeInfo.from.stepIndex}-${END_NODE_ID}-colored`;
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
      },
      [],
    );
    graph.updateEdges(intraStageInputEdges, inputColorOptions);

    const outputColorOptions = {
      color: {
        color: outputEdgeColor,
        hover: outputEdgeColor,
        inherit: false,
      },
      width: 2,
      hidden: false,
    };
    const outputEdgesInfo = this.getEdgeInfoFor(stageIndex, nodeId, "output");
    const intraStageOutputEdges = outputEdgesInfo.reduce(
      (edgeIds: $TSFixMe, edgeInfo: $TSFixMe) => {
        if (edgeInfo.to) {
          if (edgeInfo.isIntraStage) {
            edgeIds.push(`${nodeId}-${edgeInfo.to.stepIndex}-colored`);
          } else {
            const nextGraph = this.graphs[edgeInfo.to.stageIndex];
            const nextGraphEdgeId = `${START_NODE_ID}-${edgeInfo.to.stepIndex}-colored`;
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
      [],
    );
    graph.updateEdges(intraStageOutputEdges, outputColorOptions);

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
      }).status,
    );
    this.graphs[graphIndex].updateNodes([nodeId], origNodeColor);

    alteredGraphs.forEach((i: $TSFixMe) => {
      const graph = this.graphs[i];
      const allColoredEdges = graph.getEdges((edge: $TSFixMe) => {
        return edge.id.match(/-colored$/g);
      });
      graph.updateEdges(allColoredEdges, { hidden: true });
    });
    alteredGraphs.clear();
    this.setState({
      hovered: false,
      interStageArrows: ["", "", ""],
    });
  };

  closeSidebar = () => {
    this.graphs.forEach((graph: $TSFixMe) => graph.unselectAll());
    this.setState({
      sidebarVisible: false,
    });
  };

  toggleStage(index: $TSFixMe, updateHistory = true) {
    const updatedStagesOpened = [...this.state.stagesOpened];
    updatedStagesOpened[index] = !updatedStagesOpened[index];
    this.setState({ stagesOpened: updatedStagesOpened });

    updateHistory &&
      history.replaceState(
        updatedStagesOpened,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        null,
        this.urlWithStagesOpenedState(updatedStagesOpened),
      );
  }

  getStatusGroupFor(stageIndex: $TSFixMe, stepIndex: $TSFixMe) {
    const step = this.getStepDataAtIndices({
      stageIndex: stageIndex,
      stepIndex: stepIndex,
    });
    return step.status;
  }

  generateNodeData(stageIndex: $TSFixMe, edgeData: $TSFixMe) {
    const {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      graphData: { stages },
    } = this.state;
    const stepData = stages[stageIndex].steps;
    const nodeData = stepData.map((step: $TSFixMe, i: $TSFixMe) => {
      return {
        id: i,
        label: step.name,
        group: step.status,
      };
    });

    nodeData.push({ id: START_NODE_ID, group: "startEndNodes" });
    nodeData.push({ id: END_NODE_ID, group: "startEndNodes" });

    this.addPositionToNodes(nodeData, edgeData);
    return nodeData;
  }

  getNodeStatusOptions(status: $TSFixMe, hovered = false) {
    const options = this.props[`${status}NodeColor`];
    if (!options) {
      return {};
    }
    const backgroundColor =
      hovered && options.hovered ? options.hovered : options.default;
    const textColor = options.textColor;
    const shadowColor = options.shadowColor;
    return {
      color: {
        background: backgroundColor,
        border: backgroundColor,
        highlight: {
          background: backgroundColor,
          border: backgroundColor,
        },
      },
      ...(textColor
        ? { font: { color: textColor } }
        : { font: { color: cs.defaultNodeText } }),
      ...(shadowColor
        ? {
            shadow: {
              color: shadowColor,
              x: 0,
              y: 2,
              size: 8,
            },
          }
        : {}),
    };
  }

  addPositionToNodes(nodeData: $TSFixMe, edgeData: $TSFixMe) {
    const fromToToEdgeMap = groupBy("from", edgeData);
    const toToFromEdgeMap = groupBy("to", edgeData);

    this.addXCoordinatesToNodes(nodeData, fromToToEdgeMap);
    this.addYCoordinatesToNodes(nodeData, fromToToEdgeMap, toToFromEdgeMap);
  }

  addXCoordinatesToNodes(nodeData: $TSFixMe, fromToToEdgeMap: $TSFixMe) {
    const { xLayoutInterval } = this.props;

    const nodeToCurrentLevel = {};
    nodeData.forEach((node: $TSFixMe) => {
      nodeToCurrentLevel[node.id] = 0;
    });

    const bfs = [START_NODE_ID];
    while (bfs.length) {
      const currentNode = bfs.shift();
      // End node should have no children, so skip.
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      if (currentNode > END_NODE_ID) {
        // Update children and add to back of bfs queue
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
        const newLevel = nodeToCurrentLevel[currentNode] + 1;
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
        fromToToEdgeMap[currentNode].forEach((edge: $TSFixMe) => {
          if (edge.color) {
            const toNodeId = edge.to;
            if (newLevel > nodeToCurrentLevel[toNodeId]) {
              nodeToCurrentLevel[toNodeId] = newLevel;
              if (toNodeId !== END_NODE_ID) {
                nodeToCurrentLevel[END_NODE_ID] = Math.max(
                  nodeToCurrentLevel[END_NODE_ID],
                  newLevel + 1,
                );
              }
            }
            bfs.push(toNodeId);
          }
        });
      }
    }

    // @ts-expect-error ts-migrate(2550) FIXME: Property 'values' does not exist on type 'ObjectCo... Remove this comment to see the full error message
    const maxLevel = Math.max(...Object.values(nodeToCurrentLevel));
    nodeData.forEach((node: $TSFixMe) => {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      node.x = (nodeToCurrentLevel[node.id] - maxLevel / 2.0) * xLayoutInterval;
      node.level = nodeToCurrentLevel[node.id];
    });
  }

  addYCoordinatesToNodes(
    nodeData: $TSFixMe,
    fromToToEdgeMap: $TSFixMe,
    toToFromEdgeMap: $TSFixMe,
  ) {
    const { yLayoutInterval, staggerLayoutMultiplier } = this.props;

    // Because this method groups by the "level" value in the nodes, it must be
    // called after addPositionToNodes, which populates the "level" field
    const nodesByLevel = groupBy("level", nodeData);
    const maxLevel = Object.keys(nodesByLevel).length;

    // Stagger nodes if more than 2 levels (4, if including start and end nodes).
    let applyStaggerNodesMultiplier = maxLevel > 4;
    Object.values(nodesByLevel).forEach((nodes: $TSFixMe) => {
      // Sort by number of inputting and outputting edges
      nodes.sort((n1: $TSFixMe, n2: $TSFixMe) => {
        const n1Val =
          fromToToEdgeMap[n1.id].length + toToFromEdgeMap[n1.id].length;
        const n2Val =
          fromToToEdgeMap[n2.id].length + toToFromEdgeMap[n2.id].length;
        return n2Val - n1Val;
      });

      let direction = nodes.length % 2 ? -1 : 1;
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      let offsetAmount = nodes.length % 2 ? 0 : yLayoutInterval / 2;
      nodes.forEach((node: $TSFixMe) => {
        node.y =
          offsetAmount *
          direction *
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          (applyStaggerNodesMultiplier ? staggerLayoutMultiplier : 1);
        if (direction === -1) {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          offsetAmount += yLayoutInterval;
        }
        direction *= -1;
      });
      applyStaggerNodesMultiplier =
        maxLevel > 4 && !applyStaggerNodesMultiplier;
    });
  }

  generateEdgeData(stageIndex: $TSFixMe) {
    const { edgeColor } = this.props;
    const {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      graphData: { stages },
    } = this.state;
    const stepData = stages[stageIndex].steps;

    const regularColoringEdgeData = stepData
      .map((_: $TSFixMe, currStepIndex: $TSFixMe) => {
        let connectedToEndNode = false;
        const outputEdgeInfo = this.getEdgeInfoFor(
          stageIndex,
          currStepIndex,
          "output",
        );
        const outputEdges = outputEdgeInfo.reduce(
          (edges: $TSFixMe, edgeInfo: $TSFixMe) => {
            if (edgeInfo.isIntraStage) {
              edges.push({
                from: currStepIndex,
                to: edgeInfo.to.stepIndex,
                id: `${currStepIndex}-${edgeInfo.to.stepIndex}`,
                color: edgeColor,
              });
            } else if (!connectedToEndNode && edgeInfo.to) {
              connectedToEndNode = true;
              edges.push({
                from: currStepIndex,
                to: END_NODE_ID,
                id: `${currStepIndex}-${END_NODE_ID}`,
                color: edgeColor,
              });
            }
            return edges;
          },
          [],
        );

        let connectedToStartNode = false;
        const inputEdgeInfo = this.getEdgeInfoFor(
          stageIndex,
          currStepIndex,
          "input",
        );
        const inputEdges = inputEdgeInfo.reduce(
          (edges: $TSFixMe, edgeInfo: $TSFixMe) => {
            if (!edgeInfo.isIntraStage && !connectedToStartNode) {
              connectedToStartNode = true;
              edges.push({
                from: START_NODE_ID,
                to: currStepIndex,
                id: `${START_NODE_ID}-${currStepIndex}`,
                color: edgeColor,
              });
            }
            return edges;
          },
          [],
        );

        return outputEdges.concat(inputEdges);
      })
      .flat();

    const coloringEdgeData = regularColoringEdgeData.map((edge: $TSFixMe) => {
      return Object.assign(
        { ...edge },
        {
          id: `${edge.from}-${edge.to}-colored`,
          hidden: true,
          color: null,
        },
      );
    });

    return regularColoringEdgeData.concat(
      coloringEdgeData,
      this.generateHiddenEdges(stageIndex),
    );
  }

  generateHiddenEdges(stageIndex: $TSFixMe) {
    const {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      graphData: { stages },
    } = this.state;
    const hiddenEdgeColorOption = {
      color: {
        opacity: 0,
        inherit: false,
      },
    };

    // Connect all nodes to start and end nodes with hidden edges for centering
    return stages[stageIndex].steps
      .map((_: $TSFixMe, stepIndex: $TSFixMe) => {
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

  setInitialOpenedStages() {
    const {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      graphData: { stages },
    } = this.state;

    const stagesOpened = history.state || parseUrlParams();
    stages.forEach((stageData: $TSFixMe, stageIndex: $TSFixMe) => {
      const graph = this.graphs[stageIndex];
      const prevOpened = stagesOpened && stagesOpened[stageIndex];
      if (!(prevOpened || stageData.jobStatus === "inProgress") && graph) {
        graph.afterDrawingOnce(() => this.toggleStage(stageIndex, false));
      }
    });

    history.replaceState(
      this.state.stagesOpened,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      null,
      this.urlWithStagesOpenedState(this.state.stagesOpened),
    );
  }

  urlWithStagesOpenedState(stagesOpened: $TSFixMe) {
    const { sample, pipelineRun } = this.props;
    const pipelineVersion =
      pipelineRun && pipelineRun.version && pipelineRun.version.pipeline;
    return `${location.protocol}//${location.host}/samples/${
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      sample.id
    }/pipeline_viz${
      pipelineVersion ? `/${pipelineVersion}` : ""
    }?${getURLParamString(stagesOpened)}`;
  }

  drawGraphs() {
    const {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      graphData: { stages },
    } = this.state;
    stages.forEach((_: $TSFixMe, i: $TSFixMe) => {
      this.drawStageGraph(i);
    });

    this.setInitialOpenedStages();
  }

  drawStageGraph(index: $TSFixMe) {
    const { backgroundColor, edgeColor } = this.props;
    const { stagesOpened } = this.state;

    const container = this.graphContainers[index];

    const edgeData = this.generateEdgeData(index);
    const nodeData = this.generateNodeData(index, edgeData);

    const options = {
      nodes: {
        borderWidth: 1,
        borderWidthSelected: 1,
        shadow: {
          color: cs.nodeShadowColor,
          x: 0,
          y: 2,
          size: 8,
        },
        shape: "box",
        shapeProperties: {
          borderRadius: 4,
        },
        margin: {
          top: 6,
          bottom: 6,
          left: 12,
          right: 12,
        },
        widthConstraint: 75,
        heightConstraint: {
          minimum: 20,
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
        userErrored: this.getNodeStatusOptions("userErrored"),
        pipelineErrored: this.getNodeStatusOptions("pipelineErrored"),
      },
      edges: {
        chosen: false,
        arrows: {
          to: {
            enabled: true,
            type: "arrow",
            scaleFactor: 0.5,
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
      onClick: (info: $TSFixMe) => this.handleStageClick(index, info),
    };

    // Ensure stage is opened when drawing stage graph for accurate positioning.
    if (!stagesOpened[index]) {
      this.toggleStage(index);
    }

    const currStageGraph = new NetworkGraph(
      container,
      nodeData,
      edgeData,
      options,
    );
    this.graphs.push(currStageGraph);
    currStageGraph.minimizeSizeGivenScale(1.0);
  }

  handleWindowResize = () => {
    this.graphs.forEach((graph: $TSFixMe, i: $TSFixMe) => {
      if (this.state.stagesOpened[i]) {
        graph.minimizeSizeGivenScale(1.0);
      }
    });
  };

  renderStageContainer(stageName: $TSFixMe, i: $TSFixMe) {
    const {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      graphData: { stages },
    } = this.state;
    const { stagesOpened, hovered } = this.state;

    // Stages without dag_json recorded are not toggleable
    const toggleable = i < stages.length;
    const isOpened = toggleable && stagesOpened[i];
    const jobStatus = toggleable ? stages[i].jobStatus : "notStarted";

    const stageNameAndIcon = (
      <span className={cs.stageNameAndIcon}>
        <PipelineVizStatusIcon type={jobStatus} />
        <span className={cs.stageName}>{stageName}</span>
      </span>
    );

    const stageContainer = (
      <div className={isOpened ? cs.openedStage : cs.hidden}>
        <div className={cs.graphLabel}>
          {stageNameAndIcon}
          <IconCloseSmall
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
            !toggleable && cs.disabled,
          )}
          onClick={() => this.toggleStage(i)}
        >
          {stageNameAndIcon}
        </div>
        {stageContainer}
      </div>
    );
  }

  renderStageArrow(arrowValue: $TSFixMe) {
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
        <IconArrowPipelineStage className={cx(cs.stageArrowHead, coloring)} />
      </div>
    );
  }

  handleZoom = (isIn: $TSFixMe) => {
    const { zoomSpeed } = this.props;
    return () => {
      if (this.panZoomContainer && this.panZoomContainer.current) {
        isIn
          ? this.panZoomContainer.current.zoomIn(zoomSpeed)
          : this.panZoomContainer.current.zoomOut(zoomSpeed);
      }
    };
  };

  render() {
    const {
      zoomMin,
      zoomMax,
      zoomSpeed,
      pipelineRun,
      pipelineVersions,
      lastProcessedAt,
      sample,
    } = this.props;
    const { sidebarVisible, sidebarParams, interStageArrows } = this.state;

    const stageContainers = this.stageNames.map(
      (stageName: $TSFixMe, i: $TSFixMe) => {
        return (
          <div key={stageName} className={cs.stageAndArrow}>
            {i > 0 && this.renderStageArrow(interStageArrows[i - 1])}
            {this.renderStageContainer(stageName, i)}
          </div>
        );
      },
    );

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
            zoomSpeed={zoomSpeed}
            disableScrollZoom={true}
            ref={this.panZoomContainer}
          >
            <div className={cs.pipelineViz}>{stageContainers}</div>
          </PanZoom>

          <PlusMinusControl
            onPlusClick={() => this.handleZoom(true)}
            onMinusClick={() => this.handleZoom(false)}
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

interface NodeColors {
  default: string;
  hovered?: string;
  textColor?: string;
  shadowColor?: string;
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
PipelineViz.defaultProps = {
  showExperimental: false,
  backgroundColor: cs.offWhite,
  notStartedNodeColor: {
    default: cs.notStartedBg,
    textColor: cs.notStartedText,
    shadowColor: cs.notStartedShadow,
  },
  inProgressNodeColor: {
    default: cs.inProgressBg,
    hovered: cs.inProgressHoverBg,
  },
  finishedNodeColor: { default: cs.finishedBg, hovered: cs.finishedHoverBg },
  pipelineErroredNodeColor: {
    default: cs.pipelineErroredBg,
    hovered: cs.pipelineErroredHoverBg,
  },
  userErroredNodeColor: {
    default: cs.userErroredBg,
    hovered: cs.userErroredHoverBg,
  },
  edgeColor: cs.defaultEdgeColor,
  inputEdgeColor: cs.inputEdgeColor,
  outputEdgeColor: cs.outputEdgeColor,
  zoomMin: 0.5,
  zoomMax: 3,
  zoomSpeed: 3,
  minMouseMoveUpdateDistance: 20,
  xLayoutInterval: 130,
  yLayoutInterval: 84,
  staggerLayoutMultiplier: 1.5,
  updateInterval: 60000,
};

export default PipelineViz;
