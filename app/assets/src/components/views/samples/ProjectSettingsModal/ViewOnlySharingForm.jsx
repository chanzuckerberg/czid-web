import React from "react";
import cx from "classnames";

import HelpIcon from "~ui/containers/HelpIcon";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";
import Checkbox from "~ui/controls/Checkbox";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import Toggle from "~ui/controls/Toggle";
import { Input } from "~ui/controls";

import cs from "./view_only_sharing_form.scss";

class ViewOnlySharingForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sharingEnabled: false,
    };
    this.dropdownOptions = [
      { text: "NID Human CSF v3", value: "0" },
      { text: "Background Model 1", value: "1" },
      { text: "Background Model 2", value: "2" },
    ];
  }

  handleSharingStatusChange = () => {
    const { sharingEnabled } = this.state;
    this.setState({ sharingEnabled: !sharingEnabled });
  };

  render() {
    const { sharingEnabled } = this.state;
    return (
      <div className={cs.viewOnlySharingForm}>
        <div className={cs.viewOnlySharingHeader}>
          <div className={cs.headerText}>
            <div className={cs.title}>View-Only Sharing</div>
            <div className={cs.note}>
              Anyone with a link to your project will be able to see a View-Only
              version, including logged out users.
            </div>
          </div>
          <Toggle
            className={cs.toggle}
            onLabel="On"
            offLabel="Off"
            initialChecked={sharingEnabled}
            onChange={this.handleSharingStatusChange}
          />
        </div>
        {sharingEnabled && (
          <div className={cx(cs.viewOnlySharingBody, cs.background)}>
            <div className={cs.label}>Details for View-Only</div>
            <div className={cs.note}>
              123 Samples run on pipeline version 3.18 or 4.0
            </div>
            <div className={cs.settingsForm}>
              <div className={cs.settingsFormDropdown}>
                <div className={cs.backgroundModelLabel}>
                  <span>Background Model</span>
                  <HelpIcon
                    text={
                      "For View-Only Sharing, you can add a default background model or one created with samples you uploaded."
                    }
                    className={cs.helpIcon}
                  />
                </div>
                <Dropdown
                  fluid
                  className={cs.dropdown}
                  placeholder="NID Human CSF v3"
                  options={this.dropdownOptions}
                  onChange={() => console.log("background model")}
                />
              </div>
              <div className={cs.settingsFormCheckbox}>
                <Checkbox
                  checked={false}
                  onChange={() => console.log("pipeline versioning")}
                />
                <div className={cs.checkboxLabel}>
                  <span className={cs.highlight}>Pipeline Versioning: </span>
                  Automatically update samples if they’re rerun on future
                  pipeline versions.
                </div>
              </div>
              <div className={cs.settingsFormCheckbox}>
                <Checkbox
                  checked={false}
                  onChange={() => console.log("update sample list")}
                />
                <div className={cs.checkboxLabel}>
                  <span className={cs.highlight}>Update Sample List: </span>
                  Automatically update samples list if samples are added to the
                  project.
                </div>
              </div>
            </div>
            <div className={cs.shareableLink}>
              <div className={cs.shareableLinkField}>
                <Input
                  className={cs.input}
                  fluid
                  type="text"
                  id="shareableLink"
                  value={"https://idseq.net/R6Y103D5MSX#/425025826"}
                />
              </div>
              <div className={cs.shareableLinkField}>
                <SecondaryButton
                  className={cs.button}
                  text="Copy"
                  rounded={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

ViewOnlySharingForm.propTypes = {};

export default ViewOnlySharingForm;
