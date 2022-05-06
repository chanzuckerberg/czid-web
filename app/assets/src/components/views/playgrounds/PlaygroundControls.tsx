import React from "react";

import Checkbox from "~ui/controls/Checkbox";
import Slider from "~ui/controls/Slider";
import Toggle from "~ui/controls/Toggle";
import DownloadButton from "~ui/controls/buttons/DownloadButton";
import PrimaryButton from "~ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import ButtonDropdown from "~ui/controls/dropdowns/ButtonDropdown";
import DownloadButtonDropdown from "~ui/controls/dropdowns/DownloadButtonDropdown";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import MultipleDropdown from "~ui/controls/dropdowns/MultipleDropdown";
import MultipleNestedDropdown from "~ui/controls/dropdowns/MultipleNestedDropdown";
import ThresholdFilterDropdown from "~ui/controls/dropdowns/ThresholdFilterDropdown";
import BetaLabel from "~ui/labels/BetaLabel";

interface ComponentCardProps {
  children: React.ReactNode;
  title: string;
  width: number;
}

interface DropdownOption {
  text: string;
  value: string | number;
  suboptions?: DropdownOption[];
}

interface ThresholdOptions {
  targets: {
    text: string;
    value: string;
  }[];
}

interface PlaygroundControlsProps {
  thresholdFilters: ThresholdOptions;
}

interface PlaygroundControlsState {
  event: $TSFixMe;
  option?: $TSFixMe;
  vars?: $TSFixMe;
}

class PlaygroundControls extends React.Component<
  PlaygroundControlsProps,
  PlaygroundControlsState
> {
  dropdownOptions: DropdownOption[];
  thresholdOptions: ThresholdOptions;

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
              arrowInsideTrigger={false}
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
              onChange={() => {
                this.setState({ event: "MultipleDropdown:Change" });
              }}
            />
          </ComponentCard>
          <ComponentCard title="Bare Dropdown" width={4}>
            <BareDropdown
              key={0}
              trigger={<div>click me</div>}
              items={this.dropdownOptions.map((_, i) => (
                <BareDropdown.Item key={`option_${i}`} text={`option ${i}`} />
              ))}
              direction="left"
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

const ComponentCard = ({ title, width, children }: ComponentCardProps) => {
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

export default PlaygroundControls;
