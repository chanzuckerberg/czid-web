import React from "react";
import cx from "classnames";
import { find, maxBy, orderBy, sumBy } from "lodash/fp";
import moment from "moment";

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
        time: DiscoverySidebar.loadDimension(dimensions, "time_bins")
      }
    };
  }

  static loadDimension(dimensions, dimensionKey) {
    return (find({ dimension: dimensionKey }, dimensions) || {}).values || [];
  }

  static formatDate(createdAt) {
    return moment(createdAt).format("YYYY-MM-DD");
  }

  static formatNumber(value) {
    return (Math.round(value) || "").toLocaleString();
  }

  buildDateHistogram(field) {
    const { onFilterClick } = this.props;
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
                onClick={() => onFilterClick && onFilterClick(entry)}
              >
                &nbsp;
              </div>
            );
            const tooltipMessage = (
              <span>
                {entry.text}
                <br />
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
          <div className={cs.label}>{firstDate}</div>
          {firstDate !== lastDate && <div className={cs.label}>{lastDate}</div>}
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
    return (
      <dl className={cs.dataList}>
        {this.renderMetadataRowBlock(defaultRows, total)}
        {expandedMetadataGroups.has(field) &&
          this.renderMetadataRowBlock(extraRows, total)}
        {extraRows.length > 0 && (
          <div
            className={cs.showHide}
            onClick={() => this.toggleExpandedMetadataGroup(field)}
          >
            {expandedMetadataGroups.has(field) ? "Show Less" : "Show More"}
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
      return [
        <dt className={cs.barLabel} key={`${value}_label_${i}`}>
          <a onClick={() => this.handleFilterClick(value)}>
            {value === "not_set" ? <i>{text}</i> : text}
          </a>
        </dt>,
        <dd key={`${value}_value_${i}`}>
          <span
            className={cs.bar}
            // TODO(gdingle): make width depend on container
            style={{ width: percent * 1.3 + "px" }}
          />
          <span className={cs.count}>{count}</span>
        </dd>
      ];
    });
  }

  hasData() {
    return !!(this.state.stats.numSamples || this.state.stats.numProjects);
  }

  render() {
    const { className, currentTab, loading } = this.props;
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
            key={dataKey}
            open={this.hasData()}
            header={<div className={cs.title}>Overall</div>}
          >
            <div className={cs.hasBackground}>
              <dl className={cs.dataList}>
                <dt className={cs.statsDt}>
                  <strong>Samples</strong>
                </dt>
                <dd className={cs.statsDd}>{this.state.stats.numSamples}</dd>
              </dl>
            </div>
            <div className={cs.hasBackground}>
              <dl className={cs.dataList}>
                <dt className={cs.statsDt}>
                  <strong>Projects</strong>
                </dt>
                <dd className={cs.statsDd}>{this.state.stats.numProjects}</dd>
              </dl>
            </div>
            {currentTab === "samples" && (
              <div>
                <div className={cs.hasBackground}>
                  <dl className={cs.dataList}>
                    <dt className={cs.statsDt}>
                      <strong>Avg. reads per sample</strong>
                    </dt>
                    <dd className={cs.statsDd}>
                      {this.state.stats.avgTotalReads}
                    </dd>
                  </dl>
                </div>
                <div className={cs.hasBackground}>
                  <dl className={cs.dataList}>
                    <dt className={cs.statsDt}>
                      <strong>Avg. reads passing filters per sample</strong>
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
            open={this.hasData()}
            header={<div className={cs.title}>Date created</div>}
          >
            <div>{this.buildDateHistogram("time")}</div>
          </Accordion>
        </div>
        <div className={cs.metadataContainer}>
          <Accordion
            key={dataKey}
            open={this.hasData()}
            header={<div className={cs.title}>Metadata</div>}
          >
            <div className={cs.hasBackground}>
              <strong>Host</strong>
              {this.buildMetadataRows("host")}
            </div>
            <div className={cs.hasBackground}>
              <strong>Tissue</strong>
              {this.buildMetadataRows("tissue")}
            </div>
            <div className={cs.hasBackground}>
              <strong>Location</strong>
              {this.buildMetadataRows("location")}
            </div>
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
  className: PropTypes.string,
  currentTab: PropTypes.string.isRequired,
  defaultNumberOfMetadataRows: PropTypes.number,
  loading: PropTypes.bool,
  onFilterClick: PropTypes.func,
  projectDimensions: PropTypes.array,
  projects: PropTypes.arrayOf(PropTypes.Project),
  sampleDimensions: PropTypes.array,
  sampleStats: PropTypes.object,
  samples: PropTypes.arrayOf(PropTypes.Sample)
};
