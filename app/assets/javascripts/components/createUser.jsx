class CreateUser extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.csrf = props.csrf;
    this.user = props.selectedUser || null;
    this.handleCreate = this.handleCreate.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handlePConfirmChange = this.handlePConfirmChange.bind(this);
    this.clearError = this.clearError.bind(this)
    this.gotoPage = this.gotoPage.bind(this);
    this.toggleCheckBox = this.toggleCheckBox.bind(this);
    this.selectedUser = {
      email: this.user ? this.user.email : '',
      name: this.user? this.user.name : '',
      password: '',
      id: this.user ? this.user.id : null,
      password_confirmation: '',
      adminStatus: this.user ? this.user.admin : null
    }
    this.state = {
      submitting: false,
      isAdmin: this.selectedUser.adminStatus ? true : false,
      success: false,
      showFailed: false,
      errorMessage: '',
      successMessage: '',
      serverErrors: [],
      email: this.selectedUser.email || '',
      name: this.selectedUser.name || '',
      password: this.selectedUser.password || '',
      pConfirm: this.selectedUser.password_confirmation || '',
      adminstatus: this.selectedUser.adminStatus,
      id: this.selectedUser.id
    }
  }

  handleCreate(e) {
    e.preventDefault();
    if(!this.isCreateFormInvalid()) {
      this.setState({
        submitting: true
      });
      this.createUser();
    }
  }

  handleUpdate(e) {
    e.preventDefault();
    if(!this.isUpdateFormValid()) {
      this.setState({
        submitting: true
      });
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
    this.setState({
      isAdmin: e.target.value == "true" ? false : true,
      adminstatus: e.target.value == "true" ? false : true,
    })
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

  handleEmailChange(e) {
    this.setState({
        email: e.target.value
    });
  }

  handleNameChange(e) {
    this.setState({
        name: e.target.value
    });
  }

  isCreateFormInvalid() {
    if (this.state.email === '' && this.state.password === '' && this.state.password_confirmation === '') {
      this.setState({
        showFailed: true,
        errorMessage: 'Please fill all fields'
      })
      return true;
    } else if (this.state.password === '') {
      this.setState({
        showFailed: true,
        errorMessage: 'Please enter password'
      })
      return true;
    }
    else if (this.state.password_confirmation === '') {
      this.setState({
        showFailed: true,
        errorMessage: 'Please re-enter password'
      })
      return true;
    } else {
      return false;
    }
  }

  isUpdateFormValid() {
    if (this.state.email === '') {
      this.setState({
        showFailed: true,
        errorMessage: 'Please enter valid email address'
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
        name: this.state.name,
        email: this.state.email,
        password: this.state.password,
        password_confirmation: this.state.password_confirmation,
        role: this.state.isAdmin ? 1 : 0
      }
    },
    { headers: { 'X-CSRF-TOKEN': this.csrf } }
    ).then((res) => {
      that.setState({
        submitting: false,
        success: true,
        successMessage: 'User created successfully'
      }, () => {
        that.gotoPage('/users');
      })
    })
    .catch((err) => {
      that.setState({
        submitting: false,
        showFailed: true,
        serverErrors: err.response.data
      })
    })
  }

  updateUser() {
    var that = this;
    console.log("handle update user ... ")
    console.log(this.state.id)
    axios.patch(`/users/${this.state.id}.json`, {
      user: {
        name: this.state.name,
        email: this.state.email,
        password: this.state.password,
        password_confirmation: this.state.pConfirm,
        role: this.state.adminstatus ? 1 : 0
      }
    },
    { headers: { 'X-CSRF-TOKEN': this.csrf } }
    ).then((res) => {
      that.setState({
        success: true,
        submitting: false,
        successMessage: 'User updated successfully'
      }, () => {
        that.gotoPage('/users');
      })
    }).catch((err) => {
      that.setState({
        showFailed: true,
        submitting: false,
        serverErrors: err.response.data
      })
    })
  }

  displayError(failedStatus, serverError, formattedError) {
    if (failedStatus) {
      return serverError.length ? serverError.map((error, i) => {
        return <p className="error center-align" key={i}>{error}</p>
      }) : <span>{formattedError}</span>
    } else {
      return null
    }
  }

  renderUserForm(submitFunc) {
    return (
      <div className="user-form">
          <div className="row">
            <form ref="form" className="new_user" id="new_user" onSubmit={ submitFunc }>
              <div className="row title">
                <p className="col s6 signup">Update User</p>
              </div>
              { this.state.success ? <div className="success-info" >
                <i className="fa fa-success"></i>
                 <span>{this.state.successMessage}</span>
                </div> : null }
              <div className={this.state.showFailed ? 'error-info' : ''} >{ this.displayError(this.state.showFailed, this.state.serverErrors, this.state.errorMessage) }</div>
              <div className="row content-wrapper">
                <div className="input-field">
                  <i className="fa fa-envelope" aria-hidden="true"></i>
                  <input type="email" onChange = { this.handleEmailChange } className="" onFocus={ this.clearError } value={ this.state.email } />
                  <label htmlFor="user_email">Email</label>
                </div>
                <div className="input-field">
                  <i className="fa fa-envelope" aria-hidden="true"></i>
                  <input type="text" onChange = { this.handleNameChange } className="" onFocus={ this.clearError } value={ this.state.name } />
                  <label htmlFor="user_name">Name</label>
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
                <p>
                  <input type="checkbox" id="admin" className="filled-in" checked = {this.state.isAdmin ? "checked" : ""} onChange={ this.toggleCheckBox } value={this.state.isAdmin } />
                  <label htmlFor="admin">Admin</label>
                </p>
              </div>
              <input className="hidden" type="submit"/>
              { this.state.submitting ? <div className="center login-wrapper disabled"> <i className='fa fa-spinner fa-spin fa-lg'></i> </div> :
                <div onClick={ submitFunc } className="center login-wrapper">Submit</div> }
            </form>
          </div>
        </div>
    )
  }

  render() {
    return (
      <div>
        { this.props.selectedUser ? this.renderUserForm(this.handleUpdate) : this.renderUserForm(this.handleCreate) }
        <div className="bottom">
          <span className="back" onClick={ this.props.selectedUser ? this.gotoPage.bind(this, '/users') : this.gotoPage.bind(this, '/') } >Back</span>|
          <span className="home" onClick={ this.gotoPage.bind(this, '/')}>Home</span>
        </div>
      </div>
    )
  }
}

