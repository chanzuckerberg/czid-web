import React from "react";
import PropTypes from "prop-types";

const DataTooltip = ({ data, subtitle, title }) => {
  // DataTooltip receives:
  // - title
  // - subtitle
  // - an object(section_name: array([label, value], [..]))

  const renderSection = (sectionName, dataValues) => {
    return (
      <div className="data-tooltip__section" key={`section-${sectionName}`}>
        <div className="data-tooltip__section-name">{sectionName}</div>
        {dataValues.map(keyValuePair => {
          return (
            <div
              className="data-tooltip__value-pair"
              key={`value-${sectionName}-${keyValuePair[0]}`}
            >
              <div className="data-tooltip__label">{keyValuePair[0]}</div>
              <div className="data-tooltip__value">{keyValuePair[1]}</div>
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
    <div className="data-tooltip">
      {title && <div className="data-tooltip__title">{title}</div>}
      {subtitle && <div className="data-tooltip__subtitle">{subtitle}</div>}
      <div className="data-tooltip__data">{renderSections(data)}</div>
    </div>
  );
};

DataTooltip.propTypes = {
  data: PropTypes.array,
  subtitle: PropTypes.string,
  title: PropTypes.string
};
export default DataTooltip;
