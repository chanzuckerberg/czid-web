import { get } from ".";

const getSamples = ({ projectId } = {}) => {
  // TODO: add remaining parameters: filterm search, page, sortBy
  return get("/samples/library.json", {
    params: {
      projectId
    }
  });
};

export { getSamples };
