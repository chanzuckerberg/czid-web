import React from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { forEach } from "lodash";
import PropTypes from "prop-types";

class PipelineVizCytoscape extends React.Component {
  constructor(props) {
    super(props);
    this.stageResults = this.props.stageResults;
    this.stageNames = [
      "HostFiltering",
      "GSNAPL/RAPSEARCHalignment",
      "PostProcessing",
      "Experimental"
    ];
  }

  componentDidMount() {
    this.renderGraph(this.props);
  }
  // componentWillReceiveProps(nextProps) {
  // }

  renderGraph(props) {
    this.nodes = [];
    this.edges = [];

    this.populateStageNodesAndEdges();
    const nodeData = this.nodes.map(node => {
      return {
        data: {
          id: node.name + node.stage,
          parent: node.stage
        },
        classes: "stepNode"
      };
    });
    const edgeData = this.edges.map(edge => {
      return {
        data: {
          id: edge[0].name + edge[1].name,
          source: edge[0].name + edge[0].stage,
          target: edge[1].name + edge[1].stage
        }
      };
    });

    // Add parent nodes to list of nodes, edges.
    this.stageNames.forEach((stage, i) => {
      nodeData.push({ data: { id: stage }, classes: "stageNode" });
      if (i > 0) {
        edgeData.push({
          data: {
            id: this.stageNames[i - 1] + stage,
            source: this.stageNames[i - 1],
            target: stage
          },
          classes: "stageEdge"
        });
      }
    });

    const elements = {
      nodes: nodeData,
      edges: edgeData
    };

    const styles = [
      {
        selector: ".stepNode",
        style: {
          "background-color": "#EAEAEA",
          shape: "roundrectangle",
          width: "120px",
          height: "label",
          label: "data(id)",
          "text-halign": "center",
          "text-valign": "center",
          padding: "12px",
          "text-wrap": "ellipsis",
          "text-max-width": "110px"
        }
      },
      {
        selector: ".stageNode",
        style: {
          shape: "roundrectangle",
          "border-width": 0,
          label: "data(id)",
          "text-halign": "left",
          "text-valign": "top",
          "text-margin-x": "100%",
          padding: "36px",
          "background-color": "#F8F8F8"
        }
      },
      {
        selector: ".stageNode.collapsed",
        style: {
          "text-halign": "center",
          "text-valign": "center",
          "min-width": "200px",
          "text-max-width": "160px",
          "text-margin-x": "0",
          "text-margin-y": "0",
          "background-color": "#CCCCCC",
          padding: "12px"
        }
      },
      {
        selector: ".collapsed > .stepNode",
        style: {
          display: "none"
        }
      },
      {
        selector: "edge",
        style: {
          "target-arrow-shape": "triangle",
          "target-arrow-fill": "filled",
          "target-arrow-color": "#999999",
          "line-color": "#999999",
          "curve-style": "bezier"
        }
      },
      {
        selector: ".stageEdge",
        style: {
          "line-color": "#333333",
          "target-arrow-color": "#333333"
        }
      }
    ];

    const layout = {
      name: "dagre",
      rankDir: "LR",
      nodeDimensionsIncludeLabels: true
    };

    cytoscape.use(dagre);

    this.cy = cytoscape({
      container: this.container,
      elements: elements,
      style: styles,
      layout: layout
    });

    this.manageCollapsing();
  }

  manageCollapsing() {
    this.stageNames.forEach(stage => {
      this.cy.nodes("[id='" + stage + "']").on("click", function(e) {
        e.target.toggleClass("collapsed");
      });
    });
  }

  populateStageNodesAndEdges() {
    this.modifyStepNames();
    const inputToStep = {};
    const seenSteps = new Set();
    forEach(this.stageResults, (stageData, stageName) => {
      stageData.steps.forEach(step => {
        const currNode = {
          name: step.class,
          stage: stageName.split(" ").join("")
        };
        // Add step to array of nodes
        if (!seenSteps.has(currNode.name + currNode.stage)) {
          this.nodes.push(currNode);
          seenSteps.add(currNode.name + currNode.stage);
        }
        // Add to mapping of inputFile: [stepNames]
        step.in.forEach(input => {
          stageData.targets[input].forEach(inputFile => {
            if (!(inputFile in inputToStep)) {
              inputToStep[inputFile] = [];
            }
            inputToStep[inputFile].push(currNode);
          });
        });
      });
    });

    // Create edges from mapping inputFile: [stepNames]
    forEach(this.stageResults, (stageData, stageName) => {
      stageData.steps.forEach(sourceStep => {
        const currNode = {
          name: sourceStep.class,
          stage: stageName.split(" ").join("")
        };
        stageData.targets[sourceStep.out].forEach(outFile => {
          if (inputToStep[outFile]) {
            inputToStep[outFile].forEach(targetNode => {
              // Only include edges within the same stage.
              if (targetNode.stage == currNode.stage) {
                this.edges.push([currNode, targetNode]);
              }
            });
          }
        });
      });
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

  render() {
    return (
      <div
        className="pipelineViz"
        style={{ height: "100vh" }}
        ref={container => {
          this.container = container;
        }}
      />
    );
  }
}

PipelineVizCytoscape.propTypes = {
  stageResults: PropTypes.object
};

export default PipelineVizCytoscape;
