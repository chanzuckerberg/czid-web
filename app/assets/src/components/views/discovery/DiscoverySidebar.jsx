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
        samples: 0,
        projects: 0
        // TODO (gdingle):
        // avg_reads_per_sample: 0,
      },
      metadata: {
        host: {},
        tissue: {},
        createdAt: {}
        // TODO (gdingle):
        // location: {},
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
          // TODO (gdingle): reads not in samples data yet
          // avg_reads_per_sample: 0,
        },
        metadata: {
          host: countBy("hostGenome", samples),
          tissue: countBy("sampleTissue", samples),
          createdAt: countBy("createdAt", samples)
          // TODO (gdingle): location not in samples data yet
          // location: {},
        },
        _computed: currentTab
      };
    } else if (currentTab == "projects") {
      if (!projects || !projects.length) {
        return prevState;
      }

      const hosts = flatten(map("hosts", projects));
      const tissues = flatten(map("tissues", projects));

      const createdAts = map(
        project => DiscoverySidebar.formatDate(project.created_at),
        projects
      );

      return {
        stats: {
          samples: sumBy("number_of_samples", projects),
          projects: projects.length
          // TODO (gdingle): reads not in projects data yet
          // avg_reads_per_sample: 0,
        },
        metadata: {
          host: countBy(null, hosts),
          tissue: countBy(null, tissues),
          createdAt: countBy(null, createdAts)
          // TODO (gdingle): location not in projects data yet
          // location: {},
        },
        _computed: currentTab
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

  static processSamples(newSamples) {
    return newSamples.map(sample => ({
      hostGenome: sample.host || "Unknown",
      project: sample.sample.project,
      sampleTissue: sample.sampleType || "Unknown",
      // TODO (gdingle): this is broken... always getting current date
      createdAt: DiscoverySidebar.formatDate(sample.sample.createdAt)
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
                {key}
              </a>
            </dt>,
            <dd key={key + i + "number"}>
              <span className={cs.bar} style={{ width: percent + "px" }}>
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
      <div className={cx(this.props.className, cs.sidebar)}>
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
                <dd>{this.state.stats.samples}</dd>
              </dl>
            </div>
            <div className={cs.hasBackground}>
              <dl className={cx(cs.dataList)}>
                <dt>
                  <strong>Projects</strong>
                </dt>
                <dd>{this.state.stats.projects}</dd>
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
