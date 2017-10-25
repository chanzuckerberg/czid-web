class Header extends React.Component  {
  constructor(props, context) {
    super(props, context);
    this.userSignedIn = this.props.userSignedIn;
    this.userDetails = this.props.userDetails || null;
    this.location = window.location.pathname;
  }

	componentDidMount() {
    $('.profile-dropdown').dropdown();
  }
  
  gotoPage(path) {
    location.href = `${path}`
  }

  render() {
    return (
      <div>
        <div className="site-header">
          {/* Dropdown menu */}
          <ul id="dropdown1" className="dropdown-content">
            <li onClick={ this.gotoPage.bind(this, '/samples/new') }><a href="#!">New Sample</a></li>
           { this.userDetails && this.userDetails.admin ? <li onClick={ this.gotoPage.bind(this, '/users/new') }><a href="#!">Create User</a></li> : null }
            <li className="divider"></li>
            <li><a rel="nofollow" data-method="delete" href={this.props.signoutEndpoint}>Logout</a></li>
          </ul>

          <div>
            <div className="">
              <a href="/" className="left brand-details">
                <div className="brand-short">
                    ID.seq
                </div>

                <div className="brand-long">
                  Infectious Disease Platform
                </div>
              </a>

              <div className={ this.userSignedIn ? "right hide-on-med-and-down header-right-nav" : "right hide-on-med-and-down header-right-nav menu" }>
                { this.userSignedIn ? <div className='profile-header-dropdown'><a className="dropdown-button profile-dropdown" href="#!" data-activates="dropdown1">
                    { this.userDetails.email } <i className="fa fa-angle-down"></i>
                    </a></div>:  (this.location === '/users/sign_in' ? null : <div className="login"><span onClick={ this.gotoPage.bind(this, '/users/sign_in') }>Login</span></div>) 
                 }
              </div>
            </div>
          </div>
        </div>
      </div>

    )
  }
}
