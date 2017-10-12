class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    const view_level = props.view_level || 'Genus';
    this.background_model = props.background_model || 'N/A';
    this.report_title = props.report_title || 'Not Set';
    const default_nt_zscore_threshold = `0,${this.props.highest_tax_counts.highest_nt_zscore}`;
    const default_nt_rpm_threshold = `0,${this.props.highest_tax_counts.highest_nt_rpm}`;

    const nt_zscore_threshold = ReportFilter.getFilter('nt_zscore_threshold')
      ? ReportFilter.getFilter('nt_zscore_threshold') : default_nt_zscore_threshold;

    const nt_rpm_threshold = ReportFilter.getFilter('nt_rpm_threshold')
      ? ReportFilter.getFilter('nt_rpm_threshold') : default_nt_rpm_threshold;

    const nt_zscore_start =
      (nt_zscore_threshold.split(',').length > 0) ? parseInt(nt_zscore_threshold.split(',')[0], 10) : 0;
    const nt_zscore_end =
      (nt_zscore_threshold.split(',').length > 1) ? parseInt(nt_zscore_threshold.split(',')[1], 10) :
        this.props.highest_tax_counts.highest_nt_zscore;

    const nt_rpm_start =
      (nt_rpm_threshold.split(',').length > 0) ? parseInt(nt_rpm_threshold.split(',')[0], 10) : 0;
    const nt_rpm_end =
      (nt_rpm_threshold.split(',').length > 1) ? parseInt(nt_rpm_threshold.split(',')[1], 10) :
        this.props.highest_tax_counts.highest_nt_rpm;


    this.state = { nt_zscore_start, nt_zscore_end, nt_rpm_start, nt_rpm_end, view_level };

    this.applyFilter = this.applyFilter.bind(this);
    this.selectViewLevel = this.selectViewLevel.bind(this);
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

  componentDidMount() {
    const nt_zscore = document.getElementById('nt_zscore');
    const nt_rpm = document.getElementById('nt_rpm');

    noUiSlider.create(nt_zscore, {
      start: [this.state.nt_zscore_start, this.state.nt_zscore_end],
      connect: true,
      step: 1,
      orientation: 'horizontal', // 'horizontal' or 'vertical',
      behaviour: 'tap-drag',
      range: {
        'min': 0,
        'max': this.props.highest_tax_counts.highest_nt_zscore
      },
      format: wNumb({
        decimals: 0
      })
    });
    noUiSlider.create(nt_rpm, {
      start: [this.state.nt_rpm_start, this.state.nt_rpm_end],
      connect: true,
      step: 1,
      orientation: 'horizontal', // 'horizontal' or 'vertical'
      range: {
        'min': 0,
        'max': this.props.highest_tax_counts.highest_nt_rpm
      },
      format: wNumb({
        decimals: 0
      })
    });
    nt_zscore.noUiSlider.on('update', (values, handle) => {
      if (handle === 0) {
        this.setState({
          nt_zscore_start: Math.round(values[handle])
        });
      } else {
        this.setState({
          nt_zscore_end: Math.round(values[handle])
        });
      }
    });
    nt_rpm.noUiSlider.on('update', (values, handle) => {
      if (handle === 0) {
        this.setState({
          nt_rpm_start: Math.round(values[handle])
        });
      } else {
        this.setState({
          nt_rpm_end: Math.round(values[handle])
        });
      }
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
                    <div className="">
                      <div className="slider-title">
                        NT { this.state.view_level } Z Score
                      </div>
                      <div className="slider-values">
                        <div className="nt_zscore start">{ this.state.nt_zscore_start }</div>
                        <div className="nt_zscore end">{ this.state.nt_zscore_end }</div>
                      </div>
                      <div id="nt_zscore"></div>
                    </div>

                    <div className="">
                      <div className="slider-title">
                        NT { this.state.view_level } RPM
                      </div>
                      <div className="slider-values">
                        <div className="nt_rpm start">{ this.state.nt_rpm_start }</div>
                        <div className="nt_rpm end">{ this.state.nt_rpm_end }</div>
                      </div>
                      <div id="nt_rpm"></div>
                    </div>
                  </div>
                </div>
                <div className="apply-filter-button center-align">
                  <a onClick={this.applyFilter} className="btn btn-flat waves-effect grey text-grey text-lighten-5 waves-light apply-filter-button">
                    Apply filter
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }
}
