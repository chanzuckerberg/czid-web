import { createContext } from "react";
import {
  FiltersType,
  FilterType,
} from "../components/AmrFiltersContainer/types";
import { AmrContextStateType } from "./initialState";

export interface AmrContextType {
  amrContextState: AmrContextStateType;
  amrContextDispatch: React.Dispatch<any>;
}

export const AmrContext = createContext<AmrContextType>({} as AmrContextType);

export enum AmrContextActionType {
  UPDATE_REPORT_TABLE_DOWNLOAD_WITH_APPLIED_FILTERS_LINK = "UPDATE_REPORT_TABLE_DOWNLOAD_WITH_APPLIED_FILTERS_LINK",
  UPDATE_ACTIVE_THRESHOLD_FILTERS = "UPDATE_ACTIVE_THRESHOLD_FILTERS",
  UPDATE_ACTIVE_DRUG_CLASS_FILTERS = "UPDATE_ACTIVE_DRUG_CLASS_FILTERS",
  UPDATE_DRUG_CLASSES = "UPDATE_DRUG_CLASSES",
}

type AmrUpdateReportTableDownloadWithAppliedFiltersLinkAction = {
  type: AmrContextActionType.UPDATE_REPORT_TABLE_DOWNLOAD_WITH_APPLIED_FILTERS_LINK;
  payload: string | null;
};

type AmrUpdateActiveThresholdFiltersAction = {
  type: AmrContextActionType.UPDATE_ACTIVE_THRESHOLD_FILTERS;
  payload: FiltersType | null;
};

type AmrUpdateActiveDrugClassFiltersAction = {
  type: AmrContextActionType.UPDATE_ACTIVE_DRUG_CLASS_FILTERS;
  payload: FilterType | null;
};

type AmrUpdateDrugClassesAction = {
  type: AmrContextActionType.UPDATE_DRUG_CLASSES;
  payload: string[] | null;
};

type AmrAction =
  | AmrUpdateReportTableDownloadWithAppliedFiltersLinkAction
  | AmrUpdateActiveThresholdFiltersAction
  | AmrUpdateActiveDrugClassFiltersAction
  | AmrUpdateDrugClassesAction;

export const createAmrContextAction = (
  type: AmrContextActionType,
  payload,
): AmrAction => {
  return {
    type,
    payload,
  };
};

export const amrContextReducer = (
  state: AmrContextStateType,
  action: AmrAction,
) => {
  switch (action.type) {
    case AmrContextActionType.UPDATE_REPORT_TABLE_DOWNLOAD_WITH_APPLIED_FILTERS_LINK:
      return {
        ...state,
        reportTableDownloadWithAppliedFiltersLink: action.payload,
      };
    case AmrContextActionType.UPDATE_ACTIVE_THRESHOLD_FILTERS:
      if (action.payload === null) return { ...state };

      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          ...action.payload,
        },
      };
    case AmrContextActionType.UPDATE_ACTIVE_DRUG_CLASS_FILTERS:
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          drugClassFilters: action.payload,
        },
      };
    case AmrContextActionType.UPDATE_DRUG_CLASSES:
      return {
        ...state,
        drugClasses: action.payload,
      };
  }
};
