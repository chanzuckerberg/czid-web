import React from "react";
import PropTypes from "prop-types";
import { keys, countBy, mapValues, keyBy, map } from "lodash/fp";

import cs from "./host_organism_message.scss";

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

  renderOneHost(host, count) {
    return (
      <div className={cs.messageContainer}>
        We will be subtracting a host during data processing.
        {this.renderTextLine(host, count)}
      </div>
    );
  }

  renderTextLine(host, count) {
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
    return (
      <div className={cs.messageContainer}>
        We will be subtracting a host during data processing. Based on your
        selections for Host Organism, we will be subtracting the following
        hosts:
        {keys(uniqHosts).map(host => (
          <div key={host} className={cs.messageLine}>
            {this.renderTextLine(host, uniqHosts[host])}
          </div>
        ))}
      </div>
    );
  }

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
