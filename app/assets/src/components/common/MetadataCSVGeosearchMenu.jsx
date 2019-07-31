import React from "react";
import { uniq } from "lodash/fp";

import { getGeoSearchSuggestions } from "~/api/locations";
import MetadataInput from "~/components/common/MetadataInput";
import {
  LOCATION_UNRESOLVED_WARNING,
  processLocationSelection,
} from "~/components/ui/controls/GeoSearchInputBox";
import PropTypes from "~/components/utils/propTypes";

export const geosearchCSVlocations = async metadata => {
  const fieldName = "Collection Location";

  if (!(metadata && metadata.rows)) return;

  // Get results for each plain text value
  const locationNames = uniq(metadata.rows.map(r => r[fieldName]));
  const matchedLocations = {};
  for (const query of locationNames) {
    const suggestions = await getGeoSearchSuggestions(query, 1);
    if (suggestions.length > 0) {
      matchedLocations[query] = suggestions[0];
    }
  }

  // Set results if there was a match
  let newMetadata = metadata;
  const warnings = {};
  metadata.rows.forEach((row, rowIndex) => {
    const locationName = row[fieldName];
    let rowWarning;

    if (matchedLocations.hasOwnProperty(locationName)) {
      const { result, warning } = processLocationSelection(
        matchedLocations[locationName],
        isRowHuman(row)
      );
      if (warning) rowWarning = warning;
      newMetadata.rows[rowIndex][fieldName] = result;
    } else {
      rowWarning = LOCATION_UNRESOLVED_WARNING;
    }

    if (rowWarning) {
      warnings[row["Sample Name"]] = rowWarning;
    }
  });
  return { newMetadata, warnings };
};

const isRowHuman = row => row["Host Genome"] && row["Host Genome"] === "Human";

class MetadataCSVGeosearchMenu extends React.Component {
  render() {
    const {
      CSVLocationWarnings,
      metadata,
      onMetadataChange,
      projectMetadataFields,
    } = this.props;

    if (!(metadata && metadata.rows)) return null;

    // Render results
    return metadata.rows.map((sample, rowIndex) => {
      const sampleName = sample["Sample Name"];
      return (
        <div key={`location-input-${sampleName}`}>
          <span>{sampleName}</span>
          <span>
            <MetadataInput
              key={"collection_location_v2"}
              // className={cs.input}
              value={sample["Collection Location"]}
              metadataType={projectMetadataFields["collection_location_v2"]}
              onChange={(key, value) => {
                const newMetadata = metadata;
                newMetadata.rows[rowIndex]["Collection Location"] = value;
                onMetadataChange({
                  metadata: newMetadata,
                });
              }}
              withinModal={true}
              isHuman={isRowHuman(sample)}
              warning={CSVLocationWarnings[sampleName]}
            />
          </span>
        </div>
      );
    });
  }
}

MetadataCSVGeosearchMenu.propTypes = {
  CSVLocationWarnings: PropTypes.object,
  metadata: PropTypes.object,
  onMetadataChange: PropTypes.func.isRequired,
  projectMetadataFields: PropTypes.object,
};

export default MetadataCSVGeosearchMenu;
