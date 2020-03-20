import React from "react";
import PropTypes from "prop-types";
import { isObject } from "lodash/fp";
import cx from "classnames";

import cs from "./data_tooltip.scss";

const DataTooltip = ({ data, subtitle, title, singleColumn }) => {
  // DataTooltip receives:
  // - title
  // - subtitle
  // - an array of object(section_name, data: array([label, value], [..]))

  const renderSection = (sectionName, dataValues, isDisabled) => {
    return (
      <div
        className={cx(cs.dataTooltipSection, isDisabled && cs.disabled)}
        key={`section-${sectionName}`}
      >
        <div className={cs.dataTooltipSectionName}>{sectionName}</div>
        {dataValues.map(keyValuePair => {
          return (
            <div
              className={cs.dataTooltipValuePair}
              key={`value-${sectionName}-${keyValuePair[0]}`}
            >
              {singleColumn ? (
                <div className={cs.dataTooltipValue}>{keyValuePair[0]}</div>
              ) : (
                <React.Fragment>
                  <div className={cs.dataTooltipLabel}>{keyValuePair[0]}</div>
                  <div className={cs.dataTooltipValue}>
                    {
                      // Use .name if value is an object (e.g. location object)
                      // with a name property. Display React elements normally. */
                    }
                    {isObject(keyValuePair[1]) &&
                    keyValuePair[1].hasOwnProperty("name")
                      ? keyValuePair[1].name
                      : keyValuePair[1]}
                  </div>
                </React.Fragment>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSections = data => {
    return data.map(section =>
      renderSection(section.name, section.data, section.disabled)
    );
  };

  return (
    <div className={cs.dataTooltip}>
      {title && <div className={cs.dataTooltipTitle}>{title}</div>}
      {subtitle && <div className={cs.dataTooltipSubtitle}>{subtitle}</div>}
      <div className={cs.dataTooltipData}>{renderSections(data)}</div>
    </div>
  );
};

DataTooltip.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      // Array of key-value pairs.
      data: PropTypes.arrayOf(PropTypes.array),
      // Grey out the section if disabled.
      disabled: PropTypes.bool,
    })
  ),
  subtitle: PropTypes.string,
  title: PropTypes.string,
  singleColumn: PropTypes.bool,
};

DataTooltip.defaultProps = {
  singleColumn: false,
};

export default DataTooltip;
