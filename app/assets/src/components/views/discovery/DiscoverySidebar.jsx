import React from "react";
import cx from "classnames";
import { countBy, flatten, map, sortBy, sum, sumBy, uniqBy } from "lodash/fp";
import moment from "moment";

import PropTypes from "~/components/utils/propTypes";
import { Accordion } from "~/components/layout";

import cs from "./discovery_sidebar.scss";

export default class DiscoverySidebar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stats: {
        samples: "",
        projects: "",
        total_reads: "",
        adjusted_remaining_reads: ""
      },
      metadata: {
        host: {},
        tissue: {},
        createdAt: {},
        // TODO (gdingle): is location good?
        location: {},
      }
    };
  }

  static getDerivedStateFromProps(newProps, prevState) {
    const { currentTab, projects } = newProps;

    if (currentTab == "samples") {
      const samples = DiscoverySidebar.processSamples(newProps.samples);
      if (!samples || !samples.length) {
        return prevState;
      }
      return {
        stats: {
          samples: samples.length,
          projects: uniqBy("project", samples).length
          // TODO (gdingle): this good?
          // projects: uniqBy("project_id", samples).length,
          total_reads: sumBy("total_reads", samples),
          adjusted_remaining_reads: sumBy("adjusted_remaining_reads", samples)
        },
        metadata: {
          host: countBy("hostGenome", samples),
          tissue: countBy("sampleTissue", samples),
          createdAt: countBy("createdAt", samples)
          // TODO (gdingle): this good?
          location: countBy("sample_location", samples)
        },
        _computed: currentTab
      };
    } else if (currentTab == "projects") {
      if (!projects || !projects.length) {
        return prevState;
      }

      const hosts = flatten(map("hosts", projects));
      const tissues = flatten(map("tissues", projects));
      const locations = flatten(map("sample_locations", projects));

      const createdAts = map(
        project => DiscoverySidebar.formatDate(project.created_at),
        projects
      );

      return {
        stats: {
          samples: sumBy("number_of_samples", projects),
          projects: projects.length,
          total_reads: sumBy("total_reads", projects),
          adjusted_remaining_reads: sumBy("adjusted_remaining_reads", projects)
        },
        metadata: {
          host: countBy(null, hosts),
          tissue: countBy(null, tissues),
          createdAt: countBy(null, createdAts)
          location: countBy(null, locations)
        },
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
    const samples = this.state.stats.samples;
    if (!samples) {
      return "";
    }
    return Math.round(number / samples).toLocaleString();
  }

  static processSamples(newSamples) {
    return newSamples.map(sample => ({
      hostGenome: sample.host || "Unknown",
      project: sample.sample.project,
      sampleTissue: sample.sampleType || "Unknown",
      createdAt: DiscoverySidebar.formatDate(sample.sample.createdAt),
    }));
  }

  handleFilterClick(key) {
    // TODO (gdingle): coordinate with filters on left sidebar
    window.history.pushState("", "", "?" + key);
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
                {key == "unknown" ? <i>{key}</i> : key}
              </a>
            </dt>,
            <dd key={key + i + "number"}>
              <span
                className={cs.bar}
                // TODO (gdingle): make width depend on container
                style={{ width: percent * 2 - 14 + "px" }}
              />
              {count}
            </dd>
          ];
        })}
      </dl>
    );
  }

  render() {
    return (
      <div className={cx(this.props.className, cs.sideBar)}>
        <div className={cs.metadataContainer}>
          <Accordion
            open={true}
            header={<div className={cs.title}>Overall</div>}
          >
            <div className={cs.hasBackground}>
              <dl className={cx(cs.dataList)}>
                <dt>
                  <strong>Samples</strong>
                </dt>
                <dd>{this.state.stats.samples.toLocaleString()}</dd>
              </dl>
            </div>
            <div className={cs.hasBackground}>
              <dl className={cx(cs.dataList)}>
                <dt>
                  <strong>Projects</strong>
                </dt>
                <dd>{this.state.stats.projects.toLocaleString()}</dd>
              </dl>
            </div>
            <div className={cs.hasBackground}>
              <dl className={cx(cs.dataList)}>
                <dt>
                  <strong>Reads per sample</strong>
                </dt>
                <dd>{this.formatNumber(this.state.stats.total_reads)}</dd>
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
                <dd>
                  {this.formatNumber(this.state.stats.adjusted_remaining_reads)}
                </dd>
              </dl>
            </div>
          </Accordion>
        </div>
        <div className={cs.metadataContainer}>
          <Accordion
            open={true}
            header={<div className={cs.title}>Metadata</div>}
          >
            <div className={cs.hasBackground}>
              <strong>Date created</strong>
              {this.buildMetadataRows("createdAt")}
            </div>
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
  currentTab: PropTypes.string
};
