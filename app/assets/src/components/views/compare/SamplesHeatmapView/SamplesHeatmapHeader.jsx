import React, { useContext } from "react";
import PropTypes from "prop-types";

import BasicPopup from "~/components/BasicPopup";
import { HelpButton, SaveButton, ShareButton } from "~ui/controls/buttons";
import { DownloadButtonDropdown } from "~ui/controls/dropdowns";
import { withAnalytics } from "~/api/analytics";
import { logError } from "~/components/utils/logUtil";
import { ViewHeader } from "~/components/layout";
import { triggerCSVDownload } from "~/components/utils/csv";
import { logDownloadOption } from "~/components/views/report/utils/download";
import { UserContext } from "~/components/common/UserContext";

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
  const DOWNLOAD_OPTIONS = [
    { text: "Download All Heatmap Metrics (.csv)", value: "csv_metrics" },
    {
      text: "Download Current Heatmap View (.csv)",
      value: "current_heatmap_view_csv",
    },
    { text: "Download SVG", value: "svg" },
    { text: "Download PNG", value: "png" },
  ];

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
        triggerCSVDownload({
          csvDownloadUrl: onDownloadCurrentHeatmapViewCsv(),
          fileName: "current_heatmap_view",
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

  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

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
            // eslint-disable-next-line no-console
            onClick={() => console.log("TODO: connect to AppCues")}
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
