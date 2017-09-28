class Header extends React.Component  {

	componentDidMount() {
		$('.profile-dropdown').dropdown();
	}

  render() {
    return (
      <div>
        <div className="site-header">
          {/* Dropdown menu */}
          <ul id="dropdown1" className="dropdown-content">
            <li><a href="#!">New Project</a></li>
            <li><a href="#!">Account</a></li>
            <li className="divider"></li>
            <li><a href="#!">Sign out</a></li>
          </ul>

          <div>
            <div className="">
              <a href="/" className="left brand-details">
                <div className="brand-short">
                    ID<i>seq</i>
                </div>

                <div className="brand-long">
                  Infectious Disease Platform
                </div>
              </a>

              <div className="right hide-on-med-and-down header-right-nav">
                <div>
                  <a className="dropdown-button profile-dropdown" href="#!" data-activates="dropdown1">
                    Rebecca Egger <i className="fa fa-angle-down"> </i>
                  </a>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

    )
  }
}
