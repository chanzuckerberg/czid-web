import React from "react";
import Checkbox from "~/components/ui/controls/Checkbox";
import { Dropdown } from "~/components/ui/controls/dropdowns";
import { CONDITIONAL_FIELDS } from "~/components/views/BulkDownloadListView/constants";
import {
  BackgroundOptionType,
  DropdownOptionType,
  MetricsOptionType,
  SelectedFieldsType,
  SelectedFieldType,
  SelectedFieldValueType,
} from "~/components/views/DiscoveryView/components/SamplesView/components/BulkDownloadModal/types";
import { triggersConditionalField } from "~/components/views/DiscoveryView/components/SamplesView/components/BulkDownloadModal/utils";
import { MICROBIOME_DOWNLOAD_METRIC_OPTIONS } from "~/components/views/SamplesHeatmapView/constants";
import BackgroundModelFilter from "~/components/views/SampleView/components/MngsReport/components/ReportFilters/components/BackgroundModelFilter";
import { BulkDownloadFieldType, BulkDownloadType } from "~/interface/shared";
import cs from "../../bulk_download_modal_options.scss";
import { TaxonHitSelect } from "../TaxonHitSelect";
import { ThresholdFilterModal } from "../ThresholdFilterModal";

interface BulkDownloadDataFieldProps {
  backgroundOptions?: BackgroundOptionType[] | null;
  downloadType: BulkDownloadType;
  field: BulkDownloadFieldType;
  metricsOptions?: MetricsOptionType[] | null;
  onSelectField: (
    downloadType?: string,
    fieldType?: string,
    value?: SelectedFieldValueType,
    displayName?: string,
  ) => void;
  selectedDownloadTypeName?: string | null;
  selectedFields: SelectedFieldsType;
  shouldEnableMassNormalizedBackgrounds?: boolean;
  validObjectIds: Set<number | string>;
}

/**
 * BulkDownloadDataFields are the additional data that are required for a given bulk download flow
 * For example, the Combined Microbiome File requires a metric. Optionally, the user can specify
 * metrics to filter by. If the metric is a Z-score, the user must specify a background to calculate
 * the Z-score against.
 *
 * Currently, this file renders all of the various data field options. In the future, we may want to
 * split this into multiple components.
 */

