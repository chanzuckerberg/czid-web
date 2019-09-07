import { range } from "lodash/fp";
import {
  getDiscoveryProjects,
  getDiscoverySamples,
  getDiscoveryVisualizations,
} from "./discovery_api";

export default class DiscoveryDataLayer {
  constructor(domain) {
    this.domain = domain;

    this.data = {
      projects: this.newObjectDb(),
      samples: this.newObjectDb(),
      visualizations: this.newObjectDb(),
    };

    this.apiFunctions = {
      projects: this.fetchProjects,
      samples: this.fetchSamples,
      visualizations: this.fetchVisualizations,
    };
  }

  newObjectDb = () => ({
    entries: {},
    orderedIds: null,
    loading: true,
  });

  reset = dataType => {
    const objectDb = this.data[dataType];
    objectDb.orderedIds = null;
    objectDb.loading = true;
  };

  get = dataType => Object.values(this.data[dataType].entries);
  getIds = dataType => this.data[dataType].orderedIds || [];
  getLength = dataType => Object.keys(this.data[dataType].entries).length;
  isLoading = dataType => this.data[dataType].loading;

  update = (dataType, object) => {
    this.data[dataType][object.id] = object;
  };

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

  handleLoadObjectRows = async ({
    dataType,
    startIndex,
    stopIndex,
    conditions = {},
    onDataLoaded,
  }) => {
    const objects = this.data[dataType];
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
