import querystring from "querystring";
import { isEmpty, isNull } from "lodash/fp";
import React from "react";
import SvgSaver from "svgsaver";

import DownloadButtonDropdown from "~/components/ui/controls/dropdowns/DownloadButtonDropdown";
import { triggerFileDownload } from "~/components/utils/clientDownload";
import { logError } from "~/components/utils/logUtil";
import PropTypes from "~/components/utils/propTypes";
import { showToast } from "~/components/utils/toast";
import {
  getDownloadDropdownOptions,
  getLinkInfoForDownloadOption,
  logDownloadOption,
} from "~/components/views/report/utils/download";
import { ErrorButton } from "~ui/controls/buttons";
import Notification from "~ui/notifications/Notification";
import { TABS } from "./constants";

const PipelineRunSampleViewControls = ({
  backgroundId,
  className,
  currentTab,
  deletable,
  editable,
  getDownloadReportTableWithAppliedFiltersLink,
  hasAppliedFilters,
  onDeleteSample,
  pipelineRun,
  reportMetadata,
  sample,
  view,
}) => {
  const downloadCSV = () => {
    const resParams = {
      ...(backgroundId && { background_id: backgroundId }),
      ...(pipelineRun &&
        pipelineRun.pipeline_version && {
          pipeline_version: pipelineRun.pipeline_version,
        }),
    };
    location.href = `/samples/${sample.id}/report_csv?${querystring.stringify(
      resParams,
    )}`;
  };

  const handleDownload = option => {
    switch (option) {
      case "download_csv":
        isNull(backgroundId) && renderNoBackgroundSelectedNotification();
        downloadCSV();
        break;
      case "download_csv_with_filters":
        isNull(backgroundId) && renderNoBackgroundSelectedNotification();
        triggerFileDownload({
          downloadUrl: getDownloadReportTableWithAppliedFiltersLink(),
          fileName: `${sample.name}_report_with_applied_filters.csv`,
        });
        break;
      case "taxon_svg":
        new SvgSaver().asSvg(getTaxonTreeNode(), "taxon_tree.svg");
        break;
      case "taxon_png":
        new SvgSaver().asPng(getTaxonTreeNode(), "taxon_tree.png");
        break;
      default: {
        const linkInfo = getLinkInfoForDownloadOption(
          option,
          sample.id,
          pipelineRun,
        );

        if (linkInfo) {
          window.open(linkInfo.path, linkInfo.newPage ? "_blank" : "_self");
        } else {
          logError({
            message:
              "PipelineRunSampleViewControls: Invalid option passed to handleDownload",
            details: { option },
          });
        }
        break;
      }
    }

    logDownloadOption({
      component: "PipelineRunSampleViewControls",
      option,
      details: {
        sampleId: sample.id,
        sampleName: sample.name,
      },
    });
  };

  const renderNoBackgroundSelectedNotification = () =>
    showToast(
      ({ closeToast }) => (
        <Notification
          type="info"
          displayStyle="elevated"
          onClose={closeToast}
          closeWithIcon
        >
          The downloaded report will not contain the aggregate and z-score
          columns because a background model was not selected.
        </Notification>
      ),
      { autoClose: 12000 },
    );

  // TODO (gdingle): should we pass in a reference with React somehow?
  const getTaxonTreeNode = () => {
    return document.getElementsByClassName("taxon-tree-vis")[0];
  };

  const getImageDownloadOptions = () => {
    if (view === "tree") {
      return [
        { text: "Download Taxon Tree as SVG", value: "taxon_svg" },
        { text: "Download Taxon Tree as PNG", value: "taxon_png" },
      ];
    }
    return [];
  };

  const renderDownloadButtonDropdown = () => {
    const downloadOptions = [
      {
        text: "Download Report Table (.csv)",
        value: "download_csv",
        disabled: currentTab === TABS.MERGED_NT_NR,
      },
      {
        text: "Download Report Table with Applied Filters (.csv)",
        value: "download_csv_with_filters",
        disabled: !hasAppliedFilters,
      },
      ...getDownloadDropdownOptions(pipelineRun),
      ...getImageDownloadOptions(),
    ];

    return (
      <DownloadButtonDropdown
        className={className}
        options={downloadOptions}
        onClick={handleDownload}
        direction="left"
      />
    );
  };

  if (!!reportMetadata.reportReady && pipelineRun) {
    return renderDownloadButtonDropdown();
  } else if (!isEmpty(reportMetadata) && editable && deletable) {
    return (
      <ErrorButton
        className={className}
        onClick={onDeleteSample}
        text="Delete Sample"
      />
    );
  } else {
    return null;
  }
};

PipelineRunSampleViewControls.defaultProps = {
  deletable: false,
};

PipelineRunSampleViewControls.propTypes = {
  backgroundId: PropTypes.number,
  className: PropTypes.string,
  currentTab: PropTypes.string,
  deletable: PropTypes.bool,
  editable: PropTypes.bool,
  getDownloadReportTableWithAppliedFiltersLink: PropTypes.func,
  hasAppliedFilters: PropTypes.bool,
  onDeleteSample: PropTypes.func,
  pipelineRun: PropTypes.PipelineRun,
  reportMetadata: PropTypes.ReportMetadata,
  sample: PropTypes.Sample,
  view: PropTypes.string,
};

export default PipelineRunSampleViewControls;
