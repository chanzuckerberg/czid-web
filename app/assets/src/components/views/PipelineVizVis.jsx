import React from "react";
import { DataSet, Network } from "vis";
import { forEach } from "lodash";
import PropTypes from "prop-types";
import ReactPanZoom from "@ajainarayanan/react-pan-zoom";

import cs from "./pipeline_viz.scss";

const START_NODE_ID = -1;
const END_NODE_ID = -2;

class PipelineVizVis extends React.Component {
  constructor(props) {
    super(props);
    this.stageResults = this.props.stageResults;
    this.stageNames = [
      "Host Filtering",
      "GSNAPL/RAPSEARCH alignment",
      "Post Processing",
      "Experimental",
    ];

    this.stageGraphNetworks = [];
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
    this.renderGraph();
  }

  renderGraph() {
    this.modifyStepNames();
    this.stageNames.forEach((stageName, i) => {
      this.renderStageGraph(
        this.stageResults[stageName],
        this.refs["container" + i],
        i
      );
    });
  }

  renderStageGraph(stageData, container, index) {
    const nodeData = [];
    const edgeData = [];
    const nodeIds = new Set();

    const outTargetToStepId = {};
    stageData.steps.forEach((step, i) => {
      // Populate nodeData
      nodeData.push({ id: i, label: step.class, level: 1 });
      nodeIds.add(i);

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
          nodeIds.delete(fromId);

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
    nodeIds.forEach(id => {
      edgeData.push({ from: id, to: END_NODE_ID });
    });

    const data = {
      nodes: new DataSet(nodeData),
      edges: new DataSet(edgeData),
    };
    const options = {
      nodes: {
        borderWidth: 0,
        color: "#EAEAEA",
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
          widthConstraint: 0,
          heightConstraint: 0,
          color: "#f8f8f8",
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
        color: "#999999",
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

    const network = new Network(container, data, options);

    // Vertically center start and nodes
    network.moveNode(
      START_NODE_ID,
      network.getPositions([START_NODE_ID])[START_NODE_ID].x,
      0
    );
    network.moveNode(
      END_NODE_ID,
      network.getPositions([END_NODE_ID])[END_NODE_ID].x,
      0
    );

    this.adjustStageWidth(network);

    network.once("afterDrawing", () => this.toggleStage(this.keyName(index)));
    this.stageGraphNetworks.push(network);
  }

  adjustStageWidth(network) {
    // Set initial zoom.
    network.moveTo({
      scale: 1,
      position: { x: 1, y: 1 },
      offset: { x: 0, y: 0 },
    });

    // Calculate and set new canvas width
    const startEndPositions = network.getPositions([
      START_NODE_ID,
      END_NODE_ID,
    ]);
    const minX = network.canvasToDOM({
      x: startEndPositions[START_NODE_ID].x,
      y: 0,
    }).x;
    const maxX = network.canvasToDOM({
      x: startEndPositions[END_NODE_ID].x,
      y: 0,
    }).x;
    network.setSize(maxX - minX + "px", "100%");

    // Restore original zoom.
    network.moveTo({
      scale: 1,
      position: { x: 1, y: 1 },
      offset: { x: 0, y: 0 },
    });
  }

  modifyStepNames() {
    // Strips "PipelineStep[Run/Generate]" from front of each step name.
    // Consider adding "name" field to dag_json later.
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

  toggleStage(stageKeyName) {
    const stateChanges = {};
    stateChanges[stageKeyName] = !this.state[stageKeyName];
    this.setState(stateChanges);
  }

  mouseWheelZoom(e) {
    if (e.deltaY > 0) {
      this.setState({ zoom: this.state.zoom - 0.01 });
    } else if (e.deltaY < 0) {
      this.setState({ zoom: this.state.zoom + 0.01 });
    }
  }

  keyName(i) {
    return "stage" + i + "Opened";
  }

  render() {
    const stageContainers = [];

    this.stageNames.forEach((stageName, i) => {
      const keyName = this.keyName(i);
      const isOpened = this.state[keyName];

      stageContainers.push(
        <div key={i} className={cs.stage}>
          <div
            className={isOpened ? cs.hidden : cs.stageButton}
            onClick={() => this.toggleStage(keyName)}
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
                onClick={() => this.toggleStage(keyName)}
                className={cs.closeButton}
              >
                x
              </div>
            </div>
            <div className={cs.graph} ref={"container" + i} />
          </div>
        </div>
      );
    });

    return (
      <div onWheel={e => this.mouseWheelZoom(e)}>
        <ReactPanZoom zoom={this.state.zoom}>
          <div className={cs.pipelineViz}>{stageContainers}</div>
        </ReactPanZoom>
      </div>
    );
  }
}

PipelineVizVis.propTypes = {
  stageResults: PropTypes.object,
};

export default PipelineVizVis;
