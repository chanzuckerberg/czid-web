import React from "react";
import cx from "classnames";
import { countBy, flatten, map, sortBy, sum, sumBy, uniqBy } from "lodash/fp";
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
        totalReads: "",
        nonHostReads: ""
      },
      metadata: {
        host: {},
        tissue: {},
        createdAt: {},
        location: {}
      }
    };
  }

  static getDerivedStateFromProps(newProps, prevState) {
    const { currentTab, projects } = newProps;

    if (currentTab == "samples") {
      const samples = DiscoverySidebar.selectSampleData(newProps.samples);
      if (!samples || !samples.length) {
        return prevState;
      }
      return {
        stats: {
          numSamples: samples.length,
          numProjects: uniqBy("project_id", samples).length,
          totalReads: sumBy("totalReads", samples),
          nonHostReads: sumBy("nonHostReads", samples)
        },
        metadata: {
          host: countBy("hostGenome", samples),
          tissue: countBy("sampleTissue", samples),
          createdAt: countBy("createdAt", samples),
          location: countBy("sampleLocation", samples)
        }
      };
    } else if (currentTab == "projects") {
      if (!projects || !projects.length) {
        return prevState;
      }

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
          numProjects: projects.length,
          totalReads: sumBy("total_reads", projects),
          nonHostReads: sumBy("adjusted_remaining_reads", projects)
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

  formatNumber(number) {
    const samples = this.state.stats.numSamples;
    if (!samples) {
      return "";
    }
    return Math.round(number / samples).toLocaleString();
  }

  static selectSampleData(newSamples) {
    return newSamples.map(sample => ({
      hostGenome: sample.host || "Unknown",
      project: sample.sample.project,
      sampleTissue: sample.sampleType || "Unknown",
      createdAt: DiscoverySidebar.formatDate(sample.sample.createdAt),
      sampleLocation: sample.sampleLocation,
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
    // TODO (gdingle): put "unknowns" last?
    const sorted = sortBy(a => a, Object.keys(this.state.metadata[field]));
    const total = sum(Object.values(this.state.metadata[field]));
    return (
      <dl className={cx(cs.dataList)}>
        {sorted.map((key, i) => {
          const count = this.state.metadata[field][key];
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
        })}
      </dl>
    );
  }

  hasData() {
    return !!(this.state.stats.numSamples || this.state.stats.numProjects);
  }

  render() {
    // This represents the unique dataset loaded and will force a refresh of the
    // Accordions when it changes.
    const dataKey = this.state.stats.totalReads;
    return (
      <div className={cx(this.props.className, cs.sidebar)}>
        {/* <div className={cs.metadataContainer}>
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
            <div className={cs.hasBackground}>
              <dl className={cx(cs.dataList)}>
                <dt>
                  <strong>Reads per sample</strong>
                </dt>
                <dd>{this.formatNumber(this.state.stats.totalReads)}</dd>
              </dl>
            </div>
            <div className={cs.hasBackground}>
              <dl className={cx(cs.dataList)}>
                <dt>
                  <strong>
                    Non-host
                    <br />reads per sample
                  </strong>
                </dt>
                <dd>{this.formatNumber(this.state.stats.nonHostReads)}</dd>
              </dl>
            </div>
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
        </div> */}
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
  currentTab: PropTypes.string
};
