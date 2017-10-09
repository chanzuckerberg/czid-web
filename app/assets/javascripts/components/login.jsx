class Login extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    return (
      <div>
        <Header />
        <div className="form-wrapper">
          <div className="row">
            <form>
              <div className="row title">
                <p className="col s6 verify">Already a user? Sign in</p>
                <p className="col s6 signup">Login</p>
              </div>
              <div className="row content-wrapper">
                <div className="input-field">
                  <i className="fa fa-envelope" aria-hidden="true"></i>
                  <input type="email" className="validate" />
                  <label htmlFor="icon_prefix">Email</label>
                </div>
                <div className="input-field">
                  <i className="fa fa-key" aria-hidden="true"></i>
                  <input type="password" className="" />
                  <label htmlFor="icon_telephone">Password</label>
                </div>
                <div className="input-field">
                  <input type="password" className="" />
                  <label htmlFor="icon_telephone">Confirm Password</label>
                </div>
              </div>
              <div className="center-align login-wrapper">Submit</div>
            </form>
          </div>
        </div>
      </div>
    )
  }
}
