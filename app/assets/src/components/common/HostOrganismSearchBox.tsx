import { get } from "lodash/fp";
import React from "react";
import {
  doesResultMatch,
  sortResults,
} from "~/components/views/SampleUploadFlow/utils";
import { HostGenome } from "~/interface/shared";

import LiveSearchPopBox, { SearchResults } from "~ui/controls/LiveSearchPopBox";

interface HostOrganismSearchBoxProps {
  className?: string;
  onResultSelect(params: any): void;
  value?: string;
  hostGenomes: HostGenome[];
}

// Adapted from SampleTypeSearchBox
const HostOrganismSearchBox = ({
  className,
  value,
  onResultSelect,
  hostGenomes,
}: HostOrganismSearchBoxProps) => {
  const handleSearchTriggered = (query: string) => {
    // @ts-expect-error Argument of type 'LodashSortBy1x2<unknown>' is not assignable to parameter of type 'HostGenome[]'
    return buildResults(getMatchesByCategory(query), query);
  };

  // TODO (gdingle): extract all these to utils if re-used
  const getMatchesByCategory = (query: string) => {
    const matchedHostGenomes = hostGenomes.filter(
      hostGenome =>
        // IMPORTANT NOTE: Only existing, null-user host genomes will be shown as
        // options for new samples until the team gets a chance to review this
        // policy in light of the data. See HostGenome.rb.
        // See https://jira.czi.team/browse/IDSEQ-2193.
        hostGenome.showAsOption && doesResultMatch(hostGenome, query),
    );

    return sortResults(matchedHostGenomes, query, t => t.samples_count * -1);
  };

  const buildResults = (sortedHostGenomes: HostGenome[], query: string) => {
    const formatResult = (
      result: HostGenome,
    ): {
      title: string;
      name: number;
      description?: string;
    } => {
      const hostGenome = hostGenomes.find(hg => hg.id === result.id);
      return {
        title: result.name,
        name: result.id,
        description: hostGenome.ercc_only
          ? "Host will not be subtracted"
          : null,
      };
    };
    const results = {} as SearchResults;
    if (sortedHostGenomes.length) {
      results.suggested = {
        name: "SUGGESTED",
        results: sortedHostGenomes.map(formatResult),
      };
    }
    if (query.length && get([0, "name"], sortedHostGenomes) !== query) {
      results.noMatch = {
        name: "Use Plain Text (No Match)",
        results: [
          {
            title: query,
            name: query,
            description: "Host will not be subtracted",
          },
        ],
      };
    }
    return results;
  };

  return (
    <LiveSearchPopBox
      className={className}
      value={value || ""}
      onSearchTriggered={handleSearchTriggered}
      onResultSelect={onResultSelect}
      minChars={0}
      placeholder=""
      icon="chevron down"
      shouldSearchOnFocus
      delayTriggerSearch={0}
    />
  );
};

export default HostOrganismSearchBox;
