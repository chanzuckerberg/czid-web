import PropTypes from "prop-types";
import React from "react";

import DownloadButton from "~ui/controls/buttons/DownloadButton";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import ButtonDropdown from "~ui/controls/dropdowns/ButtonDropdown";
import BetaLabel from "~ui/labels/BetaLabel";
import DownloadButtonDropdown from "~ui/controls/dropdowns/DownloadButtonDropdown";
import MultipleDropdown from "~ui/controls/dropdowns/MultipleDropdown";
import ThresholdFilterDropdown from "~ui/controls/dropdowns/ThresholdFilterDropdown";
import PrimaryButton from "~ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";
import Slider from "~ui/controls/Slider";
import Checkbox from "~ui/controls/Checkbox";
import MultipleNestedDropdown from "~ui/controls/dropdowns/MultipleNestedDropdown";
import Toggle from "~ui/controls/Toggle";

class PlaygroundControls extends React.Component {
  constructor(props) {
    super(props);
    this.thresholdOptions = this.props.thresholdFilters;
    this.dropdownOptions = [
      { text: "Option 1", value: 0 },
      {
        text: "Option 2",
        value: 1,
        suboptions: [
          { text: "suboption a", value: "a" },
          { text: "suboption b", value: "b" },
        ],
      },
      { text: "Option 3", value: 2 },
    ];

    this.state = {
      event: "",
    };
  }

