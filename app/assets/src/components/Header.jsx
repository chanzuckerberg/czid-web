import React from "react";
import $ from "jquery";
import axios from "axios";
import { compact, flatten } from "lodash/fp";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
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

    const userDropdownItems = compact(
      flatten([
        this.demoUser !== 1 && [
          <BareDropdown.Item
            text="New Sample"
            key="1"
            onClick={this.gotoPage.bind(this, "/samples/new")}
          />,
          <BareDropdown.Item
            text="New Sample (Command Line)"
            key="2"
            onClick={() => this.openNewTab("/cli_user_instructions")}
          />
        ],
        this.userDetails &&
          this.userDetails.admin && (
            <BareDropdown.Item
              key="3"
              text="Create User"
              onClick={this.gotoPage.bind(this, "/users/new")}
            />
          ),
        <BareDropdown.Item
          text="Report Feedback"
          key="4"
          onClick={this.sendMail}
        />,
        <BareDropdown.Item
          text="Terms of Use"
          key="5"
          onClick={() => this.openNewTab("https://assets.idseq.net/Terms.pdf")}
        />,
        <BareDropdown.Item
          text="Privacy Policy"
          key="6"
          onClick={() =>
            this.openNewTab("https://assets.idseq.net/Privacy.pdf")
          }
        />,
        <BareDropdown.Item key="7" text="Logout" onClick={this.signOut} />
      ])
    );

    return (
      <div className="header-row row">
        <div className="page-loading">
          <div className="btn disabled">
            <i className="fa fa-spinner fa-spin" />
            <span className="spinner-label" />
          </div>
        </div>
        <div className="site-header col s12">
          <div href="/" className="left brand-details">
            <a href="/">
              <span className="logo-icon">
                <LogoIcon />
              </span>
            </a>
          </div>
          <div className="fill" />
          <BareDropdown
            trigger={<div className="user-name">{this.userDetails.name}</div>}
            className="user-dropdown"
            items={userDropdownItems}
            direction="left"
          />
        </div>
      </div>
    );
  }
}

export default Header;
