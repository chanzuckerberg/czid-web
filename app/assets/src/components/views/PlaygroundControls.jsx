import { Grid } from "semantic-ui-react";
import Dropdown from "../controls/Dropdown";
import MultipleDropdown from "../controls/MultipleDropdown";
import ThresholdFilterDropdown from "../controls/ThresholdFilterDropdown";
import PrimaryButton from "../controls/PrimaryButton";
import React from "react";
import SecondaryButton from "../controls/SecondaryButton";
import Slider from "../controls/Slider";

class PlaygroundControls extends React.Component {
  constructor(props) {
    super(props);
    this.thresholdOptions = this.props.thresholdFilters;
    this.dropdownOptions = [
      { text: "option 1", value: "1" },
      { text: "option 2", value: "2" },
      { text: "option 3", value: "3" }
    ];
  }

  render() {
    return (
      <div className="playground">
        <ComponentCard
          title="Threshold Filter Dropdown"
          width={350}
          components={[
            <ThresholdFilterDropdown
              options={this.thresholdOptions}
              onApply={vars => {
                console.log("ThresholdFilterDropdown:Apply", vars);
              }}
            />,
            <ThresholdFilterDropdown
              options={this.thresholdOptions}
              disabled
              onApply={vars => {
                console.log("ThresholdFilterDropdown:Apply", vars);
              }}
            />
          ]}
        />
        <ComponentCard
          title="Threshold Filter Dropdown"
          components={[
            <PrimaryButton
              text="Submit"
              onClick={() => console.log("PrimaryButton:Click")}
            />,
            <PrimaryButton
              text="Submit"
              disabled
              onClick={() => console.log("PrimaryButton:Click")}
            />
          ]}
        />
        <ComponentCard
          title="Secondary Button"
          components={[
            <SecondaryButton
              text="Submit"
              onClick={() => console.log("SecondaryButton:Click")}
            />,
            <SecondaryButton
              text="Submit"
              disabled
              onClick={() => console.log("SecondaryButton:Click")}
            />
          ]}
        />
        <ComponentCard
          title="Dropdown"
          width={200}
          components={[
            <Dropdown
              fluid
              options={this.dropdownOptions}
              label="Option: "
              onChange={() => console.log("Dropdown:Change")}
            />,
            <Dropdown
              fluid
              disabled
              options={this.dropdownOptions}
              label="Option: "
              onChange={() => console.log("Dropdown:Change")}
            />
          ]}
        />
        <ComponentCard
          title="Multiple Option Dropdown"
          width={200}
          components={[
            <MultipleDropdown
              fluid
              options={this.dropdownOptions}
              label="Options: "
              onChange={() => console.log("MultipleDropdown:Change")}
            />,
            <MultipleDropdown
              fluid
              disabled
              options={this.dropdownOptions}
              label="Options: "
              onChange={() => console.log("MultipleDropdown:Change")}
            />
          ]}
        />
        <ComponentCard
          title="Slider"
          width={200}
          components={[
            <Slider
              options={this.dropdownOptions}
              label="Slider: "
              onChange={() => console.log("Slider:Change")}
              onAfterChange={() => console.log("Slider:onAfterChange")}
              min={0}
              max={100}
              value={20}
            />,
            <Slider
              disabled
              options={this.dropdownOptions}
              label="Slider: "
              onChange={() => console.log("Slider:Change")}
              onChange={() => console.log("Slider:onAfterChange")}
              min={0}
              max={100}
              value={20}
            />
          ]}
        />
      </div>
    );
  }
}

const ComponentCard = ({ title, components, width }) => {
  return (
    <div
      className="component-card"
      style={{ width: width, padding: 10, float: "left" }}
    >
      <div
        className="title"
        style={{ padding: 10, textAlign: "center", whiteSpace: "nowrap" }}
      >
        {title}
      </div>
      {components.map((component, idx) => (
        <div key={idx} className="component" style={{ padding: 10 }}>
          {component}
        </div>
      ))}
    </div>
  );
};

export default PlaygroundControls;
