import { InputRadio } from "@czi-sds/components";
import { cx } from "@emotion/css";
import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import StatusLabel from "~/components/ui/labels/StatusLabel";
import { BULK_DOWNLOAD_DOCUMENTATION_LINKS } from "~/components/views/BulkDownloadListView/constants";
import {
  BackgroundOptionType,
  MetricsOptionType,
  SelectedFieldsType,
  SelectedFieldValueType,
} from "~/components/views/DiscoveryView/components/SamplesView/components/BulkDownloadModal/types";
import { BulkDownloadType } from "~/interface/shared";
import LinkCS from "~ui/controls/link.scss";
import cs from "../../bulk_download_modal_options.scss";
import { BulkDownloadDataField } from "../BulkDownloadDataField";

interface DownloadTypeOptionProps {
  backgroundOptions?: BackgroundOptionType[] | null;
  downloadType: BulkDownloadType;
  handleHeatmapLink: () => void;
  isDisabled: boolean;
  isSelected: boolean;
  metricsOptions?: MetricsOptionType[] | null;
  onSelectDownloadType: (newSelectedDownloadTypeName: string) => void;
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

export const DownloadTypeOption = ({
  backgroundOptions,
  downloadType,
  handleHeatmapLink,
  isDisabled,
  isSelected,
  metricsOptions,
  onSelectDownloadType,
  onSelectField,
  selectedDownloadTypeName,
  selectedFields,
  shouldEnableMassNormalizedBackgrounds,
  validObjectIds,
}: DownloadTypeOptionProps) => {
  return (
    <div
      className={cx(
        cs.downloadType,
        isSelected && cs.selected,
        isDisabled && cs.disabled,
      )}
      key={downloadType.type}
      onClick={() =>
        !isDisabled &&
        downloadType.type &&
        onSelectDownloadType(downloadType.type)
      }
    >
      <InputRadio
        disabled={isDisabled}
        className={cs.radioButton}
        stage={isSelected ? "checked" : "unchecked"}
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
              <ExternalLink href="https://biom-format.org/">BIOM</ExternalLink>{" "}
              format compatible with{" "}
              <ExternalLink href="https://microbiomedb.org/mbio/app">
                MicrobiomeDB
              </ExternalLink>
              .{" "}
            </>
          ) : (
            ""
          )}
          {downloadType.type &&
          downloadType.type in BULK_DOWNLOAD_DOCUMENTATION_LINKS ? (
            <ExternalLink
              href={BULK_DOWNLOAD_DOCUMENTATION_LINKS[downloadType.type]}
            >
              Learn More
            </ExternalLink>
          ) : (
            ""
          )}
        </div>
        {downloadType.fields && isSelected && (
          <div className={cs.fields}>
            {downloadType.fields.map(field => (
              <BulkDownloadDataField
                key={field.type}
                backgroundOptions={backgroundOptions}
                downloadType={downloadType}
                field={field}
                metricsOptions={metricsOptions}
                onSelectField={onSelectField}
                selectedDownloadTypeName={selectedDownloadTypeName}
                selectedFields={selectedFields}
                shouldEnableMassNormalizedBackgrounds={
                  shouldEnableMassNormalizedBackgrounds
                }
                validObjectIds={validObjectIds}
              />
            ))}
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
};
