import cx from "classnames";
import { find, get } from "lodash/fp";
import React, { useState } from "react";
import { withAnalytics, trackEvent } from "~/api/analytics";
import { processLocationSelection } from "~/components/ui/controls/GeoSearchInputBox";
import IssueGroup from "~ui/notifications/IssueGroup";
import MetadataInput from "./MetadataInput";
import { NAME_COLUMN } from "./constants";
import cs from "./metadata_csv_locations_menu.scss";
import { MetadataCSVLocationsMenuProps, Row } from "./types";
import { isRowHuman } from "./utils";

const MetadataCSVLocationsMenu = ({
  metadata,
  locationMetadataType,
  hostGenomes,
  onMetadataChange,
}: MetadataCSVLocationsMenuProps) => {
  // Which sample the "Apply to All" button should appear on.
  const [applyToAllSample, setApplyToAllSample] = useState<string | null>(null);

  const renderApplyToAll = () => (
    <button
      className={cx(cs.applyToAll, "nostylebutton")}
      onClick={withAnalytics(
        () => applyToAll(applyToAllSample),
        "MetadataCsvLocationsMenu_apply-all_clicked",
        {
          sampleName: applyToAllSample,
        },
      )}
    >
      Apply to All
    </button>
  );

  const applyToAll = (sample: string) => {
    // eslint-disable-next-line standard/computed-property-even-spacing
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
    setApplyToAllSample(null);
  };

  // Populate the data table cells
  const getManualInputData = () => {
    return metadata.rows.map((row, rowIndex) => {
      const sampleName = row[NAME_COLUMN];

      const onChange = (key: string, value: any) => {
        const newMetadata = metadata;
        newMetadata.rows[rowIndex][locationMetadataType.name] = value;
        onMetadataChange({
          metadata: newMetadata,
        });
        setApplyToAllSample(sampleName);
        trackEvent("MetadataCSVLocationsMenu_input_changed", {
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
            taxaCategory={get("taxa_category", getHostGenomeForRow(row))}
          />
          {applyToAllSample === sampleName &&
            metadata.rows.length > 1 &&
            renderApplyToAll()}
        </div>,
      ];
    });
  };

  const getHostGenomeForRow = (row: Row) =>
    find(["name", row["Host Organism"] || row["Host Genome"]], hostGenomes);

  if (!(metadata && metadata.rows)) return null;
  return (
    <>
      <div className={cs.title}>Confirm Your Collection Locations</div>
      <IssueGroup
        caption={
          "We automatically searched for location matches. Please double check and correct any errors."
        }
        getColumnWidth={column => column === NAME_COLUMN && 240}
        headers={[NAME_COLUMN, locationMetadataType.name]}
        initialOpen={true}
        rows={getManualInputData()}
        type="info"
      />
    </>
  );
};

export default MetadataCSVLocationsMenu;
