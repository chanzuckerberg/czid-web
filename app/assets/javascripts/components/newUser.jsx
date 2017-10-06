class CreateUser extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.clearError = this.clearError.bind(this)
    this.state = {
      isChecked: false,
      showFailed: false,
      errorMessage: ''
    }
  }

  renderSignUp() {
    return (
      <div className="form-wrapper">
          <div className="row">
            <form ref="form" className="new_user" id="new_user" onSubmit={ this.handleSubmit }>
              <div className="row title">
                <p className="col s6 signup">Sign up</p>
              </div>
              { this.state.showFailed ? <div className="error-info" >
                  <i className="fa fa-error"></i>
                  <span>{this.state.errorMessage}</span>
              </div> : null }
              <div className="row content-wrapper">
                <div className="input-field">
                  <i className="fa fa-envelope" aria-hidden="true"></i>
                  <input ref= "email" type="email" className="" onFocus={ this.clearError }  />
                  <label htmlFor="user_email">Email</label>
                </div>
                <div className="input-field">
                  <i className="fa fa-key" aria-hidden="true"></i>
                  <input ref= "password" type="password" className="" onFocus={ this.clearError }   />
                  <label htmlFor="user_password">Password</label>
                </div>
                <div className="input-field">
                  <i className="fa fa-key" aria-hidden="true"></i>
                  <input ref= "password_confirmation" type="password" className="" onFocus={ this.clearError }   />
                  <label htmlFor="user_password_confirmation">Confirm Password</label>
                </div>
                <div className="input-field">
                  <i className="fa fa-key" aria-hidden="true"></i>
                  <input ref= "authentication_token" type="text" className="" onFocus={ this.clearError }   />
                  <label htmlFor="user_authentication_token">Authentication Token</label>
                </div>
              </div>
              <div onClick={ this.handleSubmit } className="center-align login-wrapper">Submit</div>
            </form>
          </div>
        </div>
    )
  }
}