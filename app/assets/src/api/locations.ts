import { get } from "./core";

export const getGeoSearchSuggestions = (query: $TSFixMe, limit = null) =>
  get("/locations/external_search", {
    params: { query, limit },
  });
