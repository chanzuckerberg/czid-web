/**
 @class ReportFilter
 @desc Creates react component to handle filtering in the page
 */
class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    this.sample_id = props.sample_id
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

  static genusSearchValueFor(selected_genus) {
    genus_search_value = selected_genus == 'None' ? '' : selected_genus;
    return {genus_search_value};
  }

  enableFilters() {
    this.props.enableFilters();
  }

  setFilterThreshold(threshold_name, event) {
    this.new_filter_thresholds[threshold_name] = event.target.value;
  }

  applyFilters(event) {
    this.props.applyNewFilterThresholds(this.new_filter_thresholds);
  }

  applyExcludedCategories(e) {
    this.props.applyExcludedCategories(e.target.value, e.target.checked)
  }

  applyGenusFilter(selected_genus) {
    this.setState(ReportFilter.genusSearchValueFor(selected_genus));
    this.props.applyGenusFilter(selected_genus);
  }

  clearGenusSearch() {
    this.applyGenusFilter('None');
  }

  thresholdInput(metric_token, visible_metric_name) {
    return (
      <div className='col s12'>
        <div className='col s8'>
          <div className='threshold-label'>
            <label htmlFor={`threshold_${metric_token}`}>
              {visible_metric_name} &ge;
            </label>
          </div>
        </div>
        <div className='col s4 input-container'>
          <input
          onChange={this.setFilterThreshold.bind(this, `threshold_${metric_token}`)}
          name="group2"
          defaultValue={this.props.report_page_params[`threshold_${metric_token}`]}
          id={`threshold_${metric_token}`}
          type="text" />
        </div>
      </div>
    );
  }

  render() {
    align_right = {'textAlign': 'right'};
    threshold_filters = (
      <div className="filter-controls">
      <div className="filter-title">
        {this.props.report_page_params.disable_filters == 0 ?
        <a href="#" onClick={this.clearGenusSearch}>Click to clear genus search and enable filters.</a> :
        <a href="#" onClick={this.enableFilters}>Click to enable filters.</a>}
      </div>
      </div>
    );
    if (this.props.report_page_params.disable_filters == 0 && this.props.report_page_params.selected_genus == 'None') {
      threshold_filters = (
        <div className="filter-controls">
          <div className="filter-title">
            THRESHOLDS
          </div>
          <div className="filter-row row">
            {this.thresholdInput('zscore', 'Z')}
            {this.thresholdInput('rpm', 'rPM')}
            {this.thresholdInput('r', 'r')}
            {this.thresholdInput('aggregatescore', 'NT+NR*')}
            {this.thresholdInput('percentidentity', '%id')}
            {this.thresholdInput('neglogevalue', 'log(1/E)')}
          </div>
          <div className="apply-filter-button center-align">
            <a onClick={this.applyFilters}
               className="btn btn-flat waves-effect grey text-grey text-lighten-5 waves-light apply-filter-button">
              Apply filter
            </a>
          </div>
        </div>
      );
  }
  category_filter = '';
  if (this.props.report_page_params.disable_filters == 0 && this.props.report_page_params.selected_genus == 'None') {
    category_filter = (
        <div className="filter-controls">
          <div className="filter-title">
            CATEGORY
          </div>
          <div className="filter-values">
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
          <div className="input-field col s12">
            <div className='genus-name-label'>GENUS SEARCH</div>
            <div className="filter-values genus-autocomplete-container">
              <ReactAutocomplete
                inputProps={{ placeholder: 'Genus name here' }}
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
          <i className="fa fa-filter fa-fw"></i> Filter Report
        </div>
        <div className="sidebar-tabs">
          <div className="row">
            <div className="col s12 sidebar-full-container">
              <div id="reports-pane" className="pane col s12">
                <div className="sidebar-pane">
                  <div className="report-data">
                    <div className="report-title">
                      Background Model
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
                {threshold_filters}
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
