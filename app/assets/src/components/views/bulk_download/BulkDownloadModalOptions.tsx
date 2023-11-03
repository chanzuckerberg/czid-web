import cx from "classnames";
import { filter, get } from "lodash/fp";
import React, { useContext } from "react";
import BasicPopup from "~/components/BasicPopup";
import LoadingMessage from "~/components/common/LoadingMessage";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { WORKFLOW_TABS } from "~/components/utils/workflows";
import BackgroundModelFilter from "~/components/views/report/filters/BackgroundModelFilter";
import { humanize } from "~/helpers/strings";
import { BulkDownloadType, BulkDownloadTypeField } from "~/interface/shared";
import Checkbox from "~ui/controls/Checkbox";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import LinkCS from "~ui/controls/link.scss";
import RadioButton from "~ui/controls/RadioButton";
import StatusLabel from "~ui/labels/StatusLabel";
import { MICROBIOME_DOWNLOAD_METRIC_OPTIONS } from "../compare/SamplesHeatmapView/constants";
import cs from "./bulk_download_modal_options.scss";
import {
  BULK_DOWNLOAD_DOCUMENTATION_LINKS,
  BULK_DOWNLOAD_TYPES,
  CONDITIONAL_FIELDS,
} from "./constants";
import TaxonHitSelect from "./TaxonHitSelect";
import ThresholdFilterModal from "./ThresholdFilterModal";
import { triggersConditionalField } from "./utils";

interface BulkDownloadModalOptionsProps {
  downloadTypes?: BulkDownloadType[];
  selectedDownloadTypeName?: string;
  // The selected fields of the currently selected download type.
  selectedFields?: Record<string, string>;
  onFieldSelect: $TSFixMeFunction;
  validObjectIds: Set<$TSFixMeUnknown>;
  backgroundOptions?: $TSFixMeUnknown[];
  metricsOptions?: $TSFixMeUnknown[];
  allObjectsUploadedByCurrentUser?: boolean;
  onSelect: (newSelectedDownloadTypeName: string) => void;
  handleHeatmapLink: () => void;
  enableMassNormalizedBackgrounds?: boolean;
  objectDownloaded?: string;
  userIsCollaborator: boolean;
}

