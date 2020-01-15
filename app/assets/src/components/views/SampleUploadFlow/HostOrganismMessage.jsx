import React from "react";
import PropTypes from "prop-types";
import { keys, countBy, groupBy, mapValues, keyBy, map } from "lodash/fp";

const MATCH = "MATCH";
const NO_MATCH = "NO_MATCH";

/**
 * Shows a message depending on whether the selected host matches a
 * IDseq-supported host.
 */
export default class HostOrganismMessage extends React.Component {
  static propTypes = {
    samples: PropTypes.arrayOf(
      PropTypes.shape({ host_genome_id: PropTypes.number })
    ).isRequired,
    hostGenomes: PropTypes.arrayOf(PropTypes.HostGenome).isRequired,
  };

  hasMatch(host) {
    return map("name", this.props.hostGenomes).includes(host);
  }

  renderOneHost(host) {
    if (this.hasMatch(host)) {
      return "one host, match";
    }
    return "one host, no match";
  }

  renderManyHosts(uniqHosts) {
    const grouped = groupBy(
      host => (this.hasMatch(host) ? MATCH : NO_MATCH),
      keys(uniqHosts)
    );
    // TODO (gdingle): more display after final designs
    // TODO (gdingle): need to get the counts back from uniqHosts
    return JSON.stringify(grouped);
  }

  // TODO (gdingle): need to think about new plain text hosts
  getSelectedHostOrganisms() {
    const idToName = mapValues("name", keyBy("id", this.props.hostGenomes));
    return this.props.samples.map(sample => idToName[sample.host_genome_id]);
  }

  render() {
    const uniqHosts = countBy(null, this.getSelectedHostOrganisms());
    const length = keys(uniqHosts).length;
    if (length === 0) {
      return null;
    }
    if (length === 1) {
      return this.renderOneHost(keys(uniqHosts)[0]);
    }
    return this.renderManyHosts(uniqHosts);
  }
}
