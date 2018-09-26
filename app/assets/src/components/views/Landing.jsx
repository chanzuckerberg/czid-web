import React from "react";
import TransparentButton from "../ui/controls/buttons/TransparentButton";

class Landing extends React.Component {
  render() {
    const link = () => (location.href = "/users/sign_in");
    let header = (
      <div className="header-row row">
        <div className="site-header col s12">
          <div className="left brand-details">
            <span className="col s1 logo-label">IDseq</span>
          </div>
          <div className="sign-in">
            <TransparentButton text="Sign In" onClick={link} />
          </div>
        </div>
      </div>
    );

    let firstBlock = (
      <div className="col s12 first-block">
        <div className="top-title">
          IDseq is an unbiased global software platform that helps scientists
          identify pathogens in metagenomic data.
        </div>
      </div>
    );

    return (
      <div>
        {header}
        {firstBlock}
      </div>
    );
  }
}

export default Landing;
