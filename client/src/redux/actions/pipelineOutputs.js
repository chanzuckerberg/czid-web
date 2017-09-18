import { fetch } from '../../lib/utils';
import { SAVE_PIPELINEOUTPUTS, STORE_SELECTED_PIPELINEOUTPUT } from '../actionConstants.js';
import { routes } from '../../lib/constants';

export function storeOutputs(payload) {
  return {
    type: SAVE_PIPELINEOUTPUTS,
    payload
  }
}

export function storeOutputToUpdate(payload) {
  return {
      type: STORE_SELECTED_PIPELINEOUTPUT,
      payload
  }
}

export function getAllOutputs() {
  return(dispatch, ownProps) => {
    fetch(routes.FETCH_OUTPUTS, 'get').then(response => {
      console.log(response);
      dispatch(storeOutputs(response.data))
    }).catch(err => {
    })
  }
}