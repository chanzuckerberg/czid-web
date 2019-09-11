import { pick, range } from "lodash/fp";
import {
  getDiscoveryProjects,
  getDiscoverySamples,
  getDiscoveryVisualizations,
} from "./discovery_api";

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
  update = entry => {
    this.entries[entry.id] = entry;
  };

  reset = () => {
    this.orderedIds = null;
    this.loading = true;
  };
}

class DiscoveryDataLayer {
  constructor(domain) {
    this.domain = domain;

    this.projects = new ObjectCollection();
    this.samples = new ObjectCollection();
    this.visualizations = new ObjectCollection();

    this.apiFunctions = {
      projects: this.fetchProjects,
      samples: this.fetchSamples,
      visualizations: this.fetchVisualizations,
    };
  }

  fetchSamples = async params => {
    const {
      samples: fetchedObjects,
      sampleIds: fetchedObjectIds,
    } = await getDiscoverySamples(params);
    return { fetchedObjects, fetchedObjectIds };
  };

  fetchProjects = async params => {
    const {
      projects: fetchedObjects,
      projectIds: fetchedObjectIds,
    } = await getDiscoveryProjects(params);
    return { fetchedObjects, fetchedObjectIds };
  };

  fetchVisualizations = async params => {
    const {
      visualizations: fetchedObjects,
      visualizationIds: fetchedObjectIds,
    } = await getDiscoveryVisualizations(params);
    return { fetchedObjects, fetchedObjectIds };
  };

  loadObjectsByIdList = async ({ dataType, ids, ...props }) => {
    const collection = this[dataType];
    const requestedIds = new Set(ids);
    let startIndex = null;
    let stopIndex = null;

    for (let idx; idx < collection.orderedIds.length; idx++) {
      if (collection.orderedIds[idx] in requestedIds) {
        startIndex = startIndex || idx;
        stopIndex = idx;
      }
    }

    if (startIndex) {
      await this.handleLoadObjectRows({
        dataType,
        startIndex,
        stopIndex,
        ...props,
      });
      console.log(
        "DiscoveryDataLayer:handleLoadObjectRows",
        dataType,
        ids,
        props,
        pick(requestedIds, collection.entries)
      );
      return pick(requestedIds, collection.entries);
    }

    if (ids.length) {
      // eslint-disable-next-line no-console
      console.error("Non-existent IDs requested");
    }
    return [];
  };

  handleLoadObjectRows = async ({
    dataType,
    startIndex,
    stopIndex,
    conditions = {},
    onDataLoaded,
  }) => {
    console.log(
      "DiscoveryDataLayer:handleLoadObjectRows",
      dataType,
      startIndex,
      stopIndex,
      conditions,
      onDataLoaded
    );
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
