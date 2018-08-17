import React from "react";
import Divider from "../../layout/Divider";
import ViewHeader from "../../layout/ViewHeader";

class PhyloTreeListView extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <ViewHeader title="Phylogenetic Trees" />
        <Divider />
      </div>
    );
  }
}

export default PhyloTreeListView;
