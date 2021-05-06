import { findIndex, findLastIndex, range, slice } from "lodash/fp";
import {
  getDiscoveryProjects,
  getDiscoverySamples,
  getDiscoveryVisualizations,
} from "./discovery_api";

class ObjectCollection {
  constructor(
    // domain of the collection (my data, all data, public, snapshot)
    domain,
    // function to fetch data from server
    // should take the following parameters:
    // - domain: my_data, public, all_data, snapshot
    // - ...conditions: any callback specific filters
    // - limit: maximum number of results
    // - offset: number of results to skip
    // - listAllIds: boolean that indicates if it should retrieve
    //   a list of all possible IDs
    fetchDataCallback,
    // name of the view: mostly used for debug
    displayName = ""
  ) {
    this.domain = domain;
    this.entries = {};
    this.fetchDataCallback = fetchDataCallback;
    this._displayName = displayName;
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
    {
      // conditions: Extra conditions to use for this view.
      // These will be sent to the fetchDataCallback of the corresponding collection when requesting new data.
      conditions = {},
      // pageSize: Size of the page for this view.
      pageSize = 50,
      // callbacks to notify the client when changes occur
      // onViewChange: triggered when the view finishes loading new object ids (the full list of ids in the view)
      onViewChange = null,
      // name of the view: mostly used for debug
      displayName = "",
    }
  ) {
    this._orderedIds = null;
    this._loading = true;
    this._collection = collection;
    this._conditions = conditions;
    this._activePromises = {};
    this._pageSize = pageSize;
    this._displayName = displayName;
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

  get displayName() {
    return this._displayName;
  }

  get entries() {
    return this._collection.entries;
  }

  get = id => this._collection.entries[id];

  getIds = () => this._orderedIds || [];

  getViewLength = () => {
    return Object.keys(this._collection.entries).length;
  };

  getIntermediateIds = ({ id1, id2 }) => {
    const start = findIndex(v => v === id1 || v === id2, this._orderedIds);
    const end = findLastIndex(v => v === id1 || v === id2, this._orderedIds);
    return slice(start, end + 1, this._orderedIds);
  };

  isLoading = () => this._loading;

  reset = ({ conditions, loadFirstPage = false } = {}) => {
    this._orderedIds = null;
    this._loading = true;
    this._conditions = conditions;
    this._activePromises = {};

    if (loadFirstPage) {
      this.loadPage(0);
    }
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
      const promiseResponse = await promiseLoadObjectRows;
      return promiseResponse;
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
      } = await this._collection.fetchDataCallback({
        domain,
        ...this._conditions,
        limit: maxNeededIdx - minNeededIdx + 1,
        offset: minNeededIdx,
        listAllIds: this._orderedIds === null,
      });

      fetchedObjects.forEach(sample => {
        this._collection.entries[sample.id] = sample;
      });

      // We currently load the ids of ALL objects in the view. This allows using a simple solution to
      // handle the select all options.
      // It currently works with minimal performance impact, but might need to review in the future, as the number
      // of objects in these views increases
      if (fetchedObjectIds) {
        this._orderedIds = fetchedObjectIds;
        this._loading = false;
        this._onViewChange && this._onViewChange();
      } else {
        this._loading = false;
      }
    }

    return range(startIndex, minStopIndex + 1)
      .filter(idx => idx in this._orderedIds)
      .map(idx => this._collection.entries[this._orderedIds[idx]]);
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
