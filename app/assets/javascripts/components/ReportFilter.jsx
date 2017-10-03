class ReportFilter extends React.Component {
  constructor(props) {
    super(props);
    const view_level = props.view_level || 'Genus';

    const default_nt_zscore_threshold = `0-${this.props.highest_tax_counts.highest_nt_zscore}`;
    const default_nr_zscore_threshold = `0-${this.props.highest_tax_counts.highest_nr_zscore}`;
    const default_nt_rpm_threshold = `0-${this.props.highest_tax_counts.highest_nt_rpm}`;
    const default_nr_rpm_threshhold = `0-${this.props.highest_tax_counts.highest_nr_rpm}`;

    const nt_zscore_threshold = ReportFilter.getFilter('nt_zscore_threshold')
      ? ReportFilter.getFilter('nt_zscore_threshold') : default_nt_zscore_threshold;

    const nr_zscore_threshold = ReportFilter.getFilter('nr_zscore_threshold')
      ? ReportFilter.getFilter('nr_zscore_threshold') : default_nr_zscore_threshold;

    const nt_rpm_threshold = ReportFilter.getFilter('nt_rpm_threshold')
      ? ReportFilter.getFilter('nt_rpm_threshold') : default_nt_rpm_threshold;
    const nr_rpm_threshold = ReportFilter.getFilter('nr_rpm_threshold')
      ? ReportFilter.getFilter('nr_rpm_threshold') :default_nr_rpm_threshhold;



    const nt_zscore_start =
      (nt_zscore_threshold.split('-').length > 0) ? parseInt(nt_zscore_threshold.split('-')[0], 10) : 0;
    const nt_zscore_end =
      (nt_zscore_threshold.split('-').length > 1) ? parseInt(nt_zscore_threshold.split('-')[1], 10) :
        this.props.highest_tax_counts.highest_nt_zscore;

    const nr_zscore_start =
      (nr_zscore_threshold.split('-').length > 0) ? parseInt(nr_zscore_threshold.split('-')[0], 10) : 0;
    const nr_zscore_end =
      (nr_zscore_threshold.split('-').length > 1) ? parseInt(nr_zscore_threshold.split('-')[1], 10) :
        this.props.highest_tax_counts.highest_nr_zscore;

    const nt_rpm_start =
      (nt_rpm_threshold.split('-').length > 0) ? parseInt(nt_rpm_threshold.split('-')[0], 10) : 0;
    const nt_rpm_end =
      (nt_rpm_threshold.split('-').length > 1) ? parseInt(nt_rpm_threshold.split('-')[1], 10) :
        this.props.highest_tax_counts.highest_nt_rpm;

    const nr_rpm_start =
      (nr_rpm_threshold.split('-').length > 0) ? parseInt(nr_rpm_threshold.split('-')[0], 10) : 0;
    const nr_rpm_end =
      (nr_rpm_threshold.split('-').length > 1) ? parseInt(nr_rpm_threshold.split('-')[1], 10) :
        this.props.highest_tax_counts.highest_nr_rpm;



    this.state = { nt_zscore_start, nt_zscore_end, nr_zscore_start, nr_zscore_end, nt_rpm_start, nt_rpm_end,
      nr_rpm_start, nr_rpm_end, view_level };

    this.applyFilter = this.applyFilter.bind(this);
    this.selectViewLevel = this.selectViewLevel.bind(this);
  }

  applyFilter() {
    const current_url = location.protocol + '//' + location.host + location.pathname;
    window.location =
      `${current_url}?nt_zscore_threshold=${this.state.nt_zscore_start}-${this.state.nt_zscore_end
    }&nr_zscore_threshold=${this.state.nr_zscore_start}-${this.state.nr_zscore_end}&nt_rpm_threshold=${
      this.state.nt_rpm_start}-${this.state.nt_rpm_end}&nr_rpm_threshold=${
      this.state.nr_rpm_start}-${this.state.nr_rpm_end}&view_level=${this.state.view_level}`;
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
    const nr_zscore = document.getElementById('nr_zscore');
    const nt_rpm = document.getElementById('nt_rpm');
    const nr_rpm = document.getElementById('nr_rpm');

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
    noUiSlider.create(nr_zscore, {
      start: [this.state.nr_zscore_start, this.state.nr_zscore_end],
      connect: true,
      step: 1,
      orientation: 'horizontal', // 'horizontal' or 'vertical'
      range: {
        'min': 0,
        'max': this.props.highest_tax_counts.highest_nr_zscore
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
    noUiSlider.create(nr_rpm, {
      start: [this.state.nr_rpm_start, this.state.nr_rpm_end],
      connect: true,
      step: 1,
      orientation: 'horizontal', // 'horizontal' or 'vertical'
      range: {
        'min': 0,
        'max': this.props.highest_tax_counts.highest_nr_rpm
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

    nr_zscore.noUiSlider.on('update', (values, handle) => {
      if (handle === 0) {
        this.setState({
          nr_zscore_start: Math.round(values[handle])
        });
      } else {
        this.setState({
          nr_zscore_end: Math.round(values[handle])
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

    nr_rpm.noUiSlider.on('update', (values, handle) => {
      if (handle === 0) {
        this.setState({
          nr_rpm_start: Math.round(values[handle])
        });
      } else {
        this.setState({
          nr_rpm_end: Math.round(values[handle])
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
                        NR { this.state.view_level } Z Score
                      </div>
                      <div className="slider-values">
                        <div className="nr_zscore start">{ this.state.nr_zscore_start }</div>
                        <div className="nr_zscore end">{ this.state.nr_zscore_end }</div>
                      </div>
                      <div id="nr_zscore"></div>
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

                    <div className="">
                      <div className="slider-title">
                        NR { this.state.view_level } RPM
                      </div>
                      <div className="slider-values">
                        <div className="nr_rpm start">{ this.state.nr_rpm_start }</div>
                        <div className="nr_rpm end">{ this.state.nr_rpm_end }</div>
                      </div>
                      <div id="nr_rpm"></div>
                    </div>
                  </div>
                </div>

              </div>
              <div className="apply-filter-button center-align">
                <a onClick={this.applyFilter} className="btn waves-effect grey text-grey text-lighten-5 waves-light apply-filter-button">
                  Apply filter
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    )
  }
}
