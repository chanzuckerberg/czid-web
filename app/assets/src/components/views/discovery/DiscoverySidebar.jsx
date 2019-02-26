import React, { Fragment } from "React";
import cx from "classnames";
import { map, keyBy, countBy, times, zipObject } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";
import { getAllHostGenomes } from "~/api";

import cs from "./discovery_sidebar.scss";

export default class DiscoverySidebar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      stats: {
        samples: 0
        // TODO (gdingle):
        // avg_reads_per_sample: 0,
      },
      metadata: {
        host: {},
        tissue: {}
        // TODO (gdingle):
        // location: {},
      }
      // TODO (gdingle): created_at
    };
  }

  async componentDidMount() {
    this.genomes = await getAllHostGenomes();
  }

  componentDidUpdate() {
    const { currentTab, projects } = this.props;

    if (currentTab == "samples") {
      const samples = this.getSamples();
      if (!samples.length) {
        return;
      }
      if (this.state.stats.samples > 0) {
        // Only update once because of
        // Uncaught Invariant Violation: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
        // TODO (gdingle): fix
        return;
      }
      this.setState({
        stats: {
          samples: samples.length
          // TODO (gdingle): reads not in samples data yet
          // avg_reads_per_sample: 0,
        },
        metadata: {
          host: countBy("host_genome", samples),
          tissue: countBy("sample_tissue", samples)
          // TODO (gdingle): location not in samples data yet
          // location: {},
        }
      });
    } else if (currentTab == "projects") {
      if (!projects || !projects.length) {
        return;
      }

      const hosts = map("hosts", projects);
      const tissues = map("tissues", projects);

      this.setState({
        stats: {
          samples: countBy("number_of_samples", projects)
          // TODO (gdingle): reads not in projects data yet
          // avg_reads_per_sample: 0,
        },
        metadata: {
          // TODO (gdingle): these are not freq counts... only sets
          host: zipObject(hosts, times(() => 1, hosts.length)),
          tissue: zipObject(tissues, times(() => 1, tissues.length))
          // TODO (gdingle): location not in projects data yet
          // location: {},
        }
      });
    } else {
      console.error("Not supported: " + currentTab);
    }
  }

  getSamples() {
    // TODO (gdingle): why not include genome name in payload from getSamples?
    const genomes = keyBy("id", this.genomes);

    const samples = this.props.samples.map(sample => {
      const genome = genomes[sample.host_genome_id];
      sample.host_genome = genome ? genome.name : "unknown";
      sample.sample_tissue = sample.sample_tissue || "unknown";
      return sample;
    });
    return samples;
  }

  render() {
    return (
      <div className={cx(this.props.className, cs.sideBar)}>
        <h4>Stats</h4>
        <dl>
          <dt>Samples</dt>
          <dd>{this.state.stats.samples}</dd>
        </dl>

        <h4>Metadata</h4>
        <dl>
          <dt>Host</dt>
          {Object.keys(this.state.metadata.host).map(key => (
            <Fragment>
              <dd>{key}</dd>
              <dd>{this.state.metadata.host[key]}</dd>
            </Fragment>
          ))}
        </dl>

        <dl>
          <dt>Tissue</dt>
          {Object.keys(this.state.metadata.tissue).map(key => (
            <Fragment>
              <dd>{key}</dd>
              <dd>{this.state.metadata.tissue[key]}</dd>
            </Fragment>
          ))}
        </dl>
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
