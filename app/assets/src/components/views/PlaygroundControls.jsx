import CompareButton from "../controls/CompareButton";
import DownloadButton from "../controls/DownloadButton";
import Dropdown from "../controls/Dropdown";
import ButtonDropdown from "../controls/ButtonDropdown";
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
      { text: "Option 1", value: "1" },
      { text: "option 2", value: "2" },
      { text: "Option 3", value: "3" }
    ];
    this.dropdownOptionsBySection = {
      Options: [
        { text: "option 1", value: "1" },
        { text: "option 2", value: "2" },
        { text: "option 3", value: "3" }
      ],
      Abc: [
        { text: "a", value: "val_a" },
        { text: "b", value: "val_b" },
        { text: "c", value: "val_c" }
      ]
    };
  }

  render() {
    return (
      <div className="playground">
        <ComponentCard
          title="Primary Button"
          width={3}
          components={[
            <PrimaryButton
              key={0}
              text="Submit"
              onClick={() => console.log("PrimaryButton:Click")}
            />,
            <PrimaryButton
              key={1}
              text="Submit"
              disabled
              onClick={() => console.log("PrimaryButton:Click")}
            />
          ]}
        />
        <ComponentCard
          title="Secondary Button"
          width={3}
          components={[
            <SecondaryButton
              key={0}
              text="Submit"
              onClick={() => console.log("SecondaryButton:Click")}
            />,
            <SecondaryButton
              key={1}
              text="Submit"
              disabled
              onClick={() => console.log("SecondaryButton:Click")}
            />
          ]}
        />
        <ComponentCard
          title="Icon Button"
          width={3}
          components={[
            <CompareButton
              key={0}
              onClick={() => console.log("CompareButton:Click")}
            />,
            <CompareButton
              key={1}
              disabled
              onClick={() =>
                console.error("CompareButton:Click: should not show up!")
              }
            />
          ]}
        />
        <ComponentCard
          title="Button Dropdown"
          width={3}
          components={[
            <ButtonDropdown
              primary
              key={0}
              fluid
              options={this.dropdownOptions}
              text="Download"
              onClick={option => console.log("DropdownButton:Clicked", option)}
            />,
            <ButtonDropdown
              primary
              key={1}
              fluid
              disabled
              options={this.dropdownOptions}
              text="Download"
              onClick={option => console.log("DropdownButton:Change", option)}
            />
          ]}
        />
        <ComponentCard
          title="Download Dropdown"
          width={3}
          components={[
            <DownloadButton
              key={0}
              fluid
              options={this.dropdownOptions}
              text="Download"
              onClick={option => console.log("DropdownButton:Clicked", option)}
            />,
            <DownloadButton
              key={1}
              fluid
              disabled
              options={this.dropdownOptions}
              text="Download"
              onClick={option => console.log("DropdownButton:Clicked", option)}
            />
          ]}
        />
        <ComponentCard
          title="Threshold Filter Dropdown"
          width={5}
          components={[
            <ThresholdFilterDropdown
              key={0}
              options={this.thresholdOptions}
              onApply={vars => {
                console.log("ThresholdFilterDropdown:Apply", vars);
              }}
            />,
            <ThresholdFilterDropdown
              key={1}
              options={this.thresholdOptions}
              disabled
              onApply={vars => {
                console.log("ThresholdFilterDropdown:Apply", vars);
              }}
            />
          ]}
        />
        <ComponentCard
          title="Dropdown"
          width={4}
          components={[
            <Dropdown
              key={0}
              fluid
              options={this.dropdownOptions}
              label="Option: "
              onChange={() => console.log("Dropdown:Change")}
            />,
            <Dropdown
              key={1}
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
          width={4}
          components={[
            <MultipleDropdown
              key={0}
              fluid
              options={this.dropdownOptions}
              label="Options: "
              onChange={() => console.log("MultipleDropdown:Change")}
            />,
            <MultipleDropdown
              key={1}
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
          width={4}
          components={[
            <Slider
              key={0}
              options={this.dropdownOptions}
              label="Slider: "
              onChange={() => console.log("Slider:Change")}
              onAfterChange={() => console.log("Slider:onAfterChange")}
              min={0}
              max={100}
              value={20}
            />,
            <Slider
              key={1}
              disabled
              options={this.dropdownOptions}
              label="Slider: "
              onChange={() => console.log("Slider:Change")}
              onAfterChange={() => console.log("Slider:onAfterChange")}
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
      style={{ gridColumn: `auto / span ${width}` }}
    >
      <div className="title">{title}</div>
      {components.map((component, idx) => (
        <div key={idx} className="component">
          {component}
        </div>
      ))}
    </div>
  );
};

export default PlaygroundControls;
