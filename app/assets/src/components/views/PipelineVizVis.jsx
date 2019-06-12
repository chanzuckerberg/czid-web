import React from "react";
import { DataSet, Network } from "vis";
import { forEach } from "lodash";
import PropTypes from "prop-types";

import cs from "./pipeline_viz.scss";

class PipelineVizVis extends React.Component {
  constructor(props) {
    super(props);
    this.stageResults = this.props.stageResults;
    this.stageNames = [
      "Host Filtering",
      "GSNAPL/RAPSEARCH alignment",
      "Post Processing",
      "Experimental"
    ];

    this.state = {
      stage0Opened: true,
      stage1Opened: true,
      stage2Opened: true,
      stage3Opened: true
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

    const outTargetToStepId = {};
    stageData.steps.forEach((step, i) => {
      // Populate nodeData
      nodeData.push({ id: i, label: step.class });

      // Populate intermediatary outFileToStepId for edges
      if (!(step.out in outTargetToStepId)) {
        outTargetToStepId[step.out] = i;
      }
    });

    stageData.steps.forEach((step, i) => {
      step.in.forEach(inTarget => {
        if (inTarget in outTargetToStepId) {
          edgeData.push({ from: outTargetToStepId[inTarget], to: i });
        }
      });
    });

    const data = {
      nodes: new DataSet(nodeData),
      edges: new DataSet(edgeData)
    };
    const options = {
      nodes: {
        borderWidth: 0,
        color: "#EAEAEA",
        shape: "box",
        shapeProperties: {
          borderRadius: 6
        },
        widthConstraint: {
          minimum: 120
        },
        heightConstraint: {
          minimum: 24
        },
        font: {
          face: "Open Sans"
        }
      },
      edges: {
        arrows: {
          to: {
            enabled: true,
            type: "arrow",
            scaleFactor: 0.8
          }
        },
        smooth: {
          type: "cubicBezier",
          roundness: 0.8
        },
        color: "#999999"
      },
      layout: {
        hierarchical: {
          direction: "LR",
          sortMethod: "directed",
          levelSeparation: 200,
          parentCentralization: false
        }
      },
      physics: {
        enabled: false
      }
    };

    const network = new Network(container, data, options);
    network.once("afterDrawing", () => this.toggleStage(this.keyName(index)));
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
            <div style={{ display: "flex", justifyContent: "space-between" }}>
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

    return <div className={cs.pipelineViz}>{stageContainers}</div>;
  }
}

PipelineVizVis.propTypes = {
  stageResults: PropTypes.object
};

export default PipelineVizVis;
