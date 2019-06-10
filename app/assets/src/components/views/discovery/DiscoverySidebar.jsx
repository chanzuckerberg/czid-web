import React from "react";
import cx from "classnames";
import { find, maxBy, orderBy, sumBy } from "lodash/fp";
import moment from "moment";

import { logAnalyticsEvent } from "~/api/analytics";
import PropTypes from "~/components/utils/propTypes";
import { Accordion } from "~/components/layout";
import BasicPopup from "~/components/BasicPopup";

import cs from "./discovery_sidebar.scss";

export default class DiscoverySidebar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stats: {
        numSamples: "",
        numProjects: "",
        avgTotalReads: "",
        avgAdjustedRemainingReads: ""
      },
      metadata: {
        host: [],
        tissue: [],
        time: [],
        location: []
      },
      expandedMetadataGroups: new Set()
    };
  }

  static getDerivedStateFromProps(newProps, prevState) {
    const {
      currentTab,
      loading,
      projectDimensions,
      projects,
      sampleDimensions,
      sampleStats
    } = newProps;
    if (loading) return prevState;
    const dimensions =
      currentTab === "projects" ? projectDimensions : sampleDimensions;

    return {
      stats: {
        numSamples: DiscoverySidebar.formatNumber((sampleStats || {}).count),
        numProjects: DiscoverySidebar.formatNumber(projects.length),
        avgTotalReads: DiscoverySidebar.formatNumber(
          (sampleStats || {}).avgTotalReads
        ),
        avgAdjustedRemainingReads: DiscoverySidebar.formatNumber(
          (sampleStats || {}).avgAdjustedRemainingReads
        )
      },
      metadata: {
        host: DiscoverySidebar.loadDimension(dimensions, "host"),
        tissue: DiscoverySidebar.loadDimension(dimensions, "tissue"),
        location: DiscoverySidebar.loadDimension(dimensions, "location"),
        locationV2: DiscoverySidebar.loadDimension(dimensions, "locationV2"),
        time: DiscoverySidebar.loadDimension(dimensions, "time_bins")
      }
    };
  }

  static loadDimension(dimensions, dimensionKey) {
    return (find({ dimension: dimensionKey }, dimensions) || {}).values || [];
  }

  static formatDate(date) {
    return moment(date).format("YYYY-MM-DD");
  }

  static formatNumber(value) {
    return (Math.round(value) || "").toLocaleString();
  }

  buildDateHistogram(field) {
    const { onFilterClick, currentTab } = this.props;
    const { metadata } = this.state;

    let dates = metadata[field];
    const total = (maxBy("count", dates) || {}).count;
    const isIntervalBased = !!dates.length && dates[0].interval;
    const firstDate = dates.length
      ? isIntervalBased
        ? dates[0].interval.start
        : dates[0].value
      : null;
    const lastDate = dates.length
      ? isIntervalBased
        ? dates[dates.length - 1].interval.end
        : dates[0].value
      : null;
    const formattedFirstDate = DiscoverySidebar.formatDate(firstDate);
    const formattedLastDate = DiscoverySidebar.formatDate(lastDate);

    // Special case design to show 1 or 2 bars just side-by-side.
    const realBars = dates.filter(d => d.count > 0);
    if (realBars.length < 3) dates = realBars;
    return (
      <div className={cs.histogramContainer}>
        <div className={cs.dateHistogram}>
          {dates.map(entry => {
            const percent = Math.round(100 * entry.count / total, 0);
            const element = (
              <div
                className={cs.bar}
                key={entry.value}
                style={{ height: percent + "px" }}
                onClick={() => {
                  onFilterClick && onFilterClick(entry);
                  logAnalyticsEvent("DiscoverySidebar_date-filter_clicked", {
                    dateValue: entry.value,
                    dates: dates.length,
                    count: entry.count,
                    percent
                  });
                }}
              >
                &nbsp;
              </div>
            );
            const text = entry.interval
              ? `${DiscoverySidebar.formatDate(
                  entry.interval.start
                )} - ${DiscoverySidebar.formatDate(entry.interval.end)}`
              : `${DiscoverySidebar.formatDate(entry.value)}`;
            const tooltipMessage = (
              <span>
                <span className={cs.boldText}>Date:</span> {text}
                <br />
                <span className={cs.boldText}>{`${
                  currentTab === "samples" ? "Sample" : "Project"
                }${entry.count > 1 ? "s" : ""}: `}</span>
                {entry.count}
              </span>
            );
            return (
              <BasicPopup
                key={entry.value}
                trigger={element}
                content={tooltipMessage}
              />
            );
          })}
        </div>
        <div className={cx(cs.histogramLabels, dates.length < 3 && cs.evenly)}>
          <div className={cs.label}>{formattedFirstDate}</div>
          {firstDate !== lastDate && (
            <div className={cs.label}>{formattedLastDate}</div>
          )}
        </div>
      </div>
    );
  }

  buildMetadataRows(field) {
    const { metadata, expandedMetadataGroups } = this.state;
    const dataRows = metadata[field];
    // Sort by the value desc and then by the label alphabetically
    const sorted = orderBy(["count", "text"], ["desc", "asc"], dataRows);

    // Display N fields and show/hide the rest
    const defaultN = this.props.defaultNumberOfMetadataRows;
    const defaultRows = sorted.slice(0, defaultN);
    const extraRows = sorted.slice(defaultN);
    const total = sumBy("count", dataRows);
    const linkText = expandedMetadataGroups.has(field)
      ? "Show Less"
      : "Show More";
    return (
      <dl className={cs.dataList}>
        {this.renderMetadataRowBlock(defaultRows, total)}
        {expandedMetadataGroups.has(field) &&
          this.renderMetadataRowBlock(extraRows, total)}
        {extraRows.length > 0 && (
          <div
            className={cs.showHide}
            onClick={() => {
              this.toggleExpandedMetadataGroup(field);
              logAnalyticsEvent("DiscoverySidebar_show-more-toggle_clicked", {
                field,
                extraRows: extraRows.length,
                linkText
              });
            }}
          >
            {linkText}
          </div>
        )}
      </dl>
    );
  }

  toggleExpandedMetadataGroup(field) {
    const groups = new Set(this.state.expandedMetadataGroups);
    groups.has(field) ? groups.delete(field) : groups.add(field);
    this.setState({
      expandedMetadataGroups: groups
    });
  }

  renderMetadataRowBlock(rows, total) {
    return rows.map((entry, i) => {
      const { count, text, value } = entry;
      const percent = Math.round(100 * count / total, 0);
      return (
        <div className={cs.barChartRow} key={`${value}_row_${i}`}>
          <dt className={cs.barLabel} key={`${value}_label_${i}`}>
            <a
              onClick={() => {
                this.handleFilterClick(value);
                logAnalyticsEvent("DiscoverySidebar_metadata-filter_clicked", {
                  value,
                  count,
                  percent,
                  rows: rows.length
                });
              }}
            >
              {value === "not_set" ? <i>{text}</i> : text}
            </a>
          </dt>
          <dd key={`${value}_value_${i}`}>
            <span className={cs.bar} style={{ width: percent * 1.4 + "px" }} />
            <span className={cs.count}>{count}</span>
          </dd>
        </div>
      );
    });
  }

  hasData() {
    return !!(this.state.stats.numSamples || this.state.stats.numProjects);
  }

  render() {
    const { allowedFeatures, className, currentTab, loading } = this.props;
    if (!loading && !this.hasData()) {
      return (
        <div className={cx(className, cs.sidebar)}>
          <div className={cs.noData}>
            Try another search to see summary info.
          </div>
        </div>
      );
    }

    // This represents the unique dataset loaded and will force a refresh of the
    // Accordions when it changes.
    const dataKey = this.state.stats.avgTotalReads;
    return (
      <div className={cx(className, cs.sidebar)}>
        <div className={cs.metadataContainer}>
          <Accordion
            className={cs.metadataSection}
            bottomContentPadding
            key={dataKey}
            open={this.hasData()}
            header={<div className={cs.title}>Overall</div>}
          >
            <div className={cx(cs.hasBackground, cs.statsRow)}>
              <dl className={cs.dataList}>
                <dt className={cs.statsDt}>
                  <span className={cs.rowLabel}>Samples</span>
                </dt>
                <dd className={cs.statsDd}>{this.state.stats.numSamples}</dd>
              </dl>
            </div>
            <div className={cx(cs.hasBackground, cs.statsRow)}>
              <dl className={cs.dataList}>
                <dt className={cs.statsDt}>
                  <span className={cs.rowLabel}>Projects</span>
                </dt>
                <dd className={cs.statsDd}>{this.state.stats.numProjects}</dd>
              </dl>
            </div>
            {currentTab === "samples" && (
              <div>
                <div className={cx(cs.hasBackground, cs.statsRow)}>
                  <dl className={cs.dataList}>
                    <dt className={cs.statsDt}>
                      <span className={cs.rowLabel}>Avg. reads per sample</span>
                    </dt>
                    <dd className={cs.statsDd}>
                      {this.state.stats.avgTotalReads}
                    </dd>
                  </dl>
                </div>
                <div className={cx(cs.hasBackground, cs.statsRow)}>
                  <dl className={cs.dataList}>
                    <dt className={cs.statsDt}>
                      <span className={cs.rowLabel}>
                        Avg. reads passing filters per sample
                      </span>
                    </dt>
                    <dd className={cs.statsDd}>
                      {this.state.stats.avgAdjustedRemainingReads}
                    </dd>
                  </dl>
                </div>
              </div>
            )}
          </Accordion>
        </div>
        <div className={cs.metadataContainer}>
          <Accordion
            key={dataKey}
            className={cs.metadataSection}
            bottomContentPadding
            open={this.hasData()}
            header={<div className={cs.title}>Date created</div>}
          >
            <div>{this.buildDateHistogram("time")}</div>
          </Accordion>
        </div>
        <div className={cs.metadataContainer}>
          <Accordion
            key={dataKey}
            className={cs.metadataSection}
            bottomContentPadding
            open={this.hasData()}
            header={<div className={cs.title}>Metadata</div>}
          >
            <div className={cs.hasBackground}>
              <span className={cs.rowLabel}>Host</span>
              {this.buildMetadataRows("host")}
            </div>
            <div className={cs.hasBackground}>
              <span className={cs.rowLabel}>Tissue</span>
              {this.buildMetadataRows("tissue")}
            </div>
            <div className={cs.hasBackground}>
              <span className={cs.rowLabel}>Location</span>
              {this.buildMetadataRows("location")}
            </div>
            {allowedFeatures.includes("maps") && (
              <div className={cs.hasBackground}>
                <span className={cs.rowLabel}>Location v2</span>
                {this.buildMetadataRows("locationV2")}
              </div>
            )}
          </Accordion>
        </div>
      </div>
    );
  }
}

DiscoverySidebar.defaultProps = {
  projects: [],
  samples: [],
  defaultNumberOfMetadataRows: 4
};

DiscoverySidebar.propTypes = {
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
  currentTab: PropTypes.string.isRequired,
  defaultNumberOfMetadataRows: PropTypes.number,
  loading: PropTypes.bool,
  onFilterClick: PropTypes.func,
  projectDimensions: PropTypes.array,
  projects: PropTypes.arrayOf(PropTypes.Project),
  sampleDimensions: PropTypes.array,
  samples: PropTypes.arrayOf(PropTypes.Sample),
  sampleStats: PropTypes.object
};
