import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import axios from 'axios';
import * as actionCreators from '../redux/actions';
// import * as crypto from 'crypto-js';
import store from '../redux/store';
// import { ENCRYPTIONSECRETKEY } from './constants';
// import { showLoading, hideLoading } from 'react-redux-loading-bar';
// import Auth from './auth';

export function connectToStore(component, stateFields = null) {

  function mapStateToProps(state) {
    return getMappedState(state, stateFields)
  }

  function mapDispatchToProps(dispatch) {
    return bindActionCreators(actionCreators, dispatch)
  }

  function getMappedState(state, fieldsToMap) {
    let mapping = {}

    if (fieldsToMap) {
      fieldsToMap.forEach(element => {
        return mapping[element] = state[element]
      })
    }

    Object.keys(state).forEach(element => {
      return mapping[element] = state[element]
    });

    return mapping;
  }

  return connect(mapStateToProps, mapDispatchToProps)(component)
}

export function fetch(url, requestType, payload, withToken = true) {
  // store.dispatch(showLoading());

  const requestOptions = generateRequestOption();
  const fetchObject = new Promise((resolve, reject) => {
    axios.request(requestOptions).then(response => {
      // store.dispatch(hideLoading());
      resolve(response);
    }).catch(err => {
      // store.dispatch(hideLoading());
      reject(err)
    });
  });

  return fetchObject;

  function generateRequestOption() {
    const userToken = localStorage.getItem('user_token');
    // if (withToken && userToken) {
    //   return { url, method: requestType, data: payload, headers: { 'authorization': decrypt(userToken) } }
    // } else {
      return { url, method: requestType, data: payload }
    // }
  }
}
