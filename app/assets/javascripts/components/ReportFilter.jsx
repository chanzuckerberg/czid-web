/**
 @class ReportFilter
 @desc Creates react component to handle filtering in the page
 */
class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    this.sample_id = props.sample_id;
    this.background_model = props.background_model || 'N/A';
    this.backgroundModels = props.all_backgrounds || [];
    this.all_categories = props.all_categories || [];
    this.applyExcludedCategories = this.applyExcludedCategories.bind(this);
    this.searchSelectedTaxon = this.searchSelectedTaxon.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.resetAllFilters = this.resetAllFilters.bind(this);

    this.handleBackgroundModelChange = this.handleBackgroundModelChange.bind(this);
    this.state = {
      searchKey: '',
      searchId: 0,
      excluded_categories: [],
      backgroundName: this.background_model.name || null,
      backgroundParams: this.background_model.id || null,
      search_items: props.search_keys_in_sample
    }
  }
  componentWillReceiveProps(newProps){
      this.setState({search_items: newProps.search_keys_in_sample})
  }

  componentDidMount() {
    this.initializeSelectTag();
    $(ReactDOM.findDOMNode(this.refs.background)).on('change',this.handleBackgroundModelChange);
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
    ReportFilter.showLoading('Fetching results for new background...');
    new_params = Object.assign({}, this.props.report_page_params, overrides);
    window.location = location.protocol + '//' + location.host + location.pathname + '?' + jQuery.param(new_params);
  }


  handleBackgroundModelChange(e) {
    const selectedIndex = e.target.selectedIndex
    this.setState({
      backgroundName: e.target.value,
      backgroundParams: this.backgroundModels[selectedIndex].id
    });
    background_id = this.state.backgroundParams
    this.refreshPage({background_id});
  }

  resizeFilterHeight() {
    const height = window.innerHeight;
    const subHeader = $('.sub-header-component').height();
    const headerHeight = $('.site-header').height();
    const newHeight = height;
    // $('.reports-sidebar').css('min-height', newHeight);
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

  applyExcludedCategories(e) {
    //ReportFilter.showLoading('Applying category filter...');
    let excluded_categories = this.state.excluded_categories
    if (e.target.checked) {
      ridx = excluded_categories.indexOf(e.target.value)
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
    })
    this.applySearchFilter(0, excluded_categories)

    // flash
    $(`.filter-message`).addClass('flash')
    $(`.filter-message`).one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(event) {
      $(`.filter-message`).removeClass('flash')
    });
  }

  resetAllFilters() {
    this.setState({
      excluded_categories: [],
      searchId: 0,
      searchKey: ''
    })
    this.props.resetAllFilters()
  }

  searchSelectedTaxon(value, item) {
    //ReportFilter.showLoading(`Filtering for '${value}'...`);
    let searchId = item[1];
    this.state.searchId = searchId
    this.state.excluded_categories = []
    this.state.searchKey = item[0]

    this.applySearchFilter(searchId, [])
  }

  applySearchFilter(searchId, excluded_categories) {
    this.props.applySearchFilter(searchId, excluded_categories)
  }

  render() {
    align_right = {'textAlign': 'right'};
    category_filter = (
        <div className="filter-controls">
          <div className="category-title">
            CATEGORIES
          </div>
          <div className="categories">
            { this.all_categories.map((category, i) => {
              return (
                <p key={i}>
                  <input type="checkbox" className="filled-in cat-filter" id={category.name} value={category.name} onClick={this.applyExcludedCategories} onChange={(e) => {}} checked={this.state.excluded_categories.indexOf(category.name) < 0} />
                  <label htmlFor={ category.name }>{ category.name }</label>
                </p>
              )
            })}
            { this.all_categories.length < 1 ? <p>None found</p> : '' }
          </div>
        </div>
    );
    genus_search = (
      <div className="filter-controls">
        <div className="row">
          <div className="input-field col s12 genus-search-row">
            <div className='genus-name-label'>SEARCH</div>
            <div className="filter-values genus-autocomplete-container">
              <ReactAutocomplete
                inputProps={{ placeholder: 'species, genus, family, etc' }}
                items={this.state.search_items}
                shouldItemRender={(item, value) => (item[0] == 'All') || (value.length > 2 && item[0].toLowerCase().indexOf(value.toLowerCase()) > -1)}
                getItemValue={item => item[0]}
                renderItem={(item, highlighted) =>
                  <div
                    key={item[1]}
                    style={{ backgroundColor: highlighted ? '#eee' : 'transparent'}}
                  >
                    {item[0]}
                  </div>
                }
                value={this.state.searchKey}
                onChange={this.handleSearch}
                onSelect={this.searchSelectedTaxon}
              />
            </div>
          </div>
        </div>
      </div>
    );
    filter_message = (
      <div className="filter-message"><span className="count">hello</span></div>
    );
    return (
      <div>
        <div className="sidebar-title">
          Report filters
        </div>
        <div className="sidebar-tabs">
          <div className="row">
            <div className="col s12 sidebar-full-container">
              <div id="reports-pane" className="pane col s12">
                <div className="sidebar-pane">
                  <div className="report-data background-model">
                    <div className="report-title">
                      Select background model
                    </div>
                      <div className="input-field">
                        <select ref="background" name="background" className="" id="background" onChange={ this.handleBackgroundModelChange } value={this.state.backgroundName}>
                          { this.backgroundModels.length ?
                              this.backgroundModels.map((background, i) => {
                                return <option ref= "background" key={i}  >{background.name}</option>
                              }) : <option>No background models to display</option>
                            }
                        </select>
                      </div>
                  </div>
                </div>
              </div>
              <div id="filters-pane" className="pane col s12">
                {category_filter}
                {genus_search}
                {filter_message}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ReportFilter.propTypes = {
  background_model: React.PropTypes.object
};
