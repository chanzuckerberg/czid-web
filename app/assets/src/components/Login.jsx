import React from 'react';
import axios from 'axios';
import $ from 'jquery';

class Login extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.csrf = props.csrf
    this.handleSubmit = this.handleSubmit.bind(this);
    this.toggleCheckBox = this.toggleCheckBox.bind(this);
    this.clearError = this.clearError.bind(this);
    this.gotoPage = this.gotoPage.bind(this);
    this.sendMail = this.sendMail.bind(this);
    this.state = {
      isChecked: false,
      success: false,
      showFailedLogin: false,
      errorMessage: '',
      successMessage: ''
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    this.clearError()
    if(!this.isFormInValid()) {
      this.login()
    }
  }

  clearError() {
    this.setState({
      showFailedLogin: false,
      success: false
    })
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
    .then((response) => {
      that.setState({
        success: true,
        successMessage: 'User signed in'
      }, () => {
        that.gotoPage('/');
      })
    })
    .catch((error) => {
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
    this.state.isChecked = !this.state.isChecked;
  }

  sendMail() {
    var link = "mailto:regger@chanzuckerberg.com?Subject=Request%20IDseq%20Access"
    window.location.href = link;
  }

  renderLogin() {
    return (
        <div className="login-form">
          <div className="row">
            <form ref="form" className="new_user" id="new_user" onSubmit={ this.handleSubmit }>
              <div className="row title">
                <p className="col s6 signup">Login</p>
              </div>
              <div className="mail"><p>To request access to IDseq, please email us<span onClick={ this.sendMail }> here</span></p></div>
              <div className="mail">Or login with the following demo account:
                <p> Email: idseq.guest@chanzuckerberg.com </p>
                <p> Password: idseqisawesome</p>
              </div>
              { this.state.success ? <div className="success-info" >
                <i className="fa fa-success"></i>
                 <span>{this.state.successMessage}</span>
                </div> : null }
              { this.state.showFailedLogin ? <div className="error-info" >
                  <i className="fa fa-error"></i>
                  <span>{this.state.errorMessage}</span>
              </div> : null }
              <div className="row content-wrapper">
                <div className="input-field">
                  <i className="sample fa fa-envelope" aria-hidden="true"></i>
                  <input ref= "email" type="email" className="" onFocus={ this.clearError }  />
                  <label htmlFor="user_email">Email</label>
                </div>
                <div className="input-field">
                  <i className="sample fa fa-key" aria-hidden="true"></i>
                  <input ref= "password" type="password" className="" onFocus={ this.clearError }   />
                  <label htmlFor="user_password">Password</label>
                </div>
                <div className="">
                  <input ref="remember_me" type="checkbox" name="switch" className="filled-in" id="remember_me" onChange={ this.toggleCheckBox } value={this.state.isChecked ? 1 : 0} />
                  <label htmlFor="remember_me">Remember me</label>
                </div>
                <div className="">
                  <a href="/users/passwords/new">Forgot password?</a>
                </div>
              </div>
              <input className="hidden" type="submit"/>
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
export default Login;
