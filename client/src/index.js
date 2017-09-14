import React from 'react';
import ReactDOM from 'react-dom';
import './assets/style.css';
import { BrowserRouter } from 'react-router-dom';
import App from './pages/app';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
<App />, document.getElementById('root'));
registerServiceWorker();
