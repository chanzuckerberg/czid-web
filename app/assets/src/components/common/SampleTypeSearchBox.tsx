import { get, groupBy } from "lodash/fp";
import React from "react";
import {
  doesResultMatch,
  sortResults,
} from "~/components/views/SampleUploadFlow/utils";
import { SampleTypeProps } from "~/interface/shared";
import LiveSearchPopBox, { SearchResults } from "~ui/controls/LiveSearchPopBox";

const SUGGESTED = "SUGGESTED";
const ALL = "ALL";

interface SampleTypeSearchBoxProps {
  className: string;
  onResultSelect(params: any): void;
  value: string;
  sampleTypes: SampleTypeProps[];
  taxaCategory: string;
  showDescription?: boolean;
}

const SampleTypeSearchBox = ({
  className,
  value,
  onResultSelect,
  showDescription,
  taxaCategory,
  sampleTypes,
}: SampleTypeSearchBoxProps) => {
  const handleSearchTriggered = query => {
    return buildResults(getMatchesByCategory(query), query);
  };
  const getMatchesByCategory = query => {
    const matchedSampleTypes = sampleTypes.filter(sampleType =>
      doesResultMatch(sampleType, query),
    );

    const sortedSampleTypes = sortResults(
      matchedSampleTypes,
      query,
      (sampleType: SampleTypeProps) => sampleType.name,
    );

    // Sample types are grouped differently based on whether the current
    // sample's host genome is an insect, a human, a non-human animal or
    // unknown. The "suggested" group is shown first, then the "all" group.
    const getSampleTypeCategory = sampleType => {
      const isHuman = taxaCategory === "human";
      const isInsect = taxaCategory === "insect";
      const isNonHumanAnimal = taxaCategory === "non-human-animal";

      if (sampleType.insect_only) {
        return isInsect ? SUGGESTED : ALL;
      }
      if (sampleType.human_only) {
        return isHuman ? SUGGESTED : ALL;
      }
      if (isNonHumanAnimal) {
        return SUGGESTED;
      }
      return ALL;
    };
    return groupBy(getSampleTypeCategory, sortedSampleTypes);
  };
  const buildResults = (sampleTypesByCategory, query) => {
    const formatResult = result => {
      return {
        title: result.name,
        name: result.name,
        description: showDescription ? result.group : null,
      };
    };
    const results = {} as SearchResults;
    if (sampleTypesByCategory[SUGGESTED]) {
      results.suggested = {
        name: SUGGESTED,
        results: sampleTypesByCategory[SUGGESTED].map(formatResult),
      };
    }
    if (sampleTypesByCategory[ALL]) {
      results.all = {
        name: ALL,
        results: sampleTypesByCategory[ALL].map(formatResult),
      };
    }
    if (
      query.length &&
      get([0, "name"], sampleTypesByCategory[SUGGESTED]) !== query
    ) {
      results.noMatch = {
        name: "Use Plain Text (No Match)",
        results: [{ title: query, name: query }],
      };
    }
    return results;
  };
  return (
    <LiveSearchPopBox
      className={className}
      value={value}
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

export default SampleTypeSearchBox;
