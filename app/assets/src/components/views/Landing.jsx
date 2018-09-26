import React from "react";

class Landing extends React.Component {
  render() {
    let header = (
      <div className="header-row row">
        <div className="page-loading">
          <div className="btn disabled">
            <i className="fa fa-spinner fa-spin" />
            <span className="spinner-label" />
          </div>
        </div>
        <div className="site-header col s12">
          <div>
            <div className="">
              <div href="/" className="left brand-details">
                <a href="/">
                  <div className="row">
                    <span className="col s1 logo-label">IDseq</span>
                  </div>
                </a>
              </div>
              <Dropdown
                text={this.userDetails.email}
                className="right profile-header-dropdown"
              >
                <Dropdown.Menu>
                  {this.demoUser !== 1 && [
                    <Dropdown.Item
                      text="New Sample"
                      key="1"
                      onClick={this.gotoPage.bind(this, "/samples/new")}
                    />,
                    <Dropdown.Item
                      text="New Sample (Command Line)"
                      key="2"
                      onClick={() => this.openNewTab("/cli_user_instructions")}
                    />
                  ]}
                  {this.userDetails &&
                    this.userDetails.admin && (
                      <Dropdown.Item
                        text="Create User"
                        onClick={this.gotoPage.bind(this, "/users/new")}
                      />
                    )}
                  <Dropdown.Item
                    text="Report Feedback"
                    onClick={this.sendMail}
                  />
                  <Dropdown.Item
                    text="Terms of Use"
                    onClick={() =>
                      this.openNewTab(
                        "https://s3-us-west-2.amazonaws.com/idseq-database/Terms.pdf"
                      )
                    }
                  />
                  <Dropdown.Item
                    text="Privacy Policy"
                    onClick={() =>
                      this.openNewTab(
                        "https://s3-us-west-2.amazonaws.com/idseq-database/Privacy.pdf"
                      )
                    }
                  />
                  <Dropdown.Divider />
                  <Dropdown.Item text="Logout" onClick={this.signOut} />
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    );

    return <div>hello world</div>;
  }
}

export default Landing;
