import React from "react";
import PropTypes from "~/components/utils/propTypes";
import { find, filter, get, some, map, isUndefined } from "lodash/fp";
import cx from "classnames";

import Dropdown from "~ui/controls/dropdowns/Dropdown";
import LoadingMessage from "~/components/common/LoadingMessage";
import RadioButton from "~ui/controls/RadioButton";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";

import cs from "./choose_step.scss";

class ChooseStep extends React.Component {
  isDownloadValid = () => {
    const {
      selectedDownloadTypeName,
      downloadTypes,
      selectedFields,
    } = this.props;

    if (!selectedDownloadTypeName) {
      return false;
    }

    const downloadType = find(
      ["type", selectedDownloadTypeName],
      downloadTypes
    );

    if (!downloadType) {
      return false;
    }

    if (downloadType.fields) {
      if (
        some(
          Boolean,
          map(
            field =>
              isUndefined(get([downloadType.type, field.type], selectedFields)),
            downloadType.fields
          )
        )
      ) {
        return false;
      }
    }

    return true;
  };

  renderOption = (downloadType, field) => {
    const { selectedFields, onFieldSelect, fieldOptions } = this.props;
    const selectedField = get([downloadType.type, field.type], selectedFields);
    let dropdownOptions = [];
    let loadingOptions = false;

    switch (field.type) {
      case "file_format":
        dropdownOptions = field.options.map(option => ({
          text: option,
          value: option,
        }));

        return (
          <div className={cs.field} key={field.type}>
            <div className={cs.label}>{field.display_name}:</div>
            <Dropdown
              fluid
              options={dropdownOptions}
              onChange={(value, displayName) =>
                onFieldSelect(downloadType.type, field.type, value, displayName)
              }
              value={selectedField}
            />
          </div>
        );
      case "taxon":
        // TODO(mark): Implement more sophisticated taxon dropdown. This is a placeholder for now.
        dropdownOptions = [
          {
            text: "All Taxon",
            value: "all",
          },
        ];

        return (
          <div className={cs.field} key={field.type}>
            <div className={cs.label}>{field.display_name}:</div>
            <Dropdown
              fluid
              options={dropdownOptions}
              onChange={(value, displayName) =>
                onFieldSelect(downloadType.type, field.type, value, displayName)
              }
              value={selectedField}
            />
          </div>
        );
      // TODO(mark): Consolidate this with the above fields once the set of fields is stable.
      case "background":
        if (fieldOptions.backgrounds) {
          dropdownOptions = fieldOptions.backgrounds.map(background => ({
            text: background.name,
            value: background.id,
          }));
        } else {
          loadingOptions = true;
        }

        return (
          <div className={cs.field} key={field.type}>
            <div className={cs.label}>{field.display_name}:</div>
            <Dropdown
              fluid
              disabled={loadingOptions}
              placeholder={loadingOptions && "Loading..."}
              options={dropdownOptions || []}
              onChange={(value, displayName) =>
                onFieldSelect(downloadType.type, field.type, value, displayName)
              }
              value={selectedField}
            />
          </div>
        );
      default:
        return null;
    }
  };

  renderDownloadType = downloadType => {
    const { selectedDownloadTypeName, onSelect } = this.props;
    const selected = selectedDownloadTypeName === downloadType.type;
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
          {downloadType.fields &&
            selected && (
              <div className={cs.fields}>
                {downloadType.fields.map(field =>
                  this.renderOption(downloadType, field)
                )}
              </div>
            )}
        </div>
      </div>
    );
  };

  renderDownloadTypes = () => {
    const { downloadTypes } = this.props;

    if (!downloadTypes) {
      return <LoadingMessage message="Loading download types..." />;
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
    const { onContinue } = this.props;

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
          <PrimaryButton
            disabled={!this.isDownloadValid()}
            text="Continue"
            onClick={onContinue}
          />
          <div className={cs.downloadDisclaimer}>
            Downloads for larger files can take multiple hours to generate.
          </div>
        </div>
      </div>
    );
  }
}

ChooseStep.propTypes = {
  downloadTypes: PropTypes.arrayOf(PropTypes.DownloadType),
  selectedDownloadTypeName: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  selectedFields: PropTypes.objectOf(PropTypes.objectOf(PropTypes.string)),
  onFieldSelect: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
  fieldOptions: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.any)),
};

export default ChooseStep;
