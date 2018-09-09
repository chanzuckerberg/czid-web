import PropTypes from "prop-types";
import React from "react";
import Wizard from "../../ui/containers/Wizard";

class PhyloTreeByPathCreation extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Wizard>
        <Wizard.Page>
          <div>Page 1</div>
          <div>Contents</div>
        </Wizard.Page>
        <Wizard.Page>
          <div>Page 2</div>
          <div>Contents</div>
        </Wizard.Page>
      </Wizard>
    );
  }
}
