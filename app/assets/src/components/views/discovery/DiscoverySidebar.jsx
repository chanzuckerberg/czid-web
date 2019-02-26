import React from "React";
import { Fragment } from "React";
import PropTypes from "prop-types";
import cx from "classnames";
import { keyBy, countBy } from "lodash/fp";

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
    const samples = await this.getSamples();
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

  // TODO (gdingle): this is double-fetching along with SamplesView
  // and maybe should be replaced by elasticsearch bucket counts anyway
  getSamples = async () => {
    const { excludeLibrary, onlyLibrary } = this.props;
    const samples = await getSamples({
      excludeLibrary,
      onlyLibrary,
      // TODO (gdingle): what is a reasonable limit?
      limit: 10000,
      offset: 0
    });

    // TODO (gdingle): why not include genome name in payload from getSamples?
    let genomes = await getAllHostGenomes();
    genomes = keyBy("id", genomes);

    samples.forEach(sample => {
      const genome = genomes[sample.host_genome_id];
      sample.host_genome = genome ? genome.name : "unknown";

      sample.sample_tissue = sample.sample_tissue || "unknown";
    });
    return samples;
  };

  render() {
    return (
      <div className={cx(this.props.className)}>
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

DiscoverySidebar.propTypes = {
  className: PropTypes.string,
  excludeLibrary: PropTypes.bool,
  onlyLibrary: PropTypes.bool
};
