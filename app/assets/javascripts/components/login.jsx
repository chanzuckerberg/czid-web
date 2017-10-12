class Login extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.csrf = this.props.csrf
    this.handleSubmit = this.handleSubmit.bind(this);
    this.toggleCheckBox = this.toggleCheckBox.bind(this);
    this.clearError = this.clearError.bind(this);
    this.gotoPage = this.gotoPage.bind(this);
    this.state = {
      isChecked: false,
      showFailedLogin: false,
      errorMessage: ''
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    if(!this.isFormInValid()) {
      this.login()
    }
  }

  clearError() {
    this.setState({ showFailedLogin: false })
  }

  gotoPage(path) {
    location.href = `${path}`
  }

  login() {
    var that = this
    axios.post(`${this.props.endpoint}.json`, {
      user: {
        email: this.refs.email.value,
        password: this.refs.password.value,
        remember_me: this.refs.remember_me.value
      },
      authenticity_token: this.csrf
    })
    .then(function (response) {
      that.gotoPage('/')
    })
    .catch(function (error) {
      that.setState({
        showFailedLogin: true,
        errorMessage: 'Invalid Email and Password'
      })
    });
  }

  isFormInValid() {
    if (this.refs.email.value === '' && this.refs.password.value === '') {
      this.setState({ 
        showFailedLogin: true,
        errorMessage: 'Please enter email and password'
      })
      return true;
    } else if (this.refs.email.value === '') {
      this.setState({ 
        showFailedLogin: true,
        errorMessage: 'Please enter email'
      })
      return true;
    } else if (this.refs.password.value === '') {
      this.setState({ 
        showFailedLogin: true,
        errorMessage: 'Please enter password'
      })
      return true;
    } else {
      return false;
    }
  }

  toggleCheckBox() {
    var checkboxValue = $('#remember_me').prop('checked')
    this.setState({
      isChecked: checkboxValue
    })
    this.setState.isChecked = !this.setState.isChecked;  
  }

  renderLogin() {
    return (
        <div className="form-wrapper">
          <div className="row">
            <form ref="form" className="new_user" id="new_user" onSubmit={ this.handleSubmit }>
              <div className="row title">
                <p className="col s6 signup">Login</p>
              </div>
              { this.state.showFailedLogin ? <div className="error-info" >
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
                <div className="">  
                  <input ref="remember_me" type="checkbox" name="switch" className="filled-in" id="remember_me" onChange={ this.toggleCheckBox } value={this.setState.isChecked ? 1 : 0} />
                  <label htmlFor="remember_me">Remember me</label>
                </div>
              </div>
                <div className="forgot-password"><span onClick={this.gotoPage.bind(this, '/users/new/password')}>Forgot your password?</span><br /></div>
              <div onClick={ this.handleSubmit } className="center-align login-wrapper">Submit</div>
            </form>
          </div>
        </div>
    )
  }

  render() {
    return (
      <div>
        { this.renderLogin() }
      </div>
    )
  }

}
