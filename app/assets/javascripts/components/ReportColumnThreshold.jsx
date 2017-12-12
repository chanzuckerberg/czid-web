/**
 @class ReportColumnThreshold
 @desc Creates react component to handle column thresholding in the page
 */
class ReportColumnThreshold extends React.Component {
  constructor(props) {
    super(props);
    this.metric_token = props.metric_token;
    this.sample_id = props.sample_id;
    this.background_model = props.background_model || 'N/A';
    this.all_categories = props.all_categories || [];
    this.new_filter_thresholds = {};
    this.state = ReportFilter.genusSearchValueFor(props.report_page_params.selected_genus);
    this.genus_search_items = this.props.all_genera_in_sample;
    this.genus_search_items.splice(0, 0, 'None');
    this.applyFilters = this.applyFilters.bind(this);
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

  setFilterThreshold(threshold_name, event) {
    this.new_filter_thresholds[threshold_name] = event.target.value.trim();
    $('.apply-filter-button a').addClass('changed');
  }

  applyFilters(event) {
    ReportFilter.showLoading('Applying thresholds...');
    this.props.applyNewFilterThresholds(this.new_filter_thresholds);
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

  thresholdInputColumn(metric_token) {
    return (
        <div className='col s6 input-container'>
          <input
            className='browser-default'
            onChange={this.setFilterThreshold.bind(this, `threshold_${metric_token}`)}
            name="group2"
            defaultValue={this.props.report_page_params[`threshold_${metric_token}`]}
            id={`threshold_${metric_token}`}
            type="number" />
        </div>
    );
  }

  render() {
    threshold_filter = (
     <div>
      <div>{this.thresholdInputColumn(this.metric_token)}</div>
      <div className="apply-filter-button left center-align">
        <a onClick={this.applyFilters}
           className="btn btn-flat waves-effect grey text-grey text-lighten-5 waves-light apply-filter-button">
        Apply threshold
        </a>
      </div>
     </div>
    );
    return (
      {threshold_filter}
    );
  }
}

ReportFilter.propTypes = {
  background_model: React.PropTypes.string,
};
