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
    this.applyGenusFilter = this.applyGenusFilter.bind(this);
    this.enableFilters = this.enableFilters.bind(this);
    this.clearGenusSearch = this.clearGenusSearch.bind(this);

    this.handleBackgroundModelChange = this.handleBackgroundModelChange.bind(this);
    this.handleGenusSearch = this.handleGenusSearch.bind(this);
    this.state = {
      searchKey: null,
      searchId: null,
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

  handleGenusSearch(e) {
    this.setState({
      searchKey: e.target.value
    })
  }

  refreshPage(overrides) {
    ReportFilter.showLoading('Fetching results...');
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

  setGenusSearchValueFor(selected_genus) {
    genus_search_value = selected_genus == 'None' ? '' : selected_genus;
    return genus_search_value;
  }

  enableFilters() {
    this.props.enableFilters();
  }

  static showLoading(message) {
    $('.page-loading .spinner-label').text(message);
    $('body').css('overflow', 'hidden');
    $('.page-loading').css('display', 'flex');
  }

  applyExcludedCategories(e) {
    ReportFilter.showLoading('Applying category filter...');
    this.props.applyExcludedCategories(e.target.value, e.target.checked)
  }

  applyGenusFilter(value, item) {
    ReportFilter.showLoading(`Filtering for '${selected_genus}'...`);
    this.setState({
      searchKey: value,
      searchId: item[1]
    });
    this.props.applyGenusFilter(searchId);
  }

  clearGenusSearch() {
    this.applyGenusFilter('None');
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
                  <input type="checkbox" className="filled-in cat-filter" id={category.name} value={category.name} onClick={this.applyExcludedCategories} defaultChecked={this.props.report_page_params.excluded_categories.indexOf(category.name) < 0} />
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
                inputProps={{ placeholder: 'specifies, genus, family, etc' }}
                items={this.state.search_items}
                shouldItemRender={(item, value) => item[0] == 'None' || item[0].toLowerCase().indexOf(value.toLowerCase()) > -1}
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
                onChange={this.handleGenusSearch}
                onSelect={this.applyGenusFilter}
              />
            </div>
          </div>
        </div>
      </div>
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
