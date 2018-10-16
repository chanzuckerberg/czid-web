import React from "react";
import $ from "jquery";
import axios from "axios";
import { Menu, Dropdown } from "semantic-ui-react";
import LogoIcon from "./ui/icons/LogoIcon";

class Header extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.demoUser = this.props.demoUser;
    this.userSignedIn = this.props.userSignedIn;
    this.userDetails = this.props.userDetails || null;
    this.location = window.location.pathname;
    this.sendMail = this.sendMail.bind(this);
    this.signOut = this.signOut.bind(this);
    this.userAuthToken = props.userAuthToken;
    this.host_genome_names = props.host_genome_names;
  }

  componentDidMount() {
    this.displayProfileMenu();
  }

  displayProfileMenu() {
    $(".profile-header-dropdown").dropdown({
      belowOrigin: true,
      stopPropagation: false
    });
  }

  gotoPage(path) {
    location.href = `${path}`;
  }

  openNewTab(path) {
    window.open(path);
  }

  signOut() {
    axios(`${this.props.signoutEndpoint}.json`, {
      method: "DELETE",
      withCredentials: true
    }).then(res => {
      this.gotoPage(this.props.signInEndpoint);
    });
  }

  sendMail() {
    const link = `mailto:${this.props.contactEmail}?Subject=Report%20Feedback`;
    window.location.href = link;
  }

  render() {
    if (!this.userSignedIn) {
      return null;
    }

    return (
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
                  <span className="logo-icon">
                    <LogoIcon />
                  </span>
                </a>
              </div>
              <Menu className="profile-header-menu">
                <Menu.Menu position="right">
                  <Dropdown text={this.userDetails.name}>
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
                          onClick={() =>
                            this.openNewTab("/cli_user_instructions")
                          }
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
                          this.openNewTab("https://assets.idseq.net/Terms.pdf")
                        }
                      />
                      <Dropdown.Item
                        text="Privacy Policy"
                        onClick={() =>
                          this.openNewTab(
                            "https://assets.idseq.net/Privacy.pdf"
                          )
                        }
                      />
                      <Dropdown.Divider />
                      <Dropdown.Item text="Logout" onClick={this.signOut} />
                    </Dropdown.Menu>
                  </Dropdown>
                </Menu.Menu>
              </Menu>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Header;
