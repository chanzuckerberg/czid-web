/**
  @class Pagination
  @desc paginates dataset in an array
*/
class Pagination {
  /**
    @method constructor
  */
  constructor() {
    this.data = [];
    this.pageSize = 0;
    this.currentPage = -1;
    this.totalPages = 0;
  }

  /**
    @method initialize
    @param {Array} data
    @param {int} pageSize
    @desc initialize config for pagination
  */
  initialize(data, pageSize) {
    this.data = data;
    this.pageSize = pageSize;
    this.currentPage = -1;
    this.totalPages = Math.ceil(data.length / pageSize);
  }

  /**
    @method getCurrentPage
    @desc gets the current page
    @return {Array} current sliced portion
  */
  getCurrentPage() {
    return this.goto(this.currentPage);
  }

  /**
    @method next
    @desc increments current page
    @return {Array} a portion of the data
  */
  next() {
    this.currentPage += 1;
    return this.goto(this.currentPage);
  }

  /**
    @method prev
    @desc decrements current page
    @return {Array} a portion of the data
  */
  prev() {
    this.currentPage -= 1;
    return this.goto(this.currentPage);
  }

  /**
    @method paginate
    @param {Number} pageNumber
    @desc handles the actual pagination
    @return {Array} the filtered dataset
  */
  paginate(pageNumber) {
    // selects a portion of the array based on pagenumber
    const start = pageNumber * this.pageSize;
    const end = (pageNumber + 1) * this.pageSize;
    const result = this.data.slice(start, end);
    return result;
  }

  /**
   * @method firstPage
   * @desc return the first portion of the dataset
   * @return {Array} first set of data
  */
  firstPage() {
    this.currentPage = 0;
    return this.goto(this.currentPage);
  }

  /**
   * @method lastPage
   * @desc gets the last dataset
   * @return {Array} last dataset
  */
  lastPage() {
    this.currentPage = this.totalPages - 1;
    return this.goto(this.currentPage);
  }

  /**
    @method hasNext
    @desc checks if there's more to load
    @return {Boolean} true if it has more
  */
  hasNext() {
    return this.currentPage < this.totalPages - 1;
  }

  /**
    @method hasPrev
    @desc check if you can go back
    @return {Boolean} true if you can go back
  */
  hasPrev() {
    return this.currentPage > 0;
  }

  /**
    @method goto
    @param {int} pageNumber
    @desc allows you to go to a specific page
    @return {Array} a portion of the data
  */
  goto(pageNumber) {
    return this.paginate(pageNumber);
  }
}
