class ForgotPassword extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.csrf = this.props.csrf
    this.handleSubmit = this.handleSubmit.bind(this);
    this.clearError = this.clearError.bind(this)
    this.state = {
      showFailed: false,
      errorMessage: ''
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    if(!this.isFormInvalid()) {
      { this.path ? this.recoverPassword() : this.getConfirmationInstruction() }
    }
  }

  componentDidMount() {
    console.log(this)
  }

  clearError() {
    this.setState({ showFailed: false })
  }

  recoverPassword() {
    var that = this
    axios.post(this.props.endpoint, {
      user: {
        email: this.refs.email.value,
      },
      authenticity_token: this.csrf
    })
    .then(function (response) {
      console.log(response)
    })
    .catch(function (error) {
      console.log(error)
      that.setState({
        showFailed: true,
        errorMessage: 'Failed to reset password'
      })
    });
  }

  isFormInvalid() {
    if (this.refs.email.value === '' ) {
      this.setState({ 
        showFailed: true,
        errorMessage: 'Please enter email'
      })
      return true;
    } else {
      return false;
    }
  }

  renderForgotPassword() {
    return (
      <div className="form-wrapper">
        <div className="row">
          <form ref="form" className="new_user" id="new_user" onSubmit={ this.handleSubmit }>
            <div className="row title">
              <p className="col s6 signup">Forgot Password</p>
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
            </div>
            <div onClick={ this.handleSubmit } className="center-align login-wrapper">Send me password instructions</div>
          </form>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div>
        { this.renderForgotPassword() }
      </div>
    )
  }

}