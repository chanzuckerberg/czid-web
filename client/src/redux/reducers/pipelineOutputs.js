import { SAVE_PIPELINEOUTPUTS,
          STORE_SELECTED_PIPELINEOUTPUT } from '../actionConstants.js';

export default function pipelineOutputs(state={}, action) {
  switch(action.type) {
    case SAVE_PIPELINEOUTPUTS:
      return{...state, allOutputs: action.payload}
    case STORE_SELECTED_PIPELINEOUTPUT:
      return{...state, selec: action.payload}
    default:
      return state;
  }
}