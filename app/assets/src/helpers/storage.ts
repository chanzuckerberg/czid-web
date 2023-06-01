export const loadState = (store: Storage, key: string) => {
  try {
    return JSON.parse(store.getItem(key)) || {};
  } catch (e) {
    // Avoid possible bad transient state related crash
    // eslint-disable-next-line no-console
    console.warn(`Bad state: ${e}`);
  }
  return {};
};

export const setState = (store: Storage, key: string, state: any) => {
  try {
    store.setItem(key, JSON.stringify(state));
  } catch (e) {
    // Avoid possible bad transient state related crash
    // eslint-disable-next-line no-console
    console.warn(`Bad state: ${e}`);
  }
  return {};
};