export const BulkDownloadDataField = ({
  backgroundOptions,
  downloadType,
  field,
  metricsOptions,
  onSelectField,
  selectedDownloadTypeName,
  selectedFields,
  shouldEnableMassNormalizedBackgrounds,
  validObjectIds,
}: BulkDownloadDataFieldProps) => {
  const selectedFieldsForType: SelectedFieldType | null | undefined =
    (selectedDownloadTypeName && selectedFields?.[selectedDownloadTypeName]) ||
    null;
  const selectedFieldValue: SelectedFieldValueType =
    field.type && selectedFieldsForType?.[field.type];
  let dropdownOptions: DropdownOptionType[] | null = null;
  let placeholder = "";

  // Handle rendering conditional fields.
  // For the file format field, render a placeholder. This is a special case.
  const fileFormatConditionalField = CONDITIONAL_FIELDS[0];
  if (
    field.type === fileFormatConditionalField.field &&
    downloadType.type === fileFormatConditionalField.downloadType &&
    !triggersConditionalField(fileFormatConditionalField, selectedFieldsForType)
  ) {
    return (
      <div className={cs.field} key={field.type}>
        <div className={cs.label}>{field.display_name}:</div>
        <div className={cs.forcedOption}>.fasta</div>
        <div className={cs.info}>
          Note: Only .fasta is available when selecting one taxon.
        </div>
      </div>
    );
    // For other conditional fields, render nothing.
  } else if (
    CONDITIONAL_FIELDS.some(
      conditionalField =>
        field.type === conditionalField.field &&
        downloadType.type === conditionalField.downloadType &&
        !triggersConditionalField(conditionalField, selectedFieldsForType),
    )
  ) {
    return null;
  }

  // Set different props for the dropdown depending on the field type.
  switch (field.type) {
    case "include_metadata":
      return (
        <Checkbox
          className={cs.checkboxField}
          label="Include sample metadata in this table"
          onChange={(_, isChecked: boolean) =>
            onSelectField(
              downloadType.type,
              field.type,
              isChecked /* value */,
              isChecked ? "Yes" : "No" /* display name */,
            )
          }
          checked={!!selectedFieldValue}
        />
      );
    case "file_format":
      // For case "file_format", field.options is a list of strings
      dropdownOptions = field.options.map(option => ({
        text: option as string,
        value: option as string,
      }));

      placeholder = "Select file format";
      break;
    case "taxa_with_reads":
      return (
        <div className={cs.field} key={field.type}>
          <div className={cs.label}>{field.display_name}:</div>
          <TaxonHitSelect
            sampleIds={validObjectIds}
            onChange={(value: SelectedFieldValueType, displayName: string) => {
              onSelectField(downloadType.type, field.type, value, displayName);
            }}
            // casting here because selectedFieldValue will always be a number or undefined for case "taxa_with_reads"
            value={selectedFieldValue as number | undefined}
            hitType="read"
          />
        </div>
      );
    case "taxa_with_contigs":
      return (
        <div className={cs.field} key={field.type}>
          <div className={cs.label}>{field.display_name}:</div>
          <TaxonHitSelect
            sampleIds={validObjectIds}
            onChange={(value: SelectedFieldValueType, displayName: string) => {
              onSelectField(downloadType.type, field.type, value, displayName);
            }}
            // casting here because selectedFieldValue will always be a number or undefined for case "taxa_with_contigs"
            value={selectedFieldValue as number | undefined}
            hitType="contig"
          />
        </div>
      );
    case "background":
      // Below we use backgroundOptions rather than dropdownOptions for this one
      placeholder = backgroundOptions ? "Select background" : "Loading...";
      break;
    case "metric":
      // if download type is biom_format, only return RPM and r for NT and NR
      dropdownOptions =
        (downloadType.type === "biom_format"
          ? MICROBIOME_DOWNLOAD_METRIC_OPTIONS
          : metricsOptions) || [];
      placeholder = metricsOptions ? "Select metric" : "Loading...";
      break;
    case "filter_by":
      return (
        <div className={cs.filterbyField} key={field.type}>
          <div className={cs.label}>
            <span>{field.display_name}: </span>
            <span className={cs.description}> — optional </span>
          </div>
          <ThresholdFilterModal addFilterList={onSelectField} />
        </div>
      );
    // This one is used for CG bulk downloads to swap between a single file or multiple files
    case "download_format":
      // field.options is a list of strings in this case
      dropdownOptions = field.options.map(option => ({
        text: option as string,
        value: option as string,
      }));

      placeholder = "Select format";
      break;
  }

  if (!dropdownOptions && field.type !== "background") {
    return null;
  }
  return (
    <div className={cs.field} key={field.type}>
      <div className={cs.label}>{field.display_name}:</div>
      {field.type === "background" ? (
        <BackgroundModelFilter
          fluid
          placeholder={placeholder}
          allBackgrounds={backgroundOptions}
          onChange={(value: string, displayName: string) => {
            onSelectField(downloadType.type, field.type, value, displayName);

            // Reset conditional fields if they are no longer needed.
            CONDITIONAL_FIELDS.forEach(conditionalField => {
              if (
                field.type &&
                conditionalField.dependentFields.includes(field.type) &&
                downloadType.type === conditionalField.downloadType &&
                !conditionalField.triggerValues.includes(value)
              ) {
                onSelectField(
                  downloadType.type,
                  conditionalField.field,
                  undefined,
                  undefined,
                );
              }
            });
          }}
          enableMassNormalizedBackgrounds={
            shouldEnableMassNormalizedBackgrounds
          }
          // casting here because selectedFieldValue will always be a number or undefined for field.type "background"
          value={selectedFieldValue as number | undefined}
          usePortal
          withinModal
          rounded={false}
          label={""}
        />
      ) : (
        dropdownOptions && (
          <Dropdown
            fluid
            placeholder={placeholder}
            options={dropdownOptions}
            onChange={(value: string, displayName: string) => {
              onSelectField(downloadType.type, field.type, value, displayName);

              // Reset conditional fields if they are no longer needed.
              CONDITIONAL_FIELDS.forEach(conditionalField => {
                if (
                  field.type &&
                  conditionalField.dependentFields.includes(field.type) &&
                  downloadType.type === conditionalField.downloadType &&
                  !conditionalField.triggerValues.includes(value)
                ) {
                  onSelectField(
                    downloadType.type,
                    conditionalField.field,
                    undefined,
                    undefined,
                  );
                }
              });
            }}
            // casting here because selectedFieldValue will never be a ThresholdFilter[] or boolean in this dropdown
            value={selectedFieldValue as string | number | undefined}
            usePortal
            withinModal
          />
        )
      )}
    </div>
  );
};
