import React from "react";

import cx from "classnames";
import moment from "moment";

import BasicPopup from "~/components/BasicPopup";
import SamplePublicIcon from "~ui/icons/SamplePublicIcon";
import SamplePrivateIcon from "~ui/icons/SamplePrivateIcon";
import StatusLabel from "~ui/labels/StatusLabel";
import { numberWithCommas } from "~/helpers/strings";

// CSS file must be loaded after any elements you might want to override
import cs from "./table_renderers.scss";

const STATUS_TYPE = {
  complete: "success",
  failed: "error",
  "complete - issue": "warning",
  "complete*": "warning",
  "post processing": "default",
  "host filtering": "default",
  alignment: "default",
  waiting: "default",
  skipped: "info",
};

class TableRenderers extends React.Component {
  static renderItemDetails = ({
    cellData: item,
    detailsRenderer,
    descriptionRenderer,
    nameRenderer,
    visibilityIconRenderer,
  }) => {
    let icon = visibilityIconRenderer(item);
    return (
      <div className={cs.item}>
        <div className={cs.visibility}>
          {icon &&
            React.cloneElement(icon, {
              className: `${cx(cs.icon, icon.props.className)}`,
            })}
        </div>
        <div className={cs.itemRightPane}>
          <BasicPopup
            trigger={<div className={cs.itemName}>{nameRenderer(item)}</div>}
            content={nameRenderer(item)}
          />
          {descriptionRenderer &&
            item &&
            item.description && (
              <BasicPopup
                trigger={
                  <div className={cs.itemDescription}>
                    {descriptionRenderer(item)}
                  </div>
                }
                content={descriptionRenderer(item)}
                wide="very"
              />
            )}
          <div className={cs.itemDetails}>{detailsRenderer(item)}</div>
        </div>
      </div>
    );
  };

  static baseRenderer = data => {
    return <div className={cs.base}>{data}</div>;
  };

  static renderList = ({ cellData: list }) => {
    return TableRenderers.baseRenderer(
      list && list.length > 0 ? list.join(", ") : ""
    );
  };

  static renderDate = ({ cellData: date }) => {
    return (
      <div className={cs.date}>
        {date ? moment(date).format("YYYY-MM-DD") : ""}
      </div>
    );
  };

  static renderDateWithElapsed = ({ cellData: date }) => {
    return (
      <div className={cs.dateContainer}>
        {TableRenderers.renderDate({ cellData: date })}
        <div className={cs.elapsed}>{date ? moment(date).fromNow() : ""}</div>
      </div>
    );
  };

  static renderSample = ({ cellData: sample }, full = true) => {
    return (
      <div className={cs.sample}>
        {full && (
          <div className={cs.visibility}>
            {sample &&
              (sample.publicAccess ? (
                <SamplePublicIcon className={cx(cs.icon)} />
              ) : (
                <SamplePrivateIcon className={cx(cs.icon)} />
              ))}
          </div>
        )}
        <div className={cs.sampleRightPane}>
          {sample ? (
            <div className={cs.sampleNameAndStatus}>
              <BasicPopup
                trigger={<div className={cs.sampleName}>{sample.name}</div>}
                content={sample.name}
              />
              <StatusLabel
                className={cs.sampleStatus}
                status={sample.status}
                type={STATUS_TYPE[sample.status]}
              />
            </div>
          ) : (
            <div className={cs.sampleNameAndStatus} />
          )}
          {sample ? (
            <div className={cs.sampleDetails}>
              <span className={cs.user}>{sample.user}</span>|
              <span className={cs.project}>{sample.project}</span>
            </div>
          ) : (
            <div className={cs.sampleDetails} />
          )}
        </div>
      </div>
    );
  };

  static formatNumberWithCommas = value => {
    return numberWithCommas(value);
  };

  static renderNumberAndPercentage = ({ cellData: number }) => {
    return (
      <div className={cs.numberValueAndPercentage}>
        <div className={cs.value}>
          {number && numberWithCommas(number.value)}
        </div>
        <div className={cs.percentage}>
          {number && TableRenderers.formatPercentage(number.percent)}
        </div>
      </div>
    );
  };

  static formatNumber = value => {
    if (!value) return value;
    if (!isFinite(value)) return value;
    return value.toFixed(2);
  };

  static formatPercentage = value => {
    if (!value) return value;
    const rounded = TableRenderers.formatNumber(value);
    return rounded < 0.01 ? "<0.01%" : `${rounded}%`;
  };

  static formatDuration = runtime => {
    const h = Math.floor(runtime / 3600);
    const m = Math.floor((runtime % 3600) / 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute" : " minutes") : "";
    return hDisplay + mDisplay;
  };
}

export default TableRenderers;
