import { LocationObject } from "~/interface/shared";
import { get } from "./core";

export const getGeoSearchSuggestions = (
  query: string,
  limit = null,
): Promise<LocationObject[]> =>
  get("/locations/external_search", {
    params: { query, limit },
  });
