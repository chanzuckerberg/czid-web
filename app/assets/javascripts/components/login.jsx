class Login extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.csrf = this.props.csrf
    this.handleSubmit = this.handleSubmit.bind(this);
    this.gotToForgotPassword = this.gotToForgotPassword.bind(this)
    this.toggleCheckBox = this.toggleCheckBox.bind(this)
    this.state = {
      isChecked: false
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    var email = this.refs.email.value;
    var password = this.refs.password.value;
    var remember_me = this.refs.remember_me.value;
    axios.post(`${this.props.endpoint}.json`, {
      user: {
        email: email,
        password: password,
        remember_me: remember_me
      },
      authenticity_token: this.csrf
    })
    .then(function (response) {
      location.href = '/'
    })
    .catch(function (error) {
    });
  }

  gotToForgotPassword() {
    location.href = '/users/password/new';
  }

  toggleCheckBox() {
    var checkboxValue = $('#remember_me').prop('checked')
    this.setState({
      isChecked: checkboxValue
    })
    this.setState.isChecked = !this.setState.isChecked;  
  }

  render() {
    return (
      <div>
        <Header />
        <div className="form-wrapper">
          <div className="row">
            <form ref="form" className="new_user" id="new_user" onSubmit={ this.handleSubmit }>
              <div className="row title">
                <p className="col s6 verify">Already a user? Sign in</p>
                <p className="col s6 signup">Login</p>
              </div>
              <div className="row content-wrapper">
                <div className="input-field">
                  <i className="fa fa-envelope" aria-hidden="true"></i>
                  <input ref= "email" type="email" className="validate" />
                  <label htmlFor="user_email">Email</label>
                </div>
                <div className="input-field">
                  <i className="fa fa-key" aria-hidden="true"></i>
                  <input ref= "password" type="password" className="" />
                  <label htmlFor="user_password">Password</label>
                </div>
                <div className="">  
                  <input ref="remember_me" type="checkbox" name="switch" className="filled-in" id="remember_me" onChange={ this.toggleCheckBox } value={this.setState.isChecked ? 1 : 0} />
                  <label htmlFor="remember_me">Remember me</label>
                </div>
              </div>
                <div className="forgot-password"><span onClick={ this.gotToForgotPassword }>Forgot your password?</span><br /></div>
              <div onClick={ this.handleSubmit } className="center-align login-wrapper">Submit</div>
            </form>
          </div>
        </div>
      </div>
    )
  }
}
