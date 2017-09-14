import React from 'react';
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom';
import './assets/style.css';
import store, { history } from './redux/store'
import { BrowserRouter } from 'react-router-dom';
import App from './pages/app';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter history={history}>
      <App />
    </BrowserRouter>
  </Provider>
,document.getElementById('root'));
registerServiceWorker();


