/**
 @class ReportFilter
 @desc Creates react component to handle filtering in the page
 */
class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    this.sample_id = props.sample_id;
    this.background_model = props.background_model || 'N/A';
    this.all_categories = props.all_categories || [];
    this.state = ReportFilter.genusSearchValueFor(props.report_page_params.selected_genus);
    this.genus_search_items = this.props.all_genera_in_sample;
    this.genus_search_items.splice(0, 0, 'None');
    this.applyExcludedCategories = this.applyExcludedCategories.bind(this);
    this.applyGenusFilter = this.applyGenusFilter.bind(this);
    this.enableFilters = this.enableFilters.bind(this);
    this.clearGenusSearch = this.clearGenusSearch.bind(this);
  }

  componentDidMount() {
    // a polyfill for firefox, but disbaled for now
    // $(window).resize(() => {
    //   this.resizeFilterHeight();
    // });
  }

  resizeFilterHeight() {
    const height = window.innerHeight;
    const subHeader = $('.sub-header-component').height();
    const headerHeight = $('.site-header').height();
    const newHeight = height;
    // $('.reports-sidebar').css('min-height', newHeight);
  }

  static genusSearchValueFor(selected_genus) {
    genus_search_value = selected_genus == 'None' ? '' : selected_genus;
    return {genus_search_value};
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

  applyGenusFilter(selected_genus) {
    ReportFilter.showLoading(`Filtering for '${selected_genus}'...`);
    this.setState(ReportFilter.genusSearchValueFor(selected_genus));
    this.props.applyGenusFilter(selected_genus);
  }

  clearGenusSearch() {
    this.applyGenusFilter('None');
  }

  render() {
    align_right = {'textAlign': 'right'};
    category_filter = '';
    if (this.props.report_page_params.disable_filters == 0 && this.props.report_page_params.selected_genus == 'None') {
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
    }
    genus_search = '';
    if (this.props.report_page_params.disable_filters == 0) {
      genus_search = (
        <div className="filter-controls">
          <div className="row">
            <div className="input-field col s12 genus-search-row">
              <div className='genus-name-label'>GENUS SEARCH</div>
              <div className="filter-values genus-autocomplete-container">
                <ReactAutocomplete
                  inputProps={{ placeholder: 'Search for a genus...' }}
                  items={this.genus_search_items}
                  shouldItemRender={(item, value) => item == 'None' || item.toLowerCase().indexOf(value.toLowerCase()) > -1}
                  getItemValue={item => item}
                  renderItem={(item, highlighted) =>
                    <div
                      key={item}
                      style={{ backgroundColor: highlighted ? '#eee' : 'transparent'}}
                    >
                      {item}
                    </div>
                  }
                  value={this.state.genus_search_value}
                  onChange={(e) => this.setState(ReportFilter.genusSearchValueFor(e.target.value))}
                  onSelect={this.applyGenusFilter}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }
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
                      Background model
                    </div>
                    <div className="report-value">
                      { this.background_model }
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
  background_model: React.PropTypes.string,
};
