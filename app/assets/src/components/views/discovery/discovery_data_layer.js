import { range } from "lodash/fp";
import { getDiscoverySamples } from "./discovery_api";

export class DiscoveryDataLayer {
  constructor(domain) {
    this.domain = domain;

    // storing the object by id
    this.data = {
      samples: this.newObjectDB(),
    };

    // Issues:
  }

  newObjectDB() {
    return {
      entries: {},
      order: null,
    };
  }

  get(data_type) {
    return this.data[data_type].entries;
  }

  getIds() {
    return this.data[data_type].order || [];
  }

  handleLoadSampleRows = async ({
    startIndex,
    stopIndex,
    conditions = {},
    onDataLoaded,
  }) => {
    const { domain, samples } = this;

    const { projectId, search, filters } = conditions;

    const missingIdxs = range(startIndex, stopIndex).filter(
      idx => !(idx in samples.entries)
    );

    if (missingIdxs.length > 0) {
      const minNeededIdx = missingIdxs[0];
      const maxNeededIdx = missingIdxs[missingIdxs.length - 1];

      let {
        samples: fetchedSamples,
        sampleIds: fetchedSampleIds,
      } = await getDiscoverySamples({
        domain,
        filters,
        projectId,
        search,
        limit: maxNeededIdx - minNeededIdx + 1,
        offset: minNeededIdx,
        listAllIds: samples.order === null,
      });

      if (fetchedSampleIds) {
        samples.order = fetchedSampleIds;
      }

      fetchedSamples.forEach(sample => {
        samples.entries[sample.id] = sample;
      });
    }

    const requestedSamples = range(startIndex, stopIndex).map(
      idx => samples.entries[samples.order[idx]]
    );

    onDataLoaded && onDataLoaded(this);

    return requestedSamples;
  };
}

// const handleLoadTableRows = async ({ startIndex, stopIndex }) => {

// }

// const handleLoadProjectRows = async ({startIndex, stopIndex}) => {

// }
