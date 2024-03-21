import { camelCase } from "lodash/fp";
import React from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import cs from "~/components/common/DetailsSidebar/BulkDownloadDetailsMode/bulk_download_details_mode.scss";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import { Accordion } from "~/components/layout";
import { BULK_DOWNLOAD_TYPE_INFO } from "~/components/views/BulkDownloadListView/downloadTypeInfo";
import { DetailsTabFragment$key } from "./__generated__/DetailsTabFragment.graphql";

interface DetailsTabProps {
  bulkDownloadData: DetailsTabFragment$key;
  bulkDownloadId?: string;
}

export const DetailsTabFragment = graphql`
  fragment DetailsTabFragment on query_fedBulkDownloads_items
  @relay(plural: true) {
    id
    downloadType
    params {
      downloadFormat
      metric
      background
      filterBy
      taxaWithReads
      includeMetadata
      fileFormat
    }
    entityInputs {
      id
      name
    }
  }
`;

export const DetailsTab = ({
  bulkDownloadData,
  bulkDownloadId,
}: DetailsTabProps) => {
  const fields: { label: string; value: number | string }[] = [];
  const data = useFragment(DetailsTabFragment, bulkDownloadData);

  const bulkDownloadDetails = data.find(item => item.id === bulkDownloadId);
  const { downloadType, entityInputs } = bulkDownloadDetails ?? {};
  if (!downloadType) {
    return null;
  }
  const downloadTypeConfig = BULK_DOWNLOAD_TYPE_INFO[downloadType];

  if (entityInputs && entityInputs.length > 0) {
    fields.push({
      label: "Samples",
      value: entityInputs.length,
    });
  }

  if (downloadTypeConfig?.fileTypeDisplay) {
    fields.push({
      label: "File Format",
      value: downloadTypeConfig?.fileTypeDisplay,
    });
  }

  downloadTypeConfig.fields &&
    downloadTypeConfig.fields.forEach(field => {
      const paramsField: { displayName?: string; value: string } =
        bulkDownloadDetails?.params?.[camelCase(field.type)];
      // fieldValue must be a string. In some cases, the field has a displayName, such as for filter values.
      // In other cases, the field just has a value, such as the download format. The stringify is here just
      // in case the value is not a string - for example the list of filters.
      const fieldOption =
        paramsField?.displayName ?? // if there's a displayName, use it
        (typeof paramsField?.value === "string"
          ? (paramsField.value as string) // if value is a string, use it
          : JSON.stringify(paramsField?.value)); // something is probably wrong if we're here, but stringify so the page doesn't crash

      // the values from NextGen may not directly correspond with the values that are to be displayed to the user
      // this will grab the front end labels from the config if necessary
      const fieldValue =
        field?.optionValues &&
        Object.keys(field.optionValues).includes(fieldOption)
          ? field.optionValues[fieldOption].label
          : fieldOption;

      if (fieldOption) {
        fields.push({
          label: field.displayName,
          value: fieldValue,
        });
      }
    });

  return (
    <div className={cs.detailsTab}>
      <Accordion
        className={cs.accordion}
        header={<div className={cs.header}>Details</div>}
        bottomContentPadding
        open
        data-testid="bulk-download-details"
      >
        <FieldList fields={fields} />
      </Accordion>
      {entityInputs && entityInputs.length > 0 && (
        <Accordion
          className={cs.accordion}
          header={<div className={cs.header}>Samples in this Download</div>}
          bottomContentPadding
          data-testid="bulk-download-runs"
        >
          <div className={cs.samplesList}>
            {entityInputs.map((run: { id: any; name: string }) => (
              <div key={`${run.id}+${run.name}`} className={cs.sampleName}>
                {run.name}
              </div>
            ))}
          </div>
        </Accordion>
      )}
    </div>
  );
};
