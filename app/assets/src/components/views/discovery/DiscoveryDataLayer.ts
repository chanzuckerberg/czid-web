import { findIndex, findLastIndex, range, slice } from "lodash/fp";
import { ViewProps } from "~/interface/samplesView";
import {
  getDiscoveryProjects,
  getDiscoverySamples,
  getDiscoveryVisualizations,
  getDiscoveryWorkflowRuns,
} from "./discovery_api";

class ObjectCollection<T extends { id: ID }, ID extends string | number> {
  domain: string;
  entries: Map<ID, T>;
  fetchDataCallback: (
    params,
  ) => Promise<{ fetchedObjects: T[]; fetchedObjectIds: number[] }>;
  constructor(
    // domain of the collection (my data, all data, public, snapshot)
    domain: string,
    // function to fetch data from server
    // should take the following parameters:
    // - domain: my_data, public, all_data, snapshot
    // - ...conditions: any callback specific filters
    // - limit: maximum number of results
    // - offset: number of results to skip
    // - listAllIds: boolean that indicates if it should retrieve
    //   a list of all possible IDs
    fetchDataCallback: ObjectCollection<T, ID>["fetchDataCallback"],
  ) {
    this.domain = domain;
    this.entries = new Map();
    this.fetchDataCallback = fetchDataCallback;
  }

  createView = (viewProps: ViewProps) => {
    return new ObjectCollectionView<T, ID>(this, viewProps);
  };

  update = (entry: T) => {
    this.entries.set(entry.id, entry);
  };
}

class ObjectCollectionView<T extends { id: ID }, ID extends string | number> {
  private _activePromises: object;
  private _collection: ObjectCollection<T, ID>;
  private _conditions: ViewProps["conditions"];
  private _shouldConvertIdToString: ViewProps["shouldConvertIdToString"];
  private _loading: boolean;
  private _onViewChange: ViewProps["onViewChange"];
  private _orderedIds: ID[];
  private _pageSize: ViewProps["pageSize"];
  constructor(
    collection: ObjectCollection<T, ID>,
    {
      // conditions: Extra conditions to use for this view.
      // These will be sent to the fetchDataCallback of the corresponding collection when requesting new data.
      conditions = {},
      // pageSize: Size of the page for this view.
      pageSize = 50,
      // callbacks to notify the client when changes occur
      // onViewChange: triggered when the view finishes loading new object ids (the full list of ids in the view)
      onViewChange,
      shouldConvertIdToString,
    },
  ) {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this._orderedIds = null;
    this._loading = true;
    this._collection = collection;
    this._conditions = conditions;
    this._activePromises = {};
    this._pageSize = pageSize;
    this._shouldConvertIdToString = shouldConvertIdToString;
    this._onViewChange = onViewChange;
  }

  get loaded() {
    return (this._orderedIds || [])
      .filter(id => this._collection.entries.has(id))
      .map(id => this._collection.entries.get(id));
  }

  get length() {
    return (this._orderedIds || []).length;
  }

  get = (id: ID) => this._collection.entries.get(id);

  getIds = () => this._orderedIds || [];

  getIntermediateIds = ({ id1, id2 }: { id1: number; id2: number }) => {
    const start = findIndex(v => v === id1 || v === id2, this._orderedIds);
    const end = findLastIndex(v => v === id1 || v === id2, this._orderedIds);
    return slice(start, end + 1, this._orderedIds);
  };

  isLoading = () => this._loading;

  reset = ({
    conditions,
    loadFirstPage = false,
  }: {
    conditions?: ObjectCollectionView<T, ID>["_conditions"];
    loadFirstPage?: boolean;
  } = {}) => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this._orderedIds = null;
    this._loading = true;
    this._conditions = conditions;
    this._activePromises = {};

