import React from "react";
import { uniq, find } from "lodash/fp";

import { withAnalytics, logAnalyticsEvent } from "~/api/analytics";
import { getGeoSearchSuggestions } from "~/api/locations";
import MetadataInput from "~/components/common/MetadataInput";
import {
  LOCATION_UNRESOLVED_WARNING,
  processLocationSelection,
} from "~/components/ui/controls/GeoSearchInputBox";
import PropTypes from "~/components/utils/propTypes";
import DataTable from "~/components/visualizations/table/DataTable";

import cs from "./metadata_csv_locations_menu.scss";

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
      warnings[row[NAME_COLUMN]] = rowWarning;
    }
  });
  return { newMetadata, warnings };
};

const isRowHuman = row => row["Host Genome"] && row["Host Genome"] === "Human";

const NAME_COLUMN = "Sample Name";

class MetadataCSVLocationsMenu extends React.Component {
  state = {
    // Which sample the "Apply to All" button should appear on.
    applyToAllSample: null,
  };

  renderApplyToAll = sample => {
    const { applyToAllSample } = this.state;
    return applyToAllSample === sample ? (
      <div
        className={cs.applyToAll}
        onClick={withAnalytics(
          () => this.applyToAll(sample),
          "MetadataCsvLocationsMenu_apply-all_clicked",
          {
            sampleName: sample.name,
          }
        )}
      >
        Apply to All
      </div>
    ) : null;
  };

  applyToAll = sample => {
    const {
      metadata,
      metadataType,
      onMetadataChange,
      onCSVLocationWarningsChange,
    } = this.props;

    const newValue = (find({ [NAME_COLUMN]: sample }, metadata.rows) || {})[
      metadataType.name
    ];
    const newMetadata = metadata;

    const warnings = {};
    newMetadata.rows.forEach(row => {
      const { result, warning } = processLocationSelection(
        newValue,
        isRowHuman(row)
      );
      row[metadataType.name] = result;
      if (warning) warnings[row[NAME_COLUMN]] = warning;
    });
    onMetadataChange({
      metadata: newMetadata,
    });
    onCSVLocationWarningsChange(warnings);
    this.setState({ applyToAllSample: null });
  };

  getManualInputData = () => {
    const {
      CSVLocationWarnings,
      metadata,
      metadataType,
      onMetadataChange,
    } = this.props;

    return metadata.rows.map((row, rowIndex) => {
      const sampleName = row[NAME_COLUMN];
      return {
        [NAME_COLUMN]: (
          <div className={cs.sampleName} key={NAME_COLUMN}>
            {sampleName}
          </div>
        ),
        [metadataType.key]: (
          <div>
            <MetadataInput
              key={metadataType.key}
              className={cs.input}
              value={row[metadataType.name]}
              metadataType={metadataType}
              onChange={(key, value) => {
                const newMetadata = metadata;
                newMetadata.rows[rowIndex][metadataType.name] = value;
                this.setState({ applyToAllSample: sampleName });
                onMetadataChange({
                  metadata: newMetadata,
                });
                logAnalyticsEvent("MetadataManualInput_input_changed", {
                  key,
                  value,
                  sampleName,
                });
              }}
              withinModal={true}
              isHuman={isRowHuman(row)}
              warning={CSVLocationWarnings[sampleName]}
            />
            {this.renderApplyToAll(sampleName)}
          </div>
        ),
      };
    });
  };

  render() {
    const { metadata, metadataType } = this.props;

    if (!(metadata && metadata.rows)) return null;
    return (
      <React.Fragment>
        <div className={cs.instructions}>
          <div className={cs.title}>Location Matches</div>
          <div className={cs.subtitle}>
            We automatically searched for location matches. Please double check
            and correct any errors.
          </div>
        </div>
        <DataTable
          className={cs.inputTable}
          headers={{
            [NAME_COLUMN]: NAME_COLUMN,
            [metadataType.key]: metadataType.name,
          }}
          columns={[NAME_COLUMN, metadataType.key]}
          data={this.getManualInputData()}
          getColumnWidth={() => 240}
        />
      </React.Fragment>
    );
  }
}

MetadataCSVLocationsMenu.propTypes = {
  CSVLocationWarnings: PropTypes.object,
  metadata: PropTypes.object,
  metadataType: PropTypes.object,
  onMetadataChange: PropTypes.func.isRequired,
  onCSVLocationWarningsChange: PropTypes.func.isRequired,
};

export default MetadataCSVLocationsMenu;
