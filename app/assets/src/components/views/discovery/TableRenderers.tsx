import { Icon, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import { at, get, isNil } from "lodash/fp";
import moment from "moment";
import React from "react";
import BasicPopup from "~/components/BasicPopup";
import { AMR_V3_FEATURE } from "~/components/utils/features";
import { numberWithCommas } from "~/helpers/strings";
import StatusLabel from "~ui/labels/StatusLabel";
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
    const icon = visibilityIconRenderer(item);
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
            trigger={
              <div className={cs.itemName} data-testid="project-name">
                {nameRenderer(item)}
              </div>
            }
            content={nameRenderer(item)}
          />
          {descriptionRenderer && item && item.description && (
            <BasicPopup
              trigger={
                <div
                  className={cs.itemDescription}
                  data-testid="project-description"
                >
                  {descriptionRenderer(item)}
                </div>
              }
              content={descriptionRenderer(item)}
              wide="very"
              inverted={false}
            />
          )}
          <div className={cs.itemDetails} data-testid="created-by">
            {detailsRenderer(item)}
          </div>
        </div>
      </div>
    );
  };

  static renderSampleCounts = ({ cellData: counts, allowedFeatures }) => {
    const [
      numberOfSamples,
      mngsAnalysisRunsCount,
      cgAnlaysisRunsCount,
      amrAnalysisRunsCount,
    ] = at(
      [
        "number_of_samples",
        "mngs_runs_count",
        "cg_runs_count",
        "amr_runs_count",
      ],
      counts,
    );

    const hasAllCounts =
      !isNil(numberOfSamples) &&
      !isNil(mngsAnalysisRunsCount) &&
      !isNil(cgAnlaysisRunsCount) &&
      !isNil(amrAnalysisRunsCount);
    return (
      hasAllCounts && (
        <div className={cs.counts}>
          <div
            className={cs.sampleCount}
            data-testid="sample-counts"
          >{`${numberOfSamples} Sample${
            numberOfSamples !== 1 ? "s" : ""
          }`}</div>
          <div
            className={cs.analysesCounts}
            data-testid="nmgs-cg-sample-counts"
          >
            {`${mngsAnalysisRunsCount} mNGS`} | {`${cgAnlaysisRunsCount} CG`}
            {allowedFeatures.includes(AMR_V3_FEATURE)
              ? ` | ${amrAnalysisRunsCount} AMR`
              : ""}
          </div>
        </div>
      )
    );
  };

  static baseRenderer = data => {
    return (
      <div className={cs.base} data-testid={data}>
        {data}
      </div>
    );
  };

  static baseRendererWithTooltip = ({ cellData }) => {
    return (
      <Tooltip
        arrow
        placement="top-start"
        title={cellData}
        width="wide"
        sdsStyle="dark"
      >
        <div className={cs.base}>{cellData}</div>
      </Tooltip>
    );
  };

  static renderList = ({ cellData: list }) => {
    return TableRenderers.baseRenderer(
      list && list.length > 0 ? list.join(", ") : "",
    );
  };

  static renderDate = ({ cellData: date }) => {
    return (
      <div className={cs.date} data-testid="date-created">
        {date ? moment(date).format("YYYY-MM-DD") : ""}
      </div>
    );
  };

  static renderDateWithElapsed = ({ cellData: date }) => {
    return (
      <div className={cs.dateContainer}>
        {TableRenderers.renderDate({ cellData: date })}
        <div className={cs.elapsed} data-testid="days-elapsed">
          {date ? moment(date).fromNow() : ""}
        </div>
      </div>
    );
  };

  static renderSampleInfo = ({ rowData, full = true, basicIcon = false }) => {
    const sample = get("sample", rowData);
    const sampleName = get("name", sample);
    let status;

    if (sample) {
      if (sample.uploadError) status = sample.uploadError;
      // If the sample does not have an upload error, set status to the workflow run status.
      else status = get("status", rowData);
    }

    return (
      <div className={cs.sample}>
        {full && (
          <div className={cs.visibility}>
            {sample &&
              (basicIcon ? (
                <div className={cs.iconFlask}>
                  <Icon sdsIcon="flask" sdsSize="xl" sdsType="static" />
                </div>
              ) : sample.publicAccess ? (
                <Icon sdsIcon="flaskPublic" sdsSize="xl" sdsType="static" />
              ) : (
                <Icon sdsIcon="flaskPrivate" sdsSize="xl" sdsType="static" />
              ))}
          </div>
        )}
        <div className={cs.sampleRightPane}>
          {sample ? (
            <div className={cs.sampleNameAndStatus}>
              <BasicPopup
                trigger={<div className={cs.sampleName}>{sampleName}</div>}
                content={sampleName}
              />
              <StatusLabel
                className={cs.sampleStatus}
                status={status}
                type={STATUS_TYPE[status]}
              />
            </div>
          ) : (
            <div className={cs.sampleNameAndStatus} />
          )}
          {sample ? (
            <div className={cs.sampleDetails}>
              <span className={cs.user}>
                {sample?.userNameWhoInitiatedWorkflowRun || sample.user}
              </span>
              |<span className={cs.project}>{sample.project}</span>
            </div>
          ) : (
            <div className={cs.sampleDetails} />
          )}
        </div>
      </div>
    );
  };

  static renderSample = ({ sample, full = true, basicIcon = false }) => {
    const sampleName = get("name", sample);
    let sampleStatus;

    if (sample) {
      sampleStatus = sample.uploadError
        ? sample.uploadError
        : sample.pipelineRunStatus;
    }

    return (
      <div className={cs.sample}>
        {full && (
          <div className={cs.visibility}>
            {sample &&
              (basicIcon ? (
                <div className={cs.iconFlask}>
                  <Icon sdsIcon="flask" sdsSize="xl" sdsType="static" />
                </div>
              ) : sample.publicAccess ? (
                <Icon sdsIcon="flaskPublic" sdsSize="xl" sdsType="static" />
              ) : (
                <Icon sdsIcon="flaskPrivate" sdsSize="xl" sdsType="static" />
              ))}
          </div>
        )}
        <div className={cs.sampleRightPane}>
          {sample ? (
            <div className={cs.sampleNameAndStatus}>
              <BasicPopup
                trigger={
                  <div className={cs.sampleName} data-testid="sample-name">
                    {sampleName}
                  </div>
                }
                content={sampleName}
              />
              <StatusLabel
                className={cs.sampleStatus}
                status={sampleStatus}
                type={STATUS_TYPE[sampleStatus]}
              />
            </div>
          ) : (
            <div className={cs.sampleNameAndStatus} />
          )}
          {sample ? (
            <div className={cs.sampleDetails}>
              <span className={cs.user} data-testid="uploaded-by">
                {sample.user}
              </span>
              |
              <span className={cs.project} data-testid="sample-project">
                {sample.project}
              </span>
            </div>
          ) : (
            <div className={cs.sampleDetails} data-testid="uploaded-by" />
          )}
        </div>
      </div>
    );
  };

  static renderReferenceAccession = cellData => {
    const accessionName = get("accessionName", cellData);
    const referenceAccessionId = get("referenceAccessionId", cellData);
    const taxonName = get("taxonName", cellData);

    const accessionContent = () => {
      if (referenceAccessionId && accessionName) {
        return `${referenceAccessionId} - ${accessionName}`;
      } else if (referenceAccessionId && !accessionName) {
        return referenceAccessionId;
      } else if (!referenceAccessionId && accessionName) {
        return accessionName;
      } else {
        return <div className={cs.missingAccessionContent}>&mdash;</div>;
      }
    };

    const taxonContent = () => {
      return (
        taxonName ?? <div className={cs.missingAccessionContent}>&mdash;</div>
      );
    };

    const content = (
      <div>
        <div className={cs.title}>{accessionContent()}</div>
        <div className={cs.details}>{taxonContent()}</div>
      </div>
    );

    return (
      <BasicPopup
        basic={false}
        trigger={<div className={cs.referenceAccession}>{content}</div>}
        content={<div className={cs.referenceAccessionTooltip}>{content}</div>}
      />
    );
  };

  static renderVisualization = ({
    cellData: item,
    detailsRenderer,
    nameRenderer,
    statusRenderer,
    visibilityIconRenderer,
  }) => {
    const icon = visibilityIconRenderer(item);
    return (
      <div className={cs.visualization}>
        <div className={cs.visibility}>
          {icon &&
            React.cloneElement(icon, {
              className: `${cx(cs.icon, icon.props.className)}`,
            })}
        </div>
        <div className={cs.vizRightPane}>
          <div className={cs.vizNameAndStatus}>
            <BasicPopup
              trigger={<div className={cs.vizName}>{nameRenderer(item)}</div>}
              content={nameRenderer(item)}
            />
            {statusRenderer && item && item.status && (
              <div className={cs.vizStatus}>{statusRenderer(item)}</div>
            )}
          </div>
          <div className={cs.vizDetails}>{detailsRenderer(item)}</div>
        </div>
      </div>
    );
  };

  static renderNtNrValue = ({ cellData }) => {
    const { nt, nr } = cellData || {};

    return (
      nt &&
      nr && (
        <div className={cs.ntNrContainer}>
          <div className={cs.ntNrSection}>
            <h5 className={cs.ntNrHeader}>NT</h5>
            <h6 className={cs.ntNrValue}>{nt?.toFixed(3)}</h6>
          </div>
          |
          <div className={cs.ntNrSection}>
            <h5 className={cs.ntNrHeader}>NR</h5>
            <h6 className={cs.ntNrValue}>{nr?.toFixed(3)}</h6>
          </div>
        </div>
      )
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
    return rounded < 0.01 ? "<0.01%" : `${Math.min(100, rounded)}%`;
  };

  static formatDuration = runtime => {
    const h = Math.floor(runtime / 3600);
    const m = Math.floor((runtime % 3600) / 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute" : " minutes") : "";
    return hDisplay + mDisplay;
  };

  static format10BaseExponent = (logValue: number) => {
    if (!logValue) return logValue;
    const roundedInteger = Math.round(logValue);
    return (
      <div className={cs.exponent}>
        10<sup>{roundedInteger}</sup>
      </div>
    );
  };
}

export default TableRenderers;
