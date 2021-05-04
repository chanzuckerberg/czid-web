import React, { useContext } from "react";
import PropTypes from "prop-types";

import BasicPopup from "~/components/BasicPopup";
import { HelpButton, SaveButton, ShareButton } from "~ui/controls/buttons";
import { DownloadButtonDropdown } from "~ui/controls/dropdowns";
import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import {
  showAppcue,
  SAMPLES_HEATMAP_HEADER_HELP_SIDEBAR,
} from "~/components/utils/appcues";
import { logError } from "~/components/utils/logUtil";
import { ViewHeader } from "~/components/layout";
import { triggerFileDownload } from "~/components/utils/clientDownload";
import { logDownloadOption } from "~/components/views/report/utils/download";
import { UserContext } from "~/components/common/UserContext";
import { DOWNLOAD_OPTIONS } from "./constants";

import cs from "./samples_heatmap_view.scss";

const SamplesHeatmapHeader = ({
  sampleIds,
  data,
  onDownloadAllHeatmapMetricsCsv,
  onDownloadCurrentHeatmapViewCsv,
  onDownloadSvg,
  onDownloadPng,
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

  return (
    <ViewHeader className={cs.viewHeader}>
      <ViewHeader.Content>
        <ViewHeader.Pretitle>
          <React.Fragment>Heatmap</React.Fragment>
        </ViewHeader.Pretitle>
        <ViewHeader.Title
          label={`Comparing ${sampleIds ? sampleIds.length : ""} Samples`}
        />
      </ViewHeader.Content>
      <ViewHeader.Controls className={cs.controls}>
        <BasicPopup
          trigger={
            <ShareButton
              onClick={withAnalytics(
                onShareClick,
                "SamplesHeatmapHeader_share-button_clicked",
                {
                  sampleIds: sampleIds.length,
                }
              )}
              className={cs.controlElement}
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
            }
          )}
          className={cs.controlElement}
        />
        <DownloadButtonDropdown
          className={cs.controlElement}
          options={DOWNLOAD_OPTIONS}
          onClick={handleDownloadClick}
          disabled={!data}
        />
        {allowedFeatures.includes("appcues") && (
          <HelpButton
            className={cs.controlElement}
            onClick={showAppcue({
              flowId: SAMPLES_HEATMAP_HEADER_HELP_SIDEBAR,
              analyticEventName:
                ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_HEADER_HELP_BUTTON_CLICKED,
            })}
          />
        )}
      </ViewHeader.Controls>
    </ViewHeader>
  );
};

SamplesHeatmapHeader.propTypes = {
  sampleIds: PropTypes.arrayOf(PropTypes.number),
  data: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
  ),
  onDownloadSvg: PropTypes.func.isRequired,
  onDownloadPng: PropTypes.func.isRequired,
  onDownloadAllHeatmapMetricsCsv: PropTypes.func.isRequired,
  onDownloadCurrentHeatmapViewCsv: PropTypes.func.isRequired,
  onShareClick: PropTypes.func.isRequired,
  onSaveClick: PropTypes.func.isRequired,
};

export default SamplesHeatmapHeader;
