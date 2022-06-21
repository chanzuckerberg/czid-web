import PropTypes from "prop-types";
import React, { useContext } from "react";

import {
  ANALYTICS_EVENT_NAMES,
  withAnalytics,
  trackEvent,
} from "~/api/analytics";
import { updateHeatmapName } from "~/api/visualization";
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import { ViewHeader } from "~/components/layout";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import EditableInput from "~/components/ui/controls/EditableInput";
import {
  showAppcue,
  SAMPLES_HEATMAP_HEADER_HELP_SIDEBAR,
} from "~/components/utils/appcues";
import { triggerFileDownload } from "~/components/utils/clientDownload";
import { logError } from "~/components/utils/logUtil";
import { logDownloadOption } from "~/components/views/report/utils/download";
import {
  replaceSpecialCharacters,
  testForSpecialCharacters,
} from "~/helpers/strings";
import {
  PrimaryButton,
  HelpButton,
  SaveButton,
  ShareButton,
} from "~ui/controls/buttons";

import { DownloadButtonDropdown } from "~ui/controls/dropdowns";
import { IconFilters } from "~ui/icons";
import {
  DOWNLOAD_OPTIONS,
  TAXON_HEATMAP_MODAL_SAMPLES_MINIMUM,
} from "./constants";

import cs from "./samples_heatmap_view.scss";

const SamplesHeatmapHeader = ({
  sampleIds,
  data,
  heatmapId,
  heatmapName,
  onDownloadAllHeatmapMetricsCsv,
  onDownloadCurrentHeatmapViewCsv,
  onDownloadSvg,
  onDownloadPng,
  onNewPresetsClick,
  onShareClick,
  onSaveClick,
}) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};
  const handleDownloadClick = option => {
    switch (option) {
      case "svg":
        onDownloadSvg();
        break;
      case "png":
        onDownloadPng();
        break;
      case "csv_metrics":
        onDownloadAllHeatmapMetricsCsv();
        break;
      case "current_heatmap_view_csv":
        triggerFileDownload({
          downloadUrl: onDownloadCurrentHeatmapViewCsv(),
          fileName: "current_heatmap_view.csv",
        });
        break;
      default:
        logError({
          message:
            "SamplesHeatmapHeader: Invalid option passed to handleDownloadClick",
          details: { option },
        });
        break;
    }

    logDownloadOption({
      component: "SamplesHeatmapHeader",
      option,
      details: {
        sampleIds: sampleIds.length,
        option,
      },
    });
  };

  const handleHeatmapRename = async name => {
    if (name === "heatmap") return "";
    let error = "";

    name = replaceSpecialCharacters(name);

    try {
      await updateHeatmapName(heatmapId, name);
      trackEvent(ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_HEADER_NAME_RENAMED, {
        id: heatmapId,
        heatmapName: name,
      });
    } catch (e) {
      error = "There was an error renaming your heatmap";
    }
    return [error, name];
  };

  const getWarningMessage = inputText => {
    return testForSpecialCharacters(inputText)
      ? 'The special character(s) you entered will be converted to "-"'
      : "";
  };

  const showNewPresetsButton =
    allowedFeatures.includes("taxon_heatmap_presets") &&
    sampleIds.length > TAXON_HEATMAP_MODAL_SAMPLES_MINIMUM;
  return (
    <ViewHeader className={cs.viewHeader}>
      <ViewHeader.Content>
        <ViewHeader.Pretitle>
          <>Comparing {sampleIds ? sampleIds.length : ""} Samples</>
        </ViewHeader.Pretitle>
        <ViewHeader.Title
          label={
            heatmapId != null ? (
              <EditableInput
                value={heatmapName || "Heatmap"}
                className={cs.name}
                onDoneEditing={handleHeatmapRename}
                getWarningMessage={getWarningMessage}
              />
            ) : (
              <>Heatmap</>
            )
          }
        />
      </ViewHeader.Content>
      <ViewHeader.Controls className={cs.controls}>
        {showNewPresetsButton && (
          <ColumnHeaderTooltip
            trigger={
              <PrimaryButton
                text="New Presets"
                icon={<IconFilters />}
                onClick={withAnalytics(
                  onNewPresetsClick,
                  ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_HEADER_NEW_PRESETS_BUTTON_CLICKED,
                )}
              />
            }
            content="Create a new heatmap for the same sample set."
          />
        )}
        <BasicPopup
          trigger={
            <ShareButton
              className={cs.controlElement}
              onClick={withAnalytics(
                onShareClick,
                "SamplesHeatmapHeader_share-button_clicked",
                {
                  sampleIds: sampleIds.length,
                },
              )}
              primary={!showNewPresetsButton}
            />
          }
          content="A shareable URL was copied to your clipboard!"
          on="click"
          hideOnScroll
        />
        <SaveButton
          onClick={withAnalytics(
            onSaveClick,
            "SamplesHeatmapHeader_save-button_clicked",
            {
              sampleIds: sampleIds.length,
              path: window.location.pathname,
            },
          )}
          className={cs.controlElement}
        />
        <DownloadButtonDropdown
          className={cs.controlElement}
          options={DOWNLOAD_OPTIONS}
          onClick={handleDownloadClick}
          disabled={!data}
        />
        <HelpButton
          className={cs.controlElement}
          onClick={showAppcue({
            flowId: SAMPLES_HEATMAP_HEADER_HELP_SIDEBAR,
            analyticEventName:
              ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_HEADER_HELP_BUTTON_CLICKED,
          })}
        />
      </ViewHeader.Controls>
    </ViewHeader>
  );
};

SamplesHeatmapHeader.propTypes = {
  sampleIds: PropTypes.arrayOf(PropTypes.number),
  data: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  ),
  heatmapId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  heatmapName: PropTypes.string,
  onDownloadSvg: PropTypes.func.isRequired,
  onDownloadPng: PropTypes.func.isRequired,
  onDownloadAllHeatmapMetricsCsv: PropTypes.func.isRequired,
  onDownloadCurrentHeatmapViewCsv: PropTypes.func.isRequired,
  onNewPresetsClick: PropTypes.func,
  onShareClick: PropTypes.func.isRequired,
  onSaveClick: PropTypes.func.isRequired,
};

export default SamplesHeatmapHeader;
