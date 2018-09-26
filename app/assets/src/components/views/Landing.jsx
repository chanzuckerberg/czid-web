import React from "react";

class Landing extends React.Component {
  render() {
    let header = (
      <div className="header-row row">
        <div className="site-header col s12">
          <div className="left brand-details">
            <span className="col s1 logo-label">IDseq</span>
          </div>
        </div>
      </div>
    );

    return header;
  }
}

export default Landing;
