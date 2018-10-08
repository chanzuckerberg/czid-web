import React from "react";
import PropTypes from "prop-types";

class TaxonTooltip extends React.Component {
  constructor(props) {
    super(props);
  }

  renderTaxons() {
    let taxon = this.props.taxon;
    if (!taxon) {
      return;
    }

    let valueMap = [
      ["Max Z", "NT.maxzscore"],
      ["Agg Score", "NT.aggregatescore"],
      ["NT RPM", "NT.rpm"],
      ["NR RPM", "NR.rpm"],
      ["NT R", "NT.r"],
      ["NR R", "NR.r"],
      ["NT Z", "NT.zscore"],
      ["NR Z", "NR.zscore"]
    ];
    let ret = [
      <li className="col s12" key="taxon-name">
        <label>Taxon:</label>
        {taxon.name}
      </li>
    ];
    valueMap.forEach(function(pair) {
      if (!pair) {
        ret.push(
          <li key="blank" className="col s6">
            &nbsp;
          </li>
        );
        return;
      }

      let key = pair[0],
        value = pair[1];

      let parts = value.split("."),
        base = taxon;

      for (var part of parts) {
        base = base[part];
      }
      ret.push(
        <li className="col s6" key={"taxon-" + value + "-value"}>
          <label>{key}:</label>
          {base.toFixed(1)}
        </li>
      );
    });
    return ret;
  }
  render() {
    let sample = this.props.sample;
    return (
      <div className="heatmap-tooltips">
        <ul className="row">
          <li className="col s12">
            <label>Sample:</label>
            {sample.name}
          </li>
          {this.renderTaxons()}
        </ul>
      </div>
    );
  }
}

TaxonTooltip.propTypes = {
  taxon: PropTypes.shape({
    name: PropTypes.string
  }),
  sample: PropTypes.shape({
    name: PropTypes.string
  }).isRequired
};

export default TaxonTooltip;
