class CreateUser extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.csrf = props.csrf;
    this.user = props.selectedUser || null;
    this.handleCreate = this.handleCreate.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handlePConfirmChange = this.handlePConfirmChange.bind(this);
    this.handleTokenChange = this.handleTokenChange.bind(this);
    this.clearError = this.clearError.bind(this)
    this.gotoPage = this.gotoPage.bind(this);
    this.toggleCheckBox = this.toggleCheckBox.bind(this); 
    this.selectedUser = {
      email: this.user ? this.user.email : '',
      password: '',
      id: this.user ? this.user.id : null,
      password_confirmation: '',
      authentication_token: this.user ? this.user.authentication_token : '',
      adminStatus: this.user ? this.user.admin : null
    }
    this.state = {
      isChecked: false,
      success: false,
      showFailed: false,
      errorMessage: [],
      successMessage: '',
      isChecked : false,
      email: this.selectedUser.email || '',
      password: this.selectedUser.password || '',
      pConfirm: this.selectedUser.password_confirmation || '',
      auth: this.selectedUser.authentication_token || '',
      adminstatus: this.selectedUser.adminStatus,
      id: this.selectedUser.id,
      isMustFill: this.selectedUser.adminStatus ? true : undefined,
      adminValue: this.selectedUser.adminStatus ? 1 : 0
    }
  }

  handleCreate(e) {
    e.preventDefault();
    if(!this.isCreateFormInvalid()) {
      this.createUser()
    }
  }

  handleUpdate(e) {
    e.preventDefault();
    if(!this.isUpdateFormValid()) {
      this.updateUser()
    }
  }

  gotoPage(path) {
    location.href = `${path}`
  }

  clearError() {
    this.setState({ showFailed: false })
  }

  toggleCheckBox(e) {
    var checkboxValue = $('#admin').prop('checked')
    this.setState({
      isChecked: checkboxValue,
      adminstatus: !this.state.adminstatus,
    })
    this.isMustFill = !this.isMustFill;
    this.state.isChecked = !this.state.isChecked;
  }

  handlePasswordChange(e) {
    this.setState({
        password: e.target.value
    });
  }

  handlePConfirmChange(e) {
    this.setState({
        pConfirm: e.target.value
    });
  }

  handleTokenChange(e) {
    this.setState({
        auth: e.target.value
    });
  }

  handleEmailChange(e) {
    this.setState({
        email: e.target.value
    });
  }

  isCreateFormInvalid() {
    if (this.refs.email.value === '' && this.refs.password.value === '' && this.refs.password_confirmation.value === '' && this.refs.authentication_token.value === '') {
      this.setState({ 
        showFailed: true,
        errorMessage: 'Please fill all fields'
      })
      return true;
    } else if (this.refs.password.value === '') {
      this.setState({ 
        showFailed: true,
        errorMessage: 'Please enter password'
      })
      return true;
    } 
    else if (this.refs.password_confirmation.value === '') {
      this.setState({ 
        showFailed: true,
        errorMessage: 'Please re-enter password'
      })
      return true;
    } else if (this.refs.authentication_token.value === '') {
      this.setState({ 
        showFailed: true,
        errorMessage: 'Please enter authentication token'
      })
      return true;
    } 
    else {
      return false;
    }
  }

  isUpdateFormValid() {
    if (this.state.email === '' && this.state.auth === '') {
      this.setState({ 
        showFailed: true,
        errorMessage: 'Please fill all fields'
      })
      return true;
    } else if (this.state.email === '') {
      this.setState({ 
        showFailed: true,
        errorMessage: 'Please enter email'
      })
      return true;
    } else if (this.state.auth === '') {
      this.setState({ 
        showFailed: true,
        errorMessage: 'Please enter authentication token'
      })
      return true;
    } else {
      return false;
    }
  }

  createUser() {
    var that = this;
    axios.post('/users.json', { 
       user: {
        email: this.refs.email.value,
        password: this.refs.password.value,
        password_confirmation: this.refs.password_confirmation.value,
        authentication_token: this.refs.authentication_token.value,
        role: this.refs.admin.value
      },
      authenticity_token: this.csrf
    }).then((res) => {
      console.log('The res is ',res);
      that.setState({
        success: true,
        successMessage: 'User created successfully'
      }, () => {
        // that.gotoPage('/users');
      })
    })
    .catch((error) => {
      console.log('The error is ',error.response.data);
      that.setState({
        showFailed: true,
        errorMessage: error.response.data || 'Failed to create user'
      })
    })
  }

  updateUser() {
    var that = this;
    axios.patch(`/users/${this.state.id}.json`, {
      user: {
        email: this.state.email,
        password: this.state.password,
        password_confirmation: this.state.pConfirm,
        authentication_token: this.state.auth,
        role: this.state.adminstatus ? 1 : 0
      },
      authentication_token: this.csrf
    }).then((res) => {
      that.setState({
        success: true,
        successMessage: 'User updated successfully'
      }, () => {
        that.gotoPage('/users');
      })
    }).catch((err) => {
      that.setState({
        showFailed: true,
        errorMessage: 'Failed to update user'
      })
    })
  }

  renderCreateUser() {
    return (
      <div className="user-form">
          <div className="row">
            <form ref="form" className="new_user" id="new_user" onSubmit={ this.handleCreate }>
              <div className="row title">
                <p className="col s6 signup">Create User</p>
              </div>
              { this.state.success ? <div className="success-info" >
                <i className="fa fa-success"></i>
                 <span>{this.state.successMessage}</span>
                </div> : null }
              { this.state.errorMessage.length && this.state.showFailed ? <div className="error-info" >
                  {/* <i className="fa fa-exclamation"></i> */}
                  { this.state.errorMessage.map((message, i) => {
                    return <p key={i} className="center-align"> { message }</p>
                  }) }
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
                  <i className="fa fa-check-circle" aria-hidden="true"></i>
                  <input ref= "password_confirmation" type="password" className="" onFocus={ this.clearError }   />
                  <label htmlFor="user_password_confirmation">Confirm Password</label>
                </div>
                <div className="input-field">
                  <i className="fa fa-unlock" aria-hidden="true"></i>
                  <input ref= "authentication_token" type="text" className="" onFocus={ this.clearError }   />
                  <label htmlFor="user_authentication_token">Authentication Token</label>
                </div>
                <p>
                  <input ref="admin" type="checkbox" name="switch" id="admin" className="filled-in" onChange={ this.toggleCheckBox } value={ this.state.isChecked ? 1 : 0 } />
                  <label htmlFor="admin">Admin</label>
                </p>
              </div>
              <input className="hidden" type="submit"/>
              <div onClick={ this.handleCreate } className="center-align login-wrapper">Submit</div>
            </form>
          </div>
        </div>
    )
  }

  renderUpdateUser() {
    return (
      <div className="user-form">
          <div className="row">
            <form ref="form" className="new_user" id="new_user" onSubmit={ this.handleUpdate }>
              <div className="row title">
                <p className="col s6 signup">Update User</p>
              </div>
              { this.state.success ? <div className="success-info" >
                <i className="fa fa-success"></i>
                 <span>{this.state.successMessage}</span>
                </div> : null }
              { this.state.showFailed ? <div className="error-info" >
                  <i className="fa fa-error"></i>
                  <span>{this.state.errorMessage}</span>
              </div> : null }
              <div className="row content-wrapper">
                <div className="input-field">
                  <i className="fa fa-envelope" aria-hidden="true"></i>
                  <input type="email" onChange = { this.handleEmailChange } className="" onFocus={ this.clearError } value={ this.state.email } />
                  <label htmlFor="user_email">Email</label>
                </div>
                 <div className="input-field">
                  <i className="fa fa-key" aria-hidden="true"></i>
                  <input type="password" onChange = { this.handlePasswordChange } className="" onFocus={ this.clearError }  value={ this.state.password } />
                  <label htmlFor="user_password">Password</label>
                </div>
                <div className="input-field">
                  <i className="fa fa-check-circle" aria-hidden="true"></i>
                  <input type="password" onChange = { this.handlePConfirmChange } className="" onFocus={ this.clearError }  value={ this.state.pConfirm} />
                  <label htmlFor="user_password_confirmation">Confirm Password</label>
                </div>
                <div className="input-field">
                  <i className="fa fa-unlock" aria-hidden="true"></i>
                  <input type="text" onChange = { this.handleTokenChange } className="" onFocus={ this.clearError }   value={ this.state.auth}/>
                  <label htmlFor="user_authentication_token">Authentication Token</label>
                </div>
                <p>
                  <input type="checkbox" id="admin" className="filled-in" checked={ this.state.isMustFill } onChange={ this.toggleCheckBox } value={ this.state.adminValue } />
                  <label htmlFor="admin">Admin</label>
                </p>
              </div>
              <input className="hidden" type="submit"/>
              <div onClick={ this.handleUpdate } className="center-align login-wrapper">Submit</div>
            </form>
          </div>
        </div>
    )
  }

  render() {
    return (
      <div>
        { this.props.selectedUser ? this.renderUpdateUser() : this.renderCreateUser() }
        <div className="bottom">
          <span className="back" onClick={ this.props.selectedUser ? this.gotoPage.bind(this, '/users') : this.gotoPage.bind(this, '/') } >Back</span>|
          <span className="home" onClick={ this.gotoPage.bind(this, '/')}>Home</span>
        </div>
      </div>
    )
  }
}
