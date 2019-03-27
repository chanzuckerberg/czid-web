import React from "react";
import cx from "classnames";
import {
  countBy,
  flatten,
  map,
  orderBy,
  sum,
  sumBy,
  uniqBy,
  meanBy
} from "lodash/fp";
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
        avgNonHostReads: ""
      },
      metadata: {
        host: {},
        tissue: {},
        createdAt: {},
        location: {}
      },
      expandedMetadataGroups: new Set()
    };
  }

  static getDerivedStateFromProps(newProps, prevState) {
    const { currentTab, projects, loading } = newProps;
    if (loading) return prevState;

    if (currentTab === "samples") {
      const samples = DiscoverySidebar.selectSampleData(newProps.samples);
      return {
        stats: {
          numSamples: samples.length,
          numProjects: uniqBy("project_id", samples).length,
          avgTotalReads: DiscoverySidebar.meanByAndFormat(
            samples,
            "totalReads"
          ),
          avgNonHostReads: DiscoverySidebar.meanByAndFormat(
            samples,
            "nonHostReads"
          )
        },
        metadata: {
          host: countBy("hostGenome", samples),
          tissue: countBy("sampleTissue", samples),
          createdAt: countBy("createdAt", samples),
          location: countBy("sampleLocation", samples)
        }
      };
    } else if (currentTab === "projects") {
      const hosts = flatten(map("hosts", projects));
      const tissues = flatten(map("tissues", projects));
      const locations = flatten(map("locations", projects));

      const createdAts = map(
        project => DiscoverySidebar.formatDate(project.created_at),
        projects
      );

      return {
        stats: {
          numSamples: sumBy("number_of_samples", projects),
          numProjects: projects.length
        },
        metadata: {
          host: countBy(null, hosts),
          tissue: countBy(null, tissues),
          createdAt: countBy(null, createdAts),
          location: countBy(null, locations)
        }
      };
    } else {
      // eslint-disable-next-line no-console
      console.error("Not supported: " + currentTab);
      return prevState;
    }
  }

  static formatDate(createdAt) {
    return moment(createdAt).format("YYYY-MM-DD");
  }

  static meanByAndFormat(data, field) {
    return (Math.round(meanBy(field, data)) || "").toLocaleString();
  }

  static selectSampleData(newSamples) {
    return newSamples.map(sample => ({
      hostGenome: sample.host || "Unknown",
      project: sample.sample.project,
      sampleTissue: sample.sampleType || "Unknown",
      createdAt: DiscoverySidebar.formatDate(sample.sample.createdAt),
      sampleLocation: sample.sampleLocation || "Unknown",
      totalReads: sample.totalReads,
      nonHostReads: sample.nonHostReads.value
    }));
  }

  handleFilterClick(key) {
    // TODO (gdingle): coordinate with filters on left sidebar
    window.history.pushState("", "", "?" + key);
  }

  // TODO (gdingle): auto scale to day week or month?
  buildDateHistogram(field) {
    const dates = this.state.metadata[field];

    const total = sum(Object.values(dates));
    const dateKeys = Object.keys(dates);
    dateKeys.sort();
    const firstDate = dateKeys[0];
    const lastDate = dateKeys[dateKeys.length - 1];
    return (
      <div>
        <div className={cx(cs.dateHistogram)}>
          {dateKeys.map(key => {
            const percent = Math.round(100 * dates[key] / total, 0);
            const element = (
              <div
                className={cx(cs.bar)}
                key={key}
                style={{ height: percent * 2 + "px" }}
                onClick={() => this.handleFilterClick(key)}
              >
                &nbsp;
              </div>
            );
            const tooltipMessage = (
              <span>
                {key}
                <br />
                {dates[key]}
              </span>
            );
            return (
              <BasicPopup
                key={key}
                trigger={element}
                content={tooltipMessage}
              />
            );
          })}
        </div>
        <div className={cx(cs.dateHistogram)}>
          <div className={cx(cs.label)}>{firstDate}</div>
          <div className={cx(cs.label)}>{lastDate}</div>
        </div>
      </div>
    );
  }

  buildMetadataRows(field) {
    const { metadata, expandedMetadataGroups } = this.state;

    // TODO (gdingle): put "unknowns" last?
    const fieldData = metadata[field];
    // Sort by the value desc and then by the label alphabetically
    const sorted = orderBy(
      [k => k[1], k => k[0]],
      ["desc", "asc"],
      Object.entries(fieldData)
    );
    const total = sum(Object.values(fieldData));

    // Display N fields and show/hide the rest
    const defaultN = 4;
    const defaultRows = sorted.slice(0, defaultN);
    const extraRows = sorted.slice(defaultN);
    return (
      <dl className={cx(cs.dataList)}>
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
      const [key, count] = entry;
      const percent = Math.round(100 * count / total, 0);
      return [
        <dt key={key + i + "label"}>
          <a href={"#" + key} onClick={() => this.handleFilterClick(key)}>
            {key.toLowerCase() == "unknown" ? <i>{key}</i> : key}
          </a>
        </dt>,
        <dd key={key + i + "number"}>
          <span
            className={cs.bar}
            // TODO (gdingle): make width depend on container
            style={{ width: percent * 1.5 + "px" }}
          />
          {count}
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
              <dl className={cx(cs.dataList)}>
                <dt>
                  <strong>Samples</strong>
                </dt>
                <dd>{this.state.stats.numSamples.toLocaleString()}</dd>
              </dl>
            </div>
            <div className={cs.hasBackground}>
              <dl className={cx(cs.dataList)}>
                <dt>
                  <strong>Projects</strong>
                </dt>
                <dd>{this.state.stats.numProjects.toLocaleString()}</dd>
              </dl>
            </div>
            {currentTab === "samples" && (
              <div>
                <div className={cs.hasBackground}>
                  <dl className={cx(cs.dataList)}>
                    <dt>
                      <strong>Avg. reads per sample</strong>
                    </dt>
                    <dd>{this.state.stats.avgTotalReads}</dd>
                  </dl>
                </div>
                <div className={cs.hasBackground}>
                  <dl className={cx(cs.dataList)}>
                    <dt>
                      <strong>Avg. non-host reads per sample</strong>
                    </dt>
                    <dd>{this.state.stats.avgNonHostReads}</dd>
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
            <div>{this.buildDateHistogram("createdAt")}</div>
          </Accordion>
        </div>
        <div className={cs.metadataContainer}>
          <Accordion
            key={dataKey}
            open={this.hasData()}
            header={<div className={cs.title}>By Metadata</div>}
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
  currentTab: "samples"
};

DiscoverySidebar.propTypes = {
  className: PropTypes.string,
  projects: PropTypes.arrayOf(PropTypes.Project),
  samples: PropTypes.arrayOf(PropTypes.Sample),
  currentTab: PropTypes.string,
  loading: PropTypes.bool
};
