import React from "react";
import cx from "classnames";
import {
  uniqBy,
  sum,
  sumBy,
  flatten,
  map,
  keyBy,
  countBy,
  sortBy
} from "lodash/fp";
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
        created_at: {},
        location: {}
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
          projects: uniqBy("project_id", samples).length,
          total_reads: sumBy("total_reads", samples),
          adjusted_remaining_reads: sumBy("adjusted_remaining_reads", samples)
          // TODO (gdingle): reads not in samples data yet
          // avg_reads_per_sample: 0,
        },
        metadata: {
          host: countBy("host_genome_name", samples),
          tissue: countBy("sample_tissue", samples),
          created_at: countBy("created_at", samples),
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

      const created_ats = map(
        p => DiscoverySidebar.formatDate(p.created_at),
        projects
      );

      return {
        stats: {
          samples: sumBy("number_of_samples", projects),
          projects: projects.length,
          total_reads: sumBy("total_reads", projects),
          adjusted_remaining_reads: sumBy("adjusted_remaining_reads", projects)
          // TODO (gdingle): reads not in projects data yet
          // avg_reads_per_sample: 0,
        },
        metadata: {
          // TODO (gdingle): these freq counts per project, not per sample
          host: countBy(_ => _, hosts),
          tissue: countBy(_ => _, tissues),
          created_at: countBy(_ => _, created_ats),
          location: countBy(_ => _, locations)
        },
        _computed: currentTab
      };
    } else {
      // eslint-disable-next-line no-console
      console.error("Not supported: " + currentTab);
      return prevState;
    }
  }

  static formatDate(created_at) {
    return moment(created_at).format("YYYY-MM-DD");
  }

  // TODO (gdingle): humanize better into M such as 34M
  formatNumber(number) {
    const samples = this.state.stats.samples;
    if (!samples) {
      return "";
    }
    return Math.round(number / samples).toLocaleString();
  }

  static processSamples(newSamples) {
    const samples = newSamples.map(sample => {
      // TODO (gdingle): best description for blanks?
      sample.sample_tissue = sample.sample_tissue || "unknown";
      sample.location = sample.sample_location || "unknown";
      // TODO (gdingle): this is broken... always getting current date
      sample.created_at = DiscoverySidebar.formatDate(sample.created_at);
      return sample;
    });
    return samples;
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
                {key}
              </a>
            </dt>,
            <dd key={key + i + "number"}>
              <span
                className={cs.bar}
                style={{ width: percent * 2 - 4 + "px" }}
              >
                {percent > 10 ? count : ""}
              </span>
              {percent}%
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
            header={<div className={cs.header}>Overall</div>}
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
                    Non-host reads <br />per sample
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
            header={<div className={cs.header}>By Metadata</div>}
          >
            <div className={cs.hasBackground}>
              <strong>Date created</strong>
              {this.buildMetadataRows("created_at")}
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
