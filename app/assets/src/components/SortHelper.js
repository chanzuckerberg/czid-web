/**
 * @class SortHelper
 * @desc a helper class to handle sorting on tables
*/
class SortHelper {

  /**
    @method currentSort
    @desc this gets the current sort from the url
    @return {Object} an object literal
  */
  static currentSort() {
    const sortBy = SortHelper.getFilter('sort_by');
    let currentSort = {};
    if (sortBy) {
      currentSort = {
        sortQuery: `sort_by=${sortBy}`
      };
    }
    return currentSort;
  }

  /**
    @method getFilter
    @param {String} name
    @desc this search the url parameter for the value of the specified get key
    @return {String} when it finds the value or null when it doesn't
  */
  static getFilter(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results) {
      return null;
    }
    if (!results[2]) {
      return null;
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  /**
    @method applySort
    @param {String} sortQuery
    @desc this method refreshes the entire page with the new query string parameters
  */
  static applySort(sortQuery) {
    const currentUrl = window.location.href;
    const url = SortHelper.deleteUrlParam(currentUrl, 'sort_by');
    if (SortHelper.hasQuery(url)) {
      window.location = `${url}&${sortQuery}`;
    } else {
      window.location = `${url}?${sortQuery}`;
    }
  }

  /**
   * @method deleteUrlParam
   * @param {String} url
   * @param {String} parameter
   * @desc this delete a query parameter from a url
   * @return {String} the modified url
  */
  static deleteUrlParam(url, parameter) {
    const queryString = url.split('?');
    if (queryString.length >= 2) {
      const prefix = `${encodeURIComponent(parameter)}=`;
      const pars = queryString[1].split(/[&;]/g);
      let i;
      for (i = pars.length; i--; i > 0) {
        if (pars[i].lastIndexOf(prefix, 0) !== -1) {
          pars.splice(i, 1);
        }
      }
      url = `${queryString[0]}${pars.length > 0 ? `?${pars.join('&')}` : ''}`;
    }
    return url;
  }

  /**
   * @method hasQuery
   * @param {String} url
   * @desc check if the url contain any get query
   * @return {Boolean} true if the urls has any query modifier
  */
  static hasQuery(url) {
    return (url.split('?').length >= 2);
  }
}

export default SortHelper;
