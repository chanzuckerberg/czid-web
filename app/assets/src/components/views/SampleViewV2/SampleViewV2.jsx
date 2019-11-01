import React from "react";
import PropTypes from "prop-types";

export default class SampleViewV2 extends React.Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    return (
      <div>
        <div>Report page here</div>
      </div>
    );
  };
}

SampleViewV2.propTypes = {
  sampleId: PropTypes.number,
};
