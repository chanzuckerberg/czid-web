/**
 @class ReportFilter
 @desc Creates react component to handle filtering in the page
 */
class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    const view_level = props.view_level || 'Genus';
    this.background_model = props.background_model || 'N/A';

    this.highest_nt_zscore = this.props.highest_tax_counts.highest_nt_zscore;
    this.highest_nt_rpm = this.props.highest_tax_counts.highest_nt_rpm;

    this.lowest_nt_zscore = this.props.highest_tax_counts.lowest_nt_zscore;
    this.lowest_nt_rpm = this.props.highest_tax_counts.lowest_nt_rpm;

    this.has_valid_nt_zscore_range =
      (this.highest_nt_zscore && (this.lowest_nt_zscore < this.highest_nt_zscore));

    this.has_valid_nt_rpm_range =
      (this.highest_nt_rpm && (this.lowest_nt_rpm < this.highest_nt_rpm));


    const default_nt_zscore_threshold = `${this.lowest_nt_zscore},${this.highest_nt_zscore}`;
    const default_nt_rpm_threshold = `${this.lowest_nt_rpm},${this.highest_nt_rpm}`;

    const nt_zscore_threshold = ReportFilter.getFilter('nt_zscore_threshold')
      ? ReportFilter.getFilter('nt_zscore_threshold') : default_nt_zscore_threshold;

    const nt_rpm_threshold = ReportFilter.getFilter('nt_rpm_threshold')
      ? ReportFilter.getFilter('nt_rpm_threshold') : default_nt_rpm_threshold;

    const nt_zscore_start =
      (nt_zscore_threshold.split(',').length > 0) ? nt_zscore_threshold.split(',')[0] :
        this.lowest_nt_zscore;
    const nt_zscore_end =
      (nt_zscore_threshold.split(',').length > 1) ? nt_zscore_threshold.split(',')[1] :
        this.highest_nt_zscore;

    const nt_rpm_start =
      (nt_rpm_threshold.split(',').length > 0) ? nt_rpm_threshold.split(',')[0]:
        this.lowest_nt_rpm;
    const nt_rpm_end =
      (nt_rpm_threshold.split(',').length > 1) ? nt_rpm_threshold.split(',')[1] :
        this.highest_nt_rpm;

    this.state = { nt_zscore_start, nt_zscore_end, nt_rpm_start, nt_rpm_end, view_level };

    this.applyFilter = this.applyFilter.bind(this);
    this.selectViewLevel = this.selectViewLevel.bind(this);
    this.updateThreshold = this.updateThreshold.bind(this);
  }

  applyFilter() {
    const current_url = location.protocol + '//' + location.host + location.pathname;
    const currentSort = PipelineSampleReport.currentSort();
    const sort_by = currentSort.sort_query ? `&${currentSort.sort_query}` : '';
    window.location =
      `${current_url}?nt_zscore_threshold=${this.state.nt_zscore_start},${this.state.nt_zscore_end}&nt_rpm_threshold=${
        this.state.nt_rpm_start},${this.state.nt_rpm_end}&view_level=${this.state.view_level}${sort_by}`;
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
    if (this.has_valid_nt_zscore_range) {
      const nt_zscore = document.getElementById('nt_zscore');
      noUiSlider.create(nt_zscore, {
        start: [this.parseRange(this.state.nt_zscore_start), this.parseRange(this.state.nt_zscore_end)],
        connect: true,
        step: 0.1,
        orientation: 'horizontal', // 'horizontal' or 'vertical',
        behaviour: 'tap-drag',
        range: {
          min: this.parseRange(this.lowest_nt_zscore),
          max: this.parseRange(this.highest_nt_zscore)
        },
        format: wNumb({
          decimals: 0
        })
      });

      nt_zscore.noUiSlider.on('update', (values, handle) => {
        const value = this.parseRange(values[handle]);
        const newState = (handle === 0) ? { nt_zscore_start: value } : { nt_zscore_end: value };
        this.setState(newState);
      });
    }

    if (this.has_valid_nt_rpm_range) {
      const nt_rpm = document.getElementById('nt_rpm');
      noUiSlider.create(nt_rpm, {
        start: [this.parseRange(this.state.nt_rpm_start), this.parseRange(this.state.nt_rpm_end)],
        connect: true,
        step: 0.1,
        orientation: 'horizontal', // 'horizontal' or 'vertical'
        range: {
          min: this.parseRange(this.lowest_nt_rpm),
          max: this.parseRange(this.highest_nt_rpm)
        },
        format: wNumb({
          decimals: 0
        })
      });
      nt_rpm.noUiSlider.on('update', (values, handle) => {
        const value = this.parseRange(values[handle]);
        const newState = (handle === 0) ? { nt_rpm_start: value } : { nt_rpm_end: value };
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
              <ul id="tabs-swipe-demo" className="tabs tabs-fixed-width tabs-transparent">
                <li onClick={() => {PipelineSampleReads.setTab('reports_page','info')}}
                    className="tab col s3 reports-pane">
                  <a className={PipelineSampleReads.getActive('reports_page','info')}
                     href="#reports-pane">REPORT INFO</a>
                </li>
                <li onClick={() => {PipelineSampleReads.setTab('reports_page','filters')}}
                    className="tab col s3">
                  <a className={PipelineSampleReads.getActive('reports_page','filters')}
                     href="#filters-pane">FILTERS</a>
                </li>
              </ul>
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
                    <p>
                      <input type="checkbox" className="filled-in" id="bacteria" defaultChecked="checked" />
                      <label htmlFor="bacteria">Bacteria</label>
                    </p>
                    <p>
                      <input type="checkbox" className="filled-in" id="fungi" defaultChecked="checked" />
                      <label htmlFor="fungi">Fungi</label>
                    </p>
                    <p>
                      <input type="checkbox" className="filled-in" id="virus" defaultChecked="checked" />
                      <label htmlFor="virus">Virus</label>
                    </p>
                  </div>
                </div>

                <div className="filter-controls">
                  <div className="filter-title">
                    VIEW LEVEL
                  </div>

                  <div className="filter-values">
                    <p className="">
                      <input onChange={this.selectViewLevel} name="group1" value='Genus'
                             checked={(this.state.view_level === 'Genus')} type="radio" id="genus-select" />
                      <label htmlFor="genus-select">Genus</label>
                    </p>
                    <p className="">
                      <input onChange={this.selectViewLevel} name="group1" value='Species'
                             checked={(this.state.view_level === 'Species')} type="radio" id="specie-select" />
                      <label htmlFor="specie-select">Species</label>
                    </p>
                  </div>
                </div>

                <div className="filter-controls">
                  <div className="filter-title">
                    THRESHOLDS
                  </div>

                  <div className="filter-values">
                    { (this.highest_nt_zscore && (this.lowest_nt_zscore !== this.highest_nt_zscore)) ? (
                      <div className="">
                        <div className="slider-title">
                          NT { this.state.view_level } Z Score
                        </div>
                        <div className="slider-values">
                          <div suppressContentEditableWarning={true} contentEditable={true} className="nt_zscore start">
                            { this.state.nt_zscore_start }
                          </div>
                          <div suppressContentEditableWarning={true} contentEditable={true} className="nt_zscore end">
                            { this.state.nt_zscore_end }
                          </div>
                        </div>
                        <div id="nt_zscore"></div>
                      </div>
                    ) : ''}

                    { (this.highest_nt_rpm && (this.lowest_nt_rpm !== this.highest_nt_rpm)) ? (
                      <div className="">
                        <div className="slider-title">
                          NT { this.state.view_level } RPM
                        </div>
                        <div className="slider-values">
                          <div onBlur={ this.updateThreshold } suppressContentEditableWarning={true} contentEditable={true} className="nt_rpm start">
                            { this.state.nt_rpm_start }
                          </div>
                          <div  onBlur={ this.updateThreshold } suppressContentEditableWarning={true} contentEditable={true} className="nt_rpm end">
                            { this.state.nt_rpm_end }
                          </div>
                        </div>
                        <div id="nt_rpm"></div>
                      </div>
                    ) : ''}
                    { (!this.has_valid_nt_rpm_range && !this.has_valid_nt_zscore_range) ?
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
