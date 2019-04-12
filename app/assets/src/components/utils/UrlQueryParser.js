import QueryString from "query-string";

class UrlQueryParser {
  // This util class enhances query-string to be enable parsing
  // string values to desired object types.

  constructor(types = {}) {
    this._types = types;
  }

  parse(query) {
    let params = QueryString.parse(query);
    Object.entries(this._types).forEach(([key, type]) => {
      if (params[key]) {
        params[key] = this.convertValue(params[key], type);
      }
    });
    return params;
  }

  stringify(object) {
    const convertedObject = Object.keys(object).reduce((hash, key) => {
      if (this._types[key]) {
        hash[key] = this.stringifyValue(object[key], this._types[key]);
      } else {
        hash[key] = object[key];
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
      default:
        // eslint-disable-next-line no-console
        console.error(
          `UrlQueryParser - Type not supported (${type}). You might not need to specify this value`
        );
        return value;
    }
  }

  stringifyValue(value, type) {
    switch (type) {
      case "object":
        return Object.keys(value).length === 0
          ? undefined
          : JSON.stringify(value);
      default:
        return value;
    }
  }
}

export default UrlQueryParser;
