import React from "react";
import PropTypes from "prop-types";
import { get, find } from "lodash/fp";
import cx from "classnames";

import cs from "./bulk_download_summary.scss";

class BulkDownloadSummary extends React.Component {
  renderDownloadParam = (param, value) => {
    const { downloadType } = this.props;
    const fieldDisplayName =
      get("display_name", find(["type", param], downloadType.fields)) || "";

    return (
      <div className={cs.param} key={param}>
        <div className={cs.name}>{fieldDisplayName}</div>
        <div className={cs.value}>{value}</div>
      </div>
    );
  };

  render() {
    const { className, downloadSummary, downloadType } = this.props;
    return (
      <div className={cx(cs.bulkDownloadSummary, className)}>
        <div className={cs.title}>
          <div className={cs.name}>{downloadType.display_name}</div>
          <div className={cs.numSamples}>
            &nbsp;for {downloadSummary.numSamples} sample{downloadSummary.numSamples ===
            1
              ? ""
              : "s"}
          </div>
        </div>
        {downloadSummary.params && (
          <div className={cs.params}>
            {Object.entries(downloadSummary.params).map(([key, value]) =>
              this.renderDownloadParam(key, value)
            )}
          </div>
        )}
      </div>
    );
  }
}

BulkDownloadSummary.propTypes = {
  className: PropTypes.string,
  downloadSummary: PropTypes.shape({
    params: PropTypes.object,
    numSamples: PropTypes.number,
  }).isRequired,
  downloadType: PropTypes.shape({
    display_name: PropTypes.string,
    fields: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        display_name: PropTypes.string,
      })
    ),
  }).isRequired,
};

export default BulkDownloadSummary;
