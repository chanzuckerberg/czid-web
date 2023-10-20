export interface GlobalContextStateType {
  discoveryProjectIds: number | number[] | null;
}

export const initialGlobalContextState: GlobalContextStateType = {
  discoveryProjectIds: null,
};
