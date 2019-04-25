import React from "react";
import PropTypes from "prop-types";
import cs from "./data_tooltip.scss";

const DataTooltip = ({ data, subtitle, title, singleColumn, onMouseEnter }) => {
  // DataTooltip receives:
  // - title
  // - subtitle
  // - an array of object(section_name, data: array([label, value], [..]))

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
              {singleColumn ? (
                <div className={cs.dataTooltipValue}>{keyValuePair[0]}</div>
              ) : (
                <React.Fragment>
                  <div className={cs.dataTooltipLabel}>{keyValuePair[0]}</div>
                  <div className={cs.dataTooltipValue}>{keyValuePair[1]}</div>
                </React.Fragment>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSections = data => {
    return data.map(section => renderSection(section.name, section.data));
  };

  console.log("4:29pm");
  return (
    <div
      className={cs.dataTooltip}
      onMouseOver={() => {
        console.log("hi");
        onMouseEnter();
      }}
      onClick={() => console.log("clicked 5:22pm")}
    >
      {title && <div className={cs.dataTooltipTitle}>{title}</div>}
      {subtitle && <div className={cs.dataTooltipSubtitle}>{subtitle}</div>}
      <div className={cs.dataTooltipData}>{renderSections(data)}</div>
    </div>
  );
};

DataTooltip.propTypes = {
  data: PropTypes.array,
  subtitle: PropTypes.string,
  title: PropTypes.string,
  singleColumn: PropTypes.bool,
  onMouseEnter: PropTypes.func
};

DataTooltip.defaultProps = {
  singleColumn: false
};

export default DataTooltip;
