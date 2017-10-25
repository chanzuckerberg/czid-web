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
    this.checked_categories = (props.checked_categories || props.all_categories).map((category) => category.taxid);

    this.highest_species_nt_zscore = this.props.highest_tax_counts.highest_species_nt_zscore;
    this.highest_species_nt_rpm = this.props.highest_tax_counts.highest_species_nt_rpm;

    this.lowest_species_nt_zscore = this.props.highest_tax_counts.lowest_species_nt_zscore;
    this.lowest_species_nt_rpm = this.props.highest_tax_counts.lowest_species_nt_rpm;

    this.has_valid_species_nt_zscore_range =
      (this.highest_species_nt_zscore && (this.lowest_species_nt_zscore < this.highest_species_nt_zscore));

    this.has_valid_species_nt_rpm_range =
      (this.highest_species_nt_rpm && (this.lowest_species_nt_rpm < this.highest_species_nt_rpm));


    const default_species_nt_zscore_threshold = `${this.lowest_species_nt_zscore},${this.highest_species_nt_zscore}`;
    const default_species_nt_rpm_threshold = `${this.lowest_species_nt_rpm},${this.highest_species_nt_rpm}`;

    const species_nt_zscore_threshold = ReportFilter.getFilter('species_nt_zscore_threshold')
      ? ReportFilter.getFilter('species_nt_zscore_threshold') : default_species_nt_zscore_threshold;

    const species_nt_rpm_threshold = ReportFilter.getFilter('species_nt_rpm_threshold')
      ? ReportFilter.getFilter('species_nt_rpm_threshold') : default_species_nt_rpm_threshold;

    const species_nt_zscore_start =
      (species_nt_zscore_threshold.split(',').length > 0) ? species_nt_zscore_threshold.split(',')[0] :
        this.lowest_species_nt_zscore;
    const species_nt_zscore_end =
      (species_nt_zscore_threshold.split(',').length > 1) ? species_nt_zscore_threshold.split(',')[1] :
        this.highest_species_nt_zscore;

    const species_nt_rpm_start =
      (species_nt_rpm_threshold.split(',').length > 0) ? species_nt_rpm_threshold.split(',')[0]:
        this.lowest_species_nt_rpm;
    const species_nt_rpm_end =
      (species_nt_rpm_threshold.split(',').length > 1) ? species_nt_rpm_threshold.split(',')[1] :
        this.highest_species_nt_rpm;
    const checked_categories = this.checked_categories;
    const genus_query = genus_info.query;
    const genus_tax_id = genus_info.tax_id;

    this.state = { species_nt_zscore_start, species_nt_zscore_end, species_nt_rpm_start, species_nt_rpm_end, view_level, checked_categories, genus_query, genus_tax_id, genus_list: []};

    this.getGenusList(this.sample_id);

    this.applyFilter = this.applyFilter.bind(this);
    this.selectViewLevel = this.selectViewLevel.bind(this);
    this.updateThreshold = this.updateThreshold.bind(this);
    this.selectCategory = this.selectCategory.bind(this);
    this.searchGenus = this.searchGenus.bind(this);
  }

  getGenusList(sample_id) {
    const url = `/samples/${sample_id}/genus_list.json`;
    fetch(url)
    .then((resp) => resp.json()) // Transform the data into json
    .then((data) => this.setState({genus_list: data}))
    .catch((error) => console.log(error))
  }

  applyFilter() {
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

  static getFilter(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results) {
      return null;
    }

    if (!results[2]) {
      return null;
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  selectViewLevel(event) {
    this.setState({
      view_level: event.target.value
    });
  }

  searchGenus(value, item) {
    this.setState({
      genus_query: value,
      genus_tax_id: item.tax_id
    });
  }

  selectCategory(e) {
    // current array of options
    const options = this.state.checked_categories

    let index

    // check if the check box is checked or unchecked
    if (e.target.checked) {
      // add the numerical value of the checkbox to options array
      options.push(+e.target.value)
    } else {
      // or remove the value from the unchecked checkbox from the array
      index = options.indexOf(+e.target.value)
      options.splice(index, 1)
    }

    // update the state with the new array of options
    this.setState({ checked_categories: options })

  }

  updateThreshold(e) {
    const { innerText, className } = e.target;
    if (className.indexOf('nt_zscore') >= 0) {
      const ntZscore = document.getElementById('nt_zscore');
      if (ntZscore) {
        (className.indexOf('start') >= 0)
          ? ntZscore.noUiSlider.set([innerText, null]) : ntZscore.noUiSlider.set([null, innerText]);
      }
    } else if (className.indexOf('nt_rpm') >= 0) {
      const ntRpm = document.getElementById('nt_rpm');
      if (ntRpm) {
        (className.indexOf('start') >= 0)
          ? ntRpm.noUiSlider.set([innerText, null]) : ntRpm.noUiSlider.set([null, innerText]);
      }
    }
  }

  parseRange(value) {
    value = +Number(value).toFixed(3);
    return value;
  }

  componentDidMount() {
    if (this.has_valid_species_nt_zscore_range) {
      const nt_zscore = document.getElementById('nt_zscore');
      noUiSlider.create(nt_zscore, {
        start: [this.parseRange(this.state.species_nt_zscore_start), this.parseRange(this.state.species_nt_zscore_end)],
        connect: true,
        step: 0.1,
        orientation: 'horizontal', // 'horizontal' or 'vertical',
        behaviour: 'tap-drag',
        range: {
          min: this.parseRange(this.lowest_species_nt_zscore),
          max: this.parseRange(this.highest_species_nt_zscore)
        },
        format: wNumb({
          decimals: 0
        })
      });

      nt_zscore.noUiSlider.on('update', (values, handle) => {
        const value = this.parseRange(values[handle]);
        const newState = (handle === 0) ? { species_nt_zscore_start: value } : { species_nt_zscore_end: value };
        this.setState(newState);
      });
    }

    if (this.has_valid_species_nt_rpm_range) {
      const nt_rpm = document.getElementById('nt_rpm');
      noUiSlider.create(nt_rpm, {
        start: [this.parseRange(this.state.species_nt_rpm_start), this.parseRange(this.state.species_nt_rpm_end)],
        connect: true,
        step: 0.1,
        orientation: 'horizontal', // 'horizontal' or 'vertical'
        range: {
          min: this.parseRange(this.lowest_species_nt_rpm),
          max: this.parseRange(this.highest_species_nt_rpm)
        },
        format: wNumb({
          decimals: 0
        })
      });
      nt_rpm.noUiSlider.on('update', (values, handle) => {
        const value = this.parseRange(values[handle]);
        const newState = (handle === 0) ? { species_nt_rpm_start: value } : { species_nt_rpm_end: value };
        this.setState(newState);
      });
    }
    $('.genus-autocomplete-container div input').on('focus keyup', () => {
      $('.genus-autocomplete-container div input + div').removeAttr('style');
      $('.genus-autocomplete-container div input + div').addClass('decorate-dropdown');
    });
  }

  render() {
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
                          <input type="checkbox" className="filled-in cat-filter" id={category.name} value={category.taxid} onClick={this.selectCategory} onChange={(e) => console.log(e)} checked={this.checked_categories.indexOf(category.taxid) >= 0} />
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
                      <input onChange={this.selectViewLevel} name="group1" value='genus'
                             checked={(this.state.view_level === 'genus')} type="radio" id="genus-select" />
                      <label htmlFor="genus-select">Genus</label>
                    </p>
                    <p className="">
                      <input onChange={this.selectViewLevel} name="group1" value='species'
                             checked={(this.state.view_level === 'species')} type="radio" id="specie-select" />
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

                <div className="filter-controls">
                  <div className="filter-title">
                    THRESHOLDS
                  </div>

                  <div className="filter-values">
                    { (this.highest_species_nt_zscore && (this.lowest_species_nt_zscore !== this.highest_species_nt_zscore)) ? (
                      <div className="">
                        <div className="slider-title">
                          NT { this.state.view_level } Z Score
                        </div>
                        <div className="slider-values">
                          <div suppressContentEditableWarning={true} contentEditable={true} className="nt_zscore start">
                            { this.state.species_nt_zscore_start }
                          </div>
                          <div suppressContentEditableWarning={true} contentEditable={true} className="nt_zscore end">
                            { this.state.species_nt_zscore_end }
                          </div>
                        </div>
                        <div id="nt_zscore"></div>
                      </div>
                    ) : ''}

                    { (this.highest_species_nt_rpm && (this.lowest_species_nt_rpm !== this.highest_species_nt_rpm)) ? (
                      <div className="">
                        <div className="slider-title">
                          NT { PipelineSampleReport.uppCaseFirst(this.state.view_level) } RPM
                        </div>
                        <div className="slider-values">
                          <div onBlur={ this.updateThreshold } suppressContentEditableWarning={true} contentEditable={true} className="nt_rpm start">
                            { this.state.species_nt_rpm_start }
                          </div>
                          <div  onBlur={ this.updateThreshold } suppressContentEditableWarning={true} contentEditable={true} className="nt_rpm end">
                            { this.state.species_nt_rpm_end }
                          </div>
                        </div>
                        <div id="nt_rpm"></div>
                      </div>
                    ) : ''}
                    { (!this.has_valid_species_nt_rpm_range && !this.has_valid_species_nt_zscore_range) ?
                      <div className="center"><small>Cannot set thresholds</small></div> : '' }
                  </div>
                </div>
                <div className="apply-filter-button center-align">
                  <a onClick={this.applyFilter}
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
  highest_tax_counts: React.PropTypes.object,
};
