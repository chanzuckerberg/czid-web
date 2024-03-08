export interface GlobalContextStateType {
  // DO NOT CHANGE THIS TO TYPE STRING! This is only used for analytics events and for now,
  // Analytics will need to make changes to accept a string and for now, since projects are not
  // migrated to NextGen, we will keep using the rails ids, which we can cast to numbers.
  discoveryProjectIds: number | number[] | null;
}

export const initialGlobalContextState: GlobalContextStateType = {
  discoveryProjectIds: null,
};
