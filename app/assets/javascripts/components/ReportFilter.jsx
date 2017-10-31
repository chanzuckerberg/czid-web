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
    // this.getGenusList(this.sample_id);
    this.applyViewLevel = this.applyViewLevel.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.applyExcludedCategories = this.applyExcludedCategories.bind(this);
    // this.searchGenus = this.searchGenus.bind(this);
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

  /*
  FIX_THIS_applyFilter() {
    const current_url = location.protocol + '//' + location.host + location.pathname;
    const currentSort = PipelineSampleReport.currentSort();
    const sort_by = currentSort.sort_query ? `&${currentSort.sort_query}` : '';
    const categories = this.state.checked_categories.join();
    const genus_tax_id = this.state.genus_tax_id;
    if (genus_tax_id > 0) {
    window.location = `${current_url}?view_level=species&genus_tax_id=${genus_tax_id}${sort_by}`
    } else {
    window.location =
    `${current_url}?species_nt_zscore_threshold=${this.state.species_nt_zscore_start},${this.state.species_nt_zscore_end}&species_nt_rpm_threshold=${this.state.species_nt_rpm_start},${this.state.species_nt_rpm_end}&view_level=${this.state.view_level}&categories=${categories}${sort_by}`;
    }
  }
  */

  getGenusList(sample_id) {
    const url = `/samples/${sample_id}/genus_list.json`;
    fetch(url)
    .then((resp) => resp.json()) // Transform the data into json
    .then((data) => this.setState({genus_list: data}))
    .catch((error) => console.log(error))
  }

  searchGenus(value, item) {
    this.setState({
      genus_query: value,
      genus_tax_id: item.tax_id
    });
  }

  render() {
    align_right = {'textAlign': 'right'};
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

               { /*
               <div className="filter-controls">
                  <div className="filter-title">
                    GENUS SEARCH
                  </div>
                  <div className="filter-values genus-autocomplete-container">
          					<ReactAutocomplete
                      inputProps={{ placeholder: 'Genus name here' }}
                      items={this.state.genus_list}
                      shouldItemRender={(item, value) => item.name.toLowerCase().indexOf(value.toLowerCase()) > -1}
                      getItemValue={item => item.name}
                      renderItem={(item, highlighted) =>
                        <div
                          key={item.tax_id}
                          style={{ backgroundColor: highlighted ? '#eee' : 'transparent'}}
                        >
                          {item.name}
                        </div>
                      }
                      value={this.state.genus_query}
                      onChange={(e) => this.setState({genus_query: e.target.value, genus_tax_id: 0 })}
					  onSelect={this.searchGenus}
					         />
                  </div>
               </div>
               */ }

                <div className="filter-controls">
                  <div className="filter-title">
                    THRESHOLDS
                  </div>

                  {/* this col s3 offset-s2 stuff below is beyond the pale... probably works by chance */}

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

                </div>

                <div className="apply-filter-button center-align">
                  <a onClick={this.applyFilters}
                     className="btn btn-flat waves-effect grey text-grey text-lighten-5 waves-light apply-filter-button">
                    Apply filter
                  </a>
                </div>
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