    if (loadFirstPage) {
      this.loadPage(0);
    }
  };

  loadPage = async (pageNumber: number) => {
    const indices = {
      startIndex: pageNumber,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      stopIndex: this._pageSize * (1 + pageNumber) - 1,
    };
    return this.handleLoadObjectRows(indices);
  };

  handleLoadObjectRows = async ({
    startIndex,
    stopIndex,
  }: {
    startIndex: number;
    stopIndex: number;
  }) => {
    // Make sure we do not load the same information twice
    // If conditions change (see reset), then the active promises tracker is emptied
    // CAVEAT: we use a key based on 'startIndex,stopindex', thus, this only works if the request are exactly the same
    // Asking for a subset of an existing request (e.g. asking for 0,49 and then 10,19) will still lead to redundant requests
    const key = [startIndex, stopIndex];
    // @ts-expect-error Type 'number[]' cannot be used as an index type.
    if (this._activePromises[key]) {
      // @ts-expect-error Type 'number[]' cannot be used as an index type.
      return this._activePromises[key];
    }

    const promiseLoadObjectRows = this.fetchObjectRows({
      startIndex,
      stopIndex,
    });
    // @ts-expect-error Type 'any[]' cannot be used as an index type.
    this._activePromises[key] = promiseLoadObjectRows;
    const result = await promiseLoadObjectRows;
    // @ts-expect-error Type 'any[]' cannot be used as an index type.
    delete this._activePromises[key];
    return result;
  };

  fetchObjectRows = async ({
    startIndex,
    stopIndex,
  }: {
    startIndex: number;
    stopIndex: number;
  }) => {
    const domain = this._collection.domain;

    const minStopIndex = this._orderedIds
      ? Math.min(this._orderedIds.length - 1, stopIndex)
      : stopIndex;
    let missingIdxs = range(startIndex, minStopIndex + 1);
    if (this._orderedIds) {
      missingIdxs = missingIdxs.filter(
        idx => !this._collection.entries.has(this._orderedIds[idx]),
      );
    }
    if (missingIdxs.length > 0) {
      // currently loads using limit and offset
      // could eventually lead to redundant fetches if data is not requested in regular-sized chunks
      const minNeededIdx = missingIdxs[0];
      const maxNeededIdx = missingIdxs[missingIdxs.length - 1];
      const { fetchedObjects, fetchedObjectIds } =
        await this._collection.fetchDataCallback({
          domain,
          ...this._conditions,
          limit: maxNeededIdx - minNeededIdx + 1,
          offset: minNeededIdx,
          listAllIds: this._orderedIds === null,
        });

      fetchedObjects.forEach((object: $TSFixMe) => {
        if (this._shouldConvertIdToString) {
          this._collection.entries.set(object.id.toString(), {
            ...object,
            id: object.id.toString(),
          });
        } else {
          this._collection.entries.set(object.id, object);
        }
      });

      // We currently load the ids of ALL objects in the view. This allows using a simple solution to
      // handle the select all options.
      // It currently works with minimal performance impact, but might need to review in the future, as the number
      // of objects in these views increases
      if (fetchedObjectIds) {
        this._orderedIds = (
          this._shouldConvertIdToString
            ? fetchedObjectIds.map(id => id.toString())
            : fetchedObjectIds
        ) as ID[];
        this._loading = false;
        this._onViewChange && this._onViewChange();
      } else {
        this._loading = false;
      }
    }

    return range(startIndex, minStopIndex + 1)
      .filter(idx => idx in this._orderedIds)
      .map(idx => this._collection.entries.get(this._orderedIds[idx]));
  };
}

class DiscoveryDataLayer {
  amrWorkflowRuns: ObjectCollection<any, string>;
  benchmarkWorkflowRuns: ObjectCollection<any, string>;
  domain: string;
  longReadMngsSamples: ObjectCollection<any, string>;
  projects: ObjectCollection<any, string>;
  samples: ObjectCollection<any, string>;
  visualizations: ObjectCollection<any, number>;
  constructor(domain: string) {
    // TODO: Move domain to conditions object
    this.domain = domain;

    this.projects = new ObjectCollection(domain, this.fetchProjects);
    this.samples = new ObjectCollection(domain, this.fetchSamples);
    this.longReadMngsSamples = new ObjectCollection(domain, this.fetchSamples);
    this.visualizations = new ObjectCollection(
      domain,
      this.fetchVisualizations,
    );
    this.amrWorkflowRuns = new ObjectCollection(domain, this.fetchWorkflowRuns);
    this.benchmarkWorkflowRuns = new ObjectCollection(
      domain,
      this.fetchWorkflowRuns,
    );
  }

  fetchSamples = async (
    params: $TSFixMe,
  ): Promise<{
    fetchedObjects: $TSFixMe[];
    fetchedObjectIds: number[];
  }> => {
    const { samples: fetchedObjects, sampleIds: fetchedObjectIds } =
      await getDiscoverySamples(params);
    return { fetchedObjects, fetchedObjectIds };
  };

  fetchProjects = async (params: $TSFixMe) => {
    const { projects: fetchedObjects, projectIds: fetchedObjectIds } =
      await getDiscoveryProjects(params);
    return { fetchedObjects, fetchedObjectIds };
  };

  fetchVisualizations = async (params: $TSFixMe) => {
    const {
      visualizations: fetchedObjects,
      visualizationIds: fetchedObjectIds,
    } = await getDiscoveryVisualizations(params);
    return { fetchedObjects, fetchedObjectIds };
  };

  fetchWorkflowRuns = async (params: $TSFixMe) => {
    const { workflowRuns: fetchedObjects, workflowRunIds: fetchedObjectIds } =
      await getDiscoveryWorkflowRuns(params);
    return { fetchedObjects, fetchedObjectIds };
  };
}

export { DiscoveryDataLayer, ObjectCollectionView };
