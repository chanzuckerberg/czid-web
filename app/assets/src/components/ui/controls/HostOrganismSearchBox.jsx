import React from "react";
import { get } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";
import {
  matchType,
  sortTypes,
} from "~/components/views/SampleUploadFlow/utils";

import LiveSearchPopBox from "./LiveSearchPopBox";

// Adapted from SampleTypeSearchBox
class HostOrganismSearchBox extends React.Component {
  handleSearchTriggered = query => {
    return this.buildResults(this.getMatchesByCategory(query), query);
  };

  // TODO (gdingle): extract all these to utils if re-used
  getMatchesByCategory(query) {
    const matchedHostGenomes = this.props.hostGenomes.filter(
      hostGenome =>
        // IMPORTANT NOTE: Only existing, null-user host genomes will be shown as
        // options for new samples until the team gets a chance to review this
        // policy in light of the data. See HostGenome.rb.
        hostGenome.showAsOption && matchType(hostGenome, query)
    );

    return sortTypes(matchedHostGenomes, query, t => t.samples_count * -1);
  }

  buildResults(sortedHostGenomes, query) {
    const formatResult = result => {
      const hostGenome = this.props.hostGenomes.find(hg => hg.id === result.id);
      return {
        title: result.name,
        name: result.id,
        description: hostGenome.ercc_only
          ? "Host will not be subtracted"
          : null,
      };
    };
    const results = {};
    if (sortedHostGenomes.length) {
      results.suggested = {
        name: "SUGGESTED",
        results: sortedHostGenomes.map(formatResult),
      };
    }
    if (query.length && get([0, "name"], sortedHostGenomes) !== query) {
      results.noMatch = {
        name: "Use Plain Text (No Match)",
        results: [{ title: query, name: query }],
      };
    }
    return results;
  }

  render() {
    const { className, value, onResultSelect } = this.props;
    return (
      <LiveSearchPopBox
        className={className}
        value={value}
        onSearchTriggered={this.handleSearchTriggered}
        onResultSelect={onResultSelect}
        minChars={0}
        placeholder=""
        icon="chevron down"
        shouldSearchOnFocus={true}
        delayTriggerSearch={0}
      />
    );
  }
}

HostOrganismSearchBox.propTypes = {
  className: PropTypes.string,
  onResultSelect: PropTypes.func.isRequired,
  value: PropTypes.string,
  hostGenomes: PropTypes.arrayOf(PropTypes.HostGenome).isRequired,
};

export default HostOrganismSearchBox;
