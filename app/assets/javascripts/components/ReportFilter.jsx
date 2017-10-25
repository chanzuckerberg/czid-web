/**
 @class ReportFilter
 @desc Creates react component to handle filtering in the page
 */
class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    this.background_model = props.background_model || 'N/A';
    this.all_categories = props.all_categories || [];
    this.state = {}
    defaultState = ReportFilter.defaultState();
    for (key in defaultState) {
      this.state[key] = props[key] || defaultState[key];
    }
    this.applyFilter = this.applyFilter.bind(this);
    this.selectViewLevel = this.selectViewLevel.bind(this);
    this.updateThreshold = this.updateThreshold.bind(this);
  }

  static defaultState() {
    return {
      zscore_threshold: 1.7,
      rpm_threshold: 0.0,
      r_threshold: 10,
      view_level: 'genus',
      sort_by: 'nt_zscore'
    };
  }

  static applyParamChange(new_params) {
    var params = getURLParams();
    for (key in new_params) {
      params[key] = new_params[key];
    }
    window.location = location.protocol + '//' + location.host + location.pathname + '?' + jQuery.param(new_params);
  }

  static getURLParams() {
    // Thank you, Internet.
    var params = {}
    var search = window.location.search.substring(1);
    if (search) {
      params = JSON.parse(
        '{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}',
        function(key, value) {
          return key===""?value:decodeURIComponent(value)
        }
      );
    }
    return params;
  }

  selectViewLevel(event) {
    this.setState({
      view_level: event.target.value
    });
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
                          <input type="checkbox" className="filled-in" id={category.name} />
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
};
