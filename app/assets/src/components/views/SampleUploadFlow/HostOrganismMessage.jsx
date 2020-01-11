import React from "react";
import PropTypes from "prop-types";
import { keys, countBy, groupBy } from "lodash/fp";

const MATCH = "MATCH";
const NO_MATCH = "NO_MATCH";

/**
 * Shows a message depending on whether the selected host matches a
 * IDseq-supported host.
 */
export default class HostOrganismMessage extends React.Component {
  static propTypes = {
    allHostOrganisms: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectedHostOrganisms: PropTypes.arrayOf(PropTypes.string).isRequired,
  };

  hasMatch(host) {
    return this.props.allHostOrganisms.includes(host);
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
    return <div>{JSON.stringify(grouped)}</div>;
  }

  render() {
    const uniqHosts = countBy(this.props.selectedHostOrganisms);
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
