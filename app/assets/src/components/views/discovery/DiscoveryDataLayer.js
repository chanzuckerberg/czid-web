import { range } from "lodash/fp";
import {
  getDiscoveryProjects,
  getDiscoverySamples,
  getDiscoveryVisualizations,
} from "./discovery_api";

class ObjectCollection {
  constructor(domain, apiFunction) {
    this.domain = domain;
    this.entries = {};
    this.apiFunction = apiFunction;
  }

  createView = viewProps => {
    return new ObjectCollectionView(this, viewProps);
  };

  update = entry => {
    this.entries[entry.id] = entry;
  };
}

class ObjectCollectionView {
  constructor(
    collection,
    { conditions = {}, pageSize = 50, onViewChange = null }
  ) {
    this._orderedIds = null;
    this._loading = true;
    this._collection = collection;
    this._conditions = conditions;
    this._activePromises = {};
    this._pageSize = pageSize;

    this._onViewChange = onViewChange;
  }

  get loaded() {
    return (this._orderedIds || [])
      .filter(id => id in this._collection.entries)
      .map(id => this._collection.entries[id]);
  }
  get length() {
    return (this._orderedIds || []).length;
  }
  get = id => this._collection.entries[id];
  getIds = () => this._orderedIds || [];
  getCollectionLength = () => {
    return Object.keys(this._collection.entries).length;
  };
  isLoading = () => this._loading;
  reset = ({ conditions } = {}) => {
    this._orderedIds = null;
    this._loading = true;
    this._conditions = conditions;
    this._activePromises = {};
  };

  loadPage = async pageNumber => {
    const indices = {
      startIndex: pageNumber,
      stopIndex: this._pageSize * (1 + pageNumber) - 1,
    };
    return this.handleLoadObjectRows(indices);
  };

  handleLoadObjectRows = async ({ startIndex, stopIndex }) => {
    // Make sure we do not load the same information twice
    // If conditions change (see reset), then the active promises tracker is emptied
    // CAVEAT: we use a key based on 'startIndex,stopindex', thus, this only works if the request are exactly the same
    // Asking for a subset of an existing request (e.g. asking for 0,49 and then 10,19) will still lead to redundant requests
    const key = [startIndex, stopIndex];
    if (this._activePromises[key]) {
      const promiseLoadObjectRows = this._activePromises[key];
      return await promiseLoadObjectRows;
    } else {
      const promiseLoadObjectRows = this.fetchObjectRows({
        startIndex,
        stopIndex,
      });
      this._activePromises[key] = promiseLoadObjectRows;
      const result = await promiseLoadObjectRows;
      delete this._activePromises[key];
      return result;
    }
  };

  fetchObjectRows = async ({ startIndex, stopIndex }) => {
    const domain = this._collection.domain;

    const minStopIndex = this._orderedIds
      ? Math.min(this._orderedIds.length - 1, stopIndex)
      : stopIndex;
    let missingIdxs = range(startIndex, minStopIndex + 1);
    if (this._orderedIds) {
      missingIdxs = missingIdxs.filter(
        idx => !(this._orderedIds[idx] in this._collection.entries)
      );
    }
    if (missingIdxs.length > 0) {
      // currently loads using limit and offset
      // could eventually lead to redundant fetches if data is not requested in regular-sized chunks
      const minNeededIdx = missingIdxs[0];
      const maxNeededIdx = missingIdxs[missingIdxs.length - 1];
      const {
        fetchedObjects,
        fetchedObjectIds,
      } = await this._collection.apiFunction({
        domain,
        ...this._conditions,
        limit: maxNeededIdx - minNeededIdx + 1,
        offset: minNeededIdx,
        listAllIds: this._orderedIds === null,
      });

      fetchedObjects.forEach(sample => {
        this._collection.entries[sample.id] = sample;
      });

      if (fetchedObjectIds) {
        this._orderedIds = fetchedObjectIds;
        this._onViewChange && this._onViewChange();
      }

      this._loading = false;
    }

    const requestedObjects = range(startIndex, minStopIndex + 1)
      .filter(idx => idx in this._orderedIds)
      .map(idx => this._collection.entries[this._orderedIds[idx]]);

    return requestedObjects;
  };
}

class DiscoveryDataLayer {
  constructor(domain) {
    // TODO: Move domain to conditions object
    this.domain = domain;

    this.projects = new ObjectCollection(domain, this.fetchProjects);
    this.samples = new ObjectCollection(domain, this.fetchSamples);
    this.visualizations = new ObjectCollection(
      domain,
      this.fetchVisualizations
    );
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
}

export { DiscoveryDataLayer, ObjectCollection, ObjectCollectionView };
