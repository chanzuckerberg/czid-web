import React from "react";
import ReactAutocomplete from "react-autocomplete";

import PropTypes from "../../../utils/propTypes";

const ReportSearchBox = ({
  searchKeysInSample,
  searchKey,
  onSelect,
  onChange
}) => {
  return (
    <li className="search-box genus-autocomplete-container">
      <ReactAutocomplete
        inputProps={{ placeholder: "Search" }}
        items={searchKeysInSample}
        shouldItemRender={(item, value) =>
          item[0] === "Show All" ||
          (value.length > 2 &&
            item[0].toLowerCase().indexOf(value.toLowerCase()) > -1)
        }
        getItemValue={item => item[0]}
        renderItem={(item, highlighted) => (
          <div
            key={item[1]}
            style={{
              backgroundColor: highlighted ? "#eee" : "transparent",
              fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif",
              fontSize: "1rem",
              overflow: "hidden"
            }}
          >
            {item[0]}
          </div>
        )}
        value={searchKey}
        onChange={onChange}
        onSelect={onSelect}
      />
      <i className="fa fa-search" />
    </li>
  );
};

ReportSearchBox.propTypes = {
  // This is all the available keys for autocomplete. Each entry is of the form [string, key].
  searchKeysInSample: PropTypes.arrayOf(PropTypes.array).isRequired,
  searchKey: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ReportSearchBox;
