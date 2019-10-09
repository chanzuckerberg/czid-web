import React from "react";
import PropTypes from "prop-types";
import { filter, get } from "lodash/fp";
import cx from "classnames";

import Dropdown from "~ui/controls/dropdowns/Dropdown";
import LoadingIcon from "~ui/icons/LoadingIcon";
import RadioButton from "~ui/controls/RadioButton";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";

import cs from "./choose_step.scss";

class ChooseStep extends React.Component {
  renderOption = (downloadType, option) => {
    const { selectedOptions, onOptionSelect } = this.props;
    const selectedOption = get(
      [downloadType.type, option.type],
      selectedOptions
    );
    let dropdownOptions;

    switch (option.type) {
      case "file_format":
        dropdownOptions = option.options.map(option => ({
          text: option,
          value: option,
        }));

        return (
          <div className={cs.option}>
            <div className={cs.label}>File Format:</div>
            <Dropdown
              fluid
              options={dropdownOptions}
              onChange={value =>
                onOptionSelect(downloadType.type, option.type, value)
              }
              value={selectedOption}
            />
          </div>
        );
      default:
        return null;
    }
  };

  renderDownloadType = downloadType => {
    const { selectedDownloadType, onSelect } = this.props;
    const selected = selectedDownloadType === downloadType.type;
    return (
      <div
        className={cx(cs.downloadType, selected && cs.selected)}
        key={downloadType.type}
        onClick={() => onSelect(downloadType.type)}
      >
        <RadioButton className={cs.radioButton} selected={selected} />
        <div className={cs.content}>
          <div className={cs.name}>{downloadType.display_name}</div>
          <div className={cs.description}>{downloadType.description}</div>
          <div className={cs.options}>
            {selected &&
              downloadType.options &&
              downloadType.options.map(option =>
                this.renderOption(downloadType, option)
              )}
          </div>
        </div>
      </div>
    );
  };

  renderDownloadTypes = () => {
    const { downloadTypes } = this.props;

    if (!downloadTypes) {
      return (
        <div className={cs.loadingMessage}>
          <LoadingIcon className={cs.loadingIcon} />Loading download types...
        </div>
      );
    }

    const reportTypes = filter(["category", "report"], downloadTypes);
    const rawTypes = filter(["category", "raw"], downloadTypes);

    return (
      <React.Fragment>
        <div className={cs.category}>
          <div className={cs.title}>Reports</div>
          {reportTypes.map(this.renderDownloadType)}
        </div>
        <div className={cs.category}>
          <div className={cs.title}>Raw Data</div>
          {rawTypes.map(this.renderDownloadType)}
        </div>
      </React.Fragment>
    );
  };

  render() {
    return (
      <div className={cs.chooseStep}>
        <div className={cs.header}>
          <div className={cs.title}>Choose a Download</div>
          <div className={cs.tagline}>Learn More</div>
        </div>
        <div className={cs.downloadTypeContainer}>
          {this.renderDownloadTypes()}
        </div>
        <div className={cs.footer}>
          <PrimaryButton disabled text="Continue" />
          <div className={cs.downloadDisclaimer}>
            Downloads for larger files can take multiple hours to generate.
          </div>
        </div>
      </div>
    );
  }
}

ChooseStep.propTypes = {
  downloadTypes: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      display_name: PropTypes.string,
      description: PropTypes.string,
      category: PropTypes.string,
    })
  ).isRequired,
  selectedDownloadType: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  selectedOptions: PropTypes.objectOf(PropTypes.objectOf(PropTypes.string)),
  onOptionSelect: PropTypes.func.isRequired,
};

export default ChooseStep;
