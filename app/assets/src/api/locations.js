import { get } from "./core";

export const getGeoSearchSuggestions = query =>
  get("/locations/external_search", {
    params: { query }
  });
