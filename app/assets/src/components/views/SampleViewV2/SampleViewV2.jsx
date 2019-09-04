import React from "react";

export default class SampleViewV2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.gsnapFilterStatus = this.generateGsnapFilterStatus();
  }

  componentDidMount() {
    fetch_sample_report_data();
  }
}
