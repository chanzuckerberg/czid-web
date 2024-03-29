import { createContext, Dispatch } from "react";
import { GlobalContextStateType } from "./initialState";

export const GlobalContext = createContext<{
  globalContextState: GlobalContextStateType;
  globalContextDispatch: Dispatch<Action>;
} | null>(null);

export enum ActionType {
  UPDATE_DISCOVERY_PROJECT_IDS = "UPDATE_DISCOVERY_PROJECT_IDS",
}

type Action = {
  type: ActionType;
  payload: number | number[] | null;
};

export const createAction = (
  type: ActionType,
  payload: number | number[] | null,
) => {
  return {
    type,
    payload,
  };
};

export const globalContextReducer = (
  state: GlobalContextStateType,
  action: Action,
) => {
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (action.type) {
    case ActionType.UPDATE_DISCOVERY_PROJECT_IDS:
      return {
        ...state,
        discoveryProjectIds: action.payload,
      };
    default:
      throw new Error(
        `globalContextReducer cannot handle action type: ${action.type}`,
      );
  }
};
