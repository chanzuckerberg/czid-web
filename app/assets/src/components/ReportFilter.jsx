import React from 'react';
import $ from 'jquery';

/**
 @class ReportFilter
 @desc Creates react component to handle filtering in the page
 */
class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  static showLoading(message) {
    $('.page-loading .spinner-label').text(message);
    $('body').css('overflow', 'hidden');
    $('.page-loading').css('display', 'flex');
  }

  static hideLoading() {
    $('.page-loading .spinner-label').text();
    $('body').css('overflow', 'scroll');
    $('.page-loading').css('display', 'none');
  }

  render() {
    return (
      <div>
        <div className="sidebar-title">
          Report filters
        </div>
        <div className="sidebar-tabs">
          <div className="row">
            <div className="col s12 sidebar-full-container">
              <div id="filters-pane" className="pane col s12">

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ReportFilter;
