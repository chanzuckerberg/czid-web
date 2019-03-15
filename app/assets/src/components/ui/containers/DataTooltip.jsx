import React from "react";
import PropTypes from "prop-types";
import cs from "./data_tooltip.scss";

const DataTooltip = ({ data, subtitle, title }) => {
  // DataTooltip receives:
  // - title
  // - subtitle
  // - an object(section_name: array([label, value], [..]))

  const renderSection = (sectionName, dataValues) => {
    return (
      <div className={cs.dataTooltipSection} key={`section-${sectionName}`}>
        <div className={cs.dataTooltipSectionName}>{sectionName}</div>
        {dataValues.map(keyValuePair => {
          return (
            <div
              className={cs.dataTooltipValuePair}
              key={`value-${sectionName}-${keyValuePair[0]}`}
            >
              <div className={cs.dataTooltipLabel}>{keyValuePair[0]}</div>
              <div className={cs.dataTooltipValue}>{keyValuePair[1]}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSections = data => {
    return data.map(section => renderSection(section.name, section.data));
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
  data: PropTypes.array,
  subtitle: PropTypes.string,
  title: PropTypes.string
};
export default DataTooltip;