const BulkDownloadModalOptions = ({
  backgroundOptions,
  metricsOptions,
  validObjectIds,
  onFieldSelect,
  selectedFields,
  selectedDownloadTypeName,
  enableMassNormalizedBackgrounds,
  allObjectsUploadedByCurrentUser,
  objectDownloaded,
  userIsCollaborator,
  onSelect,
  handleHeatmapLink,
  downloadTypes,
}: BulkDownloadModalOptionsProps) => {
  const renderOption = (
    downloadType: BulkDownloadType,
    field: BulkDownloadTypeField,
  ) => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
    const selectedFieldsForType = get(selectedDownloadTypeName, selectedFields);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
    const selectedField = get(field.type, selectedFieldsForType);
    let dropdownOptions = null;
    let placeholder = "";
    // Handle rendering conditional fields.

    // For the file format field, render a placeholder. This is a special case.
    const fileFormatConditionalField = CONDITIONAL_FIELDS[0];
    if (
      field.type === fileFormatConditionalField.field &&
      downloadType.type === fileFormatConditionalField.downloadType &&
      !triggersConditionalField(
        fileFormatConditionalField,
        selectedFieldsForType,
      )
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
      return;
    }

    // Set different props for the dropdown depending on the field type.
    switch (field.type) {
      case "include_metadata":
        return (
          <Checkbox
            className={cs.checkboxField}
            label="Include sample metadata in this table"
            onChange={(_, isChecked) =>
              onFieldSelect(
                downloadType.type,
                field.type,
                isChecked /* value */,
                isChecked ? "Yes" : "No" /* display name */,
              )
            }
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            checked={selectedField}
          />
        );
      case "file_format":
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        dropdownOptions = field.options.map(option => ({
          text: option,
          value: option,
        }));

        placeholder = "Select file format";
        break;
      case "taxa_with_reads":
        return (
          <div className={cs.field} key={field.type}>
            <div className={cs.label}>{field.display_name}:</div>
            <TaxonHitSelect
              sampleIds={validObjectIds}
              onChange={(value, displayName) => {
                onFieldSelect(
                  downloadType.type,
                  field.type,
                  value,
                  displayName,
                );
              }}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
              value={selectedField}
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
              onChange={(value, displayName) => {
                onFieldSelect(
                  downloadType.type,
                  field.type,
                  value,
                  displayName,
                );
              }}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
              value={selectedField}
              hitType="contig"
            />
          </div>
        );
      case "background":
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        dropdownOptions = backgroundOptions || [];
        placeholder = backgroundOptions ? "Select background" : "Loading...";
        break;
      case "metric":
        // if download type is biom_format, only return RPM and r for NT and NR
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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
            <ThresholdFilterModal addFilterList={onFieldSelect} />
          </div>
        );
      case "download_format":
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        dropdownOptions = field.options.map(option => ({
          text: option,
          value: option,
        }));

        placeholder = "Select format";
        break;
    }

    if (!dropdownOptions) {
      return null;
    }
    return (
      <div className={cs.field} key={field.type}>
        <div className={cs.label}>{field.display_name}:</div>
        {field.type === "background" ? (
          <BackgroundModelFilter
            fluid
            placeholder={placeholder}
            allBackgrounds={dropdownOptions}
            onChange={(value: string, displayName) => {
              onFieldSelect(downloadType.type, field.type, value, displayName);

              // Reset conditional fields if they are no longer needed.
              CONDITIONAL_FIELDS.forEach(conditionalField => {
                if (
                  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
                  conditionalField.dependentFields.includes(field.type) &&
                  downloadType.type === conditionalField.downloadType &&
                  !conditionalField.triggerValues.includes(value)
                ) {
                  onFieldSelect(
                    downloadType.type,
                    conditionalField.field,
                    undefined,
                    undefined,
                  );
                }
              });
            }}
            enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            value={selectedField}
            usePortal
            withinModal
            rounded={false}
            label={""}
          />
        ) : (
          <Dropdown
            fluid
            placeholder={placeholder}
            options={dropdownOptions}
            onChange={(value: string, displayName: string) => {
              onFieldSelect(downloadType.type, field.type, value, displayName);

              // Reset conditional fields if they are no longer needed.
              CONDITIONAL_FIELDS.forEach(conditionalField => {
                if (
                  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
                  conditionalField.dependentFields.includes(field.type) &&
                  downloadType.type === conditionalField.downloadType &&
                  !conditionalField.triggerValues.includes(value)
                ) {
                  onFieldSelect(
                    downloadType.type,
                    conditionalField.field,
                    undefined,
                    undefined,
                  );
                }
              });
            }}
            value={selectedField}
            usePortal
            withinModal
          />
        )}
      </div>
    );
  };

  // Return a message to display to the user if the download option should be disabled.
  const getDisabledMessageForDownload = (downloadType: BulkDownloadType) => {
    const { admin, appConfig } = useContext(UserContext) || {};

    let disabledMessage = "";

    switch (downloadType.type) {
      case BULK_DOWNLOAD_TYPES.ORIGINAL_INPUT_FILES:
        if (!admin && !allObjectsUploadedByCurrentUser) {
          disabledMessage = `To download Original Input Files, you must be the original 
            uploader of all selected ${objectDownloaded}s.`;
        } else if (
          appConfig.maxSamplesBulkDownloadOriginalFiles &&
          validObjectIds.size > appConfig.maxSamplesBulkDownloadOriginalFiles &&
          !admin
        ) {
          disabledMessage = `No more than ${appConfig.maxSamplesBulkDownloadOriginalFiles} samples
            allowed for Original Input Files downloads`;
        }
        break;
      case BULK_DOWNLOAD_TYPES.HOST_GENE_COUNTS:
        if (!admin && !userIsCollaborator) {
          disabledMessage = `To download host count data, you must be a collaborator on the respective project for all samples.`;
        }
        break;
      default:
        break;
    }
    return disabledMessage;
  };

  const renderDownloadType = (downloadType: BulkDownloadType) => {
    const selected = selectedDownloadTypeName === downloadType.type;
    const disabledMessage = getDisabledMessageForDownload(downloadType);
    const disabled = disabledMessage !== "";

    const downloadTypeElement = (
      <div
        className={cx(
          cs.downloadType,
          selected && cs.selected,
          disabled && cs.disabled,
        )}
        key={downloadType.type}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        onClick={() => !disabled && onSelect(downloadType.type)}
      >
        <RadioButton
          disabled={disabled}
          className={cs.radioButton}
          selected={selected}
        />
        <div className={cs.content}>
          <div className={cs.name}>
            {downloadType.display_name}
            {downloadType.file_type_display && (
              <span className={cs.fileType}>
                &nbsp;({downloadType.file_type_display})
              </span>
            )}
            {downloadType.admin_only && (
              <StatusLabel inline status="Admin Only" />
            )}
            {downloadType.required_allowed_feature && (
              <StatusLabel inline status="Beta" />
            )}
          </div>
          <div className={cs.description}>
            {downloadType.description}{" "}
            {downloadType.type === "biom_format" ? (
              <>
                <ExternalLink href="https://biom-format.org/">
                  BIOM
                </ExternalLink>{" "}
                format compatible with{" "}
                <ExternalLink href="https://microbiomedb.org/mbio/app">
                  MicrobiomeDB
                </ExternalLink>
                .{" "}
              </>
            ) : (
              ""
            )}
            {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
            {downloadType.type in BULK_DOWNLOAD_DOCUMENTATION_LINKS ? (
              <ExternalLink
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
                href={BULK_DOWNLOAD_DOCUMENTATION_LINKS[downloadType.type]}
              >
                Learn More
              </ExternalLink>
            ) : (
              ""
            )}
          </div>
          {downloadType.fields && selected && (
            <div className={cs.fields}>
              {downloadType.fields.map(field =>
                renderOption(downloadType, field),
              )}
              {downloadType.type === "biom_format" && (
                <div className={cs.description}>
                  To apply more filters, download directly from
                  <span
                    role="link"
                    className={LinkCS.linkDefault}
                    tabIndex={0}
                    onClick={e => {
                      handleHeatmapLink();
                      e.stopPropagation();
                    }}
                    onKeyDown={handleHeatmapLink}
                  >
                    {" "}
                    heatmap
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );

    if (disabled && disabledMessage) {
      return (
        <BasicPopup
          key={downloadType.type}
          trigger={downloadTypeElement}
          content={disabledMessage}
        />
      );
    } else {
      return downloadTypeElement;
    }
  };

  const renderDownloadTypes = () => {
    if (!downloadTypes) {
      return <LoadingMessage message="Loading download types..." />;
    }

    const visibleTypes = downloadTypes.filter(
      type =>
        Object.prototype.hasOwnProperty.call(type, "category") &&
        !type.hide_in_creation_modal,
    );

    const designatedOrder = ["results", "reports", "raw_data"];

    // for CG bulk downloads v0, just don't display any categories
    if (
      visibleTypes.some(
        type => type.display_name === WORKFLOW_TABS.CONSENSUS_GENOME,
      )
    ) {
      visibleTypes.sort(
        (typeA, typeB) =>
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          designatedOrder.indexOf(typeA.category) -
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          designatedOrder.indexOf(typeB.category),
      );
      return (
        <div className={cs.category}>
          {visibleTypes.map(renderDownloadType)}
        </div>
      );
    }

    const backendCategories = [
      ...new Set(visibleTypes.map(type => type.category)),
    ];
    const additionalCategories = backendCategories.filter(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      category => !designatedOrder.includes(category),
    );
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
    const categories = designatedOrder.concat(additionalCategories);

    const computedDownloadTypes = categories.map(category => {
      const categoryTypes = filter(["category", category], visibleTypes);
      if (categoryTypes.length < 1) {
        return;
      }
      return (
        <div className={cs.category} key={category}>
          <div className={cs.title}>{humanize(category)}</div>
          {categoryTypes.map(renderDownloadType)}
        </div>
      );
    });

    return <React.Fragment>{computedDownloadTypes}</React.Fragment>;
  };

  return (
    <div className={cs.downloadTypeContainer}>{renderDownloadTypes()}</div>
  );
};

export default BulkDownloadModalOptions;
