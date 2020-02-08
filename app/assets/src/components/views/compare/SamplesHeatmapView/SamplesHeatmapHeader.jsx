import React from "react";
import PropTypes from "prop-types";

import BasicPopup from "~/components/BasicPopup";
import StatusLabel from "~ui/labels/StatusLabel";
import { SaveButton, ShareButton } from "~ui/controls/buttons";
import { DownloadButtonDropdown } from "~ui/controls/dropdowns";
import { withAnalytics, logAnalyticsEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import { ViewHeader } from "~/components/layout";

import cs from "./samples_heatmap_view.scss";

const DOWNLOAD_OPTIONS = [
  { text: "Download CSV", value: "csv" },
  { text: "Download SVG", value: "svg" },
  { text: "Download PNG", value: "png" },
];

const NCOV_PUBLIC_SITE = true;

export default class SamplesHeatmapHeader extends React.Component {
  handleDownloadClick = fileType => {
    switch (fileType) {
      case "svg":
        // TODO (gdingle): pass in filename per sample?
        this.props.onDownloadSvg();
        break;
      case "png":
        // TODO (gdingle): pass in filename per sample?
        this.props.onDownloadPng();
        break;
      case "csv":
        this.props.onDownloadCsv();
        break;
      default:
        break;
    }
    logAnalyticsEvent("SamplesHeatmapHeader_download-button_clicked", {
      sampleIds: this.props.sampleIds.length,
      fileType,
    });
  };

  render() {
    const { sampleIds } = this.props;
    const { allowedFeatures } = this.context || {};

    return (
      <ViewHeader className={cs.viewHeader}>
        <ViewHeader.Content>
          <ViewHeader.Pretitle>
            <React.Fragment>
              Heatmap
              {allowedFeatures.includes("heatmap_filter_fe") && (
                <StatusLabel
                  status="Beta - Client Filtering"
                  type="info"
                  inline={true}
                />
              )}
            </React.Fragment>
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
                  this.props.onShareClick,
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
          {!NCOV_PUBLIC_SITE && (
            <SaveButton
              onClick={withAnalytics(
                this.props.onSaveClick,
                "SamplesHeatmapHeader_save-button_clicked",
                {
                  sampleIds: sampleIds.length,
                  path: window.location.pathname,
                }
              )}
              className={cs.controlElement}
            />
          )}
          <DownloadButtonDropdown
            className={cs.controlElement}
            options={DOWNLOAD_OPTIONS}
            onClick={this.handleDownloadClick}
            disabled={!this.props.data}
          />
        </ViewHeader.Controls>
      </ViewHeader>
    );
  }
}

SamplesHeatmapHeader.propTypes = {
  sampleIds: PropTypes.arrayOf(PropTypes.number),
  data: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
  ),
  onDownloadSvg: PropTypes.func.isRequired,
  onDownloadPng: PropTypes.func.isRequired,
  onDownloadCsv: PropTypes.func.isRequired,
  onShareClick: PropTypes.func.isRequired,
  onSaveClick: PropTypes.func.isRequired,
};

SamplesHeatmapHeader.contextType = UserContext;
