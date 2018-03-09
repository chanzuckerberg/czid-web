import React from 'react';
import $ from 'jquery';
import Nanobar from 'nanobar';

/**
 @class ReportFilter
 @desc Creates react component to handle filtering in the page
 */
class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    this.nanobar = new Nanobar({
      id: 'prog-bar',
      class: 'prog-bar'
    });
    this.sample_id = props.sample_id;
    this.default_background = props.default_background || 'N/A';
    this.backgroundModels = props.all_backgrounds || [];
    this.all_categories = props.all_categories || [];
    this.applyExcludedCategories = this.applyExcludedCategories.bind(this);
    this.searchSelectedTaxon = this.searchSelectedTaxon.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.resetAllFilters = this.resetAllFilters.bind(this);

    this.handleBackgroundModelChange = this.handleBackgroundModelChange.bind(this);
    this.handleNameTypeChange = this.handleNameTypeChange.bind(this);
    this.applyNameType = this.applyNameType.bind(this);
    const cached_cats = Cookies.get('excluded_categories');
    this.state = {
      searchKey: '',
      searchId: 0,
      excluded_categories: (cached_cats) ? JSON.parse(cached_cats) : [] ,
      backgroundName: Cookies.get('background_name') || this.default_background.name ,
      backgroundParams: Cookies.get('background_id') || this.default_background.id,
      name_type: Cookies.get('name_type') || 'scientific',
      search_items: props.search_keys_in_sample
    };
  }
  componentWillReceiveProps(newProps){
      this.setState({search_items: newProps.search_keys_in_sample})
  }

  componentDidMount() {
    this.initializeSelectTag();
    $(ReactDOM.findDOMNode(this.refs.background)).on('change',this.handleBackgroundModelChange);
    $(ReactDOM.findDOMNode(this.refs.name_type)).on('change',this.handleNameTypeChange);
    // a polyfill for firefox, but disbaled for now
    // $(window).resize(() => {
    //   this.resizeFilterHeight();
    // });
  }

  initializeSelectTag() {
    $('select').material_select();
  }

  handleSearch(e) {
    this.setState({
      searchKey: e.target.value,
    })
  }

  // only for background model
  refreshPage(overrides) {
    this.nanobar.go(30);
    const new_params = Object.assign({}, this.props.report_page_params, overrides);
    window.location = location.protocol + '//' + location.host + location.pathname + '?' + $.param(new_params);
  }


  handleBackgroundModelChange(e) {
    const backgroundName = e.target.value;
    const backgroundParams = this.backgroundModels[e.target.selectedIndex].id;
    this.setState({ backgroundName, backgroundParams }, () => {
      Cookies.set('background_name', backgroundName);
      Cookies.set('background_id', backgroundParams);
      this.refreshPage({background_id: backgroundParams});
    });
  }

  handleNameTypeChange(e) {
    const name_type = e.target.value;
    this.setState({ name_type: name_type }, () => {
      Cookies.set('name_type', name_type);
      this.applyNameType(name_type);
    });
  }

  applyNameType(name_type) {
    this.props.applyNameType(name_type);
  }

  resizeFilterHeight() {
    const height = window.innerHeight;
    const subHeader = $('.sub-header-component').height();
    const headerHeight = $('.site-header').height();
    const newHeight = height;
    // $('.reports-sidebar').css('min-height', newHeight);
  }


  applyExcludedCategories(e) {
    //ReportFilter.showLoading('Applying category filter...');
    let excluded_categories = this.state.excluded_categories;
    if (e.target.checked) {
      const ridx = excluded_categories.indexOf(e.target.value);
      if (ridx > -1) {
        excluded_categories.splice(ridx, 1);
      }
    } else {
      excluded_categories.push(e.target.value);
    }
    this.setState({
      excluded_categories: excluded_categories,
      searchId: 0,
      searchKey: ''
    }, () => {
      Cookies.set('excluded_categories', JSON.stringify(excluded_categories));
      this.applySearchFilter(0, excluded_categories);
      this.flash();
    });
  }

  flash() {
    this.props.flash()
  }

  resetAllFilters() {
    this.setState({
      excluded_categories: [],
      searchId: 0,
      searchKey: ''
    });
    this.props.resetAllFilters()
  }

  searchSelectedTaxon(value, item) {
    //ReportFilter.showLoading(`Filtering for '${value}'...`);
    let searchId = item[1];
    this.setState({
      searchId,
      excluded_categories: [],
      searchKey: item[0]
    }, () => {
      this.applySearchFilter(searchId, []);
    });
  }

  applySearchFilter(searchId, excluded_categories) {
    this.props.applySearchFilter(searchId, excluded_categories);
    this.flash()
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
