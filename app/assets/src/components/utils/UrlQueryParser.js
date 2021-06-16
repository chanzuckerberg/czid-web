import { has } from "lodash/fp";
import QueryString from "query-string";

class UrlQueryParser {
  // This util class enhances query-string to enable parsing
  // string values to desired object types.
  // Also takes care of stringifying nested object values.

  constructor(types = {}) {
    this._types = types;
  }

  parse(query) {
    const params = QueryString.parse(query);
    Object.entries(this._types).forEach(([key, type]) => {
      if (params[key]) {
        params[key] = this.convertValue(params[key], type);
      }
    });
    return params;
  }

  stringify(object) {
    const convertedObject = Object.keys(object).reduce((hash, key) => {
      if (object[key]) {
        if (this._types[key]) {
          hash[key] = this.stringifyValue(object[key], this._types[key]);
        } else {
          hash[key] = object[key];
        }
      }
      return hash;
    }, {});
    return QueryString.stringify(convertedObject);
  }

  convertValue(value, type) {
    switch (type) {
      case "object":
        return JSON.parse(value);
      case "boolean":
        return value === "true";
      case "number":
        return Number(value);
      case "string":
        return value;
      default:
        // eslint-disable-next-line no-console
        console.warn(
          `[UrlQueryParser] Type not supported (${type}). You might not need to specify this value`
        );
        return value;
    }
  }

  stringifyValue(value, type) {
    switch (type) {
      case "object":
        return !value || Object.keys(value).length === 0
          ? undefined
          : JSON.stringify(value);
      default:
        return value;
    }
  }

  // Updates a query string parameter that currently exist in the URL and returns the updated query paramters.
  updateQueryStringParameter(searchUrl, key, value) {
    const queryStringParams = this.parse(searchUrl);

    if (has(key, queryStringParams)) {
      queryStringParams[key] = value;
    }

    return queryStringParams;
  }
}

export default UrlQueryParser;
