import { get } from "./core";

const getPathogenList = () => get(`/pathogen_list.json`);

export { getPathogenList };
