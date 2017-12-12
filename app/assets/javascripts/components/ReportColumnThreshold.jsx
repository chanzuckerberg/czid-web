/**
 @class ReportColumnThreshold
 @desc Creates react component to handle column thresholding in the page
 */
class ReportColumnThreshold extends React.Component {
  constructor(props) {
    super(props);
    this.metric_token = props.metric_token;
    this.sample_id = props.sample_id;
    this.new_filter_thresholds = {};
    this.applyFilters = this.applyFilters.bind(this);
  }

  setFilterThreshold(threshold_name, event) {
    this.new_filter_thresholds[threshold_name] = event.target.value.trim();
    $('.apply-filter-button a').addClass('changed');
  }

  applyFilters(event) {
    ReportColumnThreshold.showLoading('Applying thresholds...');
    this.props.applyNewFilterThresholds(this.new_filter_thresholds);
  }

  static showLoading(message) {
    $('.page-loading .spinner-label').text(message);
    $('body').css('overflow', 'hidden');
    $('.page-loading').css('display', 'flex');
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
      <div>{threshold_filter}</div>
    );
  }
}
