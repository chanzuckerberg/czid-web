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
    // TODO (gdingle): Failed prop type: Property `hostGenomes` of component `HostOrganismMessage` has invalid PropType notation inside arrayOf.
    hostGenomes: PropTypes.arrayOf(PropTypes.HostGenome).isRequired,
  };

  hasMatch(host) {
    return map("name", this.props.hostGenomes).includes(host);
  }

  renderOneHost(host, count) {
    // TODO (gdingle): global style
    return (
      <div style={{ margin: "10px" }}>
        We will be subtracting a host during data processing.
        {this.renderTextLine(host, count)}
      </div>
    );
  }

  renderTextLine(host, count) {
    // TODO (gdingle): strong classname
    return (
      <span>
        {" "}
        For the{" "}
        <strong>
          {count} sample{count > 1 ? "s" : ""}
        </strong>{" "}
        that you indicated as a <strong>{host}</strong> Host Organism,{" "}
        {this.hasMatch(host) ? (
          <span>
            we will subtract out a <strong>{host}</strong> genome.
          </span>
        ) : (
          <span>we will only remove ERCCs.</span>
        )}
      </span>
    );
  }

  renderManyHosts(uniqHosts) {
    // TODO (gdingle): condense NO_MATCH into one line?
    // const grouped = groupBy(
    //   host => (this.hasMatch(host) ? MATCH : NO_MATCH),
    //   keys(uniqHosts)
    // );
    // grouped.MATCH
    // grouped.NO_MATCH

    return (
      // TODO (gdingle): global style
      <div style={{ margin: "10px" }}>
        We will be subtracting a host during data processing. Based on your
        selections for Host Organism, we will be subtracting the following
        hosts:
        {map(
          (count, host) => (
            <div key={host} style={{ margin: "10px" }}>
              {this.renderTextLine(host, count)}
            </div>
          ),
          uniqHosts
        )}
      </div>
    );
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
      const host = keys(uniqHosts)[0];
      return this.renderOneHost(host, uniqHosts[host]);
    }
    return this.renderManyHosts(uniqHosts);
  }
}
