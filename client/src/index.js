import React from 'react';
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom';
import './assets/style.css';
import store, { history } from './redux/store'
import { Router } from 'react-router-dom';
import App from './pages/app';
import registerServiceWorker from './registerServiceWorker';

import 'materialize-css/dist/js/materialize.min.js';
import 'materialize-css/dist/css/materialize.min.css';
import 'font-awesome/css/font-awesome.min.css';


ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <App />
    </Router>
  </Provider>
,document.getElementById('root'));
registerServiceWorker();


