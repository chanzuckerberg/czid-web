import React from 'react';
import $ from 'jquery';
import axios from 'axios';
import { Dropdown } from 'semantic-ui-react';
import SampleUpload from './SampleUpload';

class Header extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.demoUser = this.props.demoUser;
    this.userSignedIn = this.props.userSignedIn;
    this.userDetails = this.props.userDetails || null;
    this.location = window.location.pathname;
    this.sendMail = this.sendMail.bind(this);
    this.signOut = this.signOut.bind(this);
    this.openCliModal = this.openCliModal.bind(this);
    this.user_auth_token = props.user_auth_token;
    this.host_genome_names = props.host_genome_names;
    $(document).ready(() => {
      $('.modal').modal();
    });
  }

  componentDidMount() {
    this.displayProfileMenu();
  }

  displayProfileMenu() {
    $('.profile-dropdown').dropdown({
      belowOrigin: true,
      stopPropagation: false
    });
  }

  gotoPage(path) {
    location.href = `${path}`;
  }

  signOut() {
    axios(
      `${this.props.signoutEndpoint}.json`,
      { method: 'DELETE', withCredentials: true }
    ).then((res) => {
      this.gotoPage(this.props.signInEndpoint);
    });
  }

  sendMail() {
    const link = 'mailto:regger@chanzuckerberg.com?Subject=Report%20Feedback';
    window.location.href = link;
  }

  openCliModal() {
    $('#cli_modal').modal('open');
  }

  render() {
    const host_genome_names = this.host_genome_names;
    let cli_modal;
    if (this.userSignedIn && this.demoUser !== 1) {
      cli_modal =
        (<div id="cli_modal" className="modal project-popup">
          <div className="modal-content">
            <p>1. Install and configure the Amazon Web Services Command Line Interface (AWS CLI).
               Verify it works by running <span className="code">aws help</span>, which should display usage instructions.
            </p>
            <p>2. Install the IDseq CLI:</p>
            <p><span className="code">pip install git+https://github.com/chanzuckerberg/idseq-cli.git --upgrade</span></p>
            <p>3. Upload a sample using a command of the form:</p>
            <div className="code center-code">
              <p>
                idseq -p '<span className="code-to-edit">Your Project Name</span>' -s '<span className="code-to-edit">Your Sample Name</span>' \
                <br /> -u https://idseq.net -e <span className="code-personal">{this.userDetails.email}</span> -t <span className="code-personal">{this.user_auth_token}</span> \
                <br /> --r1 <span className="code-to-edit">your_sample_R1</span>.fastq.gz --r2 <span className="code-to-edit">your_sample_R2</span>.fastq.gz
              </p>
            </div>
            <br/>
            <p>4. You can also upload samples in bulk by specifying a folder as follows:</p>
            <div className="code center-code">
              <p>
                idseq -p '<span className="code-to-edit">Your Project Name</span>' \
                <br /> -u https://idseq.net -e <span className="code-personal">{this.userDetails.email}</span> -t <span className="code-personal">{this.user_auth_token}</span> \
                <br /> --bulk <span className="code-to-edit">/path/to/your/folder</span>
              </p>
            </div>
            <br/>
            <div className="divider" />
            <br/>
            <p>By default, the host genome to be subtracted out is "Human".<br />
               You can change it by adding <span className="code">--host_genome_name <span className="code-to-edit">'Your Chosen Host'</span></span> to the command.<br />
               Current possibilities for <span className="code-to-edit">'Your Chosen Host'</span>:<br />
              {host_genome_names.map((hgn, i) => <span className="code-personal" key={i}>'{hgn}'</span>).reduce((prev, curr) => [prev, ' / ', curr])}.
            </p>
            <p className="upload-question">For more information on the IDseq CLI, have a look at its <a href="https://github.com/chanzuckerberg/idseq-web/blob/master/README.md" target="_blank">GitHub repository</a>.</p>
            <button className="modal-close">Done</button>
          </div>
         </div>);
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
                  <div className="row">
                    <div className="col s1 logo" />
                    <span className="col s1 logo-label">
                       IDseq
                    </span>
                  </div>
                </a>
              </div>

              { cli_modal /* Able to be called later */ }
              <Dropdown
                text={this.userDetails.email}
                className="right hide-on-med-and-down profile-header-dropdown"
              >
                <Dropdown.Menu>
                  {
                    this.userSignedIn && this.demoUser !== 1 &&
                      [
                        <Dropdown.Item
                          text="New sample"
                          key="1"
                          onClick={this.gotoPage.bind(this, '/samples/new')}
                        />,
                        <Dropdown.Item
                          text="New sample (command line)"
                          key="2"
                          onClick={this.openCliModal}
                        />
                      ]
                  }
                  {
                    this.userDetails && this.userDetails.admin &&
                      <Dropdown.Item
                        text="Create user"
                        onClick={this.gotoPage.bind(this, '/users/new')}
                      />
                  }
                  {
                    <Dropdown.Item
                      text="Report feedback"
                      onClick={this.sendMail}
                    />
                  }
                  {
                    <Dropdown.Divider />
                  }
                  {
                    <Dropdown.Item
                      text="Logout"
                      onClick={this.signOut}
                    />
                  }
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Header;
