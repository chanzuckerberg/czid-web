import React, { Fragment } from "React";
import cx from "classnames";
import { keyBy, countBy } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";
import { getAllHostGenomes, getSamples } from "~/api";

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
    };
  }

  async componentDidMount() {
    this.genomes = await getAllHostGenomes();
  }

  componentDidUpdate() {
    if (this.state.stats.samples > 0) {
      // Only update once because of
      // Uncaught Invariant Violation: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
      // TODO (gdingle): fix
      return;
    }
    const samples = this.getSamples();
    if (!samples.length) {
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
  samples: []
};

DiscoverySidebar.propTypes = {
  className: PropTypes.string,
  projects: PropTypes.arrayOf(PropTypes.Project),
  samples: PropTypes.arrayOf(PropTypes.Sample)
};
