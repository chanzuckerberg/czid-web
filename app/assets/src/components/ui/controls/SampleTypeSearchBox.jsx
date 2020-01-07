import React from "react";

import LiveSearchPopBox from "./LiveSearchPopBox";

export default class SampleTypeSearchBox extends React.Component {
  handleSearchTriggered = query => {
    console.log("handleSearchTriggered", query);
  };

  render() {
    return (
      <div>
        hello world
        <LiveSearchPopBox onSearchTriggered={this.handleSearchTriggered} />
      </div>
    );
  }
}
