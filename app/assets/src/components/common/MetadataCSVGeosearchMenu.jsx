import React from "react";
import { uniq, zipObject } from "lodash/fp";

import { getGeoSearchSuggestions } from "~/api/locations";
import MetadataInput from "~/components/common/MetadataInput";
import {
  LOCATION_UNRESOLVED_WARNING,
  processLocationSelection,
} from "~/components/ui/controls/GeoSearchInputBox";
import PropTypes from "~/components/utils/propTypes";
import DataTable from "~/components/visualizations/table/DataTable";

export const geosearchCSVlocations = async (metadata, metadataType) => {
  if (!(metadata && metadata.rows)) return;

  // Get the #1 result, if any, for each unique plain text value
  const rawNames = uniq(metadata.rows.map(r => r[metadataType.name]));
  const matchedLocations = {};
  const requests = rawNames.map(async query => {
    const res = await getGeoSearchSuggestions(query, 1);
    if (res.length > 0) matchedLocations[query] = res[0];
  });
  await Promise.all(requests);

  // Process matched results and set warnings
  let newMetadata = metadata;
  const warnings = {};
  metadata.rows.forEach((row, rowIndex) => {
    const locationName = row[metadataType.name];
    let rowWarning;
    if (matchedLocations.hasOwnProperty(locationName)) {
      const { result, warning } = processLocationSelection(
        matchedLocations[locationName],
        isRowHuman(row)
      );
      if (warning) rowWarning = warning;
      newMetadata.rows[rowIndex][metadataType.name] = result;
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
  getManualInputData = () => {
    const {
      CSVLocationWarnings,
      metadata,
      metadataType,
      onMetadataChange,
    } = this.props;

    return metadata.rows.map((sample, rowIndex) => {
      const sampleName = sample["Sample Name"];
      return {
        "Sample Name": sampleName,
        collection_location_v2: (
          <div>
            <MetadataInput
              key={metadataType.key}
              // className={cs.input}
              value={sample[metadataType.name]}
              metadataType={metadataType}
              onChange={(key, value) => {
                const newMetadata = metadata;
                newMetadata.rows[rowIndex][metadataType.name] = value;
                onMetadataChange({
                  metadata: newMetadata,
                });
              }}
              withinModal={true}
              isHuman={isRowHuman(sample)}
              warning={CSVLocationWarnings[sampleName]}
            />
          </div>
        ),
      };
    });
  };

  render() {
    const {
      CSVLocationWarnings,
      metadata,
      metadataType,
      onMetadataChange,
    } = this.props;

    if (!(metadata && metadata.rows)) return null;
    console.log("my data: ", this.getManualInputData());
    return (
      <DataTable
        // className={cs.inputTable}
        headers={{
          "Sample Name": "Sample Name",
          collection_location_v2: "Collection Location",
        }}
        columns={["Sample Name", "collection_location_v2"]}
        data={this.getManualInputData()}
        getColumnWidth={column => (column === "Sample Name" ? 240 : 160)}
      />
    );
  }
}

MetadataCSVGeosearchMenu.propTypes = {
  CSVLocationWarnings: PropTypes.object,
  metadata: PropTypes.object,
  metadataType: PropTypes.object,
  onMetadataChange: PropTypes.func.isRequired,
};

export default MetadataCSVGeosearchMenu;
