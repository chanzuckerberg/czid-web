import React from "react";
import PropTypes from "prop-types";
import { keys, countBy, groupBy } from "lodash/fp";

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

  renderOneHost(host) {
    if (this.props.allHostOrganisms.includes(host)) {
      return "one host, match";
    }
    return "one host, no match";
  }

  renderManyHost(uniqHosts) {
    const getMatchingHost = uniqHost =>
      this.props.allHostOrganisms.includes(uniqHost) ? uniqHost : NO_MATCH;
    const grouped = groupBy(getMatchingHost, keys(uniqHosts));
    return (
      <div>
        {keys(grouped).map(key => {
          const count = uniqHosts[key];
          if (key === NO_MATCH) {
            return count + " hosts, NO_MATCH";
          } else {
            // TODO (gdingle): need to do frequency counts!!!
            return count + " matches of host" + key;
          }
        })}
      </div>
    );
  }

  render() {
    const { selectedHostOrganisms } = this.props;
    // TODO (gdingle): need to do frequency counts here!!!
    const uniqHosts = countBy(selectedHostOrganisms);
    const length = keys(uniqHosts).length;
    if (length === 0) {
      return null;
    }
    if (length === 1) {
      return this.renderOneHost(keys(uniqHosts)[0]);
    }
    return this.renderManyHost(uniqHosts);
  }
}
