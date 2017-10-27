/**
 @class ReportFilter
 @desc Creates react component to handle filtering in the page
 */
class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    this.background_model = props.background_model || 'N/A';
    this.all_categories = props.all_categories || [];
    this.applyViewLevel = this.applyViewLevel.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.new_filter_thresholds = {};
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
                    <div className="input-field col s5">
                      <label htmlFor="threshold-rpm">rPM&nbsp;&ge;</label>
                    </div>
                    <div className="input-field col s6 offset-s1">
                      <input name="group2" defaultValue={this.props.report_page_params['threshold_rpm']}
                           type="text" id="threshold-rpm" onChange={this.setFilterThreshold.bind(this, 'threshold_rpm')}/>
                    </div>
                  </div>
                  <div className="filter-row row">
                    <div className="input-field col s3 offset-s2">
                      <label htmlFor="threshold-r" className=".filter-label">r&nbsp;&ge;</label>&nbsp;
                    </div>
                    <div className="input-field col s6 offset-s1">
                      <input name="group2" defaultValue={this.props.report_page_params['threshold_r']}
                             type="text" id="threshold-r" onChange={this.setFilterThreshold.bind(this, 'threshold_r')}/>
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
