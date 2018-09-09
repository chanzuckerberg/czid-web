import PropTypes from "prop-types";
import React from "react";

class Wizard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPage: 0
    };
  }

  render() {
    return <div>Base Wizard</div>;
  }
}

const Page = () => null;

Wizard.Page = Page;

Wizard.propTypes = {
  pages: PropTypes.arrayOf(PropTypes.instanceOf(Wizard.Page))
};

export default Wizard;
