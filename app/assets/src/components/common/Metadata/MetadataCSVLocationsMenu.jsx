import { uniq, find, chunk, random, get } from "lodash/fp";
import React from "react";

import { withAnalytics, logAnalyticsEvent } from "~/api/analytics";
import { getGeoSearchSuggestions } from "~/api/locations";
import { processLocationSelection } from "~/components/ui/controls/GeoSearchInputBox";
import PropTypes from "~/components/utils/propTypes";
import IssueGroup from "~ui/notifications/IssueGroup";
import MetadataInput from "./MetadataInput";

import cs from "./metadata_csv_locations_menu.scss";

const CONCURRENT_REQUESTS_LIMIT = 20;
const REQUEST_DELAY_MIN = 1000;
const REQUEST_DELAY_MAX = 2000;

// Batch geosearch CSV locations for matches
export const geosearchCSVLocations = async (metadata, locationMetadataType) => {
  if (!(metadata && metadata.rows)) return;

  // For each unique plain text value, get the #1 search result, if any.
  const rawNames = uniq(metadata.rows.map(r => r[locationMetadataType.name]));
  const matchedLocations = {};
  const requests = rawNames.map(async query => {
    const res = await getGeoSearchSuggestions(query, 1);
    if (res.length > 0) matchedLocations[query] = res[0];
  });

  // Batch the requests with a delay to avoid geosearch API limits.
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const batches = chunk(CONCURRENT_REQUESTS_LIMIT, requests);
  const batchRequests = batches.map(async (batch, batchIndex) => {
    await Promise.all(batch);
    // Sleep after every batch except the last
    if (batchIndex !== batches.length - 1) {
      await sleep(random(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX));
    }
  });
  await Promise.all(batchRequests);

  // Process results and set warnings.
  let newMetadata = metadata;
  metadata.rows.forEach((row, rowIndex) => {
    const locationName = row[locationMetadataType.name];

    const result = processLocationSelection(
      matchedLocations[locationName] || locationName,
      isRowHuman(row)
    );

    if (matchedLocations.hasOwnProperty(locationName)) {
      newMetadata.rows[rowIndex][locationMetadataType.name] = result;
    }
  });
  return newMetadata;
};

const isRowHuman = row =>
  (row["Host Organism"] && row["Host Organism"].toLowerCase() === "human") ||
  (row["Host Genome"] && row["Host Genome"].toLowerCase() === "human");

const NAME_COLUMN = "Sample Name";

class MetadataCSVLocationsMenu extends React.Component {
  state = {
    // Which sample the "Apply to All" button should appear on.
    applyToAllSample: null,
  };

  renderApplyToAll = () => {
    const { applyToAllSample } = this.state;
    return (
      <div
        className={cs.applyToAll}
        onClick={withAnalytics(
          () => this.applyToAll(applyToAllSample),
          "MetadataCsvLocationsMenu_apply-all_clicked",
          {
            sampleName: applyToAllSample,
          }
        )}
      >
        Apply to All
      </div>
    );
  };

  applyToAll = sample => {
    const { metadata, locationMetadataType, onMetadataChange } = this.props;

    const newValue = (find({ [NAME_COLUMN]: sample }, metadata.rows) || {})[
      locationMetadataType.name
    ];
    const newMetadata = metadata;

    // Set all the rows to the newValue
    newMetadata.rows.forEach(row => {
      const result = processLocationSelection(newValue, isRowHuman(row));
      row[locationMetadataType.name] = result;
    });

    onMetadataChange({
      metadata: newMetadata,
    });
    this.setState({ applyToAllSample: null });
  };

  // Populate the data table cells
  getManualInputData = () => {
    const { locationMetadataType, metadata, onMetadataChange } = this.props;
    const { applyToAllSample } = this.state;

    return metadata.rows.map((row, rowIndex) => {
      const sampleName = row[NAME_COLUMN];

      const onChange = (key, value) => {
        const newMetadata = metadata;
        newMetadata.rows[rowIndex][locationMetadataType.name] = value;
        onMetadataChange({
          metadata: newMetadata,
        });
        this.setState({ applyToAllSample: sampleName });
        logAnalyticsEvent("MetadataCSVLocationsMenu_input_changed", {
          key,
          sampleName,
        });
      };

      return [
        <div key={NAME_COLUMN}>{sampleName}</div>,
        <div key={locationMetadataType.name}>
          <MetadataInput
            key={locationMetadataType.key}
            className={cs.input}
            value={row[locationMetadataType.name]}
            metadataType={locationMetadataType}
            onChange={onChange}
            withinModal={true}
            taxaCategory={get("taxa_category", this.getHostGenomeForRow(row))}
          />
          {applyToAllSample === sampleName &&
            this.props.metadata.rows.length > 1 &&
            this.renderApplyToAll()}
        </div>,
      ];
    });
  };

  getHostGenomeForRow = row =>
    find(
      ["name", row["Host Organism"] || row["Host Genome"]],
      this.props.hostGenomes
    );

  render() {
    const { metadata, locationMetadataType } = this.props;

    if (!(metadata && metadata.rows)) return null;
    return (
      <React.Fragment>
        <div className={cs.title}>Confirm Your Collection Locations</div>
        <IssueGroup
          caption={
            "We automatically searched for location matches. Please double check and correct any errors."
          }
          getColumnWidth={column => column === NAME_COLUMN && 240}
          headers={[NAME_COLUMN, locationMetadataType.name]}
          initialOpen={true}
          rows={this.getManualInputData()}
          type="info"
        />
      </React.Fragment>
    );
  }
}

MetadataCSVLocationsMenu.propTypes = {
  metadata: PropTypes.shape({
    headers: PropTypes.arrayOf(PropTypes.string),
    rows: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)),
  }),
  locationMetadataType: PropTypes.shape({
    dataType: PropTypes.oneOf(["location"]),
    key: PropTypes.string,
    name: PropTypes.string,
  }),
  onMetadataChange: PropTypes.func.isRequired,
  hostGenomes: PropTypes.array,
};

export default MetadataCSVLocationsMenu;
