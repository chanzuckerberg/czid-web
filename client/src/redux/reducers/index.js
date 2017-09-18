import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import pipelineOutputs from './pipelineOutputs';

const rootReducer = combineReducers({
  routing: routerReducer,
  pipelineOutputs
});

export default rootReducer;