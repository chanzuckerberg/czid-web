import { range } from "lodash/fp";
import { getDiscoverySamples } from "./discovery_api";

class ObjectCollection {
  constructor() {
    this.entries = {};
    this.orderedIds = null;
    this.loading = true;
  }

  get loaded() {
    return (this.orderedIds || [])
      .filter(id => id in this.entries)
      .map(id => this.entries[id]);
  }
  get = id => this.entries[id];
  getIds = () => this.orderedIds || [];
  getLength = () => {
    return Object.keys(this.entries).length;
  };
  isLoading = () => this.loading;

  reset = () => {
    this.orderedIds = null;
    this.loading = true;
  };
}

class DiscoveryDataLayer {
  constructor(domain) {
    this.domain = domain;

    this.samples = new ObjectCollection();

    this.apiFunctions = {
      samples: this.fetchSamples,
    };
  }

  fetchSamples = async params => {
    let {
      samples: fetchedObjects,
      sampleIds: fetchedObjectIds,
    } = await getDiscoverySamples(params);
    return { fetchedObjects, fetchedObjectIds };
  };

  handleLoadObjectRows = async ({
    dataType,
    startIndex,
    stopIndex,
    conditions = {},
    onDataLoaded,
  }) => {
    const objects = this[dataType];
    const apiFunction = this.apiFunctions[dataType];
    const domain = this.domain;

    const minStopIndex = objects.orderedIds
      ? Math.min(objects.orderedIds.length - 1, stopIndex)
      : stopIndex;
    let missingIdxs = range(startIndex, minStopIndex + 1);
    if (objects.orderedIds) {
      missingIdxs = missingIdxs.filter(
        idx => !(objects.orderedIds[idx] in objects.entries)
      );
    }
    if (missingIdxs.length > 0) {
      // currently loads using limit and offset
      // could eventually lead to redundant fetches if data is not requested in regular continuous chunks
      const minNeededIdx = missingIdxs[0];
      const maxNeededIdx = missingIdxs[missingIdxs.length - 1];
      let { fetchedObjects, fetchedObjectIds } = await apiFunction({
        domain,
        ...conditions,
        limit: maxNeededIdx - minNeededIdx + 1,
        offset: minNeededIdx,
        listAllIds: objects.orderedIds === null,
      });

      if (fetchedObjectIds) {
        objects.orderedIds = fetchedObjectIds;
      }

      fetchedObjects.forEach(sample => {
        objects.entries[sample.id] = sample;
      });

      objects.loading = false;
    }

    const requestedObjects = range(startIndex, minStopIndex + 1)
      .filter(idx => idx in objects.orderedIds)
      .map(idx => objects.entries[objects.orderedIds[idx]]);

    onDataLoaded && onDataLoaded(this);

    return requestedObjects;
  };
}

export { DiscoveryDataLayer, ObjectCollection };
