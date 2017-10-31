/**
 @class ReportFilter
 @desc Creates react component to handle filtering in the page
 */
class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    this.sample_id = props.sample_id
    const view_level = props.view_level || 'species';
    const genus_info = props.genus_info || { query: "", tax_id: 0 };
    this.background_model = props.background_model || 'N/A';
    this.all_categories = props.all_categories || [];
    this.new_filter_thresholds = {};
    this.state = ReportFilter.genusSearchValueFor(props.report_page_params.selected_genus);
    this.genus_search_items = this.props.all_genera_in_sample;
    this.genus_search_items.splice(0, 0, 'None');
    this.applyViewLevel = this.applyViewLevel.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.applyExcludedCategories = this.applyExcludedCategories.bind(this);
    this.applyGenusFilter = this.applyGenusFilter.bind(this);
  }

  static genusSearchValueFor(selected_genus) {
    genus_search_value = selected_genus == 'None' ? '' : selected_genus;
    return {genus_search_value};
  }

  applyViewLevel(event) {
    this.props.applyViewLevel(event.target.value);
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

  componentDidMount() {
    $('.genus-autocomplete-container div input').on('focus keyup', () => {
      $('.genus-autocomplete-container div input + div').removeAttr('style');
      $('.genus-autocomplete-container div input + div').addClass('decorate-dropdown');
    });
  }

  render() {
    align_right = {'textAlign': 'right'};
    threshold_filters = (
      <div className="filter-controls">
      <div className="filter-title">
        Thresholds and category filters disabled by genus search.
      </div>
      </div>
    );
    if (this.props.report_page_params.selected_genus == 'None') {
      threshold_filters = (
        <div className="filter-controls">
        <div className="filter-title">
          THRESHOLDS
        </div>
        <div className="filter-row row">
          <div className="input-field col s3 offset-s2">
            <label htmlFor="threshold-z">Z&nbsp;&ge;</label>
          </div>
          <div className="input-field col s6 offset-s1">
            <input name="group2" defaultValue={this.props.report_page_params['threshold_zscore']}
                   type="text" id="threshold-z" onChange={this.setFilterThreshold.bind(this, 'threshold_zscore')}/>
          </div>
        </div>
        <div className="filter-row row">
          <div className="input-field col s4 offset-s1">
            <label htmlFor="threshold-rpm">rPM&nbsp;&ge;</label>
          </div>
          <div className="input-field col s6 offset-s1">
            <input name="group2" defaultValue={this.props.report_page_params['threshold_rpm']}
                 type="text" id="threshold-rpm" onChange={this.setFilterThreshold.bind(this, 'threshold_rpm')}/>
          </div>
        </div>
        <div className="filter-row row">
          <div className="input-field col s4 offset-s2">
            <label htmlFor="threshold-r" className=".filter-label">r&nbsp;&ge;</label>&nbsp;
          </div>
          <div className="input-field col s6">
            <input name="group2" defaultValue={this.props.report_page_params['threshold_r']}
                   type="text" id="threshold-r" onChange={this.setFilterThreshold.bind(this, 'threshold_r')}/>
          </div>
        </div>
        <div className="filter-row row">
          <div className="input-field col s2 offset-s1">
            <label htmlFor="threshold-aggregatescore" className=".filter-label">NT+NR*&nbsp;&ge;</label>&nbsp;
          </div>
          <div className="input-field col s6 offset-s3">
            <input name="group2" defaultValue={this.props.report_page_params['threshold_aggregatescore']}
                   type="text" id="threshold-aggregatescore" onChange={this.setFilterThreshold.bind(this, 'threshold_aggregatescore')}/>
          </div>
        </div>
        <div className="filter-row row">
          <div className="input-field col s2 offset-s2">
            <label htmlFor="threshold-percentidentity" className=".filter-label">%id&nbsp;&ge;</label>&nbsp;
          </div>
          <div className="input-field col s6 offset-s2">
            <input name="group2" defaultValue={this.props.report_page_params['threshold_percentidentity']}
                   type="text" id="threshold-percentidentity" onChange={this.setFilterThreshold.bind(this, 'threshold_percentidentity')}/>
          </div>
        </div>
        <div className="filter-row row">
          <div className="input-field col s3 offset-s1">
            <label htmlFor="threshold-negevalue" className=".filter-label">lg(1/E)&nbsp;&ge;</label>&nbsp;
          </div>
          <div className="input-field col s6 offset-s2">
            <input name="group2" defaultValue={this.props.report_page_params['threshold_neglogevalue']}
                   type="text" id="threshold-neglogevalue" onChange={this.setFilterThreshold.bind(this, 'threshold_neglogevalue')}/>
          </div>
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
  if (this.props.report_page_params.selected_genus == 'None') {
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
  return (
      <div className="reports-sidebar">
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

                <div className="filter-controls">
                  <div className="filter-title">
                    VIEW LEVEL
                  </div>

                  <div className="filter-values">
                    <p className="">
                      <input onChange={this.applyViewLevel} name="group1" value='genus'
                             checked={(this.props.report_page_params.view_level === 'genus')} type="radio" id="genus-select" />
                      <label htmlFor="genus-select">Genus</label>
                    </p>
                    <p className="">
                      <input onChange={this.applyViewLevel} name="group1" value='species'
                             checked={(this.props.report_page_params.view_level === 'species')} type="radio" id="specie-select" />
                      <label htmlFor="specie-select">Species</label>
                    </p>
                  </div>
                </div>

                <div className="filter-controls">
                  <div className="filter-title">
                    GENUS SEARCH
                  </div>
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