  render() {
    return (
      <div className="playground">
        <div className="playground-grid">
          <ComponentCard title="Primary Button" width={3}>
            <PrimaryButton
              key={0}
              text="Submit"
              onClick={() => this.setState({ event: "PrimaryButton:Click" })}
            />
            <PrimaryButton
              key={1}
              text="Submit"
              disabled
              onClick={() => this.setState({ event: "PrimaryButton:Click" })}
            />
            <PrimaryButton
              key={1}
              label={<BetaLabel />}
              text="Submit"
              onClick={() => this.setState({ event: "PrimaryButton:Click" })}
            />
          </ComponentCard>
          <ComponentCard title="Secondary Button" width={3}>
            <SecondaryButton
              key={0}
              text="Submit"
              onClick={() => this.setState({ event: "SecondaryButton:Click" })}
            />
            <SecondaryButton
              key={1}
              text="Submit"
              disabled
              onClick={() => this.setState({ event: "SecondaryButton:Click" })}
            />
          </ComponentCard>
          <ComponentCard title="Button Dropdown" width={3}>
            <ButtonDropdown
              primary
              key={0}
              fluid
              options={this.dropdownOptions}
              text="Download"
              onClick={option =>
                this.setState({ event: "DropdownButton:Clicked", option })
              }
            />
            <ButtonDropdown
              primary
              key={1}
              fluid
              disabled
              options={this.dropdownOptions}
              text="Download"
              onClick={option =>
                this.setState({ event: "DropdownButton:Change", option })
              }
            />
          </ComponentCard>
          <ComponentCard title="Secondary Button Dropdown" width={3}>
            <ButtonDropdown
              secondary
              key={0}
              fluid
              options={this.dropdownOptions}
              text="Download"
              onClick={option =>
                this.setState({ event: "DropdownButton:Clicked", option })
              }
            />
            <ButtonDropdown
              secondary
              key={1}
              fluid
              disabled
              options={this.dropdownOptions}
              text="Download"
              onClick={option =>
                this.setState({ event: "DropdownButton:Change", option })
              }
            />
          </ComponentCard>
          <ComponentCard title="Download Button" width={3}>
            <DownloadButton
              key={0}
              text="Download"
              onClick={option =>
                this.setState({ event: "DropdownButton:Clicked", option })
              }
            />
            <DownloadButton
              key={1}
              disabled
              text="Download"
              onClick={option =>
                this.setState({ event: "DropdownButton:Clicked", option })
              }
            />
          </ComponentCard>
          <ComponentCard title="Download Dropdown Button" width={4}>
            <DownloadButtonDropdown
              key={0}
              options={this.dropdownOptions}
              onClick={option =>
                this.setState({ event: "DropdownButton:Clicked", option })
              }
            />
            <DownloadButtonDropdown
              key={1}
              disabled
              options={this.dropdownOptions}
              onClick={option =>
                this.setState({ event: "DropdownButton:Clicked", option })
              }
            />
          </ComponentCard>
          <ComponentCard title="Threshold Filter Dropdown" width={5}>
            <ThresholdFilterDropdown
              key={0}
              options={this.thresholdOptions}
              onApply={vars => {
                this.setState({
                  event: "ThresholdFilterDropdown:Apply",
                  vars,
                });
              }}
            />
            <ThresholdFilterDropdown
              key={1}
              options={this.thresholdOptions}
              disabled
              onApply={vars => {
                this.setState({
                  event: "ThresholdFilterDropdown:Apply",
                  vars,
                });
              }}
            />
          </ComponentCard>
          <ComponentCard title="Dropdown" width={4}>
            <Dropdown
              key={0}
              fluid
              rounded
              options={this.dropdownOptions}
              label="Option"
              onChange={() => this.setState({ event: "Dropdown:Change" })}
            />
            <Dropdown
              key={1}
              fluid
              disabled
              rounded
              options={this.dropdownOptions}
              label="Option"
              onChange={() => this.setState({ event: "Dropdown:Change" })}
            />
          </ComponentCard>
          <ComponentCard title="Multiple Option Dropdown" width={4}>
            <MultipleDropdown
              key={0}
              fluid
              rounded
              search
              options={this.dropdownOptions}
              label="Options"
              onChange={() =>
                this.setState({ event: "MultipleDropdown:Change" })
              }
            />
            <MultipleDropdown
              key={1}
              fluid
              rounded
              disabled
              options={this.dropdownOptions}
              label="Options"
              onChange={() =>
                this.setState({ event: "MultipleDropdown:Change" })
              }
            />
          </ComponentCard>
          <ComponentCard title="Multiple Nested Dropdown" width={4}>
            <MultipleNestedDropdown
              key={0}
              fluid
              rounded
              options={this.dropdownOptions}
              label="Options"
              onChange={(a, b) => {
                this.setState({ event: "MultipleDropdown:Change" });
              }}
            />
          </ComponentCard>
          <ComponentCard title="Slider" width={4}>
            <Slider
              key={0}
              options={this.dropdownOptions}
              label="Slider: "
              onChange={() => this.setState({ event: "Slider:Change" })}
              onAfterChange={() =>
                this.setState({ event: "Slider:onAfterChange" })
              }
              min={0}
              max={100}
              value={20}
            />
            <Slider
              key={1}
              disabled
              options={this.dropdownOptions}
              label="Slider: "
              onChange={() => this.setState({ event: "Slider:Change" })}
              onAfterChange={() =>
                this.setState({ event: "Slider:onAfterChange" })
              }
              min={0}
              max={100}
              value={20}
            />
          </ComponentCard>
          <ComponentCard title="Checkbox" width={4}>
            <Checkbox
              key={0}
              label="Checkbox"
              onChange={() => this.setState({ event: "Checkbox:Change" })}
              value={0}
              checked={true}
            />
            <Checkbox
              key={1}
              label="Checkbox"
              onChange={() => this.setState({ event: "Checkbox:Change" })}
              value={1}
            />
          </ComponentCard>
          <ComponentCard title="Toggle" width={3}>
            <Toggle key={1} onLabel="Yes" offLabel="No" initialChecked={true} />
            <Toggle
              key={2}
              onLabel="Yes"
              offLabel="No"
              initialChecked={false}
            />
          </ComponentCard>
        </div>
        <div className="playground-console">
          <span className="playground-console-label">Last Event:</span>
          {this.state.event || "N/A"}
        </div>
      </div>
    );
  }
}

PlaygroundControls.propTypes = {
  thresholdFilters: PropTypes.object,
};

const ComponentCard = ({ title, width, children }) => {
  return (
    <div
      className="component-card"
      style={{ gridColumn: `auto / span ${width}` }}
    >
      <div className="title">{title}</div>
      {React.Children.map(children, (component, idx) => (
        <div key={idx} className="component">
          {component}
        </div>
      ))}
    </div>
  );
};

ComponentCard.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
  width: PropTypes.number,
};

export default PlaygroundControls;
